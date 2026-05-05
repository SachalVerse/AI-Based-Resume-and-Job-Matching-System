"use client";
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Mail, ChevronRight, RefreshCw, Users, Handshake, BrainCircuit } from "lucide-react";

type InboxCategory = "Applicant" | "Collaboration" | "Spam" | "Other";
type FilterTab = "All" | InboxCategory;

interface RecruiterEmailAnalyzerProps {
  onSync?: (emails: any[]) => void;
}

export default function RecruiterEmailAnalyzer({ onSync }: RecruiterEmailAnalyzerProps) {
  const { data: session } = useSession();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (session?.accessToken && emails.length === 0) fetchEmails();
  }, [session]);

  const fetchEmails = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/recruiter/fetch-emails", {
        headers: { "access-token": session.accessToken },
      });
      const data = response.data || [];
      setEmails(data);
      if (onSync) onSync(data);
    } catch (error: any) {
      console.error("Fetch error:", error);
      setError(error.response?.data?.detail || "Failed to sync recruiter mailbox.");
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = useMemo(() => {
    if (activeTab === "All") return emails;
    return emails.filter((e) => e.category === activeTab);
  }, [emails, activeTab]);

  const handleFeedback = async (
    emailId: string,
    isCorrect: boolean,
    predictedCategory: InboxCategory,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const previousEmails = emails;
    if (!isCorrect) {
      setEmails((prev) => prev.filter((em) => em.id !== emailId));
    }
    setIsFeedbackSubmitting(emailId);
    try {
      await api.post("/recruiter/feedback/categorization", null, {
        params: {
          email_id: emailId,
          is_correct: isCorrect,
          correct_value: isCorrect ? undefined : "Other",
          predicted_category: predictedCategory,
        },
      });
      setFeedbackGiven((prev) => ({ ...prev, [emailId]: true }));
    } catch (err) {
      if (!isCorrect) setEmails(previousEmails);
      console.error("Recruiter feedback failed:", err);
    } finally {
      setIsFeedbackSubmitting(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
      {/* Inbox Header */}
      <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-2xl">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Smart Inbox</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">AI Categorized Mail</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
             onClick={fetchEmails} 
             disabled={loading} 
             className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all disabled:opacity-50 active:scale-95 group"
           >
             <RefreshCw className={cn("w-4 h-4 text-blue-400", loading && "animate-spin")} />
             <span>{loading ? "Analyzing..." : "Sync Mailbox"}</span>
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-2 bg-gray-50/50 overflow-x-auto no-scrollbar">
        {(["All", "Applicant", "Collaboration", "Other", "Spam"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap",
              activeTab === tab 
                ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5" 
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto min-h-[500px]">
        {loading && emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[500px] text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              <BrainCircuit className="w-6 h-6 text-blue-600 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div>
              <p className="text-lg font-black text-gray-900">AI is Analyzing Your Mail</p>
              <p className="text-sm text-gray-400 font-medium">Extracting applicants and collaboration requests...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[500px] p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="w-8 h-8" />
            </div>
            <p className="text-lg font-black text-gray-900 mb-2">Sync Failed</p>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">{error}</p>
            <button onClick={fetchEmails} className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors">
              Try Again
            </button>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[500px] text-center p-8">
            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <p className="text-lg font-black text-gray-900 mb-1">Inbox Empty</p>
            <p className="text-sm text-gray-400 font-medium">No {activeTab !== "All" ? activeTab : ""} messages found in the last 20 days.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredEmails.map((email) => (
              <div 
                key={email.id} 
                onClick={() => window.open(`https://mail.google.com/mail/u/0/#inbox/${email.id}`, "_blank")}
                className="group p-6 hover:bg-gray-50/50 cursor-pointer transition-all flex flex-col md:flex-row gap-6 relative"
              >
                {/* Category Indicator Line */}
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1 transition-all opacity-0 group-hover:opacity-100",
                  email.category === "Applicant" ? "bg-blue-600" :
                  email.category === "Collaboration" ? "bg-purple-600" : "bg-gray-300"
                )} />

                <div className="flex items-start gap-4 flex-1">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 shadow-sm group-hover:scale-110 transition-transform",
                    email.category === "Applicant" ? "bg-blue-50 text-blue-600" :
                    email.category === "Collaboration" ? "bg-purple-50 text-purple-600" : "bg-gray-50 text-gray-400"
                  )}>
                    {email.sender?.[0]?.toUpperCase() || "?"}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-black text-gray-900 truncate max-w-[200px]">
                        {email.sender?.split('<')[0].trim() || "Unknown Sender"}
                      </span>
                      <div className="flex gap-1.5">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                          email.category === "Applicant" ? "bg-blue-100 text-blue-700" :
                          email.category === "Collaboration" ? "bg-purple-100 text-purple-700" :
                          email.category === "Spam" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                        )}>
                          {email.category}
                        </span>
                        {email.category === "Applicant" && email.ai_details?.match_score > 0 && (
                          <span className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-gray-900 text-white">
                            {email.ai_details.match_score}% MATCH
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h4 className="text-base font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                      {email.subject || "(No Subject)"}
                    </h4>

                    {email.ai_details && (
                      <div className="mb-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden">
                        <div className="relative z-10">
                          <p className="text-xs text-gray-600 font-medium italic mb-2 leading-relaxed">
                            "{email.ai_details.intent_summary}"
                          </p>
                          {email.ai_details.match_reason && (
                            <div className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-200/50">
                              <BrainCircuit className="w-3.5 h-3.5 text-blue-500 mt-0.5" />
                              <p className="text-[10px] text-gray-500 font-bold leading-tight">
                                AI INSIGHT: {email.ai_details.match_reason}
                              </p>
                            </div>
                          )}
                        </div>
                        {/* Background subtle brain icon */}
                        <BrainCircuit className="absolute -right-4 -bottom-4 w-20 h-20 text-gray-200/20" />
                      </div>
                    )}

                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-4">
                      {email.snippet}
                    </p>

                    {!feedbackGiven[email.id] && (
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Train AI:</span>
                         <button
                            onClick={(e) => handleFeedback(email.id, true, email.category, e)}
                            className="px-3 py-1.5 rounded-lg border border-gray-100 text-[10px] font-bold text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all"
                         >
                           ✓ Accurate
                         </button>
                         <button
                            onClick={(e) => handleFeedback(email.id, false, email.category, e)}
                            className="px-3 py-1.5 rounded-lg border border-gray-100 text-[10px] font-bold text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                         >
                           ✕ Incorrect
                         </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between shrink-0">
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">
                    {email.date ? new Date(email.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ""}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 group-hover:text-blue-600 group-hover:border-blue-100 group-hover:shadow-sm transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
