"use client";

import Link from "next/link";
import { ArrowRight, BrainCircuit, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Navigation */}
      <nav className="h-20 flex items-center justify-between px-8 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-200">
            C
          </div>
          <span className="text-2xl font-black text-gray-900 tracking-tight">CareerTrack<span className="text-blue-600">AI</span></span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors">
            Log in
          </Link>
          <Link href="/login" className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-md">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide">
            <SparklesIcon /> The Future of Hiring is Here
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight">
            AI-Powered Job Matching <br className="hidden md:block" /> for the Modern World.
          </h1>
          
          <p className="text-lg md:text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
            Whether you're a student looking for your dream role or a recruiter searching for top talent, our AI analyzes skills, experience, and potential to make the perfect match.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/login" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2">
              Start Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-2xl font-bold text-lg hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center">
              Recruiter Access
            </Link>
          </div>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-24 text-left"
        >
          {[
            { icon: BrainCircuit, color: "blue", title: "Smart Matching", desc: "Our Gemini AI analyzes thousands of data points to find roles where you'll truly excel." },
            { icon: Zap, color: "amber", title: "Instant Resume Tailoring", desc: "Automatically adapt your resume to perfectly match the job descriptions you apply for." },
            { icon: ShieldCheck, color: "emerald", title: "Verified Recruiters", desc: "Connect directly with verified hiring managers in a spam-free, secure environment." }
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all">
                <div className={`w-14 h-14 bg-${feature.color}-50 rounded-2xl flex items-center justify-center mb-6`}>
                  <Icon className={`w-7 h-7 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            )
          })}
        </motion.div>
      </main>

      <footer className="py-10 border-t border-gray-100 text-center bg-gray-50">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
          © {new Date().getFullYear()} CareerTrack AI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4M3 5h4M19 3v4M17 5h4M19 17v4M17 19h4M5 17v4M3 19h4"/>
    </svg>
  );
}
