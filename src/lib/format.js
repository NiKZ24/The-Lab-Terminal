const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function fmtPx(v) {
  if (v == null || !isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a >= 100000) return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (a >= 1000) return v.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (a >= 100) return v.toFixed(2);
  if (a >= 10) return v.toFixed(3);
  if (a >= 1) return v.toFixed(4);
  if (a >= 0.01) return v.toFixed(5);
  if (a === 0) return "0";
  return v.toPrecision(4).replace(/\.?0+$/, "").replace(/\.?0+e/, "e");
}

function fmtUsd(v, opts = {}) {
  if (v == null || !isFinite(v)) return "—";
  const sign = v < 0 ? "-" : opts.plus && v > 0 ? "+" : "";
  const a = Math.abs(v);
  let s;
  if (a >= 1e9) s = (a / 1e9).toFixed(2) + "B";
  else if (a >= 1e6) s = (a / 1e6).toFixed(2) + "M";
  else if (a >= 1e3) s = (a / 1e3).toFixed(1) + "K";
  else s = a.toFixed(a >= 1 ? 2 : 4);
  return sign + "$" + s;
}

function fmtPct(v, dp = 2) {
  if (v == null || !isFinite(v)) return "—";
  return (v > 0 ? "+" : "") + v.toFixed(dp) + "%";
}

function ago(ts, now) {
  if (!ts) return "—";
  const s = Math.max(0, Math.floor(((now || Date.now()) - ts) / 1000));
  if (s < 5) return "now";
  if (s < 60) return s + "s";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  return Math.floor(s / 86400) + "d";
}

const shortAddr = (a) => (a ? a.slice(0, 6) + "…" + a.slice(-4) : "");

const pctClass = (v) => (v > 0 ? "up" : v < 0 ? "dn" : "dim2");

/* ── headline sentiment (heuristic keyword scorer, clearly labeled in UI) ── */

let _actx = null;

function beep() {
  try {
    _actx = _actx || new (window.AudioContext || window.webkitAudioContext)();
    if (_actx.state === "suspended") _actx.resume();
    const t = _actx.currentTime;
    [[880, 0], [1318.5, 0.12]].forEach(([f, off]) => {
      const o = _actx.createOscillator(), g = _actx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + off);
      g.gain.exponentialRampToValueAtTime(0.16, t + off + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + off + 0.18);
      o.connect(g).connect(_actx.destination);
      o.start(t + off); o.stop(t + off + 0.22);
    });
  } catch (e) { /* audio unavailable */ }
}

/* ════════════════════════════ GENERIC HOOKS ════════════════════════════ */

function oiLookback(oiHist, coin, minutes) {
  const snaps = oiHist.current;
  if (!snaps.length) return null;
  const cut = Date.now() - minutes * 60e3;
  for (let i = snaps.length - 1; i >= 0; i--) {
    if (snaps[i][0] <= cut) return snaps[i][1][coin] || null;
  }
  return null;
}

export { _actx, ago, beep, clamp, fmtPct, fmtPx, fmtUsd, oiLookback, pctClass, shortAddr, uid };
