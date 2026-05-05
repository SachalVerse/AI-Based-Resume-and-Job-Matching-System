"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { BookOpen, Code, Briefcase, ArrowRight, Loader2 } from "lucide-react";

const SKILL_OPTIONS = [
  "Python", "JavaScript", "TypeScript", "React", "Node.js",
  "FastAPI", "MongoDB", "SQL", "Docker", "AWS",
  "Machine Learning", "Deep Learning", "Data Analysis",
  "HTML/CSS", "Next.js", "Git", "REST APIs", "GraphQL"
];

const INTEREST_OPTIONS = [
  "Artificial Intelligence", "Web Development", "Backend Engineering",
  "Data Science", "Cloud Computing", "Cybersecurity",
  "Mobile Development", "DevOps", "Machine Learning", "Blockchain"
];

export default function StudentProfileSetup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    education: "",
    degree: "",
    cgpa: "",
    github_username: "",
    location: "",
    skills: [] as string[],
    interests: [] as string[],
  });

  const toggleItem = (field: "skills" | "interests", val: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(val)
        ? prev[field].filter(s => s !== val)
        : [...prev[field], val]
    }));
  };

  const handleSubmit = async () => {
    if (form.skills.length === 0 || form.interests.length === 0 || !form.name || !form.education) {
      alert("Please fill in all required fields and select at least one skill and interest.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/student/profile", {
        ...form,
        cgpa: form.cgpa ? parseFloat(form.cgpa) : undefined,
      });
      router.push("/student/dashboard");
    } catch (err) {
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Complete Your Profile</h1>
          <p className="text-gray-500 mt-2">AI will personalize job matches based on your profile</p>

          {/* Step Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-2 rounded-full transition-all duration-300 ${step === s ? "w-8 bg-blue-600" : "w-2 bg-gray-200"}`} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Step 1 - Basic Info */}
          {step === 1 && (
            <div className="p-8 space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Personal & Education</h2>
                  <p className="text-xs text-gray-400">Tell us about your background</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Ali Hassan"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Lahore, Pakistan"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">University / Institution *</label>
                  <input
                    type="text"
                    value={form.education}
                    onChange={e => setForm({ ...form, education: e.target.value })}
                    placeholder="e.g. FAST NUCES, Lahore"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Degree Program</label>
                  <input
                    type="text"
                    value={form.degree}
                    onChange={e => setForm({ ...form, degree: e.target.value })}
                    placeholder="e.g. BS Computer Science"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    value={form.cgpa}
                    onChange={e => setForm({ ...form, cgpa: e.target.value })}
                    placeholder="e.g. 3.5"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    <span className="flex items-center gap-1">
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      GitHub Username
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.github_username}
                    onChange={e => setForm({ ...form, github_username: e.target.value })}
                    placeholder="e.g. ali-hassan"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!form.name || !form.education}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2 - Skills */}
          {step === 2 && (
            <div className="p-8 space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Code className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Your Technical Skills</h2>
                  <p className="text-xs text-gray-400">Select all that apply (minimum 1)</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map(skill => (
                  <button
                    key={skill}
                    onClick={() => toggleItem("skills", skill)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                      form.skills.includes(skill)
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition">
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={form.skills.length === 0}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 - Interests */}
          {step === 3 && (
            <div className="p-8 space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Your Career Interests</h2>
                  <p className="text-xs text-gray-400">Used for AI job matching (minimum 1)</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map(interest => (
                  <button
                    key={interest}
                    onClick={() => toggleItem("interests", interest)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                      form.interests.includes(interest)
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition">
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={form.interests.length === 0 || saving}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>Launch Dashboard <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
