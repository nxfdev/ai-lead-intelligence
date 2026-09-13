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
  const rafId = useRef<number | null>(null);
  const lastTargetTime = useRef<number>(0);
  const isSeeking = useRef<boolean>(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [duration, setDuration] = useState(10.67);

  // Sync scroll to video currentTime
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !videoRef.current) return;

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

    const video = videoRef.current;
    const effectiveDuration = video.duration && !isNaN(video.duration) ? video.duration : duration;
    const targetTime = progress * effectiveDuration;

    lastTargetTime.current = targetTime;

    if (!rafId.current) {
      rafId.current = requestAnimationFrame(() => {
        if (videoRef.current && Math.abs(videoRef.current.currentTime - lastTargetTime.current) > 0.03) {
          try {
            videoRef.current.currentTime = lastTargetTime.current;
          } catch {
            // Browser might throw if video not completely loaded yet
          }
        }
        rafId.current = null;
      });
    }
  }, [duration, onProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
      setIsVideoReady(true);
      // Ensure initial frame is queued at 0
      video.currentTime = 0.01;
    };

    const onCanPlay = () => {
      setIsVideoReady(true);
    };

    video.addEventListener("loadedmetadata", onMetadata);
    video.addEventListener("canplay", onCanPlay);

    if (video.readyState >= 1) {
      onMetadata();
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Initial check
    handleScroll();

    return () => {
      video.removeEventListener("loadedmetadata", onMetadata);
      video.removeEventListener("canplay", onCanPlay);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [handleScroll]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Sticky viewport container */}
      <div className="sticky top-0 w-full h-screen overflow-hidden bg-black">
        <video
          ref={videoRef}
          src="/video/dial-o-hero.mp4"
          playsInline
          muted
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
