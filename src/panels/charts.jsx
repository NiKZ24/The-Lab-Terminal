import React, { useState, useEffect, useRef, useMemo } from "react";
import { AlertTriangle, Search } from "lucide-react";
import { ErrState, Num, Pct } from "../components/index";
import { useCandles } from "../hooks/data";
import { INTERVALS, TV_MAP } from "../lib/constants";
import { clamp, fmtPct, fmtPx, fmtUsd, pctClass } from "../lib/format";
import { HL } from "../lib/hl";

function NativeChart({ candles, loading, err, onRetry }) {
  const wrapRef = useRef(null), cvsRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver((es) => {
      const r = es[0].contentRect;
      setSize({ w: Math.floor(r.width), h: Math.floor(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    const AXR = 66, AXB = 20;
    const pw = Math.max(20, size.w - AXR), ph = Math.max(20, size.h - AXB);
    const priceH = Math.floor(ph * 0.76), volH = ph - Math.floor(ph * 0.76) - 8;
    return { AXR, AXB, pw, ph, priceH, volH };
  }, [size]);

  useEffect(() => {
    const cvs = cvsRef.current; if (!cvs || !size.w || !size.h) return;
    const dpr = window.devicePixelRatio || 1;
    cvs.width = size.w * dpr; cvs.height = size.h * dpr;
    cvs.style.width = size.w + "px"; cvs.style.height = size.h + "px";
    const ctx = cvs.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);
    if (!candles || candles.length < 2) return;
    const { pw, priceH, volH } = geo;
    const n = candles.length;
    let lo = Infinity, hi = -Infinity, vmax = 0;
    for (const c of candles) { if (c.l < lo) lo = c.l; if (c.h > hi) hi = c.h; if (c.v > vmax) vmax = c.v; }
    const padP = (hi - lo) * 0.05 || hi * 0.01; lo -= padP; hi += padP;
    const colW = pw / n;
    const xAt = (i) => (i + 0.5) * colW;
    const yAt = (p) => priceH - ((p - lo) / (hi - lo)) * priceH;
    const cw = Math.max(1, Math.min(11, colW * 0.66));
    const UP = "#16c98a", DN = "#fb3e57";

    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    for (let g = 0; g <= 5; g++) {
      const p = lo + ((hi - lo) * g) / 5;
      const y = Math.round(yAt(p)) + 0.5;
      ctx.strokeStyle = "#141a28";
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(pw, y); ctx.stroke();
      ctx.fillStyle = "#5b6478";
      ctx.fillText(fmtPx(p), pw + 7, y);
    }
    const span = candles[1].t - candles[0].t;
    const ftm = (t) => {
      const dd = new Date(t);
      if (span >= 864e5) return dd.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (span >= 144e5) return dd.toLocaleDateString("en-US", { day: "numeric", month: "short" }) + " " + String(dd.getHours()).padStart(2, "0") + "h";
      return String(dd.getHours()).padStart(2, "0") + ":" + String(dd.getMinutes()).padStart(2, "0");
    };
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    const vBase = priceH + 8 + volH;
    const step = Math.max(1, Math.floor(n / 6));
    for (let i = Math.floor(step / 2); i < n; i += step) {
      const x = Math.round(xAt(i)) + 0.5;
      ctx.strokeStyle = "#10151f";
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, vBase); ctx.stroke();
      ctx.fillStyle = "#5b6478";
      ctx.fillText(ftm(candles[i].t), xAt(i), vBase + 4);
    }
    for (let i = 0; i < n; i++) {
      const c = candles[i];
      const h = vmax ? (c.v / vmax) * volH : 0;
      ctx.fillStyle = (c.c >= c.o ? UP : DN) + "55";
      ctx.fillRect(xAt(i) - cw / 2, vBase - h, cw, h);
    }
    for (let i = 0; i < n; i++) {
      const c = candles[i];
      const up = c.c >= c.o, col = up ? UP : DN, x = xAt(i);
      ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, yAt(c.h)); ctx.lineTo(x, yAt(c.l)); ctx.stroke();
      const y1 = yAt(Math.max(c.o, c.c)), y2 = yAt(Math.min(c.o, c.c));
      ctx.fillStyle = col;
      ctx.fillRect(x - cw / 2, y1, cw, Math.max(1, y2 - y1));
    }
    const last = candles[n - 1];
    const ly = yAt(last.c), lcol = last.c >= last.o ? UP : DN;
    ctx.setLineDash([4, 4]); ctx.strokeStyle = lcol + "99";
    ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(pw, ly); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = lcol;
    ctx.fillRect(pw + 2, ly - 8, 62, 16);
    ctx.fillStyle = "#06070a"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(fmtPx(last.c), pw + 7, ly + 1);
    if (hover && hover.idx >= 0 && hover.idx < n) {
      const hx = Math.round(xAt(hover.idx)) + 0.5;
      ctx.strokeStyle = "#3a4768"; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(hx, 0); ctx.lineTo(hx, vBase); ctx.stroke();
      if (hover.y < priceH) {
        const hy = Math.round(hover.y) + 0.5;
        ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(pw, hy); ctx.stroke();
        ctx.setLineDash([]);
        const pv = lo + (1 - hover.y / priceH) * (hi - lo);
        ctx.fillStyle = "#27304a";
        ctx.fillRect(pw + 2, hover.y - 8, 62, 16);
        ctx.fillStyle = "#e8ebf2";
        ctx.fillText(fmtPx(pv), pw + 7, hover.y + 1);
      }
      ctx.setLineDash([]);
    }
  }, [candles, size, geo, hover]);

  const onMove = (e) => {
    const cvs = cvsRef.current; if (!cvs || !candles || !candles.length) return;
    const r = cvs.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (x > geo.pw) { setHover(null); return; }
    const idx = clamp(Math.floor(x / (geo.pw / candles.length)), 0, candles.length - 1);
    setHover({ x, y, idx });
  };
  const hc = hover && candles ? candles[hover.idx] : null;

  return (
    <div ref={wrapRef} className="native-wrap" onMouseLeave={() => setHover(null)}>
      <canvas ref={cvsRef} onMouseMove={onMove} />
      {hc ? (
        <div className="ohlc-chip">
          <span className="dim2">{new Date(hc.t).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          <span>O <b className={hc.c >= hc.o ? "up" : "dn"}>{fmtPx(hc.o)}</b></span>
          <span>H <b>{fmtPx(hc.h)}</b></span>
          <span>L <b>{fmtPx(hc.l)}</b></span>
          <span>C <b className={hc.c >= hc.o ? "up" : "dn"}>{fmtPx(hc.c)}</b></span>
          <span className="dim2">Δ {fmtPct(((hc.c - hc.o) / hc.o) * 100)}</span>
        </div>
      ) : null}
      {loading && (!candles || !candles.length) ? <div className="skel" style={{ position: "absolute", inset: 14 }} /> : null}
      {err && (!candles || !candles.length) && !loading ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ErrState msg={err} onRetry={onRetry} />
        </div>
      ) : null}
    </div>
  );
}

