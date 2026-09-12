"use client";

import React, { useRef, useState } from "react";

interface Flashcard3DProps {
  children: React.ReactNode;
  backContent?: React.ReactNode;
  isFlipped?: boolean;
  onFlip?: () => void;
  className?: string;
  glow?: "gold" | "cyan" | "purple" | "orange" | "none";
  tiltMax?: number;
}

export function Flashcard3D({
  children,
  backContent,
  isFlipped = false,
  onFlip,
  className = "",
  glow = "none",
  tiltMax = 10,
}: Flashcard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [sheenPos, setSheenPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipped) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -tiltMax;
    const rY = ((x - centerX) / centerX) * tiltMax;

    setRotateX(rX);
    setRotateY(rY);
    setSheenPos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const glowStyles = {
    gold: "hover:border-amber-400/60 hover:shadow-[0_20px_50px_rgba(245,158,11,0.25)] border-amber-500/30",
    cyan: "hover:border-cyan-400/60 hover:shadow-[0_20px_50px_rgba(6,182,212,0.25)] border-cyan-500/30",
    purple: "hover:border-purple-400/60 hover:shadow-[0_20px_50px_rgba(168,85,247,0.25)] border-purple-500/30",
    orange: "hover:border-orange-400/60 hover:shadow-[0_20px_50px_rgba(249,115,22,0.25)] border-orange-500/30",
    none: "border-white/10 hover:border-white/25 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
  }[glow];

  return (
    <div
      className="perspective-1200 w-full"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cardRef}
        className={`flashcard-3d relative w-full rounded-2xl transition-all duration-300 ${glowStyles} ${className}`}
        style={{
          transform: isFlipped
            ? "rotateY(180deg)"
            : `rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${isHovered ? "translateZ(10px)" : "translateZ(0)"}`,
        }}
      >
        {/* Dynamic glossy specular reflection */}
        <div
          className="pointer-events-none absolute inset-0 z-30 rounded-2xl transition-opacity duration-300"
          style={{
            opacity: isHovered && !isFlipped ? 0.35 : 0,
            background: `radial-gradient(circle 320px at ${sheenPos.x}% ${sheenPos.y}%, rgba(255,255,255,0.3) 0%, transparent 80%)`,
          }}
        />

        {backContent ? (
          <>
            {/* Front side */}
            <div className={`backface-hidden w-full ${isFlipped ? "pointer-events-none" : ""}`}>
              {children}
            </div>

            {/* Back side */}
            <div className="backface-hidden rotate-y-180 absolute inset-0 w-full h-full">
              {backContent}
            </div>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
