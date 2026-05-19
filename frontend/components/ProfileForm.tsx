"use client";
import { useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";

export default function ProfileForm() {
  const toast = useToast();
  const [profile, setProfile] = useState({
    degree: "B.S. Software Engineering",
    semester: "6th",
    cgpa: "3.5",
    skills: "Python, React, FastAPI",
    interests: "AI, Web Dev",
    pref_types: "Internship, Remote",
    financial_need: "Yes",
    location_pref: "Remote",
    experience: "1 year"
  });

  const saveProfile = async () => {
    try {
      await api.post("/student/profile", profile);
      toast("Profile saved. AI matching is active.");
    } catch (err) {
      console.error(err);
      toast("Could not save profile. Check your connection.", "error");
    }
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-small text-slate-500">Degree Program</label>
          <input 
            value={profile.degree} 
            onChange={(e) => setProfile({...profile, degree: e.target.value})} 
            className="ct-input"
            placeholder="e.g. B.S. Computer Science"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
             <label className="text-small text-slate-500">Semester</label>
             <input 
               value={profile.semester} 
               onChange={(e) => setProfile({...profile, semester: e.target.value})} 
               className="ct-input"
               placeholder="6th"
             />
           </div>
           <div className="space-y-2">
             <label className="text-small text-slate-500">Current CGPA</label>
             <input 
               value={profile.cgpa} 
               onChange={(e) => setProfile({...profile, cgpa: e.target.value})} 
               className="ct-input"
               placeholder="3.50"
             />
           </div>
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-small text-slate-500">Professional Skills</label>
          <input 
            value={profile.skills} 
            onChange={(e) => setProfile({...profile, skills: e.target.value})} 
            className="ct-input"
            placeholder="React, Python, Cloud Computing..."
          />
        </div>
        <div className="space-y-2">
          <label className="text-small text-slate-500">Financial Aid Needed</label>
          <select 
            value={profile.financial_need} 
            onChange={(e) => setProfile({...profile, financial_need: e.target.value})} 
            className="ct-input"
          >
             <option>Yes</option>
             <option>No</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-small text-slate-500">Preferred Location</label>
          <input 
            value={profile.location_pref} 
            onChange={(e) => setProfile({...profile, location_pref: e.target.value})} 
            className="ct-input"
            placeholder="e.g. Remote, New York, London"
          />
        </div>
      </div>
      <div className="pt-6 border-t border-slate-50">
        <button onClick={saveProfile} className="btn-primary w-full md:w-auto px-12">
          💾 Save Matching Data
        </button>
      </div>
    </div>
  );
}
