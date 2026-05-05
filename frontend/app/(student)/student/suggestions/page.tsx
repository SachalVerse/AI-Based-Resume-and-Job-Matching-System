"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { RefreshCw, Sparkles, MapPin, Clock, ExternalLink, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function JobSuggestions() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchSuggestions(); }, []);

  const fetchSuggestions = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get(`/student/suggestions${forceRefresh ? "?refresh=true" : ""}`);
      setSuggestions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" /> AI Job Suggestions
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Personalized matches based on your GitHub & profile</p>
        </div>
        <button
          onClick={() => fetchSuggestions(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bold text-gray-500 text-lg">No suggestions yet</h3>
          <p className="text-sm text-gray-400 mt-1">Complete your profile to get AI-powered job matches</p>
          <button onClick={() => fetchSuggestions(true)} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition">
            Generate Suggestions
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((s, i) => {
            const job = s.job_data || s;
            return (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate text-base">{job.job_title || job.title}</h3>
                    <p className="text-blue-600 text-sm font-semibold">{job.employer_name || job.company}</p>
                  </div>
                  <span className={cn(
                    "ml-3 shrink-0 px-3 py-1 rounded-full text-xs font-black",
                    (s.ai_score || 0) > 80 ? "bg-green-100 text-green-700" :
                    (s.ai_score || 0) > 60 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                  )}>
                    {s.ai_score || 0}% Match
                  </span>
                </div>

                {job.job_city && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                    <MapPin className="w-3 h-3" />
                    {job.job_city}, {job.job_country}
                  </div>
                )}

                <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{job.job_description || job.description}</p>

                {s.ai_reason && (
                  <div className="bg-blue-50 rounded-xl px-3 py-2 mb-3">
                    <div className="flex items-center gap-1 text-[10px] text-blue-700 font-black uppercase mb-0.5">
                      <Sparkles className="w-3 h-3" /> AI Match Reason
                    </div>
                    <p className="text-xs text-blue-800 leading-snug">{s.ai_reason}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  {job.job_apply_link && (
                    <a
                      href={job.job_apply_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center bg-blue-600 text-white text-xs font-bold py-2 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-1"
                    >
                      Apply Now <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <span className={cn(
                    "px-2.5 py-1.5 rounded-xl text-[10px] font-bold border",
                    s.status === "new" ? "border-blue-200 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-500 bg-gray-50"
                  )}>
                    {s.status === "new" ? "New" : "Viewed"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
