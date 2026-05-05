"use client";
import RecruiterSidebar from "@/components/RecruiterSidebar";
import TopBar from "@/components/TopBar";
import { useState } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { BrainCircuit, CheckCircle2, XCircle, Trash2, ShieldAlert } from "lucide-react";

export default function FilterPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runFilter = async () => {
    setLoading(true);
    try {
      const res = await api.post("/recruiter/auto-filter/1");
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <RecruiterSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-10 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-10">
            <header>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">AI Pipeline Intelligence</h1>
              <p className="text-slate-400 font-semibold italic">Automatically identify and isolate candidates that do not meet minimum professional criteria.</p>
            </header>

            {!result ? (
              <div className="ct-card border-dashed border-2 border-blue-100 bg-blue-50/10 text-center py-24">
                 <div className="w-24 h-24 rounded-[2rem] bg-white border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-10 shadow-sm">
                   <BrainCircuit className="w-12 h-12" />
                 </div>
                 <div className="mb-10">
                    <h3 className="text-2xl font-black text-slate-900 mb-2">AI Purge Engine Ready</h3>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                      Our intelligence engine will scan all active applications to filter out candidates who don't match your required technical stack or academic minimums.
                    </p>
                 </div>
                 <button 
                    onClick={runFilter} 
                    disabled={loading}
                    className="btn-primary px-12 py-5 shadow-xl shadow-blue-100 disabled:opacity-50 h-auto"
                 >
                    {loading ? "Analyzing Pipeline Intelligence..." : "Run AI Intelligence Filter"}
                 </button>
              </div>
            ) : (
              <div className="space-y-10 animate-in fade-in duration-700">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="ct-card border-green-100 bg-green-50/10">
                       <div className="text-green-600 font-black uppercase text-[10px] tracking-widest mb-4 flex items-center gap-2">
                         <CheckCircle2 className="w-4 h-4" /> Qualified
                       </div>
                       <div className="text-5xl font-black text-slate-900">{result.qualified.length}</div>
                    </div>
                    <div className="ct-card border-red-100 bg-red-50/10">
                       <div className="text-red-600 font-black uppercase text-[10px] tracking-widest mb-4 flex items-center gap-2">
                         <ShieldAlert className="w-4 h-4" /> Isolated
                       </div>
                       <div className="text-5xl font-black text-slate-900">{result.rejected.length}</div>
                    </div>
                    <div className="ct-card">
                       <div className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-4">Total Scanned</div>
                       <div className="text-5xl font-black text-slate-900">{result.total}</div>
                    </div>
                 </div>

                 <div className="ct-card">
                    <div className="flex justify-between items-center mb-10">
                       <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                          Isolated Applications
                       </h3>
                       <button className="text-xs font-bold text-red-600 hover:underline flex items-center gap-2">
                         <Trash2 className="w-4 h-4" /> Clear Filtered
                       </button>
                    </div>
                    <div className="space-y-4">
                       {result.rejected.map((c: any) => (
                          <div key={c.id} className="bg-slate-50 p-6 rounded-2xl flex justify-between items-center border border-slate-100 group hover:border-red-200 transition-colors">
                             <div>
                                <div className="font-bold text-slate-900 mb-1">{c.name}</div>
                                <div className="text-xs font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-widest">
                                  <XCircle className="w-3.5 h-3.5" /> {c.reason}
                                </div>
                             </div>
                             <button className="text-[10px] font-black text-slate-300 hover:text-slate-600 uppercase tracking-widest transition-colors">Restore Application</button>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
