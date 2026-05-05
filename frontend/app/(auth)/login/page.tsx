"use client";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  // If already authenticated, redirect to correct destination
  useEffect(() => {
    if (status === "authenticated" && session) {
      if (!session.user?.role) {
        router.replace("/onboarding");
      } else if (session.user.role === "recruiter") {
        router.replace("/recruiter/dashboard");
      } else {
        router.replace("/student/dashboard");
      }
    }
  }, [status, session, router]);

  if (status === "loading" || (status === "authenticated")) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-400">Signing you in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Top gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <div className="p-10 text-center space-y-8">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <span className="text-white text-2xl font-black">C</span>
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">CareerTrack AI</h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                AI-powered job matching, resume builder,<br />and recruiter pipeline — all in one place.
              </p>
              <div className="pt-1">
                <Link href="/" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
                  Back to Home
                </Link>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { emoji: "🤖", label: "AI Matching" },
                { emoji: "📄", label: "Resume AI" },
                { emoji: "📬", label: "Smart Inbox" },
              ].map(f => (
                <div key={f.label} className="bg-gray-50 rounded-2xl px-3 py-3">
                  <div className="text-xl mb-1">{f.emoji}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{f.label}</div>
                </div>
              ))}
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={async () => {
                setSigningIn(true);
                await signIn("google", { callbackUrl: "/onboarding" });
              }}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 py-3.5 px-6 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {signingIn ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {signingIn ? "Redirecting to Google..." : "Continue with Google"}
            </button>

            <p className="text-[11px] text-gray-400">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Trusted by students and recruiters worldwide
        </p>
      </motion.div>
    </div>
  );
}
