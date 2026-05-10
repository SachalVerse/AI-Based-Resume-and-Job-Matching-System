"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import api from "@/lib/api";
import { Users, Loader2, BrainCircuit, Mail, ShieldCheck, Code, Link2, Briefcase, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

function CandidateCard({ candidate, activeTab, session }: { candidate: any; activeTab: string; session: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const score = candidate.ai_score || candidate.match_score || 0;
  const isPlatform = activeTab === "platform";
  const report = candidate.verification_report || {};
  const github = candidate.github_audit || {};

  const handleSendEmail = async () => {
    const token = session?.accessToken || session?.user?.accessToken;
    if (!token) {
      alert("Failed to send email. Make sure your Gmail account is synced and session is active.");
      return;
    }

    setSendingEmail(true);
    try {
      await api.post("/recruiter/send-interview-email", {
        student_email: candidate.student_email || candidate.ai_details?.contact_info || candidate.sender || "",
        job_title: candidate.job_title || 'Software Role',
        student_name: candidate.student_name || candidate.sender || 'Applicant'
      }, {
        headers: { "access-token": token }
      });
      setEmailSent(true);
    } catch (e) {
      console.error(e);
      alert("Failed to send email. Please check console for details.");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-blue-50/50 group">
      <div className="flex flex-col md:flex-row items-start justify-between gap-8">
        
        {/* Left Side: Basic Info */}
        <div className="flex items-start gap-5 flex-1 min-w-0">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-100 shrink-0">
            {(candidate.student_name?.[0] || candidate.sender?.[0] || "#").toUpperCase()}
          </div>
          <div className="space-y-3 flex-1 min-w-0">
            <div>
              <h3 className="font-black text-gray-900 text-xl tracking-tight leading-none mb-1">
                {candidate.student_name || candidate.sender || "Anonymous Applicant"}
              </h3>
              {candidate.job_title && (
                <p className="text-sm font-bold text-blue-600 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Applied for: {candidate.job_title}
                </p>
              )}
              <p className="text-sm font-bold text-gray-400 flex items-center gap-2 mt-1">
                <Mail className="w-3.5 h-3.5" /> {candidate.student_email || candidate.ai_details?.contact_info || candidate.sender}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                score >= 80 ? "bg-green-100 text-green-700" :
                score >= 60 ? "bg-blue-100 text-blue-700" : "bg-red-50 text-red-600"
              )}>
                <BrainCircuit className="w-3.5 h-3.5" />
                {score}% Match
              </span>

              {isPlatform && report.verdict && (
                <span className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                  report.verdict.toLowerCase().includes("hire") ? "bg-green-100 text-green-700" :
                  report.verdict.toLowerCase().includes("interview") ? "bg-indigo-100 text-indigo-700" : "bg-red-50 text-red-600"
                )}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verdict: {report.verdict}
                </span>
              )}

              {isPlatform && report.hiring_risk && (
                <span className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                  report.hiring_risk.toLowerCase() === "low" ? "bg-green-100 text-green-700" :
                  report.hiring_risk.toLowerCase() === "medium" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                )}>
                  Risk: {report.hiring_risk}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Action */}
        <div className="shrink-0 w-full md:w-auto">
          <button
            onClick={handleSendEmail}
            disabled={sendingEmail || emailSent}
            className={cn(
              "flex items-center justify-center gap-2 px-6 py-4 rounded-[1.5rem] text-sm font-black transition-all shadow-xl w-full",
              emailSent ? "bg-green-600 text-white hover:bg-green-700 shadow-green-200" : "bg-gray-900 text-white hover:bg-black hover:-translate-y-0.5 active:scale-95",
              (sendingEmail || emailSent) && "opacity-90 cursor-not-allowed hover:-translate-y-0 active:scale-100"
            )}
          >
            {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {emailSent ? "Interview Request Sent!" : sendingEmail ? "Sending..." : "Email Interview Request"}
          </button>
        </div>
      </div>

      {/* Detailed AI Verification Report (Platform specific) */}
      {isPlatform && report.final_recommendation && (
        <div className="mt-8 space-y-4">
          
          {/* Always visible short summary */}
          <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100/50 relative">
            <h4 className="text-xs font-black text-indigo-800 flex items-center gap-2 uppercase tracking-widest mb-2">
              <BrainCircuit className="w-4 h-4" /> Technical Summary
            </h4>
            <p className={cn(
              "text-sm font-medium text-indigo-900/80 leading-relaxed transition-all",
              !isExpanded && "line-clamp-2"
            )}>
              {report.final_recommendation}
            </p>
            
            {!isExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-indigo-50/80 to-transparent rounded-b-3xl pointer-events-none" />
            )}
          </div>

          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-2 py-3 text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest bg-indigo-50/30 hover:bg-indigo-50 rounded-2xl"
          >
            {isExpanded ? <><ChevronUp className="w-4 h-4" /> Show Less</> : <><ChevronDown className="w-4 h-4" /> Read Full AI Report</>}
          </button>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Deep Observations */}
              <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100/50">
                <h4 className="text-xs font-black text-indigo-800 uppercase tracking-widest mb-3">
                  Deep Observations
                </h4>
                {report.analysis_points && report.analysis_points.length > 0 ? (
                  <ul className="space-y-3">
                    {report.analysis_points.map((p: string, idx: number) => (
                      <li key={idx} className="text-xs font-medium text-indigo-900/80 flex items-start gap-2">
                        <span className="text-indigo-400 mt-0.5">•</span> {p}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-indigo-900/50 italic">No specific observations recorded.</p>
                )}
              </div>

              {/* GitHub, LinkedIn, Evidence Context */}
              <div className="space-y-4">
                {/* GitHub */}
                <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
                  <h4 className="text-xs font-black text-gray-800 flex items-center gap-2 uppercase tracking-widest mb-2">
                    <Code className="w-4 h-4" /> GitHub Audit
                  </h4>
                  {github.error ? (
                    <p className="text-xs text-red-500 font-bold">{github.error}</p>
                  ) : github.public_repos !== undefined ? (
                    <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-600">
                      <div className="bg-white p-2 rounded-xl border border-gray-100">Stars: <strong className="text-gray-900">{github.total_stars}</strong></div>
                      <div className="bg-white p-2 rounded-xl border border-gray-100">Originals: <strong className="text-gray-900">{github.original_repos}</strong></div>
                      <div className="bg-white p-2 rounded-xl border border-gray-100">Total: <strong className="text-gray-900">{github.public_repos}</strong></div>
                      <div className="bg-white p-2 rounded-xl border border-gray-100">Age: <strong className="text-gray-900">{github.account_age} yrs</strong></div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No GitHub connected.</p>
                  )}
                </div>

                {/* Extracted Evidence */}
                <div className="bg-amber-50/50 rounded-3xl p-5 border border-amber-100/50">
                  <h4 className="text-xs font-black text-amber-800 flex items-center gap-2 uppercase tracking-widest mb-2">
                    <FileText className="w-4 h-4" /> Evidence & Certificates
                  </h4>
                  <p className="text-xs font-medium text-amber-900/80 whitespace-pre-wrap leading-relaxed">
                    {candidate.extracted_evidence && candidate.extracted_evidence.trim() 
                      ? candidate.extracted_evidence 
                      : "No extra certificates or evidence images uploaded by the candidate."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legacy Gmail Feedback */}
      {!isPlatform && (candidate.reasons || candidate.ai_details?.match_reason) && (
        <div className="bg-blue-50/50 rounded-2xl p-4 mt-6 border border-blue-100/50">
          <p className="text-xs text-blue-800 font-bold mb-1 flex items-center gap-2">
            <BrainCircuit className="w-3.5 h-3.5" /> Basic AI Parsing Logic
          </p>
          <p className="text-xs text-blue-700/80 leading-relaxed font-medium">
            {candidate.ai_details?.match_reason || candidate.reasons?.join(". ")}
          </p>
        </div>
      )}
    </div>
  );
}

function CandidatesContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job_id");

  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"platform" | "gmail">("platform");

  useEffect(() => {
    fetchCandidates(activeTab);
  }, [activeTab, jobId]);

  const fetchCandidates = async (tab: "platform" | "gmail") => {
    setLoading(true);
    try {
      if (tab === "platform") {
        const url = jobId ? `/recruiter/jobs/${jobId}/candidates` : `/recruiter/candidates`;
        const res = await api.get(url);
        setCandidates(res.data || []);
      } else {
        const res = await api.get(`/recruiter/applicant-matches`);
        setCandidates(res.data || []);
      }
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = {
    high: candidates.filter(c => (c.ai_score || c.match_score || 0) >= 80).length,
    medium: candidates.filter(c => (c.ai_score || c.match_score || 0) >= 60 && (c.ai_score || c.match_score || 0) < 80).length,
    low: candidates.filter(c => (c.ai_score || c.match_score || 0) < 60).length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> Candidates Overview
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {jobId ? "Specific applications for your posted job." : "AI-verified applicants from the platform and your inbox."}
          </p>
        </div>
      </div>

      {!jobId && (
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl w-max">
          <button
            onClick={() => setActiveTab("platform")}
            className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === "platform" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900")}
          >
            Platform Applications
          </button>
          <button
            onClick={() => setActiveTab("gmail")}
            className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === "gmail" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900")}
          >
            Gmail Extracted
          </button>
        </div>
      )}

      {/* Stats Row */}
      {candidates.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "High Match (80%+)", count: statusCounts.high, color: "green" },
            { label: "Medium Match (60-79%)", count: statusCounts.medium, color: "yellow" },
            { label: "Low Match (<60%)", count: statusCounts.low, color: "red" },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
              <div className={cn(
                "text-2xl font-black",
                stat.color === "yellow" ? "text-yellow-600" :
                stat.color === "green" ? "text-green-600" : "text-red-500"
              )}>{stat.count}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Candidate List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-bold">No candidates found in this section.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {candidates.map((candidate) => (
            <CandidateCard key={candidate._id || candidate.student_email} candidate={candidate} activeTab={activeTab} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></div>}>
      <CandidatesContent />
    </Suspense>
  );
}
