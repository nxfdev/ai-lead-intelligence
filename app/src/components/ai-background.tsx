"use client";

import { useEffect, useMemo, useState } from "react";

function makeStars(count: number) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 4}s`,
      dur: `${3 + Math.random() * 4}s`,
    });
  }
  return stars;
}

function makeParticles(count: number) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    parts.push({
      left: `${Math.random() * 100}%`,
      bottom: `${Math.random() * 40}%`,
      size: 2 + Math.random() * 3,
      dur: `${7 + Math.random() * 9}s`,
      delay: `${Math.random() * 7}s`,
    });
  }
  return parts;
}

export function AIBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  // Only randomize decoration after mount so server & client HTML match.
  const stars = useMemo(() => (mounted ? makeStars(90) : []), [mounted]);
  const particles = useMemo(() => (mounted ? makeParticles(26) : []), [mounted]);

  return (
    <div className="aibg fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
      {/* Arabian Night Backdrop Image with ambient blending */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 transform scale-105"
        style={{
          backgroundImage: `url('/aladdin-theme.jpg')`,
          filter: "blur(2px) brightness(0.6) saturate(1.2)",
        }}
      />

      {/* Will Smith Inspired Majestic Blue Genie Background Layer */}
      <div className="absolute top-0 right-0 w-full sm:w-[65%] lg:w-[50%] h-[550px] sm:h-[700px] pointer-events-none overflow-hidden opacity-60 sm:opacity-75 transition-opacity duration-700">
        <div
          className="w-full h-full bg-contain sm:bg-cover bg-no-repeat bg-top sm:bg-right-top animate-pulse"
          style={{
            backgroundImage: `url('/aladdin-genie-bg.jpg')`,
            mixBlendMode: "screen",
            filter: "brightness(1.1) contrast(1.15)",
            maskImage: "radial-gradient(ellipse 70% 70% at 65% 35%, black 35%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 65% 35%, black 35%, transparent 75%)",
            animationDuration: "6s",
          }}
        />
      </div>

      {/* Deep twilight gradients for rich contrast */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 10%, rgba(6, 12, 38, 0.3) 0%, rgba(3, 5, 18, 0.8) 65%, #030511 100%)",
        }}
      />

      {/* Crescent Moon Glow in Top Right */}
      <div
        className="absolute top-12 right-[18%] w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(254, 240, 138, 0.35) 0%, rgba(245, 158, 11, 0.1) 45%, transparent 70%)",
          filter: "blur(12px)",
        }}
      />

      {/* Star field */}
      <div className="star-field">
        {stars.map((s, i) => (
          <span
            key={`s${i}`}
            className="star"
            style={{ left: s.left, top: s.top, animationDelay: s.delay, animationDuration: s.dur }}
          />
        ))}
      </div>

      {/* Genie Mystical Aurora Orbs */}
      <div
        className="orb"
        style={{
          top: "15%",
          right: "25%",
          width: "480px",
          height: "480px",
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, rgba(56, 189, 248, 0.08) 50%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="orb"
        style={{
          top: "35%",
          left: "15%",
          width: "550px",
          height: "550px",
          background: "radial-gradient(circle, rgba(124, 58, 237, 0.2) 0%, rgba(76, 29, 149, 0.08) 50%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      <div
        className="orb"
        style={{
          bottom: "10%",
          left: "5%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.08) 50%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* Rising golden magic sparks & particles */}
      {particles.map((p, i) => (
        <span
          key={`p${i}`}
          className="particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            background: i % 2 === 0 ? "#fef08a" : "#38bdf8",
            boxShadow: i % 2 === 0 ? "0 0 8px #f59e0b" : "0 0 8px #06b6d4",
            animationDuration: p.dur,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* Luxury Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 95% 85% at 50% 40%, transparent 50%, rgba(2, 4, 12, 0.85) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}