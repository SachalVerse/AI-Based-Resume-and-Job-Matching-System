"use client";
import { useState, useEffect, useMemo } from "react";
import { useSession, signIn } from "next-auth/react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Search, Mail, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";

type InboxCategory = "Opportunity" | "New Job" | "Spam" | "Other";
type FilterTab = "All" | InboxCategory;

function inferCategory(email: { snippet?: string; subject?: string; labels?: string[]; category?: string }): InboxCategory {
  const text = `${email.subject || ""} ${email.snippet || ""}`.toLowerCase();
  
  // 1. Aggressive Block Filter (Block these from being Jobs/Opportunities)
  const blockTerms = /assignment|homework|quiz|exam|lecture|student|class|course|grading|canvas|moodle|university|school|tutorial|submission|mailer-daemon|delivery subsystem|mail delivery|security alert|verification|undelivered|daemon|delivery status|failure|onboarding|milestone|getting started|quickstart|documentation|docs|mapbox onboarding|display a map|add data/i;
  if (blockTerms.test(text)) return "Other";

  // 2. AI Priority
  if (email.category === "Opportunity") return "Opportunity";
  if (email.category === "Spam" || email.labels?.includes("SPAM")) return "Spam";
  
  // 3. Career Regex
  const jobHints = /\b(hiring|opening|apply|career|internship|full-stack|developer|engineer|recruiter|interview|role|position|vacancy|offer|hr|talent|remote|contract)\b/;
  if (jobHints.test(text)) return "New Job";
  
  return "Other";
}

export default function EmailAnalyzer() {
  const { data: session } = useSession();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

  useEffect(() => {
    if (session?.accessToken && emails.length === 0) fetchEmails();
  }, [session]);

  const fetchEmails = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/student/fetch-emails", {
        headers: { "access-token": session.accessToken },
      });
      const list = response.data || [];
      setEmails(list.map((e: any) => ({ ...e, _category: inferCategory(e) })));
    } catch (error: any) {
      setError("Failed to fetch emails.");
    } finally {
      setLoading(false);
    }
  };

  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState<string | null>(null);

  const handleFeedback = async (
    emailId: string,
    isCorrect: boolean,
    predictedCategory: InboxCategory,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const previousEmails = emails;
    // Instant UX: remove from current list immediately on wrong feedback.
    if (!isCorrect) {
      setEmails((prev) => prev.filter((em) => em.id !== emailId));
    }
    setIsFeedbackSubmitting(emailId);
    try {
      await api.post("/student/feedback/categorization", null, {
        params: {
          email_id: emailId,
          is_correct: isCorrect,
          correct_value: isCorrect ? undefined : "Other",
          predicted_category: predictedCategory,
        }
      });
      setFeedbackGiven(prev => ({ ...prev, [emailId]: true }));
    } catch (err) {
      console.error("Feedback failed:", err);
      // Roll back optimistic removal on error.
      if (!isCorrect) {
        setEmails(previousEmails);
      }
    } finally {
      setIsFeedbackSubmitting(null);
    }
  };

  const filteredEmails = useMemo(() => {
    if (activeTab === "All") return emails;
    return emails.filter((e) => e._category === activeTab);
  }, [emails, activeTab]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600" /> Smart Inbox
        </h3>
        <button onClick={fetchEmails} disabled={loading} className="btn-secondary text-sm">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {(["All", "Opportunity", "New Job", "Other", "Spam"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "All" ? "All" : tab === "New Job" ? "Jobs" : tab}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded divide-y divide-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
             <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
             Loading emails...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : filteredEmails.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No emails found.</div>
        ) : (
          filteredEmails.map((email) => (
            <div 
              key={email.id} 
              onClick={() => window.open(`https://mail.google.com/mail/u/0/#inbox/${email.id}`, "_blank")}
              className="p-4 hover:bg-gray-50 cursor-pointer flex items-start gap-4 transition-all border-l-4 border-transparent hover:border-blue-500 group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                {email.sender?.[0]?.toUpperCase() || "M"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-gray-900 truncate">
                    {email.sender?.split('<')[0].trim() || "Unknown"}
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    email._category === "Opportunity" ? "bg-green-100 text-green-700" :
                    email._category === "New Job" ? "bg-blue-100 text-blue-700" :
                    email._category === "Spam" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                  )}>
                    {email._category}
                  </span>
                </div>
                <p className="text-sm text-gray-800 font-semibold truncate mb-1">{email.subject || "No Subject"}</p>
                
                {email.ai_details && email._category === "Opportunity" && (
                  <div className="flex flex-wrap gap-3 mt-2 mb-2">
                    <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                      <span className="font-bold">Org:</span> {email.ai_details.organisation || "N/A"}
                    </div>
                    {email.ai_details.deadline && (
                      <div className="flex items-center gap-1 text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                        <span className="font-bold">Deadline:</span> {email.ai_details.deadline}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                      <span className="font-bold">Type:</span> {email.ai_details.type || "Opportunity"}
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 line-clamp-1">{email.snippet}</p>

                {/* Feedback Loop RL */}
                {!feedbackGiven[email.id] ? (
                  <div className="mt-3 flex items-center gap-4 border-t border-gray-50 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">AI Categorization:</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => handleFeedback(email.id, true, email._category, e)}
                        disabled={isFeedbackSubmitting === email.id}
                        className="text-[10px] px-2 py-0.5 rounded border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                      >
                        ✓ Correct
                      </button>
                      <button 
                        onClick={(e) => handleFeedback(email.id, false, email._category, e)}
                        disabled={isFeedbackSubmitting === email.id}
                        className="text-[10px] px-2 py-0.5 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        ✕ Wrong
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-[10px] text-gray-400 font-medium">
                   {email.date ? new Date(email.date).toLocaleDateString() : ""}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
