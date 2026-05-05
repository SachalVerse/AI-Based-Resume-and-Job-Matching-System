"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Users, Loader2, BrainCircuit, Clock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/recruiter/applicant-matches`);
      setCandidates(res.data || []);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = {
    high: candidates.filter(c => (c.match_score || 0) >= 80).length,
    medium: candidates.filter(c => (c.match_score || 0) >= 60 && (c.match_score || 0) < 80).length,
    low: candidates.filter(c => (c.match_score || 0) < 60).length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" /> Matched Applicants
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">AI-ranked from recruiter inbox using your hiring criteria</p>
      </div>

      {/* Stats Row */}
      {candidates.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "High Match", count: statusCounts.high, color: "green" },
            { label: "Medium Match", count: statusCounts.medium, color: "yellow" },
            { label: "Low Match", count: statusCounts.low, color: "red" },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
              <div className={cn(
                "text-2xl font-black",
                stat.color === "yellow" ? "text-yellow-600" :
                stat.color === "green" ? "text-green-600" : "text-red-500"
              )}>{stat.count}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Candidate List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-bold">No applicant emails matched yet</p>
          <p className="text-xs text-gray-400 mt-1">Sync inbox from recruiter dashboard and refine AI criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((candidate, i) => (
            <div key={candidate._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-700 font-black text-base shrink-0">
                    {candidate.student_name?.[0]?.toUpperCase() || "#"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{candidate.student_name || "Anonymous"}</h3>
                      {/* AI Score Badge */}
                      {candidate.ai_score > 0 && (
                        <span className={cn(
                          "flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black",
                          candidate.match_score >= 80 ? "bg-green-100 text-green-700" :
                          candidate.match_score >= 60 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                        )}>
                          <BrainCircuit className="w-3 h-3" />
                          {candidate.match_score}% AI Match
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{candidate.ai_details?.contact_info || candidate.sender}</p>
                    {candidate.ai_details?.match_reason && (
                      <p className="text-xs text-blue-700 mt-1 italic">"{candidate.ai_details.match_reason}"</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Received: {candidate.date ? new Date(candidate.date).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`mailto:${candidate.ai_details?.contact_info || ""}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Contact
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
