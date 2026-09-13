"use client";

import React, { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

interface StepCard {
  stepNumber: string;
  title: string;
  description: string;
}

const STEP_CARDS: StepCard[] = [
  {
    stepNumber: "#STEP 1",
    title: "TELL US WHAT YOU'RE SELLING",
    description: "Your offering, criteria, and target market are parsed into structured lead intelligence.",
  },
  {
    stepNumber: "#STEP 2",
    title: "WE SURFACE THE STRONGEST PROSPECTS",
    description: "Evidence is scraped, aggregated, and scored before any phone call is ever scheduled.",
  },
  {
    stepNumber: "#STEP 3",
    title: "CALL-E REACHES OUT",
    description: "Autonomous phone agent verifies the hypothesis live and returns structured business insights.",
  },
];

export function WalkthroughSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setProgress((curr / dur) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * (videoRef.current.duration || 1);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <section
      id="walkthrough"
      className="relative w-full bg-[#00FFFF] text-black dial-grid-cyan"
      style={{ paddingTop: "80px", paddingBottom: "80px", paddingLeft: "64px", paddingRight: "64px" }}
    >
      <div className="max-w-none">
        {/* Section Header — VIDEO WALKTHROUGH @ 140px */}
        <div style={{ marginBottom: "48px" }}>
          <h2
            className="font-black uppercase font-modular text-black"
            style={{
              fontSize: "clamp(60px, 9vw, 140px)",
              lineHeight: 0.9,
              letterSpacing: "0.06em",
              // Drop shadow referencing PDF's white shadow treatment
              textShadow: "0 3px 0 rgba(255,255,255,0.6)",
            }}
          >
            VIDEO<br />WALKTHROUGH
          </h2>
        </div>

        {/* 2-Column Layout matching PDF: Left Video (7 cols), Right 3 Stacked Cards (5 cols) */}
        <div className="grid grid-cols-12 gap-10 items-stretch">
          {/* Left Column: Video (7 cols) */}
          <div className="col-span-12 lg:col-span-7 flex flex-col justify-between">
            <div className="relative w-full bg-black border-4 border-black overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.35)] flex flex-col" style={{ aspectRatio: "16/9" }}>
              <video
                ref={videoRef}
                src="/video/console-walkthrough.mp4"
                playsInline
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                className="w-full h-full object-cover cursor-pointer"
                onClick={togglePlay}
              />

              {/* Custom Accessible Controls Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2" style={{ padding: "20px 16px 12px 16px" }}>
                {/* Scrub bar */}
                <div
                  className="w-full bg-white/20 hover:bg-white/30 transition-all cursor-pointer overflow-hidden"
                  style={{ height: "6px", borderRadius: "0" }}
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-[#00FFFF] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={togglePlay}
                      className="p-1.5 hover:text-[#00FFFF] transition-colors focus:outline-none"
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause style={{ width: "24px", height: "24px" }} /> : <Play style={{ width: "24px", height: "24px" }} className="fill-current" />}
                    </button>

                    <button
                      onClick={toggleMute}
                      className="p-1.5 hover:text-[#00FFFF] transition-colors focus:outline-none"
                      aria-label={isMuted ? "Unmute sound" : "Mute sound"}
                    >
                      {isMuted ? <VolumeX style={{ width: "24px", height: "24px" }} className="text-red-400" /> : <Volume2 style={{ width: "24px", height: "24px" }} />}
                    </button>

                    <span
                      className="font-mono uppercase font-bold tracking-widest text-neutral-300"
                      style={{ fontSize: "12px" }}
                    >
                      {isPlaying ? "LIVE FEED" : "PAUSED"}
                    </span>
                  </div>

                  <button
                    onClick={handleFullscreen}
                    className="p-1.5 hover:text-[#00FFFF] transition-colors"
                    aria-label="Fullscreen"
                  >
                    <Maximize style={{ width: "20px", height: "20px" }} />
                  </button>
                </div>
              </div>

              {/* Big Play Button Overlay when paused */}
              {!isPlaying && (
                <div
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer group"
                >
                  <div className="rounded-full bg-[#EFCD5E] text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform" style={{ width: "80px", height: "80px" }}>
                    <Play style={{ width: "36px", height: "36px", marginLeft: "6px" }} className="fill-current" />
                  </div>
                </div>
              )}
            </div>

            <div
              className="flex items-center justify-between font-black tracking-[0.2em] uppercase font-modular text-black/70"
              style={{ marginTop: "16px", fontSize: "13px" }}
            >
              <span>CONSOLE DEMO PLAYBACK</span>
              <span>AUDIO ENABLED UPON USER INTERACTION</span>
            </div>
          </div>

          {/* Right Column: Three Stacked Step Cards (5 cols) */}
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-between gap-6">
            {STEP_CARDS.map((card, index) => (
              <div
                key={card.stepNumber}
                className="step-card-orange flex flex-col justify-between"
                style={{
                  padding: "32px 36px",
                  boxShadow: "0 8px 0 #000000",
                  animationDelay: `${index * 0.15}s`,
                  flex: "1",
                }}
              >
                {/* Step Badge — 48px title */}
                <div className="flex items-center justify-between" style={{ marginBottom: "16px" }}>
                  <span
                    className="step-badge font-black tracking-[0.2em] uppercase px-3 py-1 bg-black text-[#FF751F] border border-black transition-colors font-modular"
                    style={{ fontSize: "16px" }}
                  >
                    {card.stepNumber}
                  </span>
                  <span
                    className="tracking-widest uppercase font-mono opacity-80"
                    style={{ fontSize: "12px" }}
                  >
                    STAGE 0{index + 1}
                  </span>
                </div>

                {/* Card Title — 48px */}
                <h3
                  className="font-black tracking-[0.04em] uppercase leading-tight font-modular"
                  style={{ fontSize: "clamp(24px, 2.5vw, 48px)", margin: "8px 0" }}
                >
                  {card.title}
                </h3>

                {/* Card Description — 28px */}
                <p
                  className="font-medium tracking-wide leading-relaxed"
                  style={{ fontSize: "clamp(16px, 1.6vw, 28px)", opacity: 0.9, marginTop: "8px" }}
                >
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
