import React, { useState, useEffect, useRef, useMemo } from "react";
import { AlertTriangle, RefreshCw, Search, X } from "lucide-react";
import { useNow } from "../hooks/timing";
import { clamp, fmtPct, fmtPx, pctClass } from "../lib/format";

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  componentDidUpdate(prev) {
    if (this.state.err && prev.resetKey !== this.props.resetKey) this.setState({ err: null });
  }
  render() {
    if (this.state.err) return (
      <div className="err-box">
        <AlertTriangle size={18} />
        <div>{this.props.label ? this.props.label + " hit a rendering error." : "This panel hit a rendering error."}</div>
        <button className="btn" onClick={() => this.setState({ err: null })}><RefreshCw size={11} /> Retry</button>
      </div>
    );
    return this.props.children;
  }
}

function Panel({ title, icon: I, right, source, status, age, children, className = "", bodyClass = "", style }) {
  return (
    <div className={"panel " + className} style={style}>
      <div className="panel-h">
        {I ? <I size={13} className="ph-ic" /> : null}
        <span className="ph-t">{title}</span>
        <div className="ph-r">
          {right}
          {source ? <span className="src-tag">{source}</span> : null}
          {status ? <span className={"live" + (status === "live" ? "" : " " + status)}>{age || (status === "live" ? "LIVE" : status === "down" ? "DOWN" : "…")}</span> : null}
        </div>
      </div>
      <div className={"panel-b " + bodyClass}><ErrorBoundary>{children}</ErrorBoundary></div>
    </div>
  );
}

function SkeletonRows({ n = 6 }) {
  return <div>{Array.from({ length: n }).map((_, i) => <div key={i} className="skel skel-row" style={{ width: (88 - (i % 3) * 14) + "%" }} />)}</div>;
}

function ErrState({ msg, onRetry }) {
  return (
    <div className="err-box">
      <AlertTriangle size={17} className="accc" />
      <div>Feed unavailable{msg ? " — " + msg : ""}</div>
      {onRetry ? <button className="btn" onClick={onRetry}><RefreshCw size={11} /> Retry</button> : null}
    </div>
  );
}

function EmptyState({ icon: I, title, sub, children }) {
  return (
    <div className="empty">
      <div className="e-ic">{I ? <I size={17} /> : null}</div>
      <div className="e-t">{title}</div>
      <div className="e-s">{sub}</div>
      {children}
    </div>
  );
}

const Num = React.memo(function Num({ v, fmt = fmtPx, className = "" }) {
  const prev = useRef(v);
  const [fl, setFl] = useState(0);
  useEffect(() => {
    if (v !== prev.current && prev.current != null && v != null) {
      setFl(v > prev.current ? 1 : -1);
      const t = setTimeout(() => setFl(0), 720);
      prev.current = v;
      return () => clearTimeout(t);
    }
    prev.current = v;
  }, [v]);
  return <span className={"num " + (fl === 1 ? "fl-up " : fl === -1 ? "fl-dn " : "") + className}>{fmt(v)}</span>;
});

const Pct = ({ v, dp = 2 }) => <span className={"num " + pctClass(v)}>{fmtPct(v, dp)}</span>;

function Spark({ hist, coin, w = 78, h = 22 }) {
  const a = hist.current.get(coin);
  if (!a || a.length < 3) return <span className="dim2 mono" style={{ fontSize: 9 }}>···</span>;
  const pts = a.slice(-90);
  let mn = Infinity, mx = -Infinity;
  for (const p of pts) { if (p[1] < mn) mn = p[1]; if (p[1] > mx) mx = p[1]; }
  const rng = mx - mn || 1;
  const d = pts.map((p, i) => (i === 0 ? "M" : "L") + (i / (pts.length - 1) * w).toFixed(1) + "," + (h - 2 - ((p[1] - mn) / rng) * (h - 4)).toFixed(1)).join("");
  const up = pts[pts.length - 1][1] >= pts[0][1];
  return (
    <svg className="spark" width={w} height={h} viewBox={"0 0 " + w + " " + h}>
      <path d={d} fill="none" stroke={up ? "#16c98a" : "#fb3e57"} strokeWidth="1.3" opacity="0.9" />
    </svg>
  );
}

