"use client";

import { useSession } from "next-auth/react";
import { 
  Bell, 
  Search} from "lucide-react";

export default function TopBar() {
  const { data: session } = useSession();

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..."
            className="w-full bg-gray-50 border border-gray-200 rounded py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        
        <div className="h-8 w-px bg-gray-200 mx-2"></div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {session?.user?.name || "User"}
          </span>
          <img 
            src={session?.user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Kiran"} 
            alt="User" 
            className="w-8 h-8 rounded-full border border-gray-200"
          />
        </div>
      </div>
    </header>
  );
}
