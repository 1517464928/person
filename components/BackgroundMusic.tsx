"use client";

import { useEffect, useState } from "react";
import { VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { useMusic } from "./MusicContext";

export default function BackgroundMusic() {
  const { enabled, enableMusic, audioRef } = useMusic();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedMuted = localStorage.getItem("bg-music-muted");
    const muted = savedMuted === "true";
    setIsMuted(muted);

    const audio = new Audio(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/audio/bg-music.mp3`);
    audio.loop = true;
    audio.volume = 0.4;
    audio.muted = muted;
    audioRef.current = audio;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.pause();
      audioRef.current = null;
    };
  }, [audioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (enabled && !isMuted) {
      audio.muted = false;
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [enabled, isMuted, audioRef]);

  const toggle = () => {
    const audio = audioRef.current;

    if (!enabled) {
      enableMusic();
      setIsMuted(false);
      localStorage.setItem("bg-music-muted", "false");
      return;
    }

    if (!audio) return;

    if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
      localStorage.setItem("bg-music-muted", "false");
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.muted = true;
      setIsMuted(true);
      localStorage.setItem("bg-music-muted", "true");
    }
  };

  if (!mounted) return null;

  const showPlaying = enabled && isPlaying && !isMuted;

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 left-6 z-[60] w-12 h-12 rounded-full bg-white/90 backdrop-blur shadow-lg border border-[#1a1a1a]/5 flex items-center justify-center text-[#f97316] hover:scale-110 transition-transform cursor-pointer"
      aria-label={showPlaying ? "关闭背景音乐" : "播放背景音乐"}
    >
      {showPlaying ? (
        <div className="flex items-center gap-[3px] h-5">
          {[1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="w-[3px] bg-[#f97316] rounded-full"
              animate={{ height: [8, 18, 8] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      ) : (
        <VolumeX size={20} />
      )}
    </button>
  );
}
