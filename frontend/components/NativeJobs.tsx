"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import api from "@/lib/api";
import {
  Briefcase, MapPin, Clock, ChevronRight, Loader2, Sparkles,
  ShieldCheck, X, FileText, Upload, Image as ImageIcon, AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function NativeJobs() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [applyingStatus, setApplyingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // ── new separate upload states ──────────────────────────────────────────────
  const [cvFile, setCvFile] = useState<File | null>(null);           // required PDF CV
  const [certFiles, setCertFiles] = useState<File[]>([]);            // optional cert images/PDFs
  const [cvError, setCvError] = useState<string>("");

  useEffect(() => {
    api.get("/jobs/")
      .then((r) => setJobs(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleApplyClick = (job: any) => {
    setSelectedJob(job);
    setCvFile(null);
    setCertFiles([]);
    setCvError("");
    setApplyingStatus("idle");
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      setCvError("CV must be a PDF file.");
      return;
    }
    setCvError("");
    setCvFile(f);
  };

  const handleCertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCertFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    const token = (session as any)?.accessToken || session?.user?.accessToken;
    if (!token) { alert("Please login with Google first!"); return; }

    if (!cvFile) { setCvError("Please upload your CV (PDF) before applying."); return; }

    setApplyingStatus("loading");

    const formData = new FormData();
    formData.append("cv", cvFile);
    certFiles.forEach((f) => formData.append("certificates", f));

    try {
      const res = await api.post(`/jobs/${selectedJob.id}/apply`, formData, {
        headers: { "access-token": token, "Content-Type": "multipart/form-data" },
      });

      const { email_status } = res.data;
      if (email_status === "failed" || email_status === "no_token") {
        alert("⚠️ Application recorded! However, the recruiter email couldn't be sent. Please log out and back in to restore Gmail access.");
      }

      setApplyingStatus("success");
      setTimeout(() => { setSelectedJob(null); setApplyingStatus("idle"); }, 3500);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Application failed. Please try again.");
      setApplyingStatus("error");
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      (job.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (job.company?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Platform Jobs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <input
          type="text"
          placeholder="Search by role or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-8 py-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
          <Briefcase className="w-5 h-5" />
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
          <Briefcase className="w-16 h-16 text-gray-200 mx-auto mb-6" />
          <h3 className="text-xl font-black text-gray-900">No Jobs Found</h3>
          <p className="text-gray-500 max-w-xs mx-auto mt-2">Try different keywords!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100">
                  <Sparkles className="w-3.5 h-3.5" /> AI Match
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-tight group-hover:text-blue-600 transition-colors pr-16">{job.title}</h3>
                  <p className="text-blue-600 font-bold mt-1">{job.company}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400">
                  <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-300" /> {job.location || "Remote"}</div>
                  <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-300" /> {new Date(job.created_at).toLocaleDateString()}</div>
                </div>
                <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{job.description}</p>
                <button
                  onClick={() => handleApplyClick(job)}
                  className="w-full mt-6 py-4 rounded-2xl font-black bg-gray-900 text-white hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  View & Apply <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Application Modal ─────────────────────────────────────────────────── */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
            <div className="p-8 space-y-6 overflow-y-auto flex-1">

              {/* Modal header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600 text-white rounded-2xl">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Apply — {selectedJob.title}</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedJob.company}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* AI info banner */}
              <div className="p-5 bg-blue-50 border border-blue-100 rounded-3xl space-y-2">
                <p className="text-sm text-blue-900 leading-relaxed font-medium">
                  Our AI will analyze your <strong>CV</strong>, <strong>LinkedIn posts</strong>, <strong>GitHub profile</strong>, and any <strong>certificate images</strong> you upload — then send a full verification report to the recruiter.
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-black text-blue-600 uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> CV Analysis</span>
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> LinkedIn Posts</span>
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> GitHub Audit</span>
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Cert Scan</span>
                </div>
              </div>

              {/* ── CV Upload (required) ─────────────────────────────────────── */}
              <div className="space-y-2">
                <label className="block text-sm font-black text-gray-800">
                  Upload Your CV <span className="text-red-500">*</span>
                  <span className="ml-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">PDF only</span>
                </label>
                <label
                  htmlFor="cvUpload"
                  className={cn(
                    "flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all",
                    cvFile
                      ? "border-green-300 bg-green-50"
                      : cvError
                      ? "border-red-300 bg-red-50"
                      : "border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                  )}
                >
                  <div className={cn("p-3 rounded-xl", cvFile ? "bg-green-100" : "bg-gray-100")}>
                    {cvFile ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <Upload className="w-6 h-6 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-bold truncate", cvFile ? "text-green-800" : "text-gray-600")}>
                      {cvFile ? cvFile.name : "Click to select your CV (PDF)"}
                    </p>
                    {cvFile && (
                      <p className="text-xs text-green-600 font-medium mt-0.5">
                        {(cvFile.size / 1024).toFixed(0)} KB — Ready to submit
                      </p>
                    )}
                  </div>
                </label>
                <input id="cvUpload" type="file" className="hidden" accept="application/pdf" onChange={handleCvChange} />
                {cvError && (
                  <div className="flex items-center gap-2 text-red-500 text-xs font-bold">
                    <AlertCircle className="w-3.5 h-3.5" /> {cvError}
                  </div>
                )}
              </div>

              {/* ── Certificate Images (optional) ────────────────────────────── */}
              <div className="space-y-2">
                <label className="block text-sm font-black text-gray-800">
                  Certificate / Evidence Images
                  <span className="ml-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Optional</span>
                </label>
                <label
                  htmlFor="certUpload"
                  className="flex items-center gap-4 p-5 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                >
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600">
                      {certFiles.length > 0 ? `${certFiles.length} file(s) selected` : "Add certificate images or PDFs"}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      AI reads them via vision — Groq Llama-4
                    </p>
                  </div>
                </label>
                <input id="certUpload" type="file" className="hidden" multiple accept="image/*,application/pdf" onChange={handleCertChange} />

                {certFiles.length > 0 && (
                  <div className="space-y-1.5">
                    {certFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="text-xs font-bold text-gray-700 truncate flex-1">{f.name}</span>
                        <span className="text-[10px] font-bold text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={applyingStatus === "loading" || applyingStatus === "success"}
                className={cn(
                  "w-full py-5 rounded-[1.5rem] font-black text-white transition-all flex items-center justify-center gap-3 shadow-xl",
                  applyingStatus === "loading" ? "bg-gray-400 cursor-not-allowed" :
                  applyingStatus === "success" ? "bg-green-600" :
                  "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
                )}
              >
                {applyingStatus === "loading" ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> AI is verifying & sending report…</>
                ) : applyingStatus === "success" ? (
                  <><ShieldCheck className="w-5 h-5" /> Application Sent to Recruiter!</>
                ) : (
                  <>Submit Application — AI Verified</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
