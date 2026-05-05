"use client";
import RecruiterSidebar from "@/components/RecruiterSidebar";
import TopBar from "@/components/TopBar";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  // Middleware handles all redirects — layout just shows a spinner while session loads
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RecruiterSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
