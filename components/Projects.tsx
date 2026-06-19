"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { ExternalLink, Play, Trash2, Plus, Pencil, Check, X } from "lucide-react";
import Card from "./ui/Card";
import Reveal from "./ui/Reveal";
import { useEditMode } from "./EditMode";
import type { ProjectData } from "@/lib/types";

interface ProjectsSectionProps {
  title?: string;
  subtitle?: string;
  footerText?: string;
  filterFn?: (items: ProjectData[]) => ProjectData[];
  saveId?: string;
}

export default function ProjectsSection({
  title = "AI 项目",
  subtitle = "看看我做了什么",
  footerText,
  filterFn,
  saveId = "projects",
}: ProjectsSectionProps = {}) {
  const { isEditing, registerSave, unregisterSave, setHasUnsavedChanges } = useEditMode();
  const [items, setItems] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVideo, setModalVideo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const itemsRef = useRef<ProjectData[]>(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => {
    fetch("/api/public", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setItems(d.projects || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Register save fn: PUT the full projects list when 保存 is clicked.
  const saveFn = useCallback(async () => {
    const res = await fetch("/api/admin/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ projects: itemsRef.current }),
    });
    return res.ok;
  }, []);

  useEffect(() => {
    registerSave(saveId, saveFn);
    return () => unregisterSave(saveId);
  }, [registerSave, unregisterSave, saveFn, saveId]);

  const add = () => {
    const newProj: ProjectData = {
      id: -Date.now(),
      title: "新项目",
      description: "点击编辑描述",
      imageUrl: "",
      videoUrl: "",
      link: "",
      style: "{}",
      order: items.length,
    };
    setItems((prev) => [...prev, newProj]);
    setHasUnsavedChanges(true);
  };

  const remove = (id: number) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    setHasUnsavedChanges(true);
  };

  const update = (id: number, patch: Partial<ProjectData>) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setHasUnsavedChanges(true);
  };

  if (loading) return null;

  const filtered = filterFn ? filterFn(items) : items;

  return (
    <section className="py-8 px-4 max-w-6xl mx-auto">
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-4xl md:text-6xl font-bold text-[#1a1a1a] mb-4">{title}</h2>
        <p className="text-lg text-[#1a1a1a]/60">{subtitle}</p>
      </div>

      {isEditing && (
        <div className="flex justify-center mb-6">
          <button
            onClick={add}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#f97316] bg-amber-50 rounded-full border border-[#f97316]/20 hover:bg-amber-100 cursor-pointer transition-colors"
          >
            <Plus size={16} /> 添加项目
          </button>
        </div>
      )}

      {!filtered.length && !isEditing ? (
        <p className="text-center text-[#1a1a1a]/40 py-12">暂无项目</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.1} y={30}>
              <Card className="group hover:shadow-lg transition-shadow duration-300 relative bg-white/80 backdrop-blur overflow-hidden">
                {isEditing && (
                  <button
                    onClick={() => remove(p.id)}
                    aria-label="删除项目"
                    className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 text-red-400 hover:text-red-600 hover:bg-red-50 border border-[#1a1a1a]/5 cursor-pointer transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
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

                {editingId === p.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={p.title}
                      onChange={(e) => update(p.id, { title: e.target.value })}
                      className="w-full px-3 py-2 text-lg font-semibold text-[#1a1a1a] border border-[#f97316]/30 rounded-lg focus:outline-none focus:border-[#f97316] bg-white"
                      placeholder="标题"
                    />
                    <textarea
                      value={p.description}
                      onChange={(e) => update(p.id, { description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm text-[#1a1a1a]/80 border border-[#f97316]/30 rounded-lg focus:outline-none focus:border-[#f97316] bg-white resize-none"
                      placeholder="简介"
                    />
                    <input
                      type="text"
                      value={p.videoUrl}
                      onChange={(e) => update(p.id, { videoUrl: e.target.value })}
                      className="w-full px-3 py-2 text-sm text-[#1a1a1a]/80 border border-[#1a1a1a]/10 rounded-lg focus:outline-none focus:border-[#f97316] bg-white"
                      placeholder="视频链接（MP4 或本地路径）"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-[#1a1a1a]/10 hover:bg-[#faf7f4] cursor-pointer transition-colors"
                      >
                        <X size={16} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 text-sm rounded-lg bg-[#f97316] text-white hover:bg-[#ea580c] cursor-pointer transition-colors"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-[#1a1a1a]">{p.title}</h3>
                      {isEditing && (
                        <button
                          onClick={() => setEditingId(p.id)}
                          className="p-1.5 rounded-lg border border-[#1a1a1a]/10 text-[#1a1a1a]/50 hover:text-[#f97316] hover:border-[#f97316]/30 cursor-pointer transition-colors"
                          aria-label="编辑"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
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
                  </>
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
