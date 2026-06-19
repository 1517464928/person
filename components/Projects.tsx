"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Play } from "lucide-react";
import Card from "./ui/Card";
import Reveal from "./ui/Reveal";
import type { ProjectData } from "@/lib/types";

interface ProjectsSectionProps {
  title?: string;
  subtitle?: string;
  footerText?: string;
  filterFn?: (items: ProjectData[]) => ProjectData[];
}

export default function ProjectsSection({
  title = "AI 项目",
  subtitle = "看看我做了什么",
  footerText,
  filterFn,
}: ProjectsSectionProps = {}) {
  const [items, setItems] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVideo, setModalVideo] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/data.json`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.projects || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;

  const filtered = filterFn ? filterFn(items) : items;

  return (
    <section className="py-8 px-4 max-w-6xl mx-auto">
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-4xl md:text-6xl font-bold text-[#1a1a1a] mb-4">{title}</h2>
        <p className="text-lg text-[#1a1a1a]/60">{subtitle}</p>
      </div>

      {!filtered.length ? (
        <p className="text-center text-[#1a1a1a]/40 py-12">暂无项目</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.1} y={30}>
              <Card className="group hover:shadow-lg transition-shadow duration-300 relative bg-white/80 backdrop-blur overflow-hidden">
                {/* Media */}
                <div
                  className="w-full aspect-video bg-[#faf7f4] rounded-xl mb-4 flex items-center justify-center text-[#1a1a1a]/20 overflow-hidden cursor-pointer relative"
                  onClick={() => p.videoUrl && setModalVideo(p.videoUrl)}
                >
                  {p.videoUrl ? (
                    <>
                      <video
                        src={p.videoUrl}
                        muted
                        preload="metadata"
                        playsInline
                        className="w-full h-full object-cover"
                        poster={p.imageUrl || undefined}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/5 transition-colors">
                        <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center text-[#f97316] shadow-lg group-hover:scale-110 transition-transform">
                          <Play size={24} fill="currentColor" />
                        </div>
                      </div>
                    </>
                  ) : p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm flex items-center gap-2">
                      <Play size={16} /> 预览图
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-[#1a1a1a]">{p.title}</h3>
                </div>
                <p className="text-sm text-[#1a1a1a]/60 mt-2 line-clamp-2">{p.description}</p>
                {p.link && (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-4 text-sm text-[#f97316] hover:underline"
                  >
                    查看详情 <ExternalLink size={14} />
                  </a>
                )}
              </Card>
            </Reveal>
          ))}
        </div>
      )}

      {footerText && filtered.length > 0 && (
        <p className="text-center text-xs text-[#1a1a1a]/30 mt-8">{footerText}</p>
      )}

      {/* 视频播放弹窗 */}
      {modalVideo && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalVideo(null); }}
        >
          <button
            onClick={() => setModalVideo(null)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-2xl cursor-pointer transition-colors"
          >
            &times;
          </button>
          <video
            src={modalVideo}
            controls
            autoPlay
            playsInline
            className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl"
          />
        </div>
      )}
    </section>
  );
}
