"use client";
import { useState, useEffect } from "react";
import Reveal from "./ui/Reveal";

interface Stat { id: number; label: string; value: string; order: number; }

export default function StatsSection() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/data.json`).then(r => r.json()).then(d => {
      setStats(d.stats || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <section id="content" className="py-24 px-4 max-w-5xl mx-auto">
      <Reveal>
        <h2 className="text-2xl font-medium text-center mb-16 text-[#1a1a1a]/60">关键数据</h2>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="bg-white rounded-xl shadow-sm border border-[#1a1a1a]/8 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]/8 bg-[#fafafa]">
            <span className="text-xs font-medium text-[#1a1a1a]/30 uppercase tracking-widest">数据指标</span>
            <span className="text-xs text-[#1a1a1a]/25">{stats.length} 项</span>
          </div>

          {stats.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-[#1a1a1a]/25">暂无数据条目</div>
          ) : (
            <div className="divide-y divide-[#1a1a1a]/5">
              {stats.map((s, i) => (
                <div key={s.id} className="flex items-center group relative hover:bg-[#fafafa] transition-colors">
                  <span className="w-12 flex-shrink-0 text-right pr-4 text-xs text-[#1a1a1a]/20 tabular-nums select-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 py-5 pr-4 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a1a]/70">
                      {s.label}
                    </p>
                  </div>
                  <div className="py-5 pr-4 text-right tabular-nums">
                    <span className="text-lg font-semibold text-[#1a1a1a]">
                      {s.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-6 py-3 border-t border-[#1a1a1a]/5 bg-[#fafafa]" />
        </div>
      </Reveal>
    </section>
  );
}
