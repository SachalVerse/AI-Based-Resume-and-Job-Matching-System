"use client";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

import CareerInsights from "@/components/CareerInsights";
import LinkedInPosts from "@/components/LinkedInPosts";
import EmailAnalyzer from "@/components/EmailAnalyzer";

export default function StudentDashboard() {
  const { data: session } = useSession();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Hello, {session?.user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 font-medium">
            Your personalized career intelligence dashboard.
          </p>
        </div>
      </motion.header>

      {/* ── Career Insights (GitHub + AI) ────────────────────────────────── */}
      <CareerInsights />

      {/* ── LinkedIn Posts (Chrome Extension sync) ───────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm"
      >
        <LinkedInPosts />
      </motion.section>

      {/* ── Email Analyzer ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm"
      >
        <EmailAnalyzer />
      </motion.div>
    </div>
  );
}
