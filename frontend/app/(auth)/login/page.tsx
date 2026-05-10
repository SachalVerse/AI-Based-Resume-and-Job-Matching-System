"use client";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, User, Briefcase, ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"student" | "recruiter" | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      if (session.user.role === "recruiter") {
        router.replace("/recruiter/dashboard");
      } else {
        router.replace("/student/dashboard");
      }
    }
  }, [status, session, router]);

  const handleGoogleLogin = async () => {
    if (!selectedRole) return;
    setSigningIn(true);
    document.cookie = `selected_role=${selectedRole}; path=/; max-age=3600`;
    await signIn("google", { 
      callbackUrl: selectedRole === "recruiter" ? "/recruiter/dashboard" : "/onboarding" 
    });
  };

  if (status === "loading" || (status === "authenticated" && session?.user?.role)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-12 h-12">
            <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-20" />
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 relative z-10" />
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Entering Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px]"
      >
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white p-10 relative">
          
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                C
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight">CareerTrack<span className="text-blue-600">AI</span></span>
            </Link>
            
            <AnimatePresence mode="wait">
              {!selectedRole ? (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-2"
                >
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome Back</h1>
                  <p className="text-gray-500 font-medium">Choose your account type to continue</p>
                </motion.div>
              ) : (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-2"
                >
                  <button 
                    onClick={() => setSelectedRole(null)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors mb-2"
                  >
                    <ChevronLeft className="w-3 h-3" /> Change Role
                  </button>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                    {selectedRole === 'student' ? 'Student' : 'Recruiter'} Login
                  </h1>
                  <p className="text-gray-500 font-medium">Continue with your Google account</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-4">
            {!selectedRole ? (
              <div className="grid grid-cols-1 gap-4">
                <RoleCard 
                  icon={User}
                  title="I'm a Student"
                  desc="Find jobs & build your career"
                  onClick={() => setSelectedRole("student")}
                />
                <RoleCard 
                  icon={Briefcase}
                  title="I'm a Recruiter"
                  desc="Hire top talent with AI"
                  onClick={() => setSelectedRole("recruiter")}
                  color="indigo"
                />
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <button
                  onClick={handleGoogleLogin}
                  disabled={signingIn}
                  className="w-full flex items-center justify-center gap-4 bg-gray-900 text-white py-4 px-6 rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-70 group"
                >
                  {signingIn ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" fillOpacity="0.8" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" fillOpacity="0.5" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="currentColor" fillOpacity="0.8" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  <span>{signingIn ? "Authenticating..." : "Continue with Google"}</span>
                </button>
                
                <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">AI Matching Enabled</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-8 font-medium">
          By continuing, you agree to CareerTrack AI's <br />
          <Link href="#" className="text-gray-600 underline">Terms of Service</Link> and <Link href="#" className="text-gray-600 underline">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  );
}

function RoleCard({ icon: Icon, title, desc, onClick, color = "blue" }: any) {
  const isBlue = color === "blue";
  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center gap-5 p-5 bg-white border-2 border-gray-100 rounded-[1.5rem] hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left relative overflow-hidden"
    >
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
        isBlue ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"
      )}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{title}</h3>
        <p className="text-xs text-gray-500 font-medium">{desc}</p>
      </div>
      <div className={cn(
        "absolute -right-2 -bottom-2 w-12 h-12 opacity-0 group-hover:opacity-10 transition-opacity rounded-full",
        isBlue ? "bg-blue-600" : "bg-indigo-600"
      )} />
    </button>
  );
}
