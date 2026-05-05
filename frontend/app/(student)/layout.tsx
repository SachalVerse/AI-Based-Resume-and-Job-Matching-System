"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      api.get("/student/check-onboarding")
        .then((res) => {
          if (!res.data.onboarded && pathname !== "/student/profile") {
            router.replace("/student/profile");
          } else {
            setProfileReady(true);
          }
        })
        .catch((err) => {
          console.error("Profile check failed:", err);
          setProfileReady(true); // Failsafe
        });
    }
  }, [status, pathname, router]);

  // Block rendering until we confirm profile is in the DB
  if (status === "loading" || (status === "authenticated" && !profileReady && pathname !== "/student/profile")) {
    return (
      <div className="flex flex-col gap-3 items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-400 font-medium">Checking profile status...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
