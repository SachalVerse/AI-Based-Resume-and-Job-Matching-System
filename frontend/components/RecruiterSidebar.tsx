"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  BrainCircuit,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";

const menuItems = [
  { name: "Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
  { name: "Matched Applicants", href: "/recruiter/candidates", icon: Users },
  { name: "AI Criteria", href: "/recruiter/dashboard", icon: BrainCircuit },
];

export default function RecruiterSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col sticky top-0">
      <div className="p-6 border-b border-gray-50">
        <h2 className="text-xl font-bold text-gray-900">CareerTrack</h2>
        <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Recruiter Panel</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
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
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-4">
        <div className="flex items-center gap-3">
          <img 
            src={session?.user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Recruiter"} 
            alt="User" 
            className="w-8 h-8 rounded-full border border-gray-200"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{session?.user?.name || "Manager"}</p>
            <p className="text-xs text-gray-500">Recruiter</p>
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