const Toggle = ({ on, onChange }) => <button className={"tgl" + (on ? " on" : "")} onClick={() => onChange(!on)} aria-label="toggle" />;

function Clocks() {
  const now = useNow(1000);
  const d = new Date(now);
  const p2 = (n) => String(n).padStart(2, "0");
  return (
    <div className="clockbox">
      <span className="clock-utc">{p2(d.getUTCHours())}:{p2(d.getUTCMinutes())}:{p2(d.getUTCSeconds())} UTC</span>
      <span className="clock-loc">{d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} LOCAL</span>
    </div>
  );
}

function GaugeArc({ value, min = 0, max = 100, label, sub, color }) {
  const pct = clamp((value - min) / (max - min || 1), 0, 1);
  const ang = Math.PI * (1 - pct);
  const R = 56, CX = 70, CY = 66;
  const x = CX + R * Math.cos(ang), y = CY - R * Math.sin(ang);
  const col = color || (pct < 0.25 ? "#fb3e57" : pct < 0.45 ? "#9aa3b8" : pct < 0.55 ? "#9aa3b8" : pct < 0.75 ? "#8bd44a" : "#16c98a");
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <svg width="140" height="78" viewBox="0 0 140 78">
        <path d="M 14 66 A 56 56 0 0 1 126 66" fill="none" stroke="#1b2130" strokeWidth="9" strokeLinecap="round" />
        <path d={"M 14 66 A 56 56 0 0 1 " + x.toFixed(1) + " " + y.toFixed(1)} fill="none" stroke={col} strokeWidth="9" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 5px " + col + "66)", transition: "all .5s ease" }} />
        <text x="70" y="58" textAnchor="middle" fill="#e8ebf2" fontFamily="JetBrains Mono, monospace" fontSize="21" fontWeight="700">{Math.round(value)}</text>
      </svg>
      <div className="mono" style={{ fontSize: 11, color: col, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>{label}</div>
      {sub ? <div className="mono dim2" style={{ fontSize: 9 }}>{sub}</div> : null}
    </div>
  );
}

function Toasts({ list, onClose }) {
  return (
    <div className="toasts">
      {list.map((t) => (
        <div key={t.id} className={"toast " + t.sev} onClick={() => onClose(t.id)}>
          <div style={{ minWidth: 0 }}>
            <div className="toast-t">{t.sev === "crit" ? "critical alert" : t.sev === "warn" ? "alert" : "notice"}</div>
            <div className="toast-m">{t.msg}</div>
          </div>
          <X size={13} className="toast-x" />
        </div>
      ))}
    </div>
  );
}

function Slideover({ open, onClose, title, icon: I, children }) {
  if (!open) return null;
  return (
    <>
      <div className="sl-bg" onClick={onClose} />
      <div className="slideover">
        <div className="sl-h">
          {I ? <I size={14} className="ph-ic" /> : null}
          <span className="ph-t">{title}</span>
          <button className="icon-btn" style={{ marginLeft: "auto", width: 26, height: 26 }} onClick={onClose}><X size={13} /></button>
        </div>
        <div className="sl-b">{children}</div>
      </div>
    </>
  );
}

/* ════════════════════════════ CHARTING: NATIVE CANVAS (Hyperliquid candles) ════════════════════════════ */

function Stat({ label, v, sub, cls, err }) {
  return (
    <div className="stat-card">
      <div className="stat-l">{label}</div>
      <div className={"stat-v " + (cls || "")}>
        {err ? <span className="dim2" style={{ fontSize: 12 }}>unavailable</span>
          : v == null ? <span className="skel" style={{ display: "inline-block", width: 56, height: 15 }} /> : v}
      </div>
      <div className="stat-s">{sub}</div>
    </div>
  );
}

