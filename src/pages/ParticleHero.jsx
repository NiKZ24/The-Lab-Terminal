import React, { useEffect, useRef } from "react";

/*
 * FlaskWireframe — interactive 3D point-cloud of the flask logo for the landing.
 *  - Points trace the flask silhouette (neck + conical Erlenmeyer body + base),
 *    given depth around a cylinder of revolution so it reads as a 3D solid.
 *  - Hand-rolled 3D projection on a 2D canvas (no Three.js dependency).
 *  - Continuous idle spin + tilts toward the mouse pointer.
 *  - Adjacent ring points linked with faint lines for the wireframe/lab look.
 *  Modular: tweak CONFIG to restyle; flask geometry lives in buildFlask().
 */

const CONFIG = {
  color: "238,241,247",
  linkDist: 34,
  linkAlpha: 0.18,
  introMs: 1500,
  autoSpin: 0.0024,
};

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function buildFlask() {
  const pts = [];
  const RING = (yy, r, n, jitter) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.15;
      const rr = r + (jitter ? (Math.random() - 0.5) * jitter : 0);
      pts.push([Math.cos(a) * rr, yy, Math.sin(a) * rr]);
    }
  };
  // neck
  const neckTop = 1.0, neckBot = 0.42, neckR = 0.17;
  for (let s = 0; s <= 9; s++) { const t = s / 9; RING(neckTop - t * (neckTop - neckBot), neckR, 14, 0.01); }
  RING(neckTop, neckR * 1.25, 18, 0.005);
  // conical body
  const bodyTop = 0.42, bodyBot = -0.92, rTop = neckR, rBot = 0.74, rows = 22;
  for (let s = 0; s <= rows; s++) {
    const t = s / rows, e = Math.pow(t, 1.18);
    const y = bodyTop - t * (bodyTop - bodyBot), r = rTop + e * (rBot - rTop);
    RING(y, r, Math.round(16 + e * 40), 0.012);
  }
  // base disk
  const baseY = -0.92, baseR = 0.74;
  for (let ring = 0; ring < 5; ring++) { const r = baseR * (ring / 5); RING(baseY, r, Math.max(6, Math.round(r * 40)), 0.01); }
  RING(baseY, baseR, 46, 0.005);
  // liquid surface ring
  RING(-0.45, 0.45, 30, 0.01);
  return pts;
}

export default function FlaskWireframe() {
  const cvsRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef({ rotY: 0, rotX: 0.12, tgtX: 0.12, tgtY: 0, rotYPtr: 0, start: 0 });

  useEffect(() => {
    const cvs = cvsRef.current; if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, CX = 0, CY = 0, dpr = 1, scale = 200;
    const base = buildFlask();
    const scatter = base.map(() => [(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6]);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cvs.clientWidth; H = cvs.clientHeight; CX = W / 2; CY = H * 0.46;
      scale = Math.min(W, H) * 0.30;
      cvs.width = W * dpr; cvs.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize); ro.observe(cvs); resize();

    const onMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      stateRef.current.tgtY = nx * 0.6;
      stateRef.current.tgtX = 0.12 + ny * 0.4;
    };
    window.addEventListener("mousemove", onMove);
    stateRef.current.start = performance.now();

    const frame = (now) => {
      const st = stateRef.current;
      const intro = reduce ? 1 : easeOutCubic(Math.min(1, (now - st.start) / CONFIG.introMs));
      if (!reduce) {
        st.rotY += CONFIG.autoSpin;
        st.rotX += (st.tgtX - st.rotX) * 0.05;
        st.rotYPtr += (st.tgtY - st.rotYPtr) * 0.05;
      }
      const ry = st.rotY + st.rotYPtr, rx = st.rotX;
      const cosY = Math.cos(ry), sinY = Math.sin(ry), cosX = Math.cos(rx), sinX = Math.sin(rx);
      ctx.clearRect(0, 0, W, H);

      const proj = new Array(base.length);
      for (let i = 0; i < base.length; i++) {
        const b = base[i], s = scatter[i];
        const x = s[0] + (b[0] - s[0]) * intro, y = s[1] + (b[1] - s[1]) * intro, z = s[2] + (b[2] - s[2]) * intro;
        const x1 = x * cosY - z * sinY, z1 = x * sinY + z * cosY;
        const y1 = y * cosX - z1 * sinX, z2 = y * sinX + z1 * cosX;
        const persp = 1 / (1 + z2 * 0.28);
        proj[i] = { sx: CX + x1 * scale * persp, sy: CY - y1 * scale * persp, d: z2, p: persp };
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < proj.length; i++) {
        const a = proj[i];
        for (let j = i + 1; j < Math.min(i + 6, proj.length); j++) {
          const c = proj[j];
          const dx = a.sx - c.sx, dy = a.sy - c.sy, dd = dx * dx + dy * dy;
          if (dd < CONFIG.linkDist * CONFIG.linkDist) {
            const depth = (a.d + c.d) / 2;
            const al = (1 - Math.sqrt(dd) / CONFIG.linkDist) * CONFIG.linkAlpha * intro * (depth > 0 ? 0.5 : 1);
            ctx.strokeStyle = "rgba(" + CONFIG.color + "," + al.toFixed(3) + ")";
            ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(c.sx, c.sy); ctx.stroke();
          }
        }
      }
      for (let i = 0; i < proj.length; i++) {
        const a = proj[i], front = a.d < 0;
        const r = (front ? 1.7 : 1.0) * a.p, al = (front ? 0.85 : 0.4) * intro;
        ctx.fillStyle = "rgba(" + CONFIG.color + "," + al.toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(a.sx, a.sy, Math.max(0.5, r), 0, Math.PI * 2); ctx.fill();
      }

      if (!reduce) rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); window.removeEventListener("mousemove", onMove); };
  }, []);

  return <canvas ref={cvsRef} className="ph-canvas" />;
}
