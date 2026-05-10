"use client";
import RecruiterEmailAnalyzer from "@/components/RecruiterEmailAnalyzer";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { BrainCircuit, Users, Star, Mail, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function RecruiterDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ applicants: 0, strongMatches: 0, collaborations: 0 });
  const [criteria, setCriteria] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!session?.user?.email || !session?.accessToken) return;

    // Load criteria
    api.get("/recruiter/profile")
      .then(r => setCriteria(r.data?.criteria || ""))
      .catch(() => {});

    // Fetch both Platform Applications and Gmail Matches to calculate accurate stats
    Promise.all([
      api.get("/recruiter/candidates").catch(() => ({ data: [] })),
      api.get("/recruiter/applicant-matches").catch(() => ({ data: [] }))
    ]).then(([platformRes, gmailRes]) => {
      const platformApps = platformRes.data || [];
      const gmailApps = gmailRes.data || [];
      
      const allApplicants = [...platformApps, ...gmailApps];
      const strong = allApplicants.filter((a: any) => (a.ai_score || a.match_score || 0) >= 70).length;
      
      setStats(prev => ({
        ...prev,
        applicants: allApplicants.length,
        strongMatches: strong,
      }));
    });
  }, [session?.user?.email, session?.accessToken]);

  const saveCriteria = async () => {
    setIsSaving(true);
    try {
      await api.post("/recruiter/profile", { criteria });
    } catch { } finally {
      setIsSaving(false);
    }
  };

  const onEmailsSynced = (emails: any[]) => {
    const collaborations = emails.filter((e: any) => e.category === "Collaboration").length;
    setStats(prev => ({ ...prev, collaborations }));
  };

  const statCards = [
    { label: "Matched Applicants", val: stats.applicants, icon: Users, color: "blue", href: "/recruiter/candidates", desc: "Total potential hires" },
    { label: "Strong Matches", val: stats.strongMatches, icon: Star, color: "indigo", href: "/recruiter/candidates", desc: "AI Score > 70%" },
    { label: "Collaborations", val: stats.collaborations, icon: Mail, color: "green", href: "/recruiter/dashboard", desc: "Business opportunities" },
  ];

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: "bg-blue-50/50", text: "text-blue-600", border: "border-blue-100" },
    indigo: { bg: "bg-indigo-50/50", text: "text-indigo-600", border: "border-indigo-100" },
    green: { bg: "bg-green-50/50", text: "text-green-600", border: "border-green-100" },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Recruiter <span className="text-blue-600">AI</span> Panel</h1>
          <p className="text-gray-500 font-medium">Matching top talent from your inbox with intelligent AI scoring.</p>
        </div>
        <Link href="/recruiter/candidates" className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95">
          <Users className="w-5 h-5 text-blue-400" /> View All Candidates
        </Link>
      </motion.header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((s, idx) => {
          const Icon = s.icon;
          const colors = colorClasses[s.color];
          return (
            <motion.div 
              key={s.label} 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: 0.1 * idx }}
            >
              <Link href={s.href} className={cn(
                "block bg-white border rounded-3xl p-6 transition-all group relative overflow-hidden",
                colors.border,
                "hover:shadow-2xl hover:border-transparent hover:ring-2 hover:ring-blue-500/20"
              )}>
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-4 rounded-2xl", colors.bg)}>
                    <Icon className={cn("w-6 h-6", colors.text)} />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <div className="text-4xl font-black text-gray-900 mb-1 tracking-tight">{s.val}</div>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</div>
                  <div className="text-[10px] text-gray-500 font-medium">{s.desc}</div>
                </div>
                {/* Subtle background decoration */}
                <div className={cn("absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity", colors.bg)} />
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Hiring Criteria */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.3 }}
          className="lg:col-span-4 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-50 rounded-xl">
              <BrainCircuit className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">AI Scoring Engine</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Configuration</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-4 font-medium leading-relaxed">
            Define your ideal candidate profile. AI will use this criteria to score incoming applicant emails.
          </p>
          
          <textarea
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            placeholder="e.g. Full-stack developer with 2+ years in React. Prefer candidates with strong GitHub portfolios..."
            className="flex-1 w-full p-4 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none text-sm text-gray-700 bg-gray-50/30 placeholder:text-gray-300 min-h-[200px]"
          />
          
          <button 
            onClick={saveCriteria} 
            disabled={isSaving} 
            className="w-full mt-4 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black hover:bg-indigo-700 transition-all disabled:opacity-50 text-sm shadow-lg shadow-indigo-200 active:scale-95"
          >
            {isSaving ? "Updating AI..." : "Update Scoring Rules"}
          </button>
        </motion.div>

        {/* Smart Inbox */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.4 }}
          className="lg:col-span-8"
        >
          <RecruiterEmailAnalyzer onSync={onEmailsSynced} />
        </motion.div>
      </div>
    </div>
  );
}
