"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { PlusCircle, Loader2, CheckCircle } from "lucide-react";

const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Remote"];

export default function PostJobPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: "",
    company: "",
    description: "",
    location: "",
    type: "Full-time",
    salary_range: "",
    requirements: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.company || !form.description) {
      alert("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/jobs/", {
        title: form.title,
        company: form.company,
        location: form.location,
        salary_range: form.salary_range,
        description: form.description,
      });
      setSuccess(true);
      setTimeout(() => router.push("/recruiter/jobs"), 1500);
    } catch (err) {
      alert("Failed to post job. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Job Posted!</h2>
        <p className="text-gray-500">Redirecting to your jobs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-blue-600" /> Post a New Job
        </h1>
        <p className="text-gray-500 text-sm mt-1">Candidates will be AI-ranked against your job requirements</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Job Title *</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Senior React Developer"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Company Name *</label>
            <input
              value={form.company}
              onChange={e => setForm({ ...form, company: e.target.value })}
              placeholder="e.g. TechCorp Inc."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Location</label>
            <input
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Lahore, Pakistan / Remote"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Job Type</label>
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Salary Range</label>
            <input
              value={form.salary_range}
              onChange={e => setForm({ ...form, salary_range: e.target.value })}
              placeholder="e.g. PKR 80,000 - 120,000/month"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Detailed Job Description *</label>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Paste your job description here. Our AI will automatically extract required skills, tech stack, and experience levels."
            rows={10}
            className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none leading-relaxed"
            required
          />
          <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full w-fit uppercase tracking-wider">
            <CheckCircle className="w-3.5 h-3.5" /> AI Hiring Intelligence Enabled
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-70 flex items-center justify-center gap-3 mt-4"
        >
          {saving ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Requirements...</>
          ) : (
            <><PlusCircle className="w-5 h-5" /> Post & Analyze Job</>
          )}
        </button>
      </form>
    </div>
  );
}
