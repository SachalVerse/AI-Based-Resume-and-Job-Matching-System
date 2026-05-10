"use client";
import { motion } from "framer-motion";
import LinkedInPosts from "@/components/LinkedInPosts";
import { useSession } from "next-auth/react";

export default function LinkedInPage() {
  const { data: session } = useSession();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          LinkedIn Posts
        </h1>
        <p className="text-gray-500 font-medium">
          Posts automatically captured while you browse LinkedIn —{" "}
          <span className="text-blue-600 font-semibold">{session?.user?.email}</span>
        </p>
      </motion.header>

      {/* ── Extension Setup Banner ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-gradient-to-r from-[#0a66c2]/5 to-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4"
      >
        <div className="w-10 h-10 bg-[#0a66c2] rounded-xl flex items-center justify-center shrink-0 shadow shadow-blue-300">
          <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">Chrome Extension Required</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Load the <span className="font-semibold text-gray-700">feature/extension</span> folder as an unpacked Chrome extension. Click the extension icon, enter your website email, then browse your LinkedIn feed — posts sync here automatically.
          </p>
        </div>
      </motion.div>

      {/* ── Posts Feed ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm"
      >
        <LinkedInPosts />
      </motion.div>
    </div>
  );
}
