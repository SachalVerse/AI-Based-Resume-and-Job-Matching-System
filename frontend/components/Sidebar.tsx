"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Search, 
  Briefcase, 
  Settings,
  Sparkles,
  BarChart2,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";

const navItems = [
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Job Search", href: "/student/jobs", icon: Search },
  { name: "Job Suggestions", href: "/student/suggestions", icon: Sparkles },
  { name: "My Resumes", href: "/student/resume", icon: Briefcase },
  { name: "Analytics", href: "/student/analytics", icon: BarChart2 },
  { name: "Settings", href: "/student/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col border-r border-gray-200 bg-white">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900">CareerTrack</h2>
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">Student Portal</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive 
                  ? "bg-blue-50 text-blue-700 font-bold" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-blue-600" : "text-gray-400")} />
              {item.name}
              {item.name === "Job Suggestions" && (
                <span className="ml-auto text-[9px] bg-blue-100 text-blue-600 font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide">AI</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-4">
        <div className="flex items-center gap-3">
          <img 
            src={session?.user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Kiran"} 
            alt="User" 
            className="w-8 h-8 rounded-full border border-gray-200"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{session?.user?.name || "User"}</p>
            <p className="text-xs text-gray-500">Student</p>
          </div>
        </div>

        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all group"
        >
          <LogOut className="w-4 h-4 text-red-500 group-hover:-translate-x-1 transition-transform" />
          Logout
        </button>
      </div>
    </aside>
  );
}
