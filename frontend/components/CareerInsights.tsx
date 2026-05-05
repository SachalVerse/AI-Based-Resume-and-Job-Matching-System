"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Sparkles, Target, Zap, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

type InsightData = {
  summary: string;
  recommended_roles: string[];
  skills_gap: string[];
};

export default function CareerInsights() {
  const [analysis, setAnalysis] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      const res = await api.get("/student/career-analysis");
      const source = res.data?.ai_insights ?? res.data ?? {};
      setAnalysis({
        summary: String(source.summary || "You are building a strong foundation for tech roles."),
        recommended_roles: Array.isArray(source.recommended_roles) ? source.recommended_roles : [],
        skills_gap: Array.isArray(source.skills_gap) ? source.skills_gap : [],
      });
    } catch (err) {
      console.error("Failed to fetch career analysis");
      setAnalysis({
        summary: "Unable to fetch AI insights right now. Please try again shortly.",
        recommended_roles: [],
        skills_gap: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-48 bg-gray-50 animate-pulse rounded-xl border border-gray-100" />;
  if (!analysis) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">AI Career Trajectory</h3>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed italic">
          "{analysis.summary}"
        </p>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommended Roles */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-blue-700">
            <Target className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Recommended Roles</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.recommended_roles.map((role: string) => (
              <span key={role} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                {role}
              </span>
            ))}
            {analysis.recommended_roles.length === 0 && (
              <span className="text-xs text-gray-400">No role recommendations yet.</span>
            )}
          </div>
        </div>

        {/* Skills Gap */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-orange-700">
            <Zap className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Growth Areas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.skills_gap.map((skill: string) => (
              <span key={skill} className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-100">
                {skill}
              </span>
            ))}
            {analysis.skills_gap.length === 0 && (
              <span className="text-xs text-gray-400">No growth areas identified yet.</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Data sourced from GitHub Activity</span>
         <button
            onClick={() => router.push("/student/profile")}
            className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline"
         >
            Refine Profile <ChevronRight className="w-3 h-3" />
         </button>
      </div>
    </div>
  );
}
