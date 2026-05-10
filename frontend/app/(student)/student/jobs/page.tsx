"use client";
import NativeJobs from "@/components/NativeJobs";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export default function JobsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             Forensic Job Board <Briefcase className="w-8 h-8 text-blue-600" />
          </h1>
          <p className="text-gray-500 font-medium mt-2">Discover verified direct hiring roles and audit-backed opportunities</p>
        </div>
      </div>

      <div className="min-h-[60vh]">
        <NativeJobs />
      </div>
    </div>
  );
}
