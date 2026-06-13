import React, { useId } from "react";

/*
 * THE LAB — brand marks (vector).
 *
 * Redrawn from the original PNG identity: two symmetrical tapering light strokes
 * forming an Erlenmeyer flask silhouette (lip → neck → conical flare → sharp tip).
 * Differences vs the old PNG asset:
 *  - true vector (crisp at any size, from 16px favicon to hero)
 *  - transparent background (no more "black box" look)
 *  - optional soft glow baked in via SVG filter (toggle with `glow`)
 *
 * Usage: <FlaskMark size={30} />  ·  <BrandWordmark size={26} />
 */

export function FlaskMark({ size = 24, color = "#f1f4f9", glow = true, style }) {
  const raw = useId();
  const id = "flask" + raw.replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={style} aria-hidden="true">
      {glow ? (
        <defs>
          <filter id={id} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      ) : null}
      <g fill={color} filter={glow ? "url(#" + id + ")" : undefined}>
        {/* left stroke: cap (lip) → neck → conical flare to a sharp tip */}
        <path d="M58 26 L42 26 L42 50 L24 94 L46 50 L46 30 L58 30 Z" />
        {/* right stroke: mirrored */}
        <path d="M62 26 L78 26 L78 50 L96 94 L74 50 L74 30 L62 30 Z" />
      </g>
    </svg>
  );
}

export function BrandWordmark({ size = 26, text = "THE LAB TERMINAL", style }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, ...style }}>
      <FlaskMark size={size} />
      <span style={{ fontFamily: "var(--sans)", fontWeight: 700, letterSpacing: ".2em", fontSize: Math.round(size * 0.52), color: "#ffffff" }}>
        {text}
      </span>
    </span>
  );
}
