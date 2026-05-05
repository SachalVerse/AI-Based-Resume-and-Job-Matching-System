"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Star, Loader2, BrainCircuit, Clock, Mail, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShortlistPage() {
  const [shortlisted, setShortlisted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      api.get("/recruiter/shortlisted"),
      api.get("/recruiter/jobs")
    ]).then(([shortRes, jobsRes]) => {
      setShortlisted(shortRes.data || []);
      const jobMap: Record<string, string> = {};
      (jobsRes.data || []).forEach((j: any) => { jobMap[j._id] = j.title; });
      setJobs(jobMap);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500" /> Shortlisted Candidates
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {shortlisted.length} candidate{shortlisted.length !== 1 ? "s" : ""} shortlisted across all jobs
        </p>
      </div>

      {shortlisted.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-gray-500 text-lg">No shortlisted candidates yet</h3>
          <p className="text-sm text-gray-400 mt-1">Go to Candidates to review and shortlist applicants</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shortlisted.map((candidate) => (
            <div key={candidate._id} className="bg-white border border-green-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all bg-green-50/20">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center text-green-700 font-black text-lg shrink-0">
                    {candidate.student_name?.[0]?.toUpperCase() || "#"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{candidate.student_name || "Anonymous"}</h3>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase tracking-wide">
                        ✓ Shortlisted
                      </span>
                      {candidate.ai_score > 0 && (
                        <span className={cn(
                          "flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black",
                          candidate.ai_score >= 80 ? "bg-green-100 text-green-700" :
                          candidate.ai_score >= 60 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                        )}>
                          <BrainCircuit className="w-3 h-3" /> {candidate.ai_score}% Match
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />{candidate.student_email}
                      </p>
                      {jobs[candidate.job_id] && (
                        <p className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />{jobs[candidate.job_id]}
                        </p>
                      )}
                    </div>
                    {candidate.ai_reason && (
                      <p className="text-xs text-green-700 mt-1.5 italic bg-green-50 px-2 py-1 rounded-lg">
                        "{candidate.ai_reason}"
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Applied: {candidate.applied_at ? new Date(candidate.applied_at).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <a
                    href={`mailto:${candidate.student_email}`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                  >
                    <Mail className="w-3.5 h-3.5" /> Contact
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
