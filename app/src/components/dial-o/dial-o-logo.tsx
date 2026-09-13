"use client";

import React from "react";

interface DialOLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  variant?: "hero" | "header" | "mono";
}

export function DialOLogo({ className = "", size = "md", variant = "hero" }: DialOLogoProps) {
  // Font sizes mapped to Tailwind + inline style for hero (144px target)
  const sizeStyles: Record<string, { fontSize: string; letterSpacing: string }> = {
    sm: { fontSize: "18px", letterSpacing: "0.25em" },
    md: { fontSize: "24px", letterSpacing: "0.28em" },
    lg: { fontSize: "40px", letterSpacing: "0.32em" },
    xl: { fontSize: "60px", letterSpacing: "0.35em" },
    hero: { fontSize: "144px", letterSpacing: "0.1em" },
  };

  const style = sizeStyles[size] ?? sizeStyles.md;

  if (variant === "hero" || variant === "header") {
    return (
      <div
        className={`relative inline-flex items-center select-none font-modular font-black ${className}`}
        style={{ lineHeight: 1 }}
      >
        {/* Layer 1: Cyan silhouette offset left */}
        <span
          style={{
            fontSize: style.fontSize,
            letterSpacing: style.letterSpacing,
            position: "absolute",
            left: "-2px",
            top: "1px",
            color: "#00FFFF",
            opacity: 0.9,
            filter: "blur(0.3px)",
          }}
          aria-hidden="true"
        >
          DIAL O
        </span>
        {/* Layer 2: Orange / Yellow foreground */}
        <span
          style={{
            fontSize: style.fontSize,
            letterSpacing: style.letterSpacing,
            position: "relative",
            fontWeight: 900,
            textTransform: "uppercase",
            background: "linear-gradient(90deg, #EFCD5E, #FF751F, #EFCD5E)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          DIAL O
        </span>
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center select-none font-modular font-bold ${className}`}>
      <span
        style={{
          fontSize: style.fontSize,
          letterSpacing: style.letterSpacing,
          fontWeight: 900,
          textTransform: "uppercase",
          color: "#FFFFFF",
        }}
      >
        DIAL O
      </span>
    </div>
  );
}