/* ════════════════════════════ CHARTING: TRADINGVIEW EMBED (free widget, auto-fallback) ════════════════════════════ */

function TVChart({ symbol, onFail }) {
  const ref = useRef(null);
  useEffect(() => {
    let dead = false;
    const el = ref.current; if (!el) return;
    el.innerHTML = "";
    const holder = document.createElement("div");
    holder.className = "tradingview-widget-container";
    holder.style.height = "100%";
    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    inner.style.height = "100%";
    holder.appendChild(inner);
    const s = document.createElement("script");
    s.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    s.async = true;
    s.innerHTML = JSON.stringify({
      autosize: true, symbol, interval: "60", timezone: "Etc/UTC", theme: "dark", style: "1", locale: "en",
      backgroundColor: "#0a0c12", gridColor: "rgba(27,33,48,0.6)", allow_symbol_change: true,
      support_host: "https://www.tradingview.com",
    });
    s.onerror = () => { if (!dead) onFail("script blocked"); };
    holder.appendChild(s);
    el.appendChild(holder);
    const t = setTimeout(() => { if (!dead && !el.querySelector("iframe")) onFail("embed timeout"); }, 6000);
    return () => { dead = true; clearTimeout(t); el.innerHTML = ""; };
  }, [symbol]); // eslint-disable-line
  return <div ref={ref} className="tv-wrap" />;
}

