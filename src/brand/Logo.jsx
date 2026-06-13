import React from "react";

/* ════════════════════════════════════════════════════════════════════════
   THE LAB TERMINAL — BRAND MARK
   --------------------------------------------------------------------------
   A minimalist Erlenmeyer flask drawn as a precision instrument: two
   symmetrical thin strokes form the silhouette; a single inset "level" line
   reads as both the liquid surface of lab glassware AND a marked price level;
   short graduation ticks down the right wall double as volume markings and a
   price ladder. Monochrome — colour comes from `currentColor`, so the mark
   inherits the surrounding text colour and stays pure B&W everywhere.

   Exports:
     <LogoMark/>   transparent flask, in-app use (nav, headers)
     <AppIcon/>    flask balanced in a rounded-square safe area (favicon / PWA)
     <Wordmark/>   logomark + "THE LAB TERMINAL" lockup

   Clear-space:  keep ≥ 25% of the mark's height clear on all sides.
   Min size:     LogoMark 16px; AppIcon 16px (favicon-safe); Wordmark 110px wide.
   ════════════════════════════════════════════════════════════════════════ */

// Shared flask geometry on a 0 0 64 64 grid (centre x = 32, perfectly symmetric).
function Flask({ stroke = 2.4, ticks = true, fill = true }) {
  return (
    <>
      {/* liquid / volume — subtle, no colour */}
      {fill && (
        <path
          d="M22.11 34 L13 51 H51 L41.89 34 Z"
          fill="currentColor"
          opacity="0.06"
          stroke="none"
        />
      )}
      {/* flask outline (open mouth at top) */}
      <path
        d="M28 11 V23 L13 51 H51 L36 23 V11"
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* mouth lip */}
      <path
        d="M22.5 10.5 H41.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke - 0.2}
        strokeLinecap="round"
      />
      {/* marked level line (price level / liquid surface) */}
      <path
        d="M24 34 H40"
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke - 0.6}
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* graduation ticks — volume markings / price ladder */}
      {ticks && (
        <g stroke="currentColor" strokeWidth={Math.max(1.2, stroke - 1)} strokeLinecap="round" opacity="0.6">
          <path d="M45.11 40 H38.11" />
          <path d="M48.05 45.5 H42.05" />
        </g>
      )}
    </>
  );
}

export function LogoMark({ size = 28, glow = false, title = "The Lab Terminal", style, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={className}
      style={{
        display: "block",
        color: "currentColor",
        filter: glow ? "drop-shadow(0 0 10px rgba(234,240,251,.28))" : undefined,
        ...style,
      }}
    >
      <Flask stroke={2.4} ticks fill />
    </svg>
  );
}

export function AppIcon({ size = 64, rounded = true, style, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="The Lab Terminal"
      className={className}
      style={{ display: "block", ...style }}
    >
      {rounded && (
        <>
          <defs>
            <linearGradient id="lab-icon-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#11141c" />
              <stop offset="1" stopColor="#080a0f" />
            </linearGradient>
          </defs>
          <rect x="2.5" y="2.5" width="59" height="59" rx="14" fill="url(#lab-icon-bg)" stroke="#2a3142" strokeWidth="1.25" />
          {/* faint top sheen — crafted icon feel */}
          <rect x="2.5" y="2.5" width="59" height="22" rx="14" fill="#ffffff" opacity="0.025" />
        </>
      )}
      {/* white flask, heavier strokes for small-size legibility, ticks dropped */}
      <g style={{ color: "#f4f6fb" }} transform="scale(0.86) translate(5.2 5.2)">
        <Flask stroke={3} ticks={false} fill />
      </g>
    </svg>
  );
}

export function Wordmark({ size = 26, name = "THE LAB TERMINAL", sub, gap = 11, glow = false, style, className }) {
  return (
    <div className={className} style={{ display: "inline-flex", alignItems: "center", gap, color: "currentColor", ...style }}>
      <LogoMark size={size + 6} glow={glow} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
        <span
          style={{
            fontFamily: "'Space Grotesk',sans-serif",
            fontWeight: 700,
            fontSize: size * 0.52,
            letterSpacing: "0.2em",
            color: "currentColor",
          }}
        >
          {name}
        </span>
        {sub && (
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: size * 0.36,
              letterSpacing: "0.18em",
              color: "var(--t-3,#8a93a6)",
              marginTop: 2,
            }}
          >
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

export default LogoMark;
