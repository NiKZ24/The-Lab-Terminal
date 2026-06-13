import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Bell, ChevronDown, Eye, KeyRound, Layers, LineChart, LogOut, Newspaper, Search, User, Volume2, VolumeX, Zap } from "lucide-react";
import { useAuth } from "./auth/AuthProvider";
import { usePref } from "./auth/prefs";
import { LogoMark } from "./brand/Logo";
import { Clocks, CommandPalette, ErrorBoundary, Num, Pct, Slideover, Ticker, Toasts } from "./components/index";
import { useFng, useLeaderboard, useMacro, useMarkets, useNews, usePositioning, useSpot, useWhales } from "./hooks/data";
import { DEFAULT_RULES, DEFAULT_WATCH } from "./lib/constants";
import { beep, fmtPct, fmtPx, fmtUsd, oiLookback, shortAddr, uid } from "./lib/format";
import Admin from "./pages/Admin";
import { AlertsBody } from "./panels/alerts";
import { ChartTab } from "./panels/charts";
import { DerivTab } from "./panels/derivatives";
import { NewsTab } from "./panels/news";
import { OverviewTab } from "./panels/overview";
import { WalletProfile, WhaleTab } from "./panels/smartMoney";
import { CSS } from "./styles";

const TABS = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "charts", label: "Charting", icon: LineChart },
  { id: "whale", label: "Smart Money", icon: Eye },
  { id: "deriv", label: "Derivatives", icon: Zap },
  { id: "news", label: "News & Sentiment", icon: Newspaper },
];

function Sidebar({ tab, setTab, tabs, markets, news, macro }) {
  const macroOk = macro.dxy || macro.glob;
  const { user, profile, signOut } = useAuth();
  const [acct, setAcct] = useState(false);
  return (
    <div className="sidebar">
      <div className="brand">
        <div className="brand-dot"><LogoMark size={30} glow style={{ color: "#f4f6fb" }} /></div>
        <div>
          <div className="brand-name" style={{ fontSize: 13.5 }}>THE LAB TERMINAL</div>
          <div className="brand-sub">V1.0</div>
        </div>
      </div>
      <div className="nav">
        {tabs.map((t) => (
          <button key={t.id} className={"nav-item" + (tab === t.id ? " on" : "")} onClick={() => setTab(t.id)}>
            <t.icon size={15} className="nav-ic" /><span>{t.label}</span>
          </button>
        ))}
      </div>
      <div className="side-foot">
        <div className="src-row"><b>HYPERLIQUID</b><span style={{ display: "flex", alignItems: "center", gap: 6 }}>{markets.latency != null && !markets.err ? <span>{markets.latency}ms</span> : null}<span className={"dot " + (markets.err ? "err" : markets.data ? "ok" : "warn")} /></span></div>
        <div className="src-row"><b>NEWS WIRE</b><span className={"dot " + (news.err ? "err" : news.items ? "ok" : "warn")} /></div>
        <div className="src-row"><b>MACRO</b><span className={"dot " + (macro.dxyErr && macro.globErr ? "err" : macroOk ? "ok" : "warn")} /></div>
        <div style={{ position: "relative" }}>
          <button className="nav-item" style={{ width: "100%" }} onClick={() => setAcct((v) => !v)}>
            <User size={15} className="nav-ic" />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11 }}>{user ? user.email : "Account"}</span>
            <ChevronDown size={13} className="nav-ic" />
          </button>
          {acct ? (
            <div className="acct-pop" style={{ bottom: 42, top: "auto", right: 0, left: 0 }}>
              <div className="acct-row">
                <div className="acct-email">{user && user.email}</div>
                {profile && profile.is_admin ? <span className="acct-badge">ADMIN</span> : null}
              </div>
              <button className="acct-item" onClick={signOut}><LogOut size={13} /> Sign out</button>
            </div>
          ) : null}
        </div>
        <div className="side-tag">MONITORING ONLY · NO EXECUTION<br />FREE PUBLIC FEEDS · NO API KEYS</div>
      </div>
    </div>
  );
}

/* ════════════════════════════ APP ════════════════════════════ */

