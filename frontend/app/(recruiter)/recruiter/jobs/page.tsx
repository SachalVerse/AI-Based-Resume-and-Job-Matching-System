"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { Briefcase, Users, Plus, Clock, MapPin, ChevronRight, Loader2, ToggleLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/recruiter/jobs")
      .then(r => setJobs(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "closed" : "active";
    try {
      await api.patch(`/recruiter/jobs/${jobId}/status`, { status: newStatus });
      setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: newStatus } : j));
    } catch {
      alert("Failed to update job status.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-600" /> My Job Postings
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{jobs.length} total posting{jobs.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/recruiter/post-job"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" /> New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-gray-500 text-lg">No jobs posted yet</h3>
          <p className="text-sm text-gray-400 mt-1">Post your first job to start receiving AI-ranked candidates</p>
          <Link href="/recruiter/post-job" className="inline-flex items-center gap-2 mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" /> Post a Job
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map(job => (
            <div key={job._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-base">{job.title}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide",
                      job.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {job.status}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">
                      {job.type}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-blue-600">{job.company}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    {job.location && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {job.created_at ? new Date(job.created_at).toLocaleDateString() : "Recently"}
                    </span>
                    {job.salary_range && (
                      <span className="font-medium text-green-600">{job.salary_range}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleStatus(job._id, job.status)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition"
                    title={job.status === "active" ? "Close job" : "Reopen job"}
                  >
                    <ToggleLeft className="w-5 h-5" />
                  </button>
                  <Link
                    href={`/recruiter/candidates?job_id=${job._id}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition"
                  >
                    <Users className="w-3.5 h-3.5" /> View Candidates <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {job.requirements?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.requirements.slice(0, 4).map((req: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] rounded-lg border border-gray-100">
                      {req}
                    </span>
                  ))}
                  {job.requirements.length > 4 && (
                    <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[10px] rounded-lg border border-gray-100">
                      +{job.requirements.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
