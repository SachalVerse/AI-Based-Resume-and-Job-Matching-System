"use client";
import EmailAnalyzer from "@/components/EmailAnalyzer";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

import CareerInsights from "@/components/CareerInsights";

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const loadSuggestionStats = async () => {
      try {
        const res = await api.get("/student/suggestions");
        setSuggestions(Array.isArray(res.data) ? res.data : []);
      } catch {
        setSuggestions([]);
      } finally {
        setStatsLoading(false);
      }
    };
    loadSuggestionStats();
  }, []);

  const stats = useMemo(() => {
    const scored = suggestions.filter((s) => typeof s?.ai_score === "number");
    const matchedRoles = scored.length;
    const avgMatch = matchedRoles
      ? Math.round(scored.reduce((sum, s) => sum + (s.ai_score || 0), 0) / matchedRoles)
      : 0;
    return { matchedRoles, avgMatch };
  }, [suggestions]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <motion.header 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Hello, {session?.user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 font-medium">
            Your personalized career intelligence dashboard.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
          <div className="bg-white border border-gray-100 px-6 py-3 rounded-2xl shadow-sm min-w-[180px]">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Matched Roles</p>
            {statsLoading ? (
              <div className="h-7 w-16 mt-1 rounded bg-gray-100 animate-pulse" />
            ) : (
              <p className="text-3xl leading-none font-black text-blue-600">{stats.matchedRoles}</p>
            )}
          </div>
          <div className="bg-white border border-gray-100 px-6 py-3 rounded-2xl shadow-sm min-w-[180px]">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Avg Match</p>
            {statsLoading ? (
              <div className="h-7 w-20 mt-1 rounded bg-gray-100 animate-pulse" />
            ) : (
              <p className="text-3xl leading-none font-black text-green-600">{stats.avgMatch}%</p>
            )}
          </div>
        </div>
      </motion.header>

      <CareerInsights />

      <div className="grid grid-cols-1 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm"
        >
           <EmailAnalyzer />
        </motion.div>
      </div>
    </div>
  );
}
