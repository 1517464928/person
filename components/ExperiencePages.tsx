"use client";

import { useEffect, useRef, useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { useEditMode } from "./EditMode";
import { EditableText } from "./ui/InlineEdit";
import { EditableBlock } from "./ui/EditableBlock";
import { parsePanels, parseStyle, type BlockStyle, type ExperienceData, type ExperiencePanel } from "@/lib/types";
import {
  expHeroVariants,
  expDetailVariants,
  heroToDetailVariants,
  detailToDetailVariants,
  detailToHeroVariants,
} from "@/lib/animations";

const typeLabels: Record<string, string> = {
  education: "教育背景",
  work: "实习经历",
  entrepreneurship: "创业经历",
  campus: "校园经历",
};
const types = ["education", "work", "entrepreneurship", "campus"];

interface Props {
  exp: ExperienceData;
  index: number;
  isActive: boolean;
  reducedMotion: boolean;
  updExp: (id: number, field: string, val: string) => void;
  removeExp: (id: number) => void;
  updPanels: (expId: number, panels: ExperiencePanel[]) => void;
  updStyle: (id: number, key: string, style: BlockStyle) => void;
}

function getInitialPanels(exp: ExperienceData): ExperiencePanel[] {
  const parsed = parsePanels(exp.panels);
  if (parsed.length > 0) return parsed;
  const fallback: ExperiencePanel[] = [];
  if (exp.workContent?.trim()) fallback.push({ title: "工作内容", content: exp.workContent });
  if (exp.achievements?.trim()) fallback.push({ title: "工作成果", content: exp.achievements });
  if (exp.growth?.trim()) fallback.push({ title: "能力提升", content: exp.growth });
  return fallback;
}

export default function ExperiencePages({
  exp,
  index,
  isActive,
  reducedMotion,
  updExp,
  removeExp,
  updPanels,
  updStyle,
}: Props) {
  const { isEditing, isBlockInteracting } = useEditMode();
  const [panels, setPanels] = useState<ExperiencePanel[]>(() => getInitialPanels(exp));
  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const styleMap = parseStyle(exp.style);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setPanels(getInitialPanels(exp));
  }, [exp]);

  const totalPages = panels.length + 1;

  const savePanels = (next: ExperiencePanel[]) => {
    setPanels(next);
    updPanels(exp.id, next);
  };

  const updatePanelTitle = (i: number, val: string) => {
    const next = panels.map((p, idx) => (idx === i ? { ...p, title: val } : p));
    savePanels(next);
  };

  const updatePanelContent = (i: number, val: string) => {
    const next = panels.map((p, idx) => (idx === i ? { ...p, content: val } : p));
    savePanels(next);
  };

  const updateBlockStyle = (key: string, s: BlockStyle) => {
    updStyle(exp.id, key, s);
  };

  const updatePanelStyle = (i: number, field: "title" | "content", s: BlockStyle) => {
    const next = panels.map((p, idx) => {
      if (idx !== i) return p;
      return { ...p, style: { ...p.style, [field]: s } };
    });
    savePanels(next);
  };

  const scrollToPage = (idx: number) => {
    const el = pageRefs.current[idx];
    if (scrollRef.current && el) {
      scrollRef.current.scrollTo({
        left: el.offsetLeft,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    }
  };

  const nextPage = () => {
    if (pageIndex < totalPages - 1) {
      setDirection(1);
      scrollToPage(pageIndex + 1);
    }
  };

  const prevPage = () => {
    if (pageIndex > 0) {
      setDirection(-1);
      scrollToPage(pageIndex - 1);
    }
  };

  const addPanel = () => {
    const newPanel = { title: "新页面", content: "" };
    let next: ExperiencePanel[];
    let newPageIndex: number;
    if (pageIndex === 0) {
      next = [...panels, newPanel];
      newPageIndex = next.length;
    } else {
      next = [...panels.slice(0, pageIndex), newPanel, ...panels.slice(pageIndex)];
      newPageIndex = pageIndex + 1;
    }
    savePanels(next);
    setTimeout(() => scrollToPage(newPageIndex), 50);
  };

  const removeCurrentPanel = () => {
    if (pageIndex === 0) return;
    const panelIdx = pageIndex - 1;
    const next = panels.filter((_, i) => i !== panelIdx);
    savePanels(next);
    setTimeout(() => scrollToPage(pageIndex - 1), 50);
  };

  // Active page tracking
  useEffect(() => {
    if (!scrollRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = -1;
        let bestRatio = -1;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number((entry.target as HTMLElement).dataset.page);
          const ratio = entry.intersectionRatio;
          if (bestIndex === -1 || ratio > bestRatio) {
            bestIndex = idx;
            bestRatio = ratio;
          }
        });
        if (bestIndex !== -1) setPageIndex(bestIndex);
      },
      { root: scrollRef.current, threshold: 0.5 }
    );
    pageRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [panels.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevPage();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextPage();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isActive, pageIndex, totalPages, reducedMotion]);

  const pageBaseClass =
    "h-full w-full flex-shrink-0 snap-start flex items-center justify-center px-6 md:px-12 py-16 relative overflow-hidden";

  const dragProps = {
    drag: (isBlockInteracting ? false : "x") as "x" | false,
    dragConstraints: { left: 0, right: 0 },
    dragElastic: 0.15,
    onDragEnd: (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x < -50 || info.velocity.x < -500) nextPage();
      else if (info.offset.x > 50 || info.velocity.x > 500) prevPage();
    },
  };

  function HeroPage() {
    const show = isActive && pageIndex === 0;
    const number = String(index).padStart(2, "0");
    const heroV = expHeroVariants(reducedMotion);

    return (
      <motion.div
        {...dragProps}
        className="relative z-10 max-w-4xl w-full text-center"
      >
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12rem] md:text-[16rem] font-bold text-[#1a1a1a]/5 leading-none pointer-events-none select-none">
          {number}
        </span>

        <div className="relative z-10 flex flex-col items-center">
          {isEditing ? (
            <motion.div
              variants={heroV}
              initial="hidden"
              animate={show ? "visible" : "hidden"}
              custom={0}
              className="mb-4"
            >
              <select
                value={exp.type}
                onChange={(e) => updExp(exp.id, "type", e.target.value)}
                className="inline-block px-3 py-1 text-xs font-medium bg-amber-50 text-[#f97316] rounded-full border border-[#f97316]/30 focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 cursor-pointer"
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {typeLabels[t]}
                  </option>
                ))}
              </select>
            </motion.div>
          ) : (
            <motion.span
              variants={heroV}
              initial="hidden"
              animate={show ? "visible" : "hidden"}
              custom={0}
              className="inline-block px-3 py-1 text-xs font-medium bg-amber-50 text-[#f97316] rounded-full mb-4"
            >
              {typeLabels[exp.type] || exp.type}
            </motion.span>
          )}

          <motion.h2
            variants={heroV}
            initial="hidden"
            animate={show ? "visible" : "hidden"}
            custom={0.08}
            className="text-4xl md:text-6xl font-bold text-[#1a1a1a] mb-3"
          >
            <EditableBlock blockKey="title" style={styleMap.title} onStyleChange={(s) => updateBlockStyle("title", s)} className="inline-block">
              <EditableText value={exp.title} onSave={(v) => updExp(exp.id, "title", v)} />
            </EditableBlock>
          </motion.h2>

          <motion.div
            variants={heroV}
            initial="hidden"
            animate={show ? "visible" : "hidden"}
            custom={0.16}
            className="text-lg md:text-xl text-[#1a1a1a]/70 mb-2"
          >
            <EditableBlock blockKey="subtitle" style={styleMap.subtitle} onStyleChange={(s) => updateBlockStyle("subtitle", s)} className="inline-block">
              <EditableText value={exp.subtitle} onSave={(v) => updExp(exp.id, "subtitle", v)} />
            </EditableBlock>
          </motion.div>

          <motion.div
            variants={heroV}
            initial="hidden"
            animate={show ? "visible" : "hidden"}
            custom={0.24}
            className="text-sm text-[#1a1a1a]/40 mb-6"
          >
            <EditableBlock blockKey="period" style={styleMap.period} onStyleChange={(s) => updateBlockStyle("period", s)} className="inline-block">
              <EditableText value={exp.period} onSave={(v) => updExp(exp.id, "period", v)} />
            </EditableBlock>
          </motion.div>

          <motion.div
            variants={heroV}
            initial="hidden"
            animate={show ? "visible" : "hidden"}
            custom={0.32}
            className="max-w-2xl text-base md:text-lg text-[#1a1a1a]/70 leading-relaxed"
          >
            <EditableBlock blockKey="description" style={styleMap.description} onStyleChange={(s) => updateBlockStyle("description", s)} className="inline-block">
              <EditableText
                multiline
                value={exp.description}
                onSave={(v) => updExp(exp.id, "description", v)}
              />
            </EditableBlock>
          </motion.div>

          {isEditing && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={show ? { opacity: 1 } : { opacity: 0 }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.4 }}
              onClick={() => removeExp(exp.id)}
              className="mt-8 text-sm text-red-400 hover:text-red-600 transition-colors cursor-pointer"
            >
              删除此经历
            </motion.button>
          )}

          {panels.length > 0 && !isEditing && (
            <motion.button
              variants={heroV}
              initial="hidden"
              animate={show ? "visible" : "hidden"}
              custom={0.4}
              onClick={nextPage}
              className="mt-10 inline-flex items-center gap-2 px-8 py-4 bg-[#f97316] text-white rounded-full text-lg font-medium hover:bg-[#ea580c] transition-colors cursor-pointer"
            >
              GO <ChevronRight size={20} />
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  function DetailPage({
    panel,
    panelIndex,
  }: {
    panel: ExperiencePanel;
    panelIndex: number;
  }) {
    const show = isActive && pageIndex === panelIndex + 1;
    const number = `${String(index).padStart(2, "0")}-${panelIndex + 1}`;
    const detailV = expDetailVariants(reducedMotion);

    return (
      <motion.div
        {...dragProps}
        className="relative z-10 max-w-4xl w-full h-full flex flex-col items-center justify-center px-6 md:px-12"
      >
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10rem] md:text-[14rem] font-bold text-[#1a1a1a]/5 leading-none pointer-events-none select-none">
          {number}
        </span>

        <div className="relative z-10 w-full flex flex-col gap-5 md:gap-6">
          <motion.div
            variants={detailV}
            initial="hidden"
            animate={show ? "visible" : "hidden"}
            custom={0}
            className="bg-white/80 backdrop-blur rounded-2xl border border-[#1a1a1a]/5 shadow-sm px-6 py-5 md:px-8 md:py-6"
          >
            <div className="text-3xl md:text-5xl font-bold text-[#1a1a1a]">
              <EditableBlock
                blockKey={`panel-${panelIndex}-title`}
                style={panel.style?.title}
                onStyleChange={(s) => updatePanelStyle(panelIndex, "title", s)}
                className="inline-block"
              >
                <EditableText
                  value={panel.title}
                  onSave={(v) => updatePanelTitle(panelIndex, v)}
                />
              </EditableBlock>
            </div>
          </motion.div>

          <motion.div
            variants={detailV}
            initial="hidden"
            animate={show ? "visible" : "hidden"}
            custom={0.08}
            className="bg-white/60 backdrop-blur rounded-2xl border border-[#1a1a1a]/5 shadow-sm px-6 py-5 md:px-8 md:py-6"
          >
            <div className="text-base md:text-lg text-[#1a1a1a]/70 leading-relaxed">
              <EditableBlock
                blockKey={`panel-${panelIndex}-content`}
                style={panel.style?.content}
                onStyleChange={(s) => updatePanelStyle(panelIndex, "content", s)}
                className="inline-block w-full"
              >
                <EditableText
                  multiline
                  value={panel.content}
                  onSave={(v) => updatePanelContent(panelIndex, v)}
                />
              </EditableBlock>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div
        ref={scrollRef}
        className="h-full w-full overflow-x-auto snap-x snap-mandatory flex scrollbar-hide touch-pan-x"
        style={{ overscrollBehaviorY: "contain" }}
      >
        <div
          ref={(el) => { pageRefs.current[0] = el; }}
          data-page={0}
          className={pageBaseClass}
        >
          {HeroPage()}
        </div>

        {panels.map((panel, i) => (
          <div
            key={i}
            ref={(el) => { pageRefs.current[i + 1] = el; }}
            data-page={i + 1}
            className={pageBaseClass}
          >
            {DetailPage({ panel, panelIndex: i })}
          </div>
        ))}
      </div>

      {/* Horizontal indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToPage(i)}
              className="w-11 h-11 flex items-center justify-center rounded-full cursor-pointer"
              aria-label={`切换到第 ${i + 1} 页`}
            >
              <span
                className={
                  i === pageIndex
                    ? "w-2 h-8 bg-[#f97316] rounded-full transition-all duration-300"
                    : "w-2 h-2 bg-[#1a1a1a]/20 rounded-full transition-all duration-300 hover:bg-[#1a1a1a]/40"
                }
              />
            </button>
          ))}
        </div>
        <span className="text-xs text-[#1a1a1a]/40">
          {String(index).padStart(2, "0")} · {pageIndex + 1}/{totalPages}
        </span>
      </div>

      {/* Edit toolbar */}
      {isEditing && (
        <div className="absolute bottom-8 left-6 z-20 flex items-center gap-2">
          <button
            onClick={addPanel}
            className="flex items-center gap-1 px-3 h-11 text-sm font-medium text-[#f97316] hover:bg-amber-50 rounded-full border border-[#f97316]/20 cursor-pointer"
          >
            <Plus size={16} /> 添加页面
          </button>
          {pageIndex > 0 && (
            <button
              onClick={removeCurrentPanel}
              className="w-11 h-11 flex items-center justify-center rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 border border-red-200 cursor-pointer"
              aria-label="删除当前页面"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
