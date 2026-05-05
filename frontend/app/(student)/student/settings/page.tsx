"use client";
import { useSession, signOut } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <header>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Account Settings</h1>
        <p className="text-slate-400 font-semibold">Manage your connected accounts and application preferences.</p>
      </header>

      <div className="grid grid-cols-1 gap-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-6">Connected Accounts</h3>
          <div className="flex justify-between items-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-4">
              <img src={session?.user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Kiran"} className="w-12 h-12 rounded-xl border-2 border-white shadow-sm" />
              <div>
                <div className="font-bold text-slate-900">{session?.user?.name}</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Google Workspace Connected</div>
              </div>
            </div>
            <span className="text-[10px] bg-green-50 text-green-600 border border-green-100 px-3 py-1 rounded-lg font-black uppercase tracking-widest">Active</span>
          </div>
        </div>

        <div className="bg-white border border-red-50 rounded-2xl p-8 shadow-sm">
          <h3 className="text-xl font-black text-red-600 mb-6">Security & Session</h3>
          <p className="text-sm text-slate-400 font-medium mb-8">
            Logging out will end your current session. You will need to sign back in to access your AI matched opportunities.
          </p>
          <button 
            onClick={() => signOut()}
            className="w-full bg-red-50 text-red-600 hover:bg-red-100 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all border border-red-100"
          >
            Sign Out from Platform
          </button>
        </div>
      </div>
    </div>
  );
}
