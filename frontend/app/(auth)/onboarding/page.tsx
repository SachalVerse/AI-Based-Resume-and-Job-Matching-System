"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Briefcase, ChevronRight, Loader2, CheckCircle } from "lucide-react";
import api from "@/lib/api";

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<"student" | "recruiter" | null>(null);
  const [done, setDone] = useState(false);

  // If already has a role, skip onboarding immediately
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      const role = session.user.role;
      router.replace(role === "recruiter" ? "/recruiter/dashboard" : "/student/dashboard");
    }
  }, [status, session, router]);

  // Show loading while session resolves
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Not logged in
  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  const selectRole = async (role: "student" | "recruiter") => {
    if (!session?.user?.email || loading) return;
    setSelected(role);
    setLoading(true);
    try {
      // 1. Persist role to backend
      await api.post("/auth/set-role", {
        email: session.user.email,
        role,
      });

      // 2. Update NextAuth JWT with new role
      await update({ role });

      // 3. Show success state briefly, then navigate
      setDone(true);
      setTimeout(() => {
        window.location.href = role === "recruiter" ? "/recruiter/dashboard" : "/student/dashboard";
      }, 800);
    } catch (error) {
      console.error("Role selection failed:", error);
      alert("Something went wrong. Please try again.");
      setLoading(false);
      setSelected(null);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </motion.div>
        <p className="text-gray-600 font-semibold">Setting up your workspace...</p>
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const roles = [
    {
      id: "student" as const,
      icon: User,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      hoverBorder: "hover:border-blue-400",
      selectedBg: "border-blue-500 bg-blue-50",
      ctaColor: "text-blue-600",
      title: "I'm a Student",
      description: "Find internships, analyze your resume with AI, discover job opportunities, and automate applications.",
      perks: ["AI Resume Builder", "Smart Job Matching", "Email Opportunity Detector"],
    },
    {
      id: "recruiter" as const,
      icon: Briefcase,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      hoverBorder: "hover:border-purple-400",
      selectedBg: "border-purple-500 bg-purple-50",
      ctaColor: "text-purple-600",
      title: "I'm a Recruiter",
      description: "Post jobs, rank candidates with AI, manage your hiring pipeline, and shortlist top talent.",
      perks: ["AI Candidate Ranking", "Job Pipeline Manager", "Smart Email Filter"],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-3xl"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-5 shadow-lg shadow-blue-200">
            <span className="text-white text-2xl font-black">C</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Welcome, {session?.user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-gray-500 mt-2 text-base">
            How will you be using CareerTrack AI? Choose your role to get started.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selected === role.id;
            const isOther = selected && selected !== role.id;

            return (
              <motion.button
                key={role.id}
                onClick={() => selectRole(role.id)}
                disabled={loading}
                whileHover={!loading ? { y: -2 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className={`relative text-left p-7 rounded-3xl border-2 transition-all duration-200 shadow-sm
                  ${isSelected ? role.selectedBg : "border-gray-200 bg-white"}
                  ${!loading && !isSelected ? `${role.hoverBorder} hover:shadow-md` : ""}
                  ${isOther ? "opacity-40" : ""}
                  ${loading ? "cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                {/* Loading spinner overlay */}
                {isSelected && loading && (
                  <div className="absolute top-4 right-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                )}

                <div className={`w-12 h-12 ${role.iconBg} rounded-2xl flex items-center justify-center mb-5`}>
                  <Icon className={`w-6 h-6 ${role.iconColor}`} />
                </div>

                <h3 className="text-xl font-black text-gray-900 mb-2">{role.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">{role.description}</p>

                <ul className="space-y-1.5 mb-6">
                  {role.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-black shrink-0">✓</span>
                      {perk}
                    </li>
                  ))}
                </ul>

                <div className={`flex items-center gap-1 text-sm font-bold ${role.ctaColor}`}>
                  {isSelected && loading ? "Setting up..." : `Continue as ${role.id === "student" ? "Student" : "Recruiter"}`}
                  {(!isSelected || !loading) && <ChevronRight className="w-4 h-4" />}
                </div>
              </motion.button>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          You can switch roles later from your account settings.
        </p>
      </motion.div>
    </div>
  );
}
