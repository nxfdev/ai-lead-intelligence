"use client";

interface AIAvatarProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function AIAvatar({ size = 96, className = "", animated = true }: AIAvatarProps) {
  const haloId = `halo-${size}`;
  const glowId = `glow-${size}`;
  const gradHair = `grad-hair-${size}`;
  const gradSkin = `grad-skin-${size}`;
  const gradInner = `grad-inner-${size}`;

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Halo ring */}
      <svg
        viewBox="0 0 160 160"
        width={size}
        height={size}
        className="absolute inset-0 animate-spin-slow"
      >
        <defs>
          <linearGradient id={gradHair} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff5fa2" />
            <stop offset="50%" stopColor="#d23cff" />
            <stop offset="100%" stopColor="#6c5bff" />
          </linearGradient>
          <linearGradient id={gradSkin} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffe9f2" />
            <stop offset="100%" stopColor="#f3c6dd" />
          </linearGradient>
          <linearGradient id={gradInner} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#b9aed8" />
          </linearGradient>
          <radialGradient id={haloId} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#d23cff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#d23cff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={glowId} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#ff5fa2" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ff5fa2" stopOpacity="0" />
          </radialGradient>
          <filter id="fblur">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Rotating dashed outer ring */}
        <circle cx="80" cy="80" r="75" fill="none" stroke="url(#gradHair)" strokeWidth="1" strokeDasharray="3 7" opacity="0.7" />
        <circle cx="80" cy="80" r="66" fill="none" stroke="rgba(143,134,168,0.35)" strokeWidth="0.8" />
        <circle cx="80" cy="80" r="70" fill="url(#haloId)" />
      </svg>

      {/* Inner spinning arc (reverse direction) */}
      <svg
        viewBox="0 0 160 160"
        width={size * 0.86}
        height={size * 0.86}
        className="absolute inset-0"
        style={{ animation: "spin-slow 9s linear infinite reverse" }}
      >
        <circle cx="80" cy="80" r="68" fill="none" stroke="url(#gradHair)" strokeWidth="1.4" strokeDasharray="120 148" strokeLinecap="round" opacity="0.85" />
      </svg>

      {/* The portrait */}
      <svg
        viewBox="0 0 160 160"
        width={size * 0.72}
        height={size * 0.72}
        className="relative z-10 drop-shadow-[0_10px_24px_rgba(210,60,255,0.45)]"
      >
        {/* Glow behind face */}
        <ellipse cx="80" cy="96" rx="42" ry="34" fill={`url(#${glowId})`} filter="url(#fblur)" />

        {/* Hair base */}
        <path d="M80 26c-24 0-40 18-42 42-2 26 10 52 22 64l6-24 4-10c-6-2-10-10-10-18 8 4 16 6 20 2V26z" fill={`url(#${gradHair})`} />
        <path d="M80 26c24 0 40 18 42 42 2 26-10 52-22 64l-6-24-4-10c6-2 10-10 10-18-8 4-16 6-20 2V26z" fill={`url(#${gradHair})`} />

        {/* Face */}
        <ellipse cx="80" cy="92" rx="30" ry="40" fill={`url(#${gradSkin})`} />

        {/* Eyes */}
        <g fill="#2a1438">
          <ellipse cx="68" cy="86" rx="4.4" ry="5.2" />
          <ellipse cx="92" cy="86" rx="4.4" ry="5.2" />
        </g>
        <g fill="#ff5fa2">
          <ellipse cx="66.6" cy="87.4" rx="2.2" ry="1.6" opacity="0.95" />
          <ellipse cx="90.6" cy="87.4" rx="2.2" ry="1.6" opacity="0.95" />
        </g>
        {/* Eyelashes */}
        <g stroke="#2a1438" strokeWidth="1.1" strokeLinecap="round" fill="none">
          <path d="M62 82l3-1.5M73 81l3-1.8M86 81l3-1.8M97 82l-3-1.5" />
        </g>

        {/* Eyebrows */}
        <g stroke="url(#gradHair)" strokeWidth="2.2" strokeLinecap="round" fill="none">
          <path d="M62 77q6-5 12-2" />
          <path d="M98 77q-6-5-12-2" />
        </g>

        {/* Nose */}
        <path d="M80 92c2 4 1.5 7-1 10" stroke="#d99bb9" strokeWidth="1.6" strokeLinecap="round" fill="none" />

        {/* Lips */}
        <path d="M71 106q9 7 18 0" stroke="#ff7da9" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <path d="M71 106q9 7 18 0" stroke="rgba(255,90,140,0.4)" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.4" />

        {/* Blush */}
        <ellipse cx="64" cy="96" rx="5" ry="3" fill="#ffacc8" opacity="0.55" />
        <ellipse cx="96" cy="96" rx="5" ry="3" fill="#ffacc8" opacity="0.55" />

        {/* Choker — "merchant" AI collar */}
        <path d="M62 118q18 9 36 0" stroke="#f0b429" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <circle cx="80" cy="121" r="3.4" fill="#ff5fa2" stroke="#ffe9f2" strokeWidth="1" />

        {/* Earrings */}
        <circle cx="52" cy="104" r="2.6" fill="#f0b429" />
        <circle cx="108" cy="104" r="2.6" fill="#f0b429" />

        {/* Circuit sparkles */}
        {animated && (
          <g fill="#5ff0ff">
            <circle cx="44" cy="52" r="1.6" className="pulse-dot" />
            <circle cx="118" cy="60" r="1.6" className="pulse-dot" style={{ animationDelay: "0.4s" }} />
            <circle cx="124" cy="34" r="1.4" className="pulse-dot" style={{ animationDelay: "0.8s" }} />
            <circle cx="34" cy="70" r="1.4" className="pulse-dot" style={{ animationDelay: "1.2s" }} />
          </g>
        )}

        {/* Vertical data stream on side */}
        {animated && (
          <g stroke="#5ff0ff" strokeWidth="1" opacity="0.5" strokeDasharray="2 6">
            <path d="M126 24v34" />
            <path d="M130 40v30" />
          </g>
        )}

        {/* Tech face accent */}
        <path d="M64 96l6 3 8-3" stroke={`url(#${gradInner})`} strokeWidth="0.9" fill="none" opacity="0.65" />
      </svg>
    </div>
  );
}