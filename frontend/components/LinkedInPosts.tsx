"use client";
import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileText,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  DownloadCloud,
} from "lucide-react";

interface Post {
  post_id: string;
  text: string;
  source_url?: string;
  saved_at: string;
}

export default function LinkedInPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const fetchPosts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await api.get("/linkedin/my-posts?limit=50");
      setPosts(res.data.posts || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load LinkedIn posts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    // Auto-refresh every 10 seconds to catch posts immediately after the user fetches them
    const interval = setInterval(() => fetchPosts(true), 10000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

  const handleClear = async () => {
    if (!confirm("Clear all your synced LinkedIn posts? This cannot be undone.")) return;
    setClearing(true);
    try {
      await api.delete("/linkedin/my-posts/clear");
      setPosts([]);
    } catch {
      setError("Failed to clear posts.");
    } finally {
      setClearing(false);
    }
  };

  const handleFetchClick = () => {
    // Open LinkedIn recent activity page where the extension can scrape posts
    window.open("https://www.linkedin.com/in/me/recent-activity/all/?careertrack_fetch=true", "_blank");
    // Start a visual refresh indicating we are waiting for data
    setRefreshing(true);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  };

  const truncate = (text: string, len = 200) =>
    text.length > len ? text.slice(0, len) + "…" : text;

  // ── Header ──────────────────────────────────────────────────────────────────
  const Header = () => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#0a66c2] rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
          <Link2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">LinkedIn Posts</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            {posts.length > 0 ? "Synced via Extension" : "Setup Required"}
          </p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        {posts.length > 0 && (
          <button onClick={handleClear} disabled={clearing} title="Clear all posts"
            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40 border border-transparent">
            {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        )}
        
        {/* The Fetch Button the User Requested */}
        <button 
          onClick={handleFetchClick}
          className="flex items-center gap-2 px-4 py-2 bg-[#0a66c2] hover:bg-[#004182] text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95"
        >
          <DownloadCloud className="w-4 h-4" />
          Fetch New Posts
        </button>

        <button onClick={() => fetchPosts(true)} disabled={refreshing} title="Refresh UI"
          className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-40 border border-transparent border-gray-100 bg-white shadow-sm">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full">
        <Header />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#0a66c2] animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <Header />
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      </div>
    );
  }

  // ── Empty State ─────────────────────────────────────────────────────────────
  if (posts.length === 0) {
    return (
      <div className="w-full">
        <Header />
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden"
        >
          <div className="max-w-lg mx-auto space-y-8 py-4">
            
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-[#0a66c2]/10 rounded-2xl flex items-center justify-center mx-auto text-[#0a66c2]">
                <DownloadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900">No Posts Fetched Yet</h3>
              <p className="text-gray-500 font-medium">
                To sync your posts, you need to trigger a fetch from your LinkedIn profile.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                How to Fetch Your Posts
              </p>

              {[
                {
                  n: "1",
                  title: "Install & Link",
                  desc: 'Ensure the Chrome Extension is running and you have linked your account email.',
                },
                {
                  n: "2",
                  title: "Click Fetch Button",
                  desc: "Click the blue 'Fetch New Posts' button above. This opens your LinkedIn activity page.",
                },
                {
                  n: "3",
                  title: "Scroll & Wait",
                  desc: "Scroll down briefly on the LinkedIn page. The extension will automatically grab the posts and they will appear here in a few seconds!",
                },
              ].map((s) => (
                <div key={s.n} className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#0a66c2] flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5 shadow-sm">
                    {s.n}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button 
                onClick={handleFetchClick}
                className="flex items-center gap-2 px-6 py-4 bg-[#0a66c2] hover:bg-[#004182] text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-200 active:scale-95"
              >
                <DownloadCloud className="w-5 h-5" />
                Fetch Posts Now
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    );
  }

  // ── Posts Feed ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <Header />

      {/* Stats bar */}
      <div className="flex items-center gap-3 mb-5 px-1">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-black text-blue-700">
            {posts.length} post{posts.length !== 1 ? "s" : ""} fetched
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
          Auto-updating UI...
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {posts.map((post, i) => {
            const isExpanded = expandedId === post.post_id;
            const isLong = post.text.length > 200;

            return (
              <motion.div
                key={post.post_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-blue-100 transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#0a66c2]/10 flex items-center justify-center">
                      <Link2 className="w-4 h-4 text-[#0a66c2]" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900">LinkedIn Post</p>
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDate(post.saved_at)}
                      </div>
                    </div>
                  </div>
                  {post.source_url && (
                    <a href={post.source_url} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-500 hover:text-blue-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                      Open <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                    {isExpanded ? post.text : truncate(post.text)}
                  </p>
                </div>

                {isLong && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : post.post_id)}
                    className="mt-4 ml-7 flex items-center gap-1 text-xs font-bold text-[#0a66c2] hover:text-[#004182] transition-colors"
                  >
                    {isExpanded ? (<>Show less <ChevronUp className="w-3 h-3" /></>) : (<>Read full post <ChevronDown className="w-3 h-3" /></>)}
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
