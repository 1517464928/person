"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useMusic } from "./MusicContext";
import SplitText from "./animations/SplitText";

export default function Hero() {
  const { enableMusic, audioRef } = useMusic();
  const [title, setTitle] = useState("张攀岳");
  const [btnText, setBtnText] = useState("了解更多");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/data.json`)
      .then((r) => r.json())
      .then((d) => {
        if (d.siteConfig) {
          setTitle(d.siteConfig.heroTitle || "张攀岳");
          setBtnText(d.siteConfig.heroButtonText || "了解更多");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-transparent">
      <div className="relative z-10 text-center px-4 w-full max-w-4xl">
        <SplitText
          text={title}
          className="text-6xl md:text-8xl font-bold tracking-tight text-[#1a1a1a] mb-8"
          delay={80}
          duration={0.5}
          from={{ opacity: 0, y: 40, rotateX: -60 }}
          to={{ opacity: 1, y: 0, rotateX: 0 }}
          splitType="chars"
          textAlign="center"
          tag="h1"
        />

        <Link href="/about">
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ scale: 1.05, boxShadow: "0 12px 24px rgba(249,115,22,0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { enableMusic(); const a = audioRef.current; if (a) { a.currentTime = 0; a.muted = false; a.play().catch(() => {}); } }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#f97316] text-white rounded-full text-base font-medium hover:bg-[#ea580c] transition-colors duration-300 cursor-pointer shadow-lg"
          >
            {btnText} <ArrowRight size={18} />
          </motion.button>
        </Link>
      </div>
    </section>
  );
}
