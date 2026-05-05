"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Search, MapPin, DollarSign, Clock, Globe, ChevronRight, Sparkles, AlertCircle } from "lucide-react";

const JOB_COUNTRY_OPTIONS = [
  { code: "us", label: "United States" },
  { code: "gb", label: "United Kingdom" },
  { code: "pk", label: "Pakistan" },
  { code: "ca", label: "Canada" },
] as const;

export default function JobInbox() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [country, setCountry] = useState("pk"); // Default to Pakistan as requested
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/student/jobs-search", {
        params: {
          query: query.trim() || "Jobs",
          country: country.trim().toLowerCase(),
          ...(city.trim() ? { location: city.trim() } : {}),
          page: 1,
        },
      });
      const rawJobs = Array.isArray(res.data) ? res.data : [];
      setJobs(rawJobs);

      // AI Match Ranking
      if (rawJobs.length > 0) {
        try {
          const matchRes = await api.post("/student/batch-match", {
            jobs: rawJobs.map(j => ({ id: j.id, title: j.job_title, description: j.job_description }))
          });
          
          if (Array.isArray(matchRes.data)) {
             const matchedJobs = rawJobs.map(j => {
               const match = matchRes.data.find((m: any) => m.id === j.id);
               return { ...j, ai_score: match?.score || 0, ai_reason: match?.reason || "" };
             });
             setJobs(matchedJobs.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0)));
          }
        } catch (err) {
          console.error("AI Match failed:", err);
        }
      }
    } catch (err: any) {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [query, country, city]);

  useEffect(() => {
    if (!jobs.length && loading) {
       runSearch();
    }
  }, [runSearch, jobs.length, loading]);

  const handleApply = (jobUrl: string) => {
    if (jobUrl) window.open(jobUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Jobs</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Job Title or Keywords"
            className="border border-gray-300 rounded p-2 md:col-span-1"
          />
          <input 
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="border border-gray-300 rounded p-2 md:col-span-1"
          />
          <select 
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="border border-gray-300 rounded p-2 md:col-span-1"
          >
            {JOB_COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
          <button 
            onClick={runSearch}
            className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 font-bold"
          >
            Search
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {loading ? "Searching..." : `${jobs.length} Results`}
          </h2>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            [1, 2, 4].map(i => (
              <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
            ))
          ) : jobs.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white border border-gray-200 rounded-lg">
              <p className="text-gray-500">No jobs found.</p>
            </div>
          ) : (
            jobs.map((job, i) => (
              <JobCard key={job.id || i} job={job} i={i} onApply={() => handleApply(job.job_apply_link)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, onApply }: any) {
  const [isTailoring, setIsTailoring] = useState(false);
  const { data: session } = useSession();
  const score = job.ai_score || 0;
  
  const handleTailorAndApply = async () => {
    if (!session?.accessToken) {
      alert("Please sign in with Google to use Auto Apply.");
      return;
    }
    setIsTailoring(true);
    try {
      // 1. Get user profile
      const profileRes = await api.get("/student/profile");
      const profile = profileRes.data;

      // 2. Call Auto Apply with Google Token
      await api.post("/student/auto-apply", {
        target_email: job.employer_email || "hr@example.com",
        resume_data: profile
      }, {
        headers: { "access-token": session.accessToken }
      });
      
      alert("AI has tailored your resume and sent the application!");
    } catch (err) {
      console.error("Auto Apply failed:", err);
      alert("Auto Apply failed. Please try manual application.");
    } finally {
      setIsTailoring(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-900 truncate">{job.job_title}</h3>
          <div className="flex items-center gap-2 mt-1">
             <p className="text-sm text-blue-600 font-bold">{job.employer_name}</p>
             <span className="text-gray-300">•</span>
             <div className="flex items-center gap-1 text-xs text-gray-500">
               <MapPin className="w-3 h-3" />
               {job.job_city ? `${job.job_city}, ${job.job_country}` : job.job_country}
             </div>
          </div>
        </div>
        {score > 0 && (
          <div className="flex flex-col items-end gap-1">
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-black shadow-sm",
              score > 80 ? "bg-green-100 text-green-700" : score > 50 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
            )}>
              {score}% Match
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
         <div className="flex items-center gap-1">
           <Clock className="w-3 h-3" />
           Posted: {job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc).toLocaleDateString() : "Recently"}
         </div>
         {job.job_offer_expiration_datetime_utc && (
           <div className="flex items-center gap-1 text-orange-500">
             <AlertCircle className="w-3 h-3" />
             Ends: {new Date(job.job_offer_expiration_datetime_utc).toLocaleDateString()}
           </div>
         )}
      </div>

      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
        {job.job_description}
      </p>

      {job.ai_reason && (
        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
          <div className="flex items-center gap-1.5 text-blue-800 text-[10px] font-black uppercase mb-1">
            <Sparkles className="w-3 h-3" /> AI Analysis
          </div>
          <p className="text-xs text-blue-900 leading-snug">
            {job.ai_reason}
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-2 mt-auto">
        <button 
          onClick={onApply}
          className="flex-1 bg-blue-600 text-white text-sm font-bold py-2 rounded hover:bg-blue-700"
        >
          View & Apply
        </button>
      </div>
    </div>
  );
}