/* ════════════════════════════ TAB: CHARTING ════════════════════════════ */

function ChartTab({ markets, selSym, setSelSym, watchlist, settings, setSettings }) {
  const interval = settings.interval || "1h";
  const mode = settings.chartMode || "tv";
  const [tvFailed, setTvFailed] = useState(false);
  const candles = useCandles(selSym, interval);
  const c = markets.data ? markets.data.byCoin[selSym] : null;
  const [symIn, setSymIn] = useState("");
  const useNative = mode === "native" || tvFailed;
  const tvSym = TV_MAP[selSym] || "BINANCE:" + selSym + "USDT";

  const pick = () => {
    const s = symIn.trim().toUpperCase();
    const u = markets.data ? markets.data.universe : [];
    const hit = u.find((x) => x.toUpperCase() === s);
    if (hit) { setSelSym(hit); setSymIn(""); }
  };

  return (
    <div className="grid">
      <div className="g12">
        <div className="panel">
          <div className="kpi-row">
            <div className="kpi" style={{ minWidth: 158 }}>
              <div className="kpi-l">{selSym}-USD · PERP</div>
              <div className="kpi-v"><Num v={c ? c.mark : null} /></div>
            </div>
            <div className="kpi"><div className="kpi-l">24h Change</div><div className="kpi-v">{c ? <Pct v={c.chg} /> : "—"}</div></div>
            <div className="kpi"><div className="kpi-l">Funding APR</div><div className="kpi-v">{c ? <span className={pctClass(c.apr)}>{fmtPct(c.apr, 1)}</span> : "—"}</div></div>
            <div className="kpi"><div className="kpi-l">Open Interest</div><div className="kpi-v">{c ? <Num v={c.oi} fmt={fmtUsd} /> : "—"}</div></div>
            <div className="kpi"><div className="kpi-l">24h Volume</div><div className="kpi-v">{c ? <Num v={c.vol} fmt={fmtUsd} /> : "—"}</div></div>
            <div className="kpi"><div className="kpi-l">Max Lev</div><div className="kpi-v dimtxt">{c ? c.maxLev + "×" : "—"}</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
            <div className="in-row">
              <Search size={12} className="dim2" />
              <input className="input" style={{ width: 112 }} list="hl-universe" placeholder="Symbol…" value={symIn}
                onChange={(e) => setSymIn(e.target.value)} onKeyDown={(e) => e.key === "Enter" && pick()} />
            </div>
            <div className="pills">
              {watchlist.map((w) => (
                <button key={w} className={"pill" + (w === selSym ? " on" : "")} onClick={() => setSelSym(w)}>{w}</button>
              ))}
            </div>
            <div className="in-row" style={{ marginLeft: "auto" }}>
              <div className="seg" title="Interval applies to the native chart">
                {Object.keys(INTERVALS).map((iv) => (
                  <button key={iv} className={"seg-btn" + (iv === interval ? " on" : "")} onClick={() => setSettings((s) => ({ ...s, interval: iv }))}>{iv}</button>
                ))}
              </div>
              <div className="seg">
                <button className={"seg-btn" + (!useNative ? " on" : "")} onClick={() => { setTvFailed(false); setSettings((s) => ({ ...s, chartMode: "tv" })); }}>TRADINGVIEW</button>
                <button className={"seg-btn" + (useNative ? " on" : "")} onClick={() => setSettings((s) => ({ ...s, chartMode: "native" }))}>NATIVE · HL</button>
              </div>
            </div>
          </div>
          <div className="chart-box">
            {useNative
              ? <NativeChart candles={candles.data} loading={candles.loading} err={candles.err} onRetry={candles.reload} />
              : <TVChart key={tvSym} symbol={tvSym} onFail={() => setTvFailed(true)} />}
            {tvFailed && mode !== "native" ? (
              <div className="cb-notice">
                <AlertTriangle size={12} />
                TradingView embed couldn't load in this environment — showing the native Hyperliquid chart instead.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════ TAB: OVERVIEW ════════════════════════════ */

export { ChartTab, NativeChart, TVChart };
