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
    <div className="aibg" aria-hidden>
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

      {/* Aurora orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />

      {/* Rising particles */}
      {particles.map((p, i) => (
        <span
          key={`p${i}`}
          className="particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            animationDuration: p.dur,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* Vignette for depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 90% 80% at 50% 45%, transparent 55%, rgba(4,2,10,0.75) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}