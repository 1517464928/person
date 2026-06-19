"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { ChevronRight, ChevronDown, Sparkles, Zap, Target, Users, Brain, Rocket, Heart } from "lucide-react";
import { type AdvantageData } from "@/lib/types";
import { advantagesVariants } from "@/lib/animations";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Sparkles,
  Zap,
  Target,
  Users,
  Brain,
  Rocket,
  Heart,
};

interface Props {
  items: AdvantageData[];
  isActive: boolean;
  reducedMotion: boolean;
  onPageChange?: (pageIndex: number, totalPages: number) => void;
  downLocked?: boolean;
}

export default function PersonalAdvantages({
  items,
  isActive,
  reducedMotion,
  onPageChange,
  downLocked,
}: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [bounceDown, setBounceDown] = useState(false);
  const bounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const pagesCount = items.length + 1;
  const lastPage = pageIndex === pagesCount - 1;
  const shouldBlock = downLocked && !lastPage;

  const triggerBounce = () => {
    setBounceDown(true);
    if (bounceTimer.current) clearTimeout(bounceTimer.current);
    bounceTimer.current = setTimeout(() => setBounceDown(false), 2500);
  };

  useEffect(() => {
    return () => {
      if (bounceTimer.current) clearTimeout(bounceTimer.current);
    };
  }, []);

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
        if (bestIndex !== -1) {
          setDirection(bestIndex > pageIndex ? 1 : -1);
          setPageIndex(bestIndex);
        }
      },
      { root: scrollRef.current, threshold: 0.5 }
    );
    pageRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [items.length, pageIndex]);

  useEffect(() => {
    onPageChange?.(pageIndex, pagesCount);
  }, [pageIndex, pagesCount, onPageChange]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isActive) return;
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollToPage(Math.min(pagesCount - 1, pageIndex + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollToPage(Math.max(0, pageIndex - 1));
      } else if (e.key === "ArrowDown") {
        if (shouldBlock) {
          e.preventDefault();
          triggerBounce();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isActive, pageIndex, pagesCount, shouldBlock]);

  const scrollToPage = (idx: number) => {
    const el = pageRefs.current[idx];
    if (el && scrollRef.current) {
      setDirection(idx > pageIndex ? 1 : -1);
      scrollRef.current.scrollTo({
        left: el.offsetLeft,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!shouldBlock) return;
    const absX = Math.abs(e.deltaX);
    const absY = Math.abs(e.deltaY);
    if (absY > absX && e.deltaY > 0) {
      e.preventDefault();
      e.stopPropagation();
      triggerBounce();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!shouldBlock) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!shouldBlock) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absY > absX && dy > 0) {
      e.preventDefault();
      e.stopPropagation();
      triggerBounce();
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const dragProps = {
    drag: "x" as const,
    dragConstraints: { left: 0, right: 0 },
    dragElastic: 0.15,
    onDragEnd: (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x < -50 || info.velocity.x < -500) {
        scrollToPage(Math.min(pagesCount - 1, pageIndex + 1));
      } else if (info.offset.x > 50 || info.velocity.x > 500) {
        scrollToPage(Math.max(0, pageIndex - 1));
      }
    },
  };

  const advV = advantagesVariants(reducedMotion);

  const pageBaseClass =
    "h-full w-full flex-shrink-0 snap-start flex items-center justify-center px-6 md:px-12 py-16 relative overflow-hidden";

  const heroInView = isActive && pageIndex === 0;

  return (
    <div
      className="relative h-full w-full"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Bounce indicator — arrow only, no text */}
      <AnimatePresence>
        {bounceDown && (
          <motion.div
            key="bounce"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          >
            <motion.span
              initial={{ y: 0 }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.5, repeat: 2, ease: "easeInOut" }}
              className="text-[#f97316]/50"
            >
              <ChevronDown size={28} />
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page bounce animation wrapper */}
      <motion.div
        animate={bounceDown && !reducedMotion ? { y: [0, -16, 0] } : {}}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="h-full w-full"
      >
        <div
          ref={scrollRef}
          className="h-full w-full overflow-x-auto snap-x snap-mandatory flex scrollbar-hide touch-pan-x"
          style={{ overscrollBehaviorY: shouldBlock ? "none" : "contain" }}
        >
          {/* Hero page */}
          <div ref={(el) => { pageRefs.current[0] = el; }} data-page={0} className={pageBaseClass}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="text-[120px] md:text-[220px] font-bold text-[#1a1a1a]/[0.03]">优势</span>
            </div>

            <motion.div {...dragProps} className="relative z-10 max-w-3xl mx-auto text-center">
              <motion.h2
                variants={advV}
                initial="hidden"
                animate={heroInView ? "visible" : "hidden"}
                custom={0}
                className="text-5xl md:text-7xl font-bold text-[#1a1a1a] mb-4"
              >
                个人优势
              </motion.h2>
              <motion.p
                variants={advV}
                initial="hidden"
                animate={heroInView ? "visible" : "hidden"}
                custom={0.1}
                className="text-xl md:text-2xl text-[#1a1a1a]/60 mb-12"
              >
                继续探索，发现我的核心竞争力
              </motion.p>
              <motion.button
                variants={advV}
                initial="hidden"
                animate={heroInView ? "visible" : "hidden"}
                custom={0.2}
                onClick={() => scrollToPage(1)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#f97316] text-white rounded-full text-lg font-medium hover:bg-[#ea580c] transition-colors cursor-pointer"
              >
                GO <ChevronRight size={20} />
              </motion.button>
            </motion.div>
          </div>

          {/* Advantage pages */}
          {items.map((item, i) => {
            const Icon = iconMap[item.icon] || Sparkles;
            const pageInView = isActive && pageIndex === i + 1;
            const isLast = i === items.length - 1;
            return (
              <div
                key={item.id}
                ref={(el) => { pageRefs.current[i + 1] = el; }}
                data-page={i + 1}
                className={pageBaseClass}
              >
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <motion.div
                    className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#f97316]/5 blur-3xl"
                    animate={pageInView && !reducedMotion ? { x: [0, 30, 0], y: [0, 20, 0] } : {}}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute -left-20 -bottom-20 w-96 h-96 rounded-full bg-[#f97316]/[0.03] blur-3xl"
                    animate={pageInView && !reducedMotion ? { x: [0, -20, 0], y: [0, -30, 0] } : {}}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>

                <motion.div {...dragProps} className="relative z-10 max-w-4xl mx-auto w-full">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16">
                    <motion.div
                      variants={advV}
                      initial="hidden"
                      animate={pageInView ? "visible" : "hidden"}
                      custom={0}
                      className="flex-shrink-0"
                    >
                      <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl bg-[#faf7f4] border border-[#1a1a1a]/5 flex items-center justify-center text-[#f97316]">
                        <motion.div
                          animate={pageInView && !reducedMotion ? { scale: [1, 1.08, 1], y: [0, -6, 0] } : {}}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Icon size={56} />
                        </motion.div>
                      </div>
                    </motion.div>

                    <div className="flex-1 text-center md:text-left">
                      <motion.h3
                        variants={advV}
                        initial="hidden"
                        animate={pageInView ? "visible" : "hidden"}
                        custom={0.08}
                        className="text-4xl md:text-6xl font-bold text-[#1a1a1a] mb-6"
                      >
                        {item.title}
                      </motion.h3>
                      <motion.div
                        variants={advV}
                        initial="hidden"
                        animate={pageInView ? "visible" : "hidden"}
                        custom={0.16}
                        className="text-lg md:text-xl text-[#1a1a1a]/70 leading-relaxed whitespace-pre-wrap"
                      >
                        {item.description}
                      </motion.div>
                      <motion.button
                        variants={advV}
                        initial="hidden"
                        animate={pageInView ? "visible" : "hidden"}
                        custom={0.24}
                        onClick={() => {
                          if (isLast) {
                            const cta = document.querySelector('[data-screen="cta"]') as HTMLElement | null;
                            if (cta) cta.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
                          } else {
                            scrollToPage(i + 2);
                          }
                        }}
                        className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-[#f97316] text-white rounded-full text-lg font-medium hover:bg-[#ea580c] transition-colors cursor-pointer"
                      >
                        GO {isLast ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Horizontal indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            {Array.from({ length: pagesCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToPage(i)}
                className="w-11 h-11 flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]/50 cursor-pointer"
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
            {pageIndex + 1} / {pagesCount}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
