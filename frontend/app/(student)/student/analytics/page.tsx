"use client";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { BarChart3, Sparkles, Target, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get("/student/suggestions");
        setSuggestions(Array.isArray(res.data) ? res.data : []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const stats = useMemo(() => {
    const scored = suggestions.filter((s) => typeof s?.ai_score === "number");
    const avg = scored.length
      ? Math.round(scored.reduce((sum, s) => sum + (s.ai_score || 0), 0) / scored.length)
      : 0;
    const strong = scored.filter((s) => (s.ai_score || 0) >= 80).length;
    const high = scored.filter((s) => (s.ai_score || 0) >= 70);
    const roleCount: Record<string, number> = {};
    for (const s of high) {
      const title = String(s?.job_data?.job_title || s?.job_title || "Unknown Role");
      roleCount[title] = (roleCount[title] || 0) + 1;
    }
    const topRoles = Object.entries(roleCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([role, count]) => ({ role, count }));

    return {
      totalScanned: scored.length,
      strongMatches: strong,
      avgMatch: avg,
      topRoles,
    };
  }, [suggestions]);

  return (
    <div className="space-y-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-blue-600" />
          Match Analytics
        </h1>
        <p className="text-gray-500">Live analytics from your latest AI job suggestions.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {[
          {
            label: "Total Scanned",
            val: loading ? "..." : String(stats.totalScanned),
            sub: "AI-ranked opportunities",
            icon: Target,
          },
          {
            label: "Strong Matches",
            val: loading ? "..." : String(stats.strongMatches),
            sub: "80%+ match score",
            icon: Sparkles,
          },
          {
            label: "Average Match",
            val: loading ? "..." : `${stats.avgMatch}%`,
            sub: "Across current suggestions",
            icon: TrendingUp,
          },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-xs uppercase font-bold text-gray-400">
              <stat.icon className="w-3.5 h-3.5" />
              {stat.label}
            </div>
            <div className="text-4xl font-bold text-gray-900">{stat.val}</div>
            <div className="text-[10px] text-gray-500 mt-2 font-medium">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Top Recommended Roles</h3>
        {loading ? (
          <p className="text-sm text-gray-400">Calculating role trends...</p>
        ) : stats.topRoles.length === 0 ? (
          <p className="text-sm text-gray-500">No analytics yet. Generate job suggestions to view role trends.</p>
        ) : (
          <div className="space-y-3">
            {stats.topRoles.map((item) => (
              <div key={item.role} className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="text-sm font-bold text-gray-900">{item.role}</span>
                <span className="text-xs font-black uppercase tracking-widest text-blue-700">
                  {item.count} Match{item.count > 1 ? "es" : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