function CommandPalette({ open, onClose, markets, tabs, setTab, setSelSym }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inRef = useRef(null);
  useEffect(() => { if (open) { setQ(""); setSel(0); setTimeout(() => inRef.current && inRef.current.focus(), 30); } }, [open]);

  const items = useMemo(() => {
    const tabItems = tabs.map((t) => ({ kind: "tab", id: t.id, label: t.label, hint: "Go to" }));
    const coins = markets.data ? Object.values(markets.data.byCoin) : [];
    const symItems = coins.map((c) => ({ kind: "sym", id: c.coin, label: c.coin, px: c.mark, chg: c.chg }));
    const ql = q.trim().toLowerCase();
    let pool = [...tabItems, ...symItems];
    if (ql) pool = pool.filter((it) => it.label.toLowerCase().includes(ql));
    pool.sort((x, y) => (x.kind === y.kind ? 0 : x.kind === "tab" ? -1 : 1));
    return pool.slice(0, 40);
  }, [q, markets.data, tabs]);

  useEffect(() => { setSel(0); }, [q]);
  if (!open) return null;

  const run = (it) => {
    if (!it) return;
    if (it.kind === "tab") setTab(it.id);
    else { setSelSym(it.id); }
    onClose();
  };
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(items.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); run(items[sel]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  return (
    <div className="cmdk-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmdk">
        <div className="cmdk-head">
          <Search size={15} style={{ color: "var(--txt3)" }} />
          <input ref={inRef} className="cmdk-input" placeholder="Search symbols or jump to a module…" value={q}
            onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} />
        </div>
        <div className="cmdk-list">
          {items.length === 0 ? <div className="cmdk-empty">No matches for "{q}"</div> :
            items.map((it, i) => (
              <div key={it.kind + it.id} className={"cmdk-item" + (i === sel ? " on" : "")}
                onMouseEnter={() => setSel(i)} onMouseDown={(e) => { e.preventDefault(); run(it); }}>
                <span className="cmdk-tag">{it.kind === "tab" ? "GO" : "SYM"}</span>
                <span className="cmdk-lab">{it.label}</span>
                {it.kind === "sym" ? <span className="cmdk-px"><Num v={it.px} /> <Pct v={it.chg} /></span> : <span className="cmdk-px dim2" style={{ fontSize: 10 }}>{it.hint}</span>}
              </div>
            ))}
        </div>
        <div className="cmdk-foot">
          <span><span className="kbd">↑↓</span>navigate</span>
          <span><span className="kbd">↵</span>open</span>
          <span><span className="kbd">esc</span>close</span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════ ORDERBOOK PANEL ════════════════════════════ */

function Ticker({ markets, watchlist }) {
  const d = markets.data;
  const items = watchlist.map((w) => d && d.byCoin[w]).filter(Boolean);
  if (!items.length) {
    return (
      <div className="ticker">
        <span className="mono dim2" style={{ paddingLeft: 14, fontSize: 10 }}>
          {markets.err ? "feed unavailable — retrying…" : "connecting to feed…"}
        </span>
      </div>
    );
  }
  const seq = [...items, ...items];
  return (
    <div className="ticker">
      <div className="tk-inner">
        {seq.map((c, i) => (
          <span key={i} className="tk-item">
            <span className="tk-sym">{c.coin}</span>
            <Num v={c.mark} />
            <Pct v={c.chg} />
          </span>
        ))}
      </div>
    </div>
  );
}

export { Clocks, CommandPalette, EmptyState, ErrState, ErrorBoundary, GaugeArc, Num, Panel, Pct, SkeletonRows, Slideover, Spark, Stat, Ticker, Toasts, Toggle };
