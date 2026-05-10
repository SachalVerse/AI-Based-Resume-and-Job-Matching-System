"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { uid } from "@/lib/utils";
import { buildEditorUrl } from "@/lib/editorNavigation";
import type { ResumeData } from "@/types/types";
import { FileText, Trash2, Plus, RefreshCw, Code } from "lucide-react";
import api from "@/lib/api";

export type ResumeCvDashboardVariant = "standalone" | "student";

interface ResumeCvDashboardProps {
  variant?: ResumeCvDashboardVariant;
}

export default function ResumeCvDashboard({ variant = "standalone" }: ResumeCvDashboardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [savedResumes, setSavedResumes] = useState<{ id: string; name: string; date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const fromStudent = variant === "student";

  const loadResumes = async () => {
    setLoading(true);
    const email = session?.user?.email || "student@example.com";
    
    // 1. Load from localStorage (legacy/local)
    const localResumes: { id: string; name: string; date: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("resume-builder-data-")) {
        const id = key.replace("resume-builder-data-", "");
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const data = JSON.parse(raw) as ResumeData;
            localResumes.push({
              id,
              name: data.name || "Untitled Resume",
              date: new Date(data.updatedAt).toLocaleDateString(),
            });
          }
        } catch { /* ignore */ }
      }
    }

    // 2. Load from Backend
    let remoteResumes: any[] = [];
    try {
      const res = await api.get(`/resumes/${email}`);
      remoteResumes = res.data.map((r: any) => ({
        id: r.id,
        name: r.name,
        date: new Date(r.updated_at).toLocaleDateString(),
      }));
    } catch (err) {
      console.error("Failed to fetch remote resumes:", err);
    }

    // 3. Merge (de-duplicate by ID if needed)
    setSavedResumes([...remoteResumes, ...localResumes]);
    setLoading(false);
  };

  useEffect(() => {
    loadResumes();
  }, [session]);

  const handleCreateNew = () => {
    const newId = uid();
    router.push(buildEditorUrl(newId, fromStudent));
  };

  const handleGenerateFromGithub = async () => {
    if (cooldown > 0) return;
    const username = prompt("Enter your GitHub username:");
    if (!username) return;

    setIsGenerating(true);
    try {
      const email = session?.user?.email || "student@example.com";
      const res = await api.post("/resumes/generate-from-github", {
        user_email: email,
        github_username: username
      });
      alert(res.data.message);
      loadResumes();
    } catch (err: any) {
      console.error("GitHub Generation failed:", err);
      const message = err.response?.data?.detail || "Failed to generate CV. Please check your GitHub username and AI settings.";
      alert(message);
      
      if (err.response?.status === 429) {
        setCooldown(60); // Set 1-minute cooldown on 429
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetProfile = () => {
    if (confirm("This will reset your AI profile data. Are you sure?")) {
      const email = session?.user?.email || "default";
      localStorage.removeItem(`onboarded_${email}`);
      window.location.reload();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this resume?")) {
      try {
        if (id.length > 10) {
          await api.delete(`/resumes/${id}`);
        }
        localStorage.removeItem(`resume-builder-data-${id}`);
        setSavedResumes(savedResumes.filter((r) => r.id !== id));
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete resume. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-gray-100 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Resumes</h2>
          <p className="text-sm text-gray-500">Manage your resumes and AI matching profile.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleResetProfile} 
            className="px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50"
          >
            Reset Profile
          </button>
          <button 
            onClick={handleGenerateFromGithub} 
            disabled={isGenerating || cooldown > 0}
            className="px-3 py-2 text-sm border border-blue-200 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 flex items-center gap-2 disabled:opacity-50"
          >
            <Code className="w-4 h-4" />
            {isGenerating ? "Generating..." : cooldown > 0 ? `Wait (${cooldown}s)` : "Generate from GitHub"}
          </button>
          <button 
            onClick={handleCreateNew} 
            className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New
          </button>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-50 border border-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : savedResumes.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg py-12 text-center bg-gray-50">
          <p className="text-gray-500">No resumes found. Click "Create New" to start.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedResumes.map((resume) => (
            <div key={resume.id} className="bg-white border border-gray-200 rounded p-4 flex flex-col hover:border-blue-500 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <button onClick={() => handleDelete(resume.id)} className="text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-gray-900">{resume.name}</h3>
              <p className="text-xs text-gray-400 mb-4 uppercase">Last updated: {resume.date}</p>
              <button 
                onClick={() => router.push(buildEditorUrl(resume.id, fromStudent))}
                className="mt-auto w-full py-2 bg-blue-50 text-blue-700 text-sm font-bold rounded hover:bg-blue-100"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