function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [watchlist, setWatchlist] = usePref("watchlist", DEFAULT_WATCH);
  const [wallets, setWallets] = usePref("wallets", []);
  const [rules, setRules, rulesReady] = usePref("rules", DEFAULT_RULES);
  const [log, setLog] = usePref("log", []);
  const [settings, setSettings] = usePref("settings", { sound: false, chartMode: "tv", interval: "1h" });
  const [selSym, setSelSym] = usePref("sym", "BTC");

  const markets = useMarkets();
  const addrList = useMemo(() => wallets.map((w) => w.addr), [wallets]);
  const whales = useWhales(addrList);
  const lb = useLeaderboard();
  const cohortAddrs = useMemo(() => {
    const top = lb.rows ? lb.rows.slice(0, 30).map((r) => r.addr) : [];
    const set = new Set([...top, ...addrList]);
    return Array.from(set);
  }, [lb.rows, addrList]);
  const pos = usePositioning(cohortAddrs, markets);
  const news = useNews();
  const fng = useFng();
  const macro = useMacro();
  const spot = useSpot(watchlist);

  const [toasts, setToasts] = useState([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [profileAddr, setProfileAddr] = useState(null);
  const cooldown = useRef(new Map());
  const soundRef = useRef(false);
  useEffect(() => { soundRef.current = !!settings.sound; }, [settings.sound]);

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap";
    document.head.appendChild(l);
    return () => { try { document.head.removeChild(l); } catch (e) { /* noop */ } };
  }, []);

  const dismissToast = useCallback((id) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);
  const fireAlert = useCallback((sev, msg) => {
    const e = { id: uid(), ts: Date.now(), sev, msg };
    setLog((l) => [e, ...l].slice(0, 200));
    setToasts((ts) => [...ts.slice(-3), e]);
    setUnread((u) => u + 1);
    if (soundRef.current) beep();
    setTimeout(() => dismissToast(e.id), 9000);
  }, [dismissToast, setLog]);

  /* market-driven rules: evaluated on every markets refresh */
  useEffect(() => {
    if (!markets.data || !rulesReady) return;
    const now = Date.now();
    const d = markets.data;
    const fireKeyed = (r, key, msg, sev) => {
      const k = r.id + ":" + key;
      if (now - (cooldown.current.get(k) || 0) < 5 * 60e3) return;
      cooldown.current.set(k, now);
      fireAlert(sev || "warn", msg);
      if (r.once) setRules((rs) => rs.map((x) => x.id === r.id ? { ...x, enabled: false } : x));
    };
    rules.filter((r) => r.enabled).forEach((r) => {
      if (r.type === "price_above" || r.type === "price_below") {
        const c = d.byCoin[r.coin]; if (!c) return;
        const hit = r.type === "price_above" ? c.mark >= r.value : c.mark <= r.value;
        if (hit) fireKeyed(r, r.coin, r.coin + " " + (r.type === "price_above" ? "≥" : "≤") + " " + fmtPx(r.value) + " — last " + fmtPx(c.mark));
      } else if (r.type === "pct_move") {
        const c = d.byCoin[r.coin];
        const h = markets.hist.current.get(r.coin);
        if (!c || !h || h.length < 2) return;
        const cut = now - r.windowMin * 60e3;
        let base = null;
        for (let i = h.length - 1; i >= 0; i--) { if (h[i][0] <= cut) { base = h[i][1]; break; } }
        if (base == null) {
          if (h[0][0] > cut + r.windowMin * 60e3 * 0.25) return; // not enough history yet
          base = h[0][1];
        }
        const mv = ((c.mark - base) / base) * 100;
        if (Math.abs(mv) >= r.value) fireKeyed(r, r.coin, r.coin + " " + fmtPct(mv) + " in " + r.windowMin + "m (" + fmtPx(base) + " → " + fmtPx(c.mark) + ")", Math.abs(mv) >= r.value * 1.6 ? "crit" : "warn");
      } else if (r.type === "funding_apr") {
        const list = r.coin && r.coin !== "ANY" ? [d.byCoin[r.coin]].filter(Boolean) : d.rows;
        list.forEach((c) => {
          if (Math.abs(c.apr) >= r.value) fireKeyed(r, c.coin, c.coin + " funding " + fmtPct(c.apr, 1) + " APR (" + (c.funding * 100).toFixed(4) + "%/h)");
        });
      } else if (r.type === "oi_change") {
        const c = d.byCoin[r.coin]; if (!c) return;
        const base = oiLookback(markets.oiHist, r.coin, r.windowMin);
        if (!base) return;
        const mv = ((c.oi - base) / base) * 100;
        if (Math.abs(mv) >= r.value) fireKeyed(r, r.coin, r.coin + " OI " + fmtPct(mv, 1) + " in " + r.windowMin + "m (" + fmtUsd(base) + " → " + fmtUsd(c.oi) + ")");
      }
    });
  }, [markets.tick, rulesReady]); // eslint-disable-line

  /* whale-driven rules: new/flipped positions from tracked wallets */
  useEffect(() => {
    const evs = whales.takeEvents();
    if (!evs.length) return;
    const wr = rules.filter((r) => r.enabled && r.type === "whale_open");
    const now = Date.now();
    evs.forEach((ev) => {
      if (ev.type === "close") return;
      const w = wallets.find((x) => x.addr === ev.addr);
      const name = (w && w.label) || shortAddr(ev.addr);
      wr.forEach((r) => {
        if (ev.notional >= r.value) {
          const k = r.id + ":" + ev.addr + ":" + ev.coin;
          if (now - (cooldown.current.get(k) || 0) < 60e3) return;
          cooldown.current.set(k, now);
          fireAlert("crit", "Whale " + name + " " + (ev.type === "flip" ? "flipped to" : "opened") + " " + ev.side + " " + ev.coin + " · " + fmtUsd(ev.notional));
          if (r.once) setRules((rs) => rs.map((x) => x.id === r.id ? { ...x, enabled: false } : x));
        }
      });
    });
  }, [whales.tick]); // eslint-disable-line

  const { profile } = useAuth();
  const tabs = useMemo(() => profile && profile.is_admin ? [...TABS, { id: "admin", label: "Admin", icon: KeyRound }] : TABS, [profile]);
  const curTab = tabs.find((t) => t.id === tab);
  const hdrC = markets.data ? markets.data.byCoin[selSym] : null;
  const tabsRef = useRef(tabs); tabsRef.current = tabs;
  const cmdOpenRef = useRef(cmdOpen); cmdOpenRef.current = cmdOpen;
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); setCmdOpen((v) => !v); return; }
      if (typing) return;
      if (e.key === "/") { e.preventDefault(); setCmdOpen(true); return; }
      if (!cmdOpenRef.current && /^[1-9]$/.test(e.key)) { const t = tabsRef.current[+e.key - 1]; if (t) setTab(t.id); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      <style>{CSS}</style>
      <datalist id="hl-universe">
        {(markets.data ? markets.data.universe : []).map((c) => <option key={c} value={c} />)}
      </datalist>
      <Sidebar tab={tab} setTab={setTab} tabs={tabs} markets={markets} news={news} macro={macro} />
      <div className="main-col">
        <div className="hdr">
          <div>
            <div className="hdr-title">{curTab ? curTab.label : ""}</div>
            <div className="hdr-sub">PERPS · SPOT · ON-CHAIN · MACRO — MONITORING ONLY</div>
          </div>
          <div className="hdr-sym" title="Active symbol — click any row to change it">
            <span className="hs-lab">SYM</span>
            <span className="hs-sym">{selSym}</span>
            {hdrC ? <><Num v={hdrC.mark} /> <Pct v={hdrC.chg} /></> : <span className="dim2">—</span>}
          </div>
          <div className="hdr-right">
            <Clocks />
            <button className="icon-btn" title="Command palette  (Ctrl/Cmd-K)" onClick={() => setCmdOpen(true)}><Search size={14} /></button>
            <button className={"icon-btn" + (settings.sound ? " on" : "")} title={settings.sound ? "Sound alerts: on" : "Sound alerts: off"}
              onClick={() => { const v = !settings.sound; setSettings((s) => ({ ...s, sound: v })); if (v) beep(); }}>
              {settings.sound ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            <button className={"icon-btn" + (alertsOpen ? " on" : "")} title="Alerts & rules" onClick={() => { setAlertsOpen((o) => !o); setUnread(0); }}>
              <Bell size={14} />
              {unread > 0 ? <span className="bell-badge">{unread > 99 ? "99+" : unread}</span> : null}
            </button>
          </div>
        </div>
        <div className="main">
          <div className="tabfade" key={tab}>
            <ErrorBoundary resetKey={tab + ":" + selSym} label={"The " + (curTab ? curTab.label : "") + " module"}>
              {tab === "overview" ? <OverviewTab markets={markets} watchlist={watchlist} setWatchlist={setWatchlist} selSym={selSym} setSelSym={setSelSym} macro={macro} fng={fng} spot={spot} /> : null}
              {tab === "charts" ? <ChartTab markets={markets} selSym={selSym} setSelSym={setSelSym} watchlist={watchlist} settings={settings} setSettings={setSettings} /> : null}
              {tab === "whale" ? <WhaleTab wallets={wallets} setWallets={setWallets} whales={whales} markets={markets} setSelSym={setSelSym} lb={lb} pos={pos} onProfile={setProfileAddr} /> : null}
              {tab === "deriv" ? <DerivTab markets={markets} selSym={selSym} setSelSym={setSelSym} watchlist={watchlist} /> : null}
              {tab === "news" ? <NewsTab news={news} fng={fng} /> : null}
              {tab === "admin" && profile && profile.is_admin ? <Admin /> : null}
            </ErrorBoundary>
          </div>
        </div>
        <Ticker markets={markets} watchlist={watchlist} />
      </div>
      <Toasts list={toasts} onClose={dismissToast} />
      <Slideover open={alertsOpen} onClose={() => setAlertsOpen(false)} title="Alerts & Rules" icon={Zap}>
        <AlertsBody rules={rules} setRules={setRules} log={log} setLog={setLog}
          universe={markets.data ? markets.data.universe : []} settings={settings} setSettings={setSettings} />
      </Slideover>
      <ErrorBoundary resetKey={cmdOpen ? "open" : "closed"}>
        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} markets={markets} tabs={tabs} setTab={setTab} setSelSym={setSelSym} />
      </ErrorBoundary>
      <ErrorBoundary resetKey={profileAddr || "none"}>
        <WalletProfile addr={profileAddr} onClose={() => setProfileAddr(null)}
          onTrack={(ad) => { setWallets((ws) => ws.some((w) => w.addr.toLowerCase() === ad.toLowerCase()) ? ws : [...ws, { addr: ad, label: "" }]); }}
          isTracked={!!profileAddr && wallets.some((w) => w.addr.toLowerCase() === profileAddr.toLowerCase())} />
      </ErrorBoundary>
    </div>
  );
}

/* ════════════════════════════ AUTH ROUTER ════════════════════════════ */

export { Dashboard, Sidebar, TABS };
