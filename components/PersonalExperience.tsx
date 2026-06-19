"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, ChevronDown } from "lucide-react";
import { useEditMode } from "./EditMode";
import {
  parseStyle,
  stringifyPanels,
  stringifyStyle,
  type AdvantageData,
  type BlockStyle,
  type ExperienceData,
  type ExperiencePanel,
  type SiteConfigData,
} from "@/lib/types";
import {
  introVariants,
  projectsVariants,
} from "@/lib/animations";
import ExperiencePages from "./ExperiencePages";
import PersonalAdvantages from "./PersonalAdvantages";
import ProjectsSection from "./Projects";
import AskMeContent from "./AskMe";

const typeLabels: Record<string, string> = {
  education: "教育背景",
  work: "实习经历",
  entrepreneurship: "创业经历",
  campus: "校园经历",
};
const types = ["education", "work", "entrepreneurship", "campus"];

const SAVE_ID = "experiences";

// Background gradient stops for the /about scroll experience.
// Progress 0 = intro cream, 1 = AI project peak.
const GRADIENT_STOPS = [
  { p: 0.0, color: "#faf7f4" },
  { p: 0.2, color: "#faf0e8" },
  { p: 0.4, color: "#f8e9de" },
  { p: 0.6, color: "#f5dfd2" },
  { p: 0.75, color: "#f0d4c8" },
  { p: 0.9, color: "#e9d9e3" },
  { p: 1.0, color: "peak" },
];

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(Math.round(r))}${toHex(Math.round(g))}${toHex(Math.round(b))}`;
}

function lerpColor(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(
    ca.r + (cb.r - ca.r) * t,
    ca.g + (cb.g - ca.g) * t,
    ca.b + (cb.b - ca.b) * t
  );
}

function getGradient(progress: number): string {
  const clamped = Math.max(0, Math.min(1, progress));
  const stops = GRADIENT_STOPS;

  // Peak: rich but refined radial gradient.
  if (clamped >= 0.95) {
    const inner = lerpColor(stops[stops.length - 2].color as string, "#e2d6ef", (clamped - 0.95) / 0.05);
    return `radial-gradient(circle at 25% 25%, ${inner} 0%, #f5d8c8 35%, #faf0e6 75%)`;
  }

  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (clamped >= s1.p && clamped <= s2.p) {
      const t = s2.p === s1.p ? 0 : (clamped - s1.p) / (s2.p - s1.p);
      const c1 = s1.color as string;
      const c2 = s2.color === "peak" ? "#ebe0e6" : (s2.color as string);
      const color = lerpColor(c1, c2, t);
      return `linear-gradient(180deg, ${color} 0%, ${color} 100%)`;
    }
  }

  return `#faf7f4`;
}

