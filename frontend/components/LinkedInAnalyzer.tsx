"use client";
import React, { useState, useEffect } from "react";
import { Upload, FileArchive, Loader2, CheckCircle2, AlertCircle, TrendingUp, Award, MessageSquare, ShieldAlert, Zap, Briefcase } from "lucide-react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface AnalysisData {
  experience_analysis: {
    total_years: number;
    seniority_level: string;
    career_growth_pattern: string;
    job_stability: string;
  };
  skills_analysis: {
    core_skills: string[];
    advanced_skills: string[];
    skill_depth_assessment: string;
  };
  leadership_analysis: {
    has_leadership_experience: boolean;
    leadership_indicators: string[];
  };
  communication_analysis: {
    professional_tone: string;
    thought_leadership_score: number;
    consistency_indicator: string;
  };
  risk_analysis: {
    red_flags: string[];
    employment_gaps_detected: boolean;
  };
  summary: {
    top_strengths: string[];
    improvement_areas: string[];
  };
  final_evaluation: {
    final_hire_score: number;
    recommendation: string;
    confidence_level: string;
  };
}

export default function LinkedInAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we already have an analysis in the profile
    const fetchExisting = async () => {
      try {
        const res = await api.get("/student/profile");
        if (res.data?.linkedin_analysis) {
          setAnalysis(res.data.linkedin_analysis);
        }
      } catch (err) {
        console.error("Failed to fetch existing LinkedIn analysis");
      }
    };
    fetchExisting();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.name.endsWith(".zip")) {
        setFile(selected);
        setError(null);
      } else {
        setError("Please upload a valid .zip file from LinkedIn.");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/student/analyze-linkedin", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAnalysis(res.data.analysis);
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to analyze LinkedIn data. Ensure it's a valid archive.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
          <FileArchive className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">LinkedIn Talent Intelligence</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Enterprise-Grade Analysis</p>
        </div>
      </div>

      {!analysis && !analyzing && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2rem] p-8 text-center border border-gray-700 shadow-2xl relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
          
          <div className="max-w-md mx-auto space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                <Upload className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Upload Your LinkedIn Archive</h3>
              <p className="text-sm text-gray-400">
                Get a recruiter-level evaluation of your seniority, stability, and hireability score.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <label className="cursor-pointer">
                <input type="file" className="hidden" onChange={handleFileChange} accept=".zip" />
                <div className="bg-white/5 hover:bg-white/10 border border-white/10 py-4 px-6 rounded-2xl transition-all group">
                  <span className="text-sm font-bold text-blue-400 group-hover:text-blue-300">
                    {file ? file.name : "Select LinkedIn ZIP Archive"}
                  </span>
                </div>
              </label>

              <button
                onClick={handleUpload}
                disabled={!file}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black transition-all shadow-xl shadow-blue-900/20 active:scale-95"
              >
                Start AI Deep Analysis
              </button>
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 text-red-400 text-xs font-bold bg-red-400/10 py-2 rounded-lg">
                <AlertCircle className="w-3 h-3" /> {error}
              </div>
            )}
            
            <p className="text-[10px] text-gray-500 font-medium">
              We only parse Positions, Skills, Education, and Shares. Your data is analyzed and used only for matching.
            </p>
          </div>
        </motion.div>
      )}

      {analyzing && (
        <div className="bg-white border border-gray-100 rounded-[2rem] p-12 text-center shadow-xl flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <div className="absolute inset-0 bg-blue-600/10 blur-xl animate-pulse" />
          </div>
          <h3 className="text-xl font-black text-gray-900">Consulting AI Recruiter...</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Evaluating experience depth, career trajectory, and professional tone. This takes about 10-15 seconds.
          </p>
        </div>
      )}

      {analysis && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Main Score Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white border border-gray-100 rounded-[2rem] p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8">
                  <div className="text-6xl font-black text-gray-100/50">#{analysis.final_evaluation.final_hire_score}/10</div>
               </div>
               <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 mb-4">
                    <CheckCircle2 className="w-3 h-3" /> AI Verification Complete
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-2">
                    {analysis.final_evaluation.recommendation === "Strong Hire" ? "🚀 Exceptional Candidate" : 
                     analysis.final_evaluation.recommendation === "Hire" ? "✅ Highly Recommended" :
                     analysis.final_evaluation.recommendation === "Consider" ? "🔍 Solid Potential" : "⚠️ Development Needed"}
                  </h3>
                  <p className="text-gray-500 font-medium max-w-md leading-relaxed">
                    Based on your LinkedIn archive, you demonstrate a <span className="text-blue-600 font-bold">{analysis.experience_analysis.seniority_level}</span> seniority level with <span className="text-gray-900 font-bold">{analysis.experience_analysis.total_years} years</span> of verified experience.
                  </p>
               </div>
               <div className="mt-8 flex gap-4">
                  <button onClick={() => setAnalysis(null)} className="text-xs font-bold text-gray-400 hover:text-gray-600 transition">Retake Analysis</button>
               </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-200">
               <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-4">Hireability Score</h4>
               <div className="text-6xl font-black mb-2">{analysis.final_evaluation.final_hire_score * 10}%</div>
               <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mb-6">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.final_evaluation.final_hire_score * 10}%` }}
                    className="bg-white h-full" 
                  />
               </div>
               <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="opacity-70">Confidence Level</span>
                    <span>{analysis.final_evaluation.confidence_level}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="opacity-70">Job Stability</span>
                    <span>{analysis.experience_analysis.job_stability}</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <StatBox icon={TrendingUp} label="Seniority" val={analysis.experience_analysis.seniority_level} color="blue" />
             <StatBox icon={Award} label="Core Tech" val={analysis.skills_analysis.core_skills[0] || "N/A"} color="indigo" />
             <StatBox icon={MessageSquare} label="Thought Lead" val={`${analysis.communication_analysis.thought_leadership_score}/10`} color="green" />
             <StatBox icon={ShieldAlert} label="Risk Profile" val={analysis.risk_analysis.red_flags.length === 0 ? "Clean" : "Moderate"} color={analysis.risk_analysis.red_flags.length === 0 ? "green" : "orange"} />
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
               <div className="flex items-center gap-2 mb-4 text-green-600">
                  <Zap className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Key Strengths</span>
               </div>
               <ul className="space-y-3">
                  {analysis.summary.top_strengths.map((s, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700 font-medium">
                       <span className="text-green-500">•</span> {s}
                    </li>
                  ))}
               </ul>
            </div>
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
               <div className="flex items-center gap-2 mb-4 text-orange-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Areas for Growth</span>
               </div>
               <ul className="space-y-3">
                  {analysis.summary.improvement_areas.map((s, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700 font-medium">
                       <span className="text-orange-500">•</span> {s}
                    </li>
                  ))}
               </ul>
            </div>
          </div>

          {/* Leadership & Risk */}
          <div className="bg-gray-900 rounded-[2rem] p-8 text-white">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                   <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-blue-400" />
                      <h4 className="font-bold text-lg">Leadership Analysis</h4>
                   </div>
                   <div className="space-y-4">
                      {analysis.leadership_analysis.has_leadership_experience ? (
                        <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                           <p className="text-sm font-bold text-blue-400 mb-2">Indicators Found:</p>
                           <ul className="text-xs text-gray-300 space-y-2">
                              {analysis.leadership_analysis.leadership_indicators.map((l, i) => <li key={i}>• {l}</li>)}
                           </ul>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No direct leadership or management indicators detected in archive.</p>
                      )}
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                      <h4 className="font-bold text-lg">Integrity & Risk Audit</h4>
                   </div>
                   <div className="space-y-4">
                      {analysis.risk_analysis.red_flags.length > 0 ? (
                        <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                           <ul className="text-xs text-red-300 space-y-2">
                              {analysis.risk_analysis.red_flags.map((r, i) => <li key={i}>⚠️ {r}</li>)}
                           </ul>
                        </div>
                      ) : (
                        <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                           <p className="text-xs text-green-400 font-bold flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> No major red flags or employment gaps detected.
                           </p>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                         <span>Employment Gaps</span>
                         <span className={analysis.risk_analysis.employment_gaps_detected ? "text-orange-400" : "text-green-400"}>
                            {analysis.risk_analysis.employment_gaps_detected ? "Detected" : "None Detected"}
                         </span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatBox({ icon: Icon, label, val, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    green: "bg-green-50 text-green-600 border-green-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };
  
  return (
    <div className="bg-white border border-gray-100 p-4 rounded-3xl shadow-sm flex items-center gap-4">
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colors[color]}`}>
          <Icon className="w-6 h-6" />
       </div>
       <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
          <p className="text-sm font-bold text-gray-900">{val}</p>
       </div>
    </div>
  );
}
