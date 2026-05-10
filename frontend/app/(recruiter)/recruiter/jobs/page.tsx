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
    api.get("/jobs/my-jobs")
      .then(r => setJobs(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (jobId: string, currentStatus: string) => {
    // Backend toggle status not yet implemented in job_routes.py
    alert("Status toggling coming soon!");
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
            <div key={job.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-lg">{job.title}</h3>
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wide">
                      Active
                    </span>
                  </div>
                  <p className="text-sm font-bold text-blue-600">{job.company}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    {job.location && (
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {job.created_at ? new Date(job.created_at).toLocaleDateString() : "Recently"}
                    </span>
                    {job.salary_range && (
                      <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">{job.salary_range}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/recruiter/candidates?job_id=${job.id}`}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black hover:bg-black transition shadow-lg shadow-gray-200"
                  >
                    <Users className="w-4 h-4" /> View Candidates <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {job.structured_requirements && (
                <div className="mt-5 pt-5 border-t border-gray-50">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ToggleLeft className="w-3 h-3 text-blue-500" /> AI-Extracted Requirements
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {job.structured_requirements.tech_stack?.map((tech: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100">
                        {tech}
                      </span>
                    ))}
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100 uppercase">
                      {job.structured_requirements.experience_level}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