export default function PersonalExperience() {
  const { isEditing, registerSave, unregisterSave, setHasUnsavedChanges } = useEditMode();
  const [items, setItems] = useState<ExperienceData[]>([]);
  const [advantages, setAdvantages] = useState<AdvantageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [advantagePage, setAdvantagePage] = useState(0);
  const [advantageTotal, setAdvantageTotal] = useState(1);

  const scrollRef = useRef<HTMLDivElement>(null);
  const screenRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Ref mirror of items so the registered save fn always reads the latest state.
  const itemsRef = useRef<ExperienceData[]>(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    fetch("/api/public")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.experiences || []);
        setAdvantages(d.advantages || []);
        setLoading(false);
        // Fix: reset scroll position to avoid auto-jumping to last screen
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo(0, 0);
        });
      })
      .catch(() => setLoading(false));
  }, []);

  const screens = [
    { type: "intro" as const },
    ...items.map((exp) => ({ type: "experience" as const, exp })),
    { type: "advantages" as const },
    { type: "cta" as const },
    { type: "cta2" as const },
    { type: "askme" as const },
  ];

  const progress = screens.length <= 1 ? 100 : (activeIndex / (screens.length - 1)) * 100;

  // Combined vertical + horizontal scroll progress for background gradient.
  const advantagesIndex = items.length + 1;
  const totalScreens = screens.length;
  let overallProgress = 0;
  if (activeIndex < advantagesIndex) {
    overallProgress = (activeIndex / Math.max(1, totalScreens - 1)) * 0.6;
  } else if (activeIndex === advantagesIndex) {
    overallProgress = 0.6 + (advantagePage / Math.max(1, advantageTotal - 1)) * 0.3;
  } else {
    overallProgress = 1;
  }
  const backgroundStyle = getGradient(overallProgress);

  // Register save fn: PUT all experiences to the server when 保存 is clicked.
  const saveFn = useCallback(async () => {
    const res = await fetch("/api/admin/experiences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ experiences: itemsRef.current }),
    });
    return res.ok;
  }, []);

  useEffect(() => {
    registerSave(SAVE_ID, saveFn);
    return () => unregisterSave(SAVE_ID);
  }, [registerSave, unregisterSave, saveFn]);

  // Use functional update so rapid edits don't read stale state. Local state only;
  // the actual API call is deferred until the user clicks 保存.
  const updExp = (id: number, field: string, val: string) => {
    setItems((prev) => prev.map((s) =>
      s.id === id ? ({ ...s, [field]: val } as ExperienceData) : s
    ));
    setHasUnsavedChanges(true);
  };

  const updExpStyle = (id: number, key: string, style: BlockStyle) => {
    setItems((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      const map = parseStyle(s.style);
      map[key] = style;
      return { ...s, style: stringifyStyle(map) };
    }));
    setHasUnsavedChanges(true);
  };

  const addExp = () => {
    const newExp: ExperienceData = {
      id: -Date.now(),
      type: "work",
      title: "新经历",
      subtitle: "",
      period: "",
      description: "",
      detail1: "",
      detail2: "",
      workContent: "",
      achievements: "",
      growth: "",
      panel1Title: "",
      panel2Title: "",
      panel3Title: "",
      panel4Title: "",
      panels: "[]",
      style: "{}",
      order: items.length,
    };
    const newIndex = items.length + 1;
    setItems((prev) => [...prev, newExp]);
    setHasUnsavedChanges(true);
    setTimeout(() => scrollToScreen(newIndex), 50);
  };

  const removeExp = (id: number) => {
    const target = Math.max(0, activeIndex - 1);
    setItems((prev) => prev.filter((s) => s.id !== id));
    setHasUnsavedChanges(true);
    setTimeout(() => scrollToScreen(target), 50);
  };

  const updPanels = (expId: number, panels: ExperiencePanel[]) => {
    setItems((prev) => prev.map((s) =>
      s.id === expId ? { ...s, panels: stringifyPanels(panels) } : s
    ));
    setHasUnsavedChanges(true);
  };

  const scrollToScreen = (index: number) => {
    const el = screenRefs.current[index];
    if (el) {
      el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }
  };

  // Active screen tracking
  useEffect(() => {
    if (!scrollRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = -1;
        let bestRatio = -1;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number((entry.target as HTMLElement).dataset.index);
          const ratio = entry.intersectionRatio;
          if (bestIndex === -1 || ratio > bestRatio) {
            bestIndex = idx;
            bestRatio = ratio;
          }
        });
        if (bestIndex !== -1) setActiveIndex(bestIndex);
      },
      { root: scrollRef.current, threshold: 0.5 }
    );
    screenRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [items, screens.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable) return;

      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        scrollToScreen(Math.max(0, activeIndex - 1));
      } else if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        scrollToScreen(Math.min(screens.length - 1, activeIndex + 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        scrollToScreen(0);
      } else if (e.key === "End") {
        e.preventDefault();
        scrollToScreen(screens.length - 1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, screens.length, reducedMotion]);

  if (loading) return null;

  return (
    <div
      className="relative h-dvh w-full overflow-hidden transition-all duration-700"
      style={{ background: backgroundStyle }}
    >
      {/* Progress bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-[#f97316] z-50 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />

      {/* Vertical scroll container */}
      <div
        ref={scrollRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory scroll-smooth scrollbar-hide touch-pan-y"
        style={{ overscrollBehaviorX: "contain" }}
      >
        {screens.map((screen, i) => (
          <div
            key={screen.type + i}
            ref={(el) => { screenRefs.current[i] = el; }}
            data-index={i}
            className="h-dvh w-full snap-start relative overflow-hidden"
          >
            {screen.type === "intro" && (
              <IntroScreen
                isActive={activeIndex === i}
                reducedMotion={reducedMotion}
                onExplore={() => scrollToScreen(1)}
              />
            )}
            {screen.type === "experience" && screen.exp && (
              <ExperiencePages
                exp={screen.exp}
                index={i}
                isActive={activeIndex === i}
                reducedMotion={reducedMotion}
                updExp={updExp}
                removeExp={removeExp}
                updPanels={updPanels}
                updStyle={updExpStyle}
              />
            )}
            {screen.type === "advantages" && (
              <PersonalAdvantages
                items={advantages}
                isActive={activeIndex === i}
                reducedMotion={reducedMotion}
                downLocked={true}
                onPageChange={(pageIndex, totalPages) => {
                  setAdvantagePage(pageIndex);
                  setAdvantageTotal(totalPages);
                }}
              />
            )}
            {screen.type === "cta" && (
              <div data-screen="cta" className="h-full w-full">
                <ProjectsScreen
                  isActive={activeIndex === i}
                  reducedMotion={reducedMotion}
                  screenIndex={i}
                />
              </div>
            )}
            {screen.type === "cta2" && (
              <div data-screen="cta2" className="h-full w-full">
                <ProjectsScreen2
                  isActive={activeIndex === i}
                  reducedMotion={reducedMotion}
                  screenIndex={i}
                />
              </div>
            )}
            {screen.type === "askme" && (
              <AskMeScreen isActive={activeIndex === i} reducedMotion={reducedMotion} />
            )}
          </div>
        ))}
      </div>

      {/* Vertical dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-4">
        {screens.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToScreen(i)}
            className="w-11 h-11 flex items-center justify-center rounded-full cursor-pointer"
            aria-label={`跳转到第 ${i + 1} 屏`}
          >
            <span
              className={
                i === activeIndex
                  ? "w-3 h-8 bg-[#f97316] rounded-full transition-all duration-300"
                  : "w-3 h-3 bg-[#1a1a1a]/20 rounded-full transition-all duration-300 hover:bg-[#1a1a1a]/40"
              }
            />
          </button>
        ))}
      </div>

      {/* Edit toolbar */}
      {isEditing && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 bg-white rounded-full shadow-lg border border-[#1a1a1a]/5">
          <button
            onClick={addExp}
            className="flex items-center gap-1 text-sm font-medium text-[#f97316] hover:text-[#ea580c] cursor-pointer"
          >
            <Plus size={16} /> 添加经历
          </button>
        </div>
      )}

    </div>
  );
}

function IntroScreen({
  isActive,
  reducedMotion,
  onExplore,
}: {
  isActive: boolean;
  reducedMotion: boolean;
  onExplore?: () => void;
}) {
  const variants = introVariants(reducedMotion);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center px-6 text-center">
      <motion.h1
        variants={variants}
        initial="hidden"
        animate={isActive ? "visible" : "hidden"}
        custom={0}
        className="text-5xl md:text-7xl font-bold text-[#1a1a1a] mb-4"
      >
        关于我
      </motion.h1>
      <motion.h2
        variants={variants}
        initial="hidden"
        animate={isActive ? "visible" : "hidden"}
        custom={0.1}
        className="text-2xl md:text-3xl text-[#1a1a1a]/70 mb-6"
      >
        张攀岳
      </motion.h2>
      <motion.p
        variants={variants}
        initial="hidden"
        animate={isActive ? "visible" : "hidden"}
        custom={0.2}
        className="max-w-xl text-lg text-[#1a1a1a]/60 leading-relaxed"
      >
        向下滚动，探索我的教育、实习、创业与校园经历。
      </motion.p>

      <motion.button
        variants={variants}
        initial="hidden"
        animate={isActive ? "visible" : "hidden"}
        custom={0.3}
        onClick={onExplore}
        className="mt-10 inline-flex items-center gap-2 px-8 py-4 bg-[#f97316] text-white rounded-full text-lg font-medium hover:bg-[#ea580c] transition-colors cursor-pointer"
      >
        开始探索 <ChevronDown size={20} />
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isActive ? { opacity: 1 } : { opacity: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.4 }}
        className="absolute bottom-12 flex flex-col items-center gap-2 text-[#1a1a1a]/40"
      >
        <span className="text-xs tracking-widest">向下滚动</span>
        <motion.div
          animate={reducedMotion ? {} : { y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </motion.div>
    </div>
  );
}

function ProjectsScreen({
  isActive,
  reducedMotion,
  screenIndex,
}: {
  isActive: boolean;
  reducedMotion: boolean;
  screenIndex: number;
}) {
  const variants = projectsVariants(reducedMotion);

  const handleExplore = () => {
    const el = document.querySelector(`[data-index="${screenIndex + 1}"]`) as HTMLElement;
    if (el) el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="h-full w-full overflow-y-auto scrollbar-hide py-16 px-6">
      <motion.div
        variants={variants}
        initial="hidden"
        animate={isActive ? "visible" : "hidden"}
        custom={0}
      >
        <ProjectsSection
          title="AI 项目"
          subtitle="看看我做了什么"
          footerText="关键数据保密需要，以上演示均用模拟网站演示"
          filterFn={(items) => items.slice(0, 4)}
          saveId="projects"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isActive ? { opacity: 1 } : { opacity: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.6 }}
        className="flex justify-center mt-10 pb-4"
      >
        <button
          onClick={handleExplore}
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#f97316] text-white rounded-full text-lg font-medium hover:bg-[#ea580c] transition-colors cursor-pointer"
        >
          开始探索 <ChevronDown size={20} />
        </button>
      </motion.div>
    </div>
  );
}

