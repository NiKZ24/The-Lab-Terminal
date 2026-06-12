import React, { useEffect, useRef } from "react";

/*
 * ParticleHero — background canvas animation for the landing page.
 *
 * Behaviour (inspired by motion-heavy crypto landings, built from scratch):
 *  1. ON-LOAD: particles start scattered at random screen positions, then ease
 *     into orbital formation around the center over ~1.6s.
 *  2. IDLE: particles orbit the center at varied radii/speeds with organic
 *     sine-noise drift; nearby particles are linked with faint lines.
 *
 * Modular by design: the visual is entirely particle-driven and theme-agnostic.
 * To change the look, tweak the CONFIG block below (count, colors, sizes).
 * The center object (flask logo) is rendered as a DOM element by the parent,
 * layered above this canvas — swap it there.
 */

const CONFIG = {
  count: 150,
  color: "238,241,247",   // rgb of --acc (B&W identity)
  linkDist: 116,          // px distance under which particles get linked
  linkAlpha: 0.10,
  dotMin: 0.6,
  dotMax: 2.1,
  introMs: 1600,
};

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

export default function ParticleHero() {
  const cvsRef = useRef(null);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    const cvs = cvsRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    let W = 0, H = 0, CX = 0, CY = 0, dpr = 1;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const parts = [];
    const seed = () => {
      parts.length = 0;
      const minDim = Math.min(W, H);
      for (let i = 0; i < CONFIG.count; i++) {
        const ang = Math.random() * Math.PI * 2;
        // orbital radius: clustered band around center, a few far out
        const rBand = Math.pow(Math.random(), 0.7);
        const radius = minDim * (0.10 + rBand * 0.42);
        parts.push({
          ang,
          radius,
          speed: (Math.random() * 0.10 + 0.03) * (Math.random() < 0.5 ? 1 : -1) * 0.004 * 60,
          // start scattered anywhere on screen
          sx: Math.random() * W,
          sy: Math.random() * H,
          size: CONFIG.dotMin + Math.random() * (CONFIG.dotMax - CONFIG.dotMin),
          nA: Math.random() * Math.PI * 2,
          nSpeed: Math.random() * 0.6 + 0.2,
          nAmp: Math.random() * 14 + 4,
          x: 0, y: 0,
        });
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cvs.clientWidth; H = cvs.clientHeight;
      CX = W / 2; CY = H * 0.46;
      cvs.width = W * dpr; cvs.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(cvs);
    resize();
    startRef.current = performance.now();

    const frame = (now) => {
      const elapsed = now - startRef.current;
      const intro = reduce ? 1 : easeOutCubic(Math.min(1, elapsed / CONFIG.introMs));
      const t = now * 0.001;
      ctx.clearRect(0, 0, W, H);

      // compute live positions
      for (const p of parts) {
        if (!reduce) { p.ang += p.speed * 0.016; p.nA += p.nSpeed * 0.016; }
        const ox = Math.cos(p.ang) * p.radius + Math.cos(p.nA) * p.nAmp;
        const oy = Math.sin(p.ang) * p.radius * 0.82 + Math.sin(p.nA * 1.3) * p.nAmp;
        const tx = CX + ox, ty = CY + oy;
        // ease from scattered start → orbital target
        p.x = p.sx + (tx - p.sx) * intro;
        p.y = p.sy + (ty - p.sy) * intro;
      }

      // links
      ctx.lineWidth = 1;
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i], b = parts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < CONFIG.linkDist * CONFIG.linkDist) {
            const al = (1 - Math.sqrt(d2) / CONFIG.linkDist) * CONFIG.linkAlpha * intro;
            ctx.strokeStyle = "rgba(" + CONFIG.color + "," + al.toFixed(3) + ")";
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      // dots
      for (const p of parts) {
        const tw = reduce ? 1 : 0.65 + 0.35 * Math.sin(t * 1.4 + p.nA);
        ctx.fillStyle = "rgba(" + CONFIG.color + "," + (0.55 * intro * tw).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }

      if (!reduce) rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);

  return <canvas ref={cvsRef} className="ph-canvas" />;
}
