"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface HeroVideoProps {
  onProgress?: (progress: number) => void;
  className?: string;
  children?: React.ReactNode;
}

export function HeroVideo({ onProgress, className = "", children }: HeroVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Report scroll progress through the hero so the Page 1 → Page 2 content
  // cross-fades. This NEVER touches video playback — the video plays
  // continuously and independently of scrolling.
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const totalScrollable = rect.height - windowHeight;

    if (totalScrollable <= 0) return;

    // Calculate normalized scroll progress [0, 1] through the container
    const scrollOffset = -rect.top;
    const progress = Math.min(Math.max(scrollOffset / totalScrollable, 0), 1);

    if (onProgress) {
      onProgress(progress);
    }
  }, [onProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onMetadata = () => {
      setIsVideoReady(true);
    };

    const onCanPlay = () => {
      setIsVideoReady(true);
    };

    const startPlayback = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay may be temporarily blocked by the browser; the
          // interaction handlers below will resume it.
        });
      }
    };

    video.addEventListener("loadedmetadata", onMetadata);
    video.addEventListener("canplay", onCanPlay);

    if (video.readyState >= 1) {
      onMetadata();
    }

    // Continuous cinematic background playback
    startPlayback();

    // Some browsers block autoplay until the user first interacts.
    // A single pointer/key interaction resumes playback.
    const resumeOnInteraction = () => startPlayback();
    window.addEventListener("pointerdown", resumeOnInteraction, { once: true });
    window.addEventListener("keydown", resumeOnInteraction, { once: true });

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Initial progress check
    handleScroll();

    return () => {
      video.removeEventListener("loadedmetadata", onMetadata);
      video.removeEventListener("canplay", onCanPlay);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener("pointerdown", resumeOnInteraction);
      window.removeEventListener("keydown", resumeOnInteraction);
    };
  }, [handleScroll]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Sticky viewport container */}
      <div className="sticky top-0 w-full h-screen overflow-hidden bg-black">
        <video
          ref={videoRef}
          src="/video/dial-o-hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
          style={{
            // Slight contrast enhancement to maintain pure blacks
            filter: "contrast(1.05) brightness(0.98)",
          }}
        />

        {/* Loading / Poster State protection */}
        {!isVideoReady && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-10 transition-opacity duration-700">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] tracking-[0.25em] text-[#00FFFF] uppercase animate-pulse">
                INITIALIZING CINEMATIC FEED
              </span>
            </div>
          </div>
        )}

        {/* Overlay grid and children UI */}
        <div className="absolute inset-0 z-20 pointer-events-auto flex flex-col justify-between">
          {children}
        </div>
      </div>
    </div>
  );
}