function ProjectsScreen2({
  isActive,
  reducedMotion,
  screenIndex,
}: {
  isActive: boolean;
  reducedMotion: boolean;
  screenIndex: number;
}) {
  const variants = projectsVariants(reducedMotion);

  const handleExplore = () => {
    const el = document.querySelector(`[data-index="${screenIndex + 1}"]`) as HTMLElement;
    if (el) el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="h-full w-full overflow-y-auto scrollbar-hide py-16 px-6">
      <motion.div
        variants={variants}
        initial="hidden"
        animate={isActive ? "visible" : "hidden"}
        custom={0}
      >
        <ProjectsSection
          title="AI 项目"
          subtitle="其他领域（比如电商）的探索"
          footerText="借助飞书cli搭建的多维表格"
          filterFn={(items) => items.slice(4, 6)}
          saveId="projects2"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isActive ? { opacity: 1 } : { opacity: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.6 }}
        className="flex justify-center mt-10 pb-4"
      >
        <button
          onClick={handleExplore}
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#f97316] text-white rounded-full text-lg font-medium hover:bg-[#ea580c] transition-colors cursor-pointer"
        >
          开始探索 <ChevronDown size={20} />
        </button>
      </motion.div>
    </div>
  );
}

function AskMeScreen({ isActive, reducedMotion }: { isActive: boolean; reducedMotion: boolean }) {
  const variants = projectsVariants(reducedMotion);

  return (
    <div className="h-full w-full overflow-hidden">
      <motion.div
        variants={variants}
        initial="hidden"
        animate={isActive ? "visible" : "hidden"}
        custom={0}
        className="h-full"
      >
        <AskMeContent />
      </motion.div>
    </div>
  );
}

export { typeLabels, types };
