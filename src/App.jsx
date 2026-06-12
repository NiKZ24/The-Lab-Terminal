import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import logoImg from "./assets/logo.png";
import { Activity, AlertTriangle, BarChart3, Bell, Clock, ExternalLink, Eye, Flame, Gauge, Layers, LineChart, Newspaper, Plus, Radio, RefreshCw, Search, Trash2, TrendingDown, TrendingUp, Volume2, VolumeX, Wallet, X, Zap, KeyRound, LogOut, User, ChevronDown } from "lucide-react";
import { CSS, AUTH_CSS, LANDING_CSS } from "./styles.js";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { PrefsProvider, usePref } from "./auth/prefs.jsx";
import Landing from "./pages/Landing";
import InviteGate from "./pages/InviteGate";
import Admin from "./pages/Admin";

/* ════════════════════════════ CONSTANTS ════════════════════════════ */

const HL = "https://api.hyperliquid.xyz/info";
const DEFAULT_WATCH = ["BTC", "ETH", "SOL", "HYPE", "XRP", "DOGE"];
const INTERVALS = { "5m": 3e5, "15m": 9e5, "1h": 36e5, "4h": 144e5, "1d": 864e5 };
const TV_MAP = { HYPE: "KUCOIN:HYPEUSDT", kPEPE: "BINANCE:1000PEPEUSDT", kBONK: "BINANCE:1000BONKUSDT", kSHIB: "BINANCE:1000SHIBUSDT", kFLOKI: "BINANCE:1000FLOKIUSDT", kLUNC: "BINANCE:1000LUNCUSDT", PURR: "HYPERLIQUID:PURRUSDC" };
const CG_IDS = { BTC: "bitcoin", ETH: "ethereum", SOL: "solana", XRP: "ripple", DOGE: "dogecoin", HYPE: "hyperliquid", BNB: "binancecoin", AVAX: "avalanche-2", LINK: "chainlink", SUI: "sui", ADA: "cardano", LTC: "litecoin", ARB: "arbitrum", OP: "optimism", APT: "aptos", TIA: "celestia", INJ: "injective", SEI: "sei-network", JUP: "jupiter-exchange-solana", AAVE: "aave", UNI: "uniswap", NEAR: "near", DOT: "polkadot", TON: "the-open-network", TRX: "tron", BCH: "bitcoin-cash", ENA: "ethena", PENDLE: "pendle", WLD: "worldcoin-wld", TAO: "bittensor", FIL: "filecoin", ATOM: "cosmos" };

const DEFAULT_RULES = [
  { id: "r-btc-move", type: "pct_move", coin: "BTC", value: 2, windowMin: 15, enabled: true, once: false },
  { id: "r-fund-any", type: "funding_apr", coin: "ANY", value: 100, windowMin: 0, enabled: true, once: false },
  { id: "r-whale", type: "whale_open", coin: "", value: 250000, windowMin: 0, enabled: true, once: false },
];

/* ════════════════════════════ DESIGN SYSTEM ════════════════════════════ */


/* ════════════════════════════ UTILITIES ════════════════════════════ */

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
const BULL_RX = ["surge", "rall(y|ies)", "soar", "jump", "gain", "bullish", "breakout", "all-time high", "\\bath\\b", "approv", "adopt", "inflow", "accumulat", "upgrade", "partnership", "rebound", "recover", "outperform", "milestone", "buying", "\\bpump", "spike", "record high", "green"].map((w) => new RegExp("\\b" + w, "i"));
const BEAR_RX = ["crash", "dump", "plunge", "plummet", "slump", "bearish", "sell-?off", "liquidat", "hack", "exploit", "breach", "lawsuit", "\\bsue[sd]?\\b", "\\bban[s]?\\b", "fraud", "scam", "outflow", "warning", "decline", "tumble", "fine[sd]", "penalt", "halt", "delist", "bankrupt", "drop", "fall[s]?\\b", "fear"].map((w) => new RegExp("\\b" + w, "i"));
function scoreHeadline(t) {
  if (!t) return 0;
  let sc = 0;
  for (const r of BULL_RX) if (r.test(t)) sc++;
  for (const r of BEAR_RX) if (r.test(t)) sc--;
  return clamp(sc, -3, 3);
}

/* ════════════════════════════ STORAGE (window.storage w/ in-memory fallback) ════════════════════════════ */

const memStore = new Map();
const hasClaudeStore = typeof window !== "undefined" && window.storage && typeof window.storage.get === "function";
async function stGet(key, fb) {
  try {
    if (hasClaudeStore) {
      const r = await window.storage.get(key);
      if (r && r.value != null) return JSON.parse(r.value);
      return fb;
    }
    const v = localStorage.getItem(key);
    return v != null ? JSON.parse(v) : fb;
  } catch (e) {
    return memStore.has(key) ? memStore.get(key) : fb;
  }
}
async function stSet(key, val) {
  memStore.set(key, val);
  try {
    if (hasClaudeStore) { await window.storage.set(key, JSON.stringify(val)); return; }
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) { /* persist unavailable — in-memory only */ }
}
function usePersistent(key, initial) {
  const [val, setVal] = useState(initial);
  const [ready, setReady] = useState(false);
  const tRef = useRef(null);
  useEffect(() => {
    let on = true;
    stGet(key, initial).then((v) => { if (on) { setVal(v); setReady(true); } });
    return () => { on = false; };
  }, []); // eslint-disable-line
  const set = useCallback((v) => {
    setVal((prev) => {
      const nv = typeof v === "function" ? v(prev) : v;
      clearTimeout(tRef.current);
      tRef.current = setTimeout(() => stSet(key, nv), 350);
      return nv;
    });
  }, [key]);
  return [val, set, ready];
}

/* ════════════════════════════ AUDIO ════════════════════════════ */

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

function useInterval(cb, ms) {
  const ref = useRef(cb);
  useEffect(() => { ref.current = cb; }, [cb]);
  useEffect(() => {
    if (ms == null) return;
    const id = setInterval(() => ref.current && ref.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}
function useNow(step = 1000) {
  const [now, setNow] = useState(Date.now());
  useInterval(() => setNow(Date.now()), step);
  return now;
}

/* ════════════════════════════ DATA: HYPERLIQUID MARKETS ════════════════════════════ */

async function hlPost(body) {
  const r = await fetch(HL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

function useMarkets() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [latency, setLatency] = useState(null);
  const [tick, setTick] = useState(0);
  const histRef = useRef(new Map());   // coin -> [[ts, markPx], ...]  (~66 min window)
  const oiHistRef = useRef([]);        // [[ts, {coin: oiUsd}], ...]   (1/min, ~75 entries)
  const lastOiSnap = useRef(0);

  const load = useCallback(async () => {
    const t0 = performance.now();
    try {
      const [meta, ctxs] = await hlPost({ type: "metaAndAssetCtxs" });
      const now = Date.now();
      const rows = (meta.universe || []).map((u, i) => {
        const c = ctxs[i] || {};
        const mark = +c.markPx || 0;
        const prev = +c.prevDayPx || 0;
        const oi = (+c.openInterest || 0) * mark;
        const funding = +c.funding || 0;
        return {
          coin: u.name, szDecimals: u.szDecimals, maxLev: u.maxLeverage || 0,
          mark, mid: +c.midPx || mark, prev,
          chg: prev ? ((mark - prev) / prev) * 100 : 0,
          vol: +c.dayNtlVlm || 0, oi, oiBase: +c.openInterest || 0,
          funding, apr: funding * 24 * 365 * 100,
          volOi: oi > 0 ? (+c.dayNtlVlm || 0) / oi : 0,
          premium: +c.premium || 0,
          delisted: !!u.isDelisted,
        };
      }).filter((r2) => !r2.delisted && r2.mark > 0);

      const byCoin = {};
      rows.forEach((r2) => { byCoin[r2.coin] = r2; });

      // price history (all coins; trimmed to ~66 min)
      const cut = now - 66 * 60e3;
      rows.forEach((r2) => {
        let a = histRef.current.get(r2.coin);
        if (!a) { a = []; histRef.current.set(r2.coin, a); }
        a.push([now, r2.mark]);
        while (a.length && a[0][0] < cut) a.shift();
      });
      // OI snapshot once per minute
      if (now - lastOiSnap.current > 60e3) {
        lastOiSnap.current = now;
        const snap = {};
        rows.forEach((r2) => { snap[r2.coin] = r2.oi; });
        oiHistRef.current.push([now, snap]);
        if (oiHistRef.current.length > 75) oiHistRef.current.shift();
      }

      setData({ rows, byCoin, ts: now, universe: rows.map((r2) => r2.coin) });
      setErr(null);
      setLatency(Math.round(performance.now() - t0));
      setTick((t) => t + 1);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useInterval(load, 6000);
  return { data, err, latency, tick, hist: histRef, oiHist: oiHistRef, reload: load };
}

/* ════════════════════════════ DATA: CANDLES (Hyperliquid) ════════════════════════════ */

function useCandles(coin, interval) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  const load = useCallback(async (initial) => {
    const my = ++seq.current;
    if (initial) { setLoading(true); setErr(null); }
    try {
      const ms = INTERVALS[interval];
      const end = Date.now();
      const j = await hlPost({ type: "candleSnapshot", req: { coin, interval, startTime: end - ms * 240, endTime: end } });
      if (my !== seq.current) return;
      const cs = (Array.isArray(j) ? j : []).map((c) => ({ t: c.t, o: +c.o, h: +c.h, l: +c.l, c: +c.c, v: +c.v })).filter((c) => c.o > 0);
      setData(cs);
      setErr(cs.length ? null : "No candle data returned for " + coin);
    } catch (e) {
      if (my === seq.current) setErr(String(e.message || e));
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, [coin, interval]);

  useEffect(() => { setData(null); load(true); }, [load]);
  useInterval(() => load(false), 45000);
  return { data, err, loading, reload: () => load(true) };
}

/* ════════════════════════════ DATA: WHALE WALLETS (Hyperliquid clearinghouse) ════════════════════════════ */

function useWhales(addresses) {
  const [data, setData] = useState({});
  const [tick, setTick] = useState(0);
  const eventsRef = useRef([]);
  const prevRef = useRef(new Map());   // "addr:coin" -> {szi, notional}
  const initRef = useRef(new Set());   // wallets that completed a first snapshot
  const addrKey = addresses.join(",");

  const load = useCallback(async () => {
    if (!addresses.length) { setData({}); setTick((t) => t + 1); return; }
    const out = {};
    for (const addr of addresses) {
      try {
        const j = await hlPost({ type: "clearinghouseState", user: addr });
        const positions = (j.assetPositions || []).map((ap) => {
          const p = ap.position || {};
          const szi = +p.szi || 0;
          return {
            coin: p.coin, szi, side: szi > 0 ? "LONG" : "SHORT",
            entry: +p.entryPx || 0,
            notional: Math.abs(+p.positionValue || 0),
            upnl: +p.unrealizedPnl || 0,
            roe: (+p.returnOnEquity || 0) * 100,
            lev: (p.leverage && p.leverage.value) || 0,
            levType: (p.leverage && p.leverage.type) || "",
            liq: p.liquidationPx != null ? +p.liquidationPx : null,
            margin: +p.marginUsed || 0,
          };
        }).filter((p) => p.szi !== 0);
        out[addr] = { ok: true, ts: Date.now(), accountValue: +((j.marginSummary || {}).accountValue) || 0, positions };

        const wasInit = initRef.current.has(addr);
        const seen = new Set();
        positions.forEach((p) => {
          const k = addr + ":" + p.coin;
          seen.add(k);
          const prev = prevRef.current.get(k);
          if (wasInit) {
            if (!prev) eventsRef.current.push({ type: "open", addr, coin: p.coin, side: p.side, notional: p.notional });
            else if (Math.sign(prev.szi) !== Math.sign(p.szi)) eventsRef.current.push({ type: "flip", addr, coin: p.coin, side: p.side, notional: p.notional });
          }
          prevRef.current.set(k, { szi: p.szi, notional: p.notional });
        });
        for (const [k, v] of Array.from(prevRef.current)) {
          if (k.startsWith(addr + ":") && !seen.has(k)) {
            if (wasInit) eventsRef.current.push({ type: "close", addr, coin: k.split(":")[1], side: v.szi > 0 ? "LONG" : "SHORT", notional: v.notional });
            prevRef.current.delete(k);
          }
        }
        initRef.current.add(addr);
      } catch (e) {
        out[addr] = { ok: false, err: String(e.message || e), ts: Date.now(), accountValue: 0, positions: [] };
      }
      await new Promise((r) => setTimeout(r, 130));
    }
    setData(out);
    setTick((t) => t + 1);
  }, [addrKey]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);
  useInterval(load, 30000);
  const takeEvents = useCallback(() => { const e = eventsRef.current; eventsRef.current = []; return e; }, []);
  return { data, tick, takeEvents, reload: load };
}

/* ════════════════════════════ DATA: GLOBAL LEADERBOARD (best-effort, via serverless) ════════════════════════════ */

function useLeaderboard() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/leaderboard");
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      if (!j.rows || !j.rows.length) throw new Error("empty");
      setRows(j.rows);
      setErr(null);
    } catch (e) { setErr(String(e.message || e)); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useInterval(load, 5 * 60e3);
  return { rows, err, reload: load };
}

/* ════════════════════════════ DATA: AGGREGATE POSITIONING (cohort of addresses) ════════════════════════════ */
// Fetches clearinghouseState for a set of addresses (throttled) and aggregates per coin:
// long/short notional, trader counts, majority side, L/S ratio. Powers the Hyperdash-style table.

function usePositioning(addresses, markets) {
  const [agg, setAgg] = useState(null);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState(null);
  const key = addresses.slice(0, 40).join(",");

  const load = useCallback(async () => {
    const addrs = addresses.slice(0, 40);
    if (!addrs.length) { setAgg(null); return; }
    const byCoin = {};
    let done = 0, ok = 0;
    for (const addr of addrs) {
      try {
        const j = await hlPost({ type: "clearinghouseState", user: addr });
        ok++;
        (j.assetPositions || []).forEach((ap) => {
          const p = ap.position || {};
          const szi = +p.szi || 0;
          if (!szi) return;
          const notion = Math.abs(+p.positionValue || 0);
          const c = byCoin[p.coin] || (byCoin[p.coin] = { coin: p.coin, longN: 0, shortN: 0, longC: 0, shortC: 0, pnl: 0 });
          if (szi > 0) { c.longN += notion; c.longC++; } else { c.shortN += notion; c.shortC++; }
          c.pnl += +p.unrealizedPnl || 0;
        });
      } catch (e) { /* skip this wallet */ }
      done++; setProgress(done / addrs.length);
      await new Promise((r) => setTimeout(r, 90));
    }
    if (!ok) { setErr("could not load positions"); setAgg(null); return; }
    const rows = Object.values(byCoin).map((c) => {
      const total = c.longN + c.shortN;
      return {
        ...c, total,
        majSide: c.longN >= c.shortN ? "LONG" : "SHORT",
        majPct: total ? (Math.max(c.longN, c.shortN) / total) * 100 : 50,
        lsRatio: c.shortN > 0 ? c.longN / c.shortN : (c.longN > 0 ? Infinity : 0),
        traders: c.longC + c.shortC,
      };
    }).sort((a, b) => b.total - a.total);
    setAgg({ rows, wallets: ok, ts: Date.now() });
    setErr(null);
  }, [key]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);
  useInterval(load, 90e3);
  return { agg, progress, err, reload: load };
}

/* ════════════════════════════ DATA: NEWS (multi-source via serverless) ════════════════════════════ */

function parseRssClient(xml, sourceName) {
  const out = [];
  try {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const items = doc.querySelectorAll("item, entry");
    items.forEach((it) => {
      const title = (it.querySelector("title")?.textContent || "").trim();
      let link = it.querySelector("link")?.textContent?.trim() || "";
      if (!link) { const le = it.querySelector("link"); if (le) link = le.getAttribute("href") || ""; }
      const date = it.querySelector("pubDate, published, date")?.textContent || "";
      if (!title || !link) return;
      const ts = date ? Date.parse(date) : Date.now();
      out.push({ id: link, title, url: link, source: sourceName, ts: isFinite(ts) ? ts : Date.now(), cats: [], sent: scoreHeadline(title) });
    });
  } catch (e) { /* ignore */ }
  return out;
}

function useNews() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState(null);
  const load = useCallback(async () => {
    const normalizeJson = (j) => (j.Data || []).map((n) => ({
      id: n.id, title: n.title, url: n.url,
      source: (n.source_info && n.source_info.name) || n.source || "news",
      ts: (n.published_on || 0) * 1000,
      cats: (n.categories || "").split("|").filter(Boolean).slice(0, 4),
      sent: scoreHeadline(n.title),
    }));
    // 1) our serverless aggregator (works on Vercel)
    try {
      const r = await fetch("/api/news");
      if (r.ok) {
        const j = await r.json();
        if (j && Array.isArray(j.Data) && j.Data.length) {
          const arr = normalizeJson(j); arr.sort((a, b) => b.ts - a.ts);
          setItems(arr); setErr(null); return;
        }
      }
    } catch (e) { /* next */ }
    // 2) direct CryptoCompare (CORS-enabled most of the time)
    try {
      const r = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN");
      if (r.ok) {
        const j = await r.json();
        if (j && Array.isArray(j.Data) && j.Data.length) {
          const arr = normalizeJson(j); arr.sort((a, b) => b.ts - a.ts);
          setItems(arr); setErr(null); return;
        }
      }
    } catch (e) { /* next */ }
    // 3) public CORS proxy → crypto RSS feeds, parsed in the browser
    const feeds = [
      ["CoinDesk", "https://www.coindesk.com/arc/outboundfeeds/rss/"],
      ["Cointelegraph", "https://cointelegraph.com/rss"],
      ["Decrypt", "https://decrypt.co/feed"],
    ];
    const proxy = (u) => "https://api.allorigins.win/raw?url=" + encodeURIComponent(u);
    try {
      const settled = await Promise.allSettled(feeds.map(async ([name, u]) => {
        const r = await fetch(proxy(u));
        if (!r.ok) throw new Error(name);
        return parseRssClient(await r.text(), name);
      }));
      let all = [];
      settled.forEach((s) => { if (s.status === "fulfilled") all = all.concat(s.value); });
      if (all.length) { all.sort((a, b) => b.ts - a.ts); setItems(all.slice(0, 60)); setErr(null); return; }
      throw new Error("all sources blocked");
    } catch (e) { setErr(String(e.message || e)); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useInterval(load, 180000);
  return { items, err, reload: load };
}

/* ════════════════════════════ DATA: FEAR & GREED (alternative.me) ════════════════════════════ */

function useFng() {
  const [v, setV] = useState(null);
  const [err, setErr] = useState(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch("https://api.alternative.me/fng/?limit=1");
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      const d = j.data && j.data[0];
      if (!d) throw new Error("empty");
      setV({ value: +d.value, label: d.value_classification, ts: (+d.timestamp || 0) * 1000 });
      setErr(null);
    } catch (e) { setErr(String(e.message || e)); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useInterval(load, 15 * 60e3);
  return { v, err };
}

/* ════════════════════════════ DATA: MACRO (DXY calc · UST 10Y best-effort · CoinGecko global) ════════════════════════════ */

const DXY_W = { EUR: 0.576, JPY: 0.136, GBP: 0.119, CAD: 0.091, SEK: 0.042, CHF: 0.036 };

function useMacro() {
  const [dxy, setDxy] = useState(null);     const [dxyErr, setDxyErr] = useState(null);
  const [us10y, setUs10y] = useState(null); const [us10yErr, setUs10yErr] = useState(null);
  const [glob, setGlob] = useState(null);   const [globErr, setGlobErr] = useState(null);

  const load = useCallback(async () => {
    // DXY computed from ECB daily reference rates (Frankfurter) using the ICE index formula
    try {
      let j = null;
      try {
        const r = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,JPY,GBP,CAD,SEK,CHF");
        if (r.ok) j = await r.json();
      } catch (e) { /* try fallback host */ }
      if (!j) {
        const r2 = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,JPY,GBP,CAD,SEK,CHF");
        if (!r2.ok) throw new Error("HTTP " + r2.status);
        j = await r2.json();
      }
      const rt = j.rates || {};
      let v = 50.14348112;
      for (const k of Object.keys(DXY_W)) {
        if (!rt[k]) throw new Error("missing " + k);
        v *= Math.pow(rt[k], DXY_W[k]);
      }
      setDxy({ v, date: j.date });
      setDxyErr(null);
    } catch (e) { setDxyErr(String(e.message || e)); }

    // CoinGecko global (total mcap, BTC dominance)
    try {
      const r = await fetch("https://api.coingecko.com/api/v3/global");
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      const d = j.data || {};
      setGlob({
        mcap: (d.total_market_cap && d.total_market_cap.usd) || null,
        mcapChg: d.market_cap_change_percentage_24h_usd,
        btcD: d.market_cap_percentage && d.market_cap_percentage.btc,
        ethD: d.market_cap_percentage && d.market_cap_percentage.eth,
      });
      setGlobErr(null);
    } catch (e) { setGlobErr(String(e.message || e)); }

    // US 10Y — official Treasury XML via public CORS relay (best effort)
    try {
      const yr = new Date().getUTCFullYear();
      const src = "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=" + yr;
      let r = null;
      try { const own = await fetch("/api/us10y?year=" + yr); if (own.ok) r = own; } catch (e2) { /* no serverless env */ }
      if (!r) r = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(src));
      if (!r.ok) throw new Error("HTTP " + r.status);
      const txt = await r.text();
      const doc = new DOMParser().parseFromString(txt, "text/xml");
      const entries = doc.getElementsByTagName("entry");
      if (!entries.length) throw new Error("no entries");
      const last = entries[entries.length - 1];
      const yEl = last.getElementsByTagNameNS("*", "BC_10YEAR")[0];
      const dEl = last.getElementsByTagNameNS("*", "NEW_DATE")[0];
      const val = yEl ? parseFloat(yEl.textContent) : NaN;
      if (!isFinite(val)) throw new Error("parse failed");
      setUs10y({ v: val, date: dEl ? dEl.textContent.slice(0, 10) : "" });
      setUs10yErr(null);
    } catch (e) { setUs10yErr(String(e.message || e)); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useInterval(load, 10 * 60e3);
  return { dxy, dxyErr, us10y, us10yErr, glob, globErr, reload: load };
}

/* ════════════════════════════ DATA: SPOT SNAPSHOT (CoinGecko) ════════════════════════════ */

function useSpot(watchlist) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const ids = useMemo(() => watchlist.filter((c) => CG_IDS[c]), [watchlist.join(",")]); // eslint-disable-line
  const load = useCallback(async () => {
    if (!ids.length) { setData({}); return; }
    try {
      const q = ids.map((c) => CG_IDS[c]).join(",");
      const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=" + q + "&vs_currencies=usd&include_24hr_change=true");
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      const out = {};
      ids.forEach((c) => {
        const d = j[CG_IDS[c]];
        if (d && d.usd) out[c] = { px: d.usd, chg: d.usd_24h_change };
      });
      setData(out);
      setErr(null);
    } catch (e) { setErr(String(e.message || e)); }
  }, [ids.join(",")]); // eslint-disable-line
  useEffect(() => { load(); }, [load]);
  useInterval(load, 90000);
  return { data, err };
}

/* ════════════════════════════ UI ATOMS ════════════════════════════ */

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  render() {
    if (this.state.err) return (
      <div className="err-box">
        <AlertTriangle size={18} />
        <div>This panel hit a rendering error.</div>
        <button className="btn" onClick={() => this.setState({ err: null })}><RefreshCw size={11} /> Retry</button>
      </div>
    );
    return this.props.children;
  }
}

function Panel({ title, icon: I, right, children, className = "", bodyClass = "", style }) {
  return (
    <div className={"panel " + className} style={style}>
      <div className="panel-h">
        {I ? <I size={13} className="ph-ic" /> : null}
        <span className="ph-t">{title}</span>
        <div className="ph-r">{right}</div>
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
      <path d={d} fill="none" stroke={up ? "#0ecb81" : "#f6465d"} strokeWidth="1.3" opacity="0.9" />
    </svg>
  );
}

const Toggle = ({ on, onChange }) => <button className={"tgl" + (on ? " on" : "")} onClick={() => onChange(!on)} aria-label="toggle" />;

function useSort(rows, initKey, initDir = "desc") {
  const [s, setS] = useState({ k: initKey, d: initDir });
  const sorted = useMemo(() => {
    if (!rows) return rows;
    const a = [...rows];
    a.sort((x, y) => {
      const xv = x[s.k], yv = y[s.k];
      const d = (xv == null ? -Infinity : xv) > (yv == null ? -Infinity : yv) ? 1 : (xv == null ? -Infinity : xv) < (yv == null ? -Infinity : yv) ? -1 : 0;
      return s.d === "asc" ? d : -d;
    });
    return a;
  }, [rows, s]);
  const TH = ({ k, children, right }) => (
    <th className={right ? "ta-r" : ""}>
      <span className={"th-btn" + (s.k === k ? " on" : "")} onClick={() => setS((p) => ({ k, d: p.k === k && p.d === "desc" ? "asc" : "desc" }))}>
        {children}{s.k === k ? (s.d === "desc" ? " ↓" : " ↑") : ""}
      </span>
    </th>
  );
  return { sorted, TH };
}

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
  const col = color || (pct < 0.25 ? "#f6465d" : pct < 0.45 ? "#9aa3b8" : pct < 0.55 ? "#9aa3b8" : pct < 0.75 ? "#8bd44a" : "#0ecb81");
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
    const UP = "#0ecb81", DN = "#f6465d";

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

function WatchlistPanel({ markets, watchlist, setWatchlist, selSym, setSelSym }) {
  const [add, setAdd] = useState("");
  const now = useNow(5000);
  const d = markets.data;
  const doAdd = () => {
    if (!d) return;
    const s = add.trim().toUpperCase();
    const hit = d.universe.find((x) => x.toUpperCase() === s);
    if (hit && !watchlist.includes(hit)) { setWatchlist((w) => [...w, hit]); setAdd(""); }
  };
  return (
    <Panel title="Watchlist — Perps" icon={Layers} bodyClass="pad0"
      right={<><span>{d ? "upd " + ago(d.ts, now) : ""}</span><Radio size={10} className={markets.err ? "dn" : "up"} /></>}>
      {!d && !markets.err ? <SkeletonRows n={7} /> :
        !d && markets.err ? <ErrState msg={markets.err} onRetry={markets.reload} /> : (
          <>
            <div className="tbl-w scroll" style={{ maxHeight: 332 }}>
              <table className="tbl">
                <thead><tr><th>Asset</th><th className="ta-r">Last</th><th className="ta-r">24h</th><th className="ta-r">10m</th><th className="ta-r">Funding APR</th><th className="ta-r">OI</th><th className="ta-r">24h Vol</th><th></th></tr></thead>
                <tbody>
                  {watchlist.map((w) => {
                    const c = d.byCoin[w];
                    return (
                      <tr key={w} className={"row-click" + (w === selSym ? " sel" : "")} onClick={() => setSelSym(w)}>
                        <td><div className="coin-cell"><span className="coin-sym">{w}</span><span className="dim2" style={{ fontSize: 9 }}>PERP</span></div></td>
                        <td className="ta-r">{c ? <Num v={c.mark} /> : <span className="dim2">delisted?</span>}</td>
                        <td className="ta-r">{c ? <Pct v={c.chg} /> : "—"}</td>
                        <td className="ta-r"><Spark hist={markets.hist} coin={w} /></td>
                        <td className="ta-r">{c ? <span className={pctClass(c.apr)}>{fmtPct(c.apr, 1)}</span> : "—"}</td>
                        <td className="ta-r dimtxt">{c ? fmtUsd(c.oi) : "—"}</td>
                        <td className="ta-r dimtxt">{c ? fmtUsd(c.vol) : "—"}</td>
                        <td><X size={11} className="coin-x" onClick={(e) => { e.stopPropagation(); setWatchlist((ws) => ws.filter((x) => x !== w)); }} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="in-row" style={{ padding: "9px 12px", borderTop: "1px solid var(--line)" }}>
              <Plus size={12} className="dim2" />
              <input className="input" style={{ width: 132 }} list="hl-universe" placeholder="Add symbol…" value={add}
                onChange={(e) => setAdd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doAdd()} />
              <button className="btn btn-ghost" onClick={doAdd}>Add</button>
              <span className="mono dim2" style={{ fontSize: 9, marginLeft: "auto" }}>click a row to set the chart symbol</span>
            </div>
          </>
        )}
    </Panel>
  );
}

function ScannerPanel({ markets, setSelSym, selSym }) {
  const [minVol, setMinVol] = useState(true);
  const [s, setS] = useState({ k: "chg", d: "desc" });
  const d = markets.data;
  const rows = useMemo(() => {
    if (!d) return null;
    let r = d.rows.filter((x) => !minVol || x.vol >= 1e6);
    r = [...r].sort((a, b) => {
      const av = a[s.k] == null ? -Infinity : a[s.k], bv = b[s.k] == null ? -Infinity : b[s.k];
      const dd = av > bv ? 1 : av < bv ? -1 : 0;
      return s.d === "asc" ? dd : -dd;
    });
    return r.slice(0, 18);
  }, [d, minVol, s]);
  const TH = ({ k, children }) => (
    <th className="ta-r">
      <span className={"th-btn" + (s.k === k ? " on" : "")} onClick={() => setS((p) => ({ k, d: p.k === k && p.d === "desc" ? "asc" : "desc" }))}>
        {children}{s.k === k ? (s.d === "desc" ? " ↓" : " ↑") : ""}
      </span>
    </th>
  );
  const gOn = s.k === "chg" && s.d === "desc", lOn = s.k === "chg" && s.d === "asc", vOn = s.k === "vol" && s.d === "desc";
  return (
    <Panel title="Scanner — Top Movers" icon={BarChart3} bodyClass="pad0"
      right={<>
        <div className="pills">
          <button className={"pill" + (gOn ? " on" : "")} onClick={() => setS({ k: "chg", d: "desc" })}>Gainers</button>
          <button className={"pill" + (lOn ? " on" : "")} onClick={() => setS({ k: "chg", d: "asc" })}>Losers</button>
          <button className={"pill" + (vOn ? " on" : "")} onClick={() => setS({ k: "vol", d: "desc" })}>Volume</button>
        </div>
        <button className={"pill" + (minVol ? " on" : "")} title="Hide pairs under $1M 24h volume" onClick={() => setMinVol((v) => !v)}>≥ $1M</button>
      </>}>
      {!rows ? (markets.err ? <ErrState msg={markets.err} onRetry={markets.reload} /> : <SkeletonRows n={9} />) : (
        <div className="tbl-w scroll" style={{ maxHeight: 438 }}>
          <table className="tbl">
            <thead><tr><th>Asset</th><TH k="mark">Last</TH><TH k="chg">24h</TH><TH k="vol">24h Vol</TH><TH k="oi">OI</TH><TH k="apr">Funding APR</TH><TH k="volOi">Vol/OI</TH></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.coin} className={"row-click" + (r.coin === selSym ? " sel" : "")} onClick={() => setSelSym(r.coin)}>
                  <td className="coin-sym">{r.coin}</td>
                  <td className="ta-r"><Num v={r.mark} /></td>
                  <td className="ta-r"><Pct v={r.chg} /></td>
                  <td className="ta-r dimtxt">{fmtUsd(r.vol)}</td>
                  <td className="ta-r dimtxt">{fmtUsd(r.oi)}</td>
                  <td className="ta-r"><span className={pctClass(r.apr)}>{fmtPct(r.apr, 1)}</span></td>
                  <td className="ta-r dimtxt">{r.volOi.toFixed(2)}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

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

function MacroPanel({ macro, fng, markets }) {
  const eth = markets.data && markets.data.byCoin.ETH, btc = markets.data && markets.data.byCoin.BTC;
  const ethbtc = eth && btc ? eth.mark / btc.mark : null;
  return (
    <Panel title="Macro & Regime" icon={Gauge} right={<span className="tag est">free public feeds</span>}>
      <div className="stat-grid">
        <Stat label="DXY · USD Index" v={macro.dxy ? macro.dxy.v.toFixed(2) : null} err={!!macro.dxyErr && !macro.dxy}
          sub={macro.dxy ? "calc from ECB ref rates · " + macro.dxy.date : macro.dxyErr ? "feed unreachable" : "loading…"} />
        <Stat label="US 10Y Yield" v={macro.us10y ? macro.us10y.v.toFixed(2) + "%" : null} err={!!macro.us10yErr && !macro.us10y}
          sub={macro.us10y ? "US Treasury · " + macro.us10y.date : macro.us10yErr ? "relay blocked — best-effort feed" : "loading…"} />
        <Stat label="Total Crypto MCap" v={macro.glob && macro.glob.mcap ? fmtUsd(macro.glob.mcap) : null} err={!!macro.globErr && !macro.glob}
          sub={macro.glob && macro.glob.mcapChg != null ? <span className={pctClass(macro.glob.mcapChg)}>{fmtPct(macro.glob.mcapChg)} 24h</span> : macro.globErr ? "feed unreachable" : "loading…"} />
        <Stat label="BTC Dominance" v={macro.glob && macro.glob.btcD != null ? macro.glob.btcD.toFixed(1) + "%" : null} err={!!macro.globErr && !macro.glob}
          sub={macro.glob && macro.glob.ethD != null ? "ETH.D " + macro.glob.ethD.toFixed(1) + "%" : "CoinGecko global"} />
        <Stat label="ETH / BTC" v={ethbtc ? ethbtc.toFixed(5) : null} sub="from HL perp marks · live" />
        <Stat label="Fear & Greed" v={fng.v ? fng.v.value : null} err={!!fng.err && !fng.v}
          cls={fng.v ? (fng.v.value >= 55 ? "up" : fng.v.value <= 45 ? "dn" : "") : ""}
          sub={fng.v ? fng.v.label + " · alternative.me" : fng.err ? "feed unreachable" : "loading…"} />
      </div>
    </Panel>
  );
}

function SpotPanel({ spot, markets, watchlist }) {
  const rows = watchlist.filter((c) => CG_IDS[c]);
  return (
    <Panel title="Spot Snapshot" icon={TrendingUp} right={<span>CoinGecko · 90s</span>} bodyClass="pad0">
      {spot.err && !spot.data ? <ErrState msg={spot.err} /> :
        !spot.data ? <SkeletonRows n={5} /> : (
          <div className="tbl-w">
            <table className="tbl">
              <thead><tr><th>Asset</th><th className="ta-r">Spot</th><th className="ta-r">24h</th><th className="ta-r">Perp Basis</th></tr></thead>
              <tbody>
                {rows.map((c) => {
                  const sp = spot.data[c];
                  const p = markets.data && markets.data.byCoin[c];
                  const basis = sp && p ? ((p.mark - sp.px) / sp.px) * 1e4 : null;
                  return (
                    <tr key={c}>
                      <td className="coin-sym">{c}</td>
                      <td className="ta-r">{sp ? <Num v={sp.px} /> : <span className="dim2">n/a</span>}</td>
                      <td className="ta-r">{sp ? <Pct v={sp.chg} /> : "—"}</td>
                      <td className="ta-r basis">{basis == null ? <span className="dim2">—</span> : <span className={pctClass(basis)}>{(basis > 0 ? "+" : "") + basis.toFixed(1)} bp</span>}</td>
                    </tr>
                  );
                })}
                {!rows.length ? <tr><td colSpan={4} className="dim2">No watchlist coins mapped to a spot feed.</td></tr> : null}
              </tbody>
            </table>
          </div>
        )}
      <div className="mono dim2" style={{ padding: "7px 12px", fontSize: 9, borderTop: "1px dashed var(--line)" }}>
        basis = HL perp mark vs CoinGecko spot, in basis points
      </div>
    </Panel>
  );
}

function OverviewTab({ markets, watchlist, setWatchlist, selSym, setSelSym, macro, fng, spot }) {
  return (
    <div className="grid">
      <div className="g7" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <WatchlistPanel markets={markets} watchlist={watchlist} setWatchlist={setWatchlist} selSym={selSym} setSelSym={setSelSym} />
        <ScannerPanel markets={markets} setSelSym={setSelSym} selSym={selSym} />
      </div>
      <div className="g5" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <MacroPanel macro={macro} fng={fng} markets={markets} />
        <SpotPanel spot={spot} markets={markets} watchlist={watchlist} />
      </div>
    </div>
  );
}

/* ════════════════════════════ TAB: WHALE INTELLIGENCE ════════════════════════════ */

function WalletBar({ wallets, setWallets, whales }) {
  const [addr, setAddr] = useState("");
  const [label, setLabel] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const add = () => {
    const a = addr.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(a)) { setErrMsg("Enter a valid 0x… address (40 hex characters)."); return; }
    if (wallets.some((w) => w.addr.toLowerCase() === a.toLowerCase())) { setErrMsg("Already tracking that wallet."); return; }
    setWallets((ws) => [...ws, { addr: a, label: label.trim() }]);
    setAddr(""); setLabel(""); setErrMsg("");
  };
  return (
    <Panel title="Tracked Wallets" icon={Wallet} right={<span>{wallets.length} tracked · refresh 30s · HL clearinghouse</span>}>
      <div className="in-row">
        <input className="input" style={{ flex: "1 1 280px" }} placeholder="0x… Hyperliquid wallet address" value={addr}
          onChange={(e) => { setAddr(e.target.value); setErrMsg(""); }} onKeyDown={(e) => e.key === "Enter" && add()} />
        <input className="input" style={{ width: 130 }} placeholder="Label (optional)" value={label}
          onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className="btn btn-acc" onClick={add}><Plus size={11} /> Track</button>
      </div>
      {errMsg ? <div className="mono dn" style={{ fontSize: 10, marginTop: 7 }}>{errMsg}</div> : null}
      {wallets.length ? (
        <div className="in-row" style={{ marginTop: 10 }}>
          {wallets.map((w) => {
            const st = whales.data[w.addr];
            return (
              <span key={w.addr} className="chip" title={w.addr}>
                <span className={"dot " + (st ? (st.ok ? "ok" : "err") : "warn")} />
                <b>{w.label || shortAddr(w.addr)}</b>
                {st && st.ok ? <span className="dimtxt">{fmtUsd(st.accountValue)}</span> : null}
                <span className="chip-x" onClick={() => setWallets((ws) => ws.filter((x) => x.addr !== w.addr))}><X size={11} /></span>
              </span>
            );
          })}
        </div>
      ) : null}
    </Panel>
  );
}

function PositionsPanel({ wallets, whales, markets }) {
  const now = useNow(10000);
  if (!wallets.length) {
    return (
      <Panel title="Open Positions" icon={Eye} bodyClass="pad0">
        <EmptyState icon={Eye} title="No wallets tracked yet"
          sub="Paste Hyperliquid wallet addresses above to monitor live perp positions — entries, leverage, liquidation prices and uPnL come straight from the public clearinghouse endpoint." />
      </Panel>
    );
  }
  return (
    <Panel title="Open Positions — Live Clearinghouse" icon={Eye} right={<span>real positions · not estimates</span>} bodyClass="pad0">
      {wallets.map((w) => {
        const st = whales.data[w.addr];
        return (
          <div key={w.addr}>
            <div className="wal-head">
              <span className={"dot " + (st ? (st.ok ? "ok" : "err") : "warn")} />
              <b className="mono" style={{ fontSize: 11 }}>{w.label || "Wallet"}</b>
              <span className="addr">{shortAddr(w.addr)}</span>
              {st && st.ok ? (
                <span className="mono dimtxt" style={{ fontSize: 10.5, marginLeft: "auto" }}>Equity <b className="accc">{fmtUsd(st.accountValue)}</b> · upd {ago(st.ts, now)}</span>
              ) : st && !st.ok ? (
                <span className="mono dn" style={{ fontSize: 10, marginLeft: "auto" }}>fetch failed — {st.err}</span>
              ) : (
                <span className="mono dim2" style={{ fontSize: 10, marginLeft: "auto" }}>loading…</span>
              )}
            </div>
            {!st ? <SkeletonRows n={2} /> : !st.ok ? null : !st.positions.length ? (
              <div className="mono dim2" style={{ padding: "9px 12px", fontSize: 10.5 }}>No open perp positions right now.</div>
            ) : (
              <div className="tbl-w">
                <table className="tbl">
                  <thead><tr><th>Asset</th><th>Side</th><th className="ta-r">Size</th><th className="ta-r">Notional</th><th className="ta-r">Entry</th><th className="ta-r">Mark</th><th className="ta-r">Liq Px</th><th className="ta-r">→ Liq</th><th className="ta-r">Lev</th><th className="ta-r">uPnL</th><th className="ta-r">ROE</th></tr></thead>
                  <tbody>
                    {st.positions.map((p) => {
                      const m = markets.data && markets.data.byCoin[p.coin];
                      const mark = m ? m.mark : null;
                      const dist = p.liq && mark ? ((p.liq - mark) / mark) * 100 : null;
                      return (
                        <tr key={p.coin}>
                          <td className="coin-sym">{p.coin}</td>
                          <td><span className={"tag " + (p.side === "LONG" ? "long" : "short")}>{p.side}</span></td>
                          <td className="ta-r dimtxt">{Math.abs(p.szi).toLocaleString("en-US", { maximumFractionDigits: 4 })}</td>
                          <td className="ta-r"><Num v={p.notional} fmt={fmtUsd} /></td>
                          <td className="ta-r dimtxt">{fmtPx(p.entry)}</td>
                          <td className="ta-r">{mark != null ? <Num v={mark} /> : "—"}</td>
                          <td className="ta-r dimtxt">{p.liq ? fmtPx(p.liq) : "—"}</td>
                          <td className="ta-r">{dist == null ? <span className="dim2">—</span> : <span className={Math.abs(dist) < 7 ? "dn" : "dimtxt"}>{fmtPct(dist, 1)}</span>}</td>
                          <td className="ta-r dimtxt">{p.lev ? p.lev + "×" : "—"} <span className="dim2" style={{ fontSize: 8.5 }}>{p.levType === "cross" ? "X" : "ISO"}</span></td>
                          <td className="ta-r"><Num v={p.upnl} fmt={(x) => fmtUsd(x, { plus: true })} className={pctClass(p.upnl)} /></td>
                          <td className="ta-r"><Pct v={p.roe} dp={1} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </Panel>
  );
}

function LiqHeatmap({ wallets, whales, markets }) {
  const all = useMemo(() => {
    const out = [];
    Object.entries(whales.data).forEach(([addr, st]) => {
      if (st && st.ok) st.positions.forEach((p) => { if (p.liq && p.liq > 0) out.push({ addr, ...p }); });
    });
    return out;
  }, [whales.tick]); // eslint-disable-line
  const coins = useMemo(() => {
    const m = {};
    all.forEach((p) => { m[p.coin] = (m[p.coin] || 0) + p.notional; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
  }, [all]);
  const [sel, setSel] = useState(null);
  useEffect(() => { if (coins.length && (!sel || !coins.includes(sel))) setSel(coins[0]); }, [coins.join(",")]); // eslint-disable-line
  const [hov, setHov] = useState(null);

  if (!all.length) {
    return (
      <Panel title="Liquidation Map" icon={Flame} right={<span className="tag est">tracked wallets only</span>} bodyClass="pad0">
        <EmptyState icon={Flame} title="No liquidation data yet"
          sub={wallets.length
            ? "Tracked wallets have no open positions with liquidation prices right now."
            : "This map plots the real liquidation prices of wallets you track — it is not a market-wide heatmap. Add wallets above to populate it."} />
      </Panel>
    );
  }
  const mark = markets.data && markets.data.byCoin[sel] ? markets.data.byCoin[sel].mark : null;
  const pos = all.filter((p) => p.coin === sel);
  let lo = Infinity, hi = -Infinity;
  pos.forEach((p) => { lo = Math.min(lo, p.liq); hi = Math.max(hi, p.liq); });
  if (mark) { lo = Math.min(lo, mark * 0.94); hi = Math.max(hi, mark * 1.06); }
  const padP = (hi - lo) * 0.04 || hi * 0.02; lo -= padP; hi += padP;
  const N = 26;
  const buckets = Array.from({ length: N }, (_, i) => ({ i, pHi: hi - ((hi - lo) * i) / N, pLo: hi - ((hi - lo) * (i + 1)) / N, long: 0, short: 0, n: 0 }));
  pos.forEach((p) => {
    const bi = clamp(Math.floor(((hi - p.liq) / (hi - lo)) * N), 0, N - 1);
    buckets[bi][p.side === "LONG" ? "long" : "short"] += p.notional;
    buckets[bi].n++;
  });
  const mx = Math.max(1, ...buckets.map((b) => b.long + b.short));
  const markTop = mark != null ? clamp((hi - mark) / (hi - lo), 0, 1) : null;

  return (
    <Panel title="Liquidation Map" icon={Flame}
      right={<>
        <span className="tag est">tracked wallets only — not market-wide</span>
        <select className="select" value={sel || ""} onChange={(e) => setSel(e.target.value)}>
          {coins.map((c) => <option key={c}>{c}</option>)}
        </select>
      </>}>
      <div className="heat">
        {markTop != null ? <div className="heat-mark" style={{ top: (markTop * 100) + "%" }}><span>{fmtPx(mark)}</span></div> : null}
        {buckets.map((b) => (
          <div key={b.i} className="heat-row" onMouseEnter={() => setHov(b)} onMouseLeave={() => setHov(null)}>
            <div className="heat-lab">{b.i % 3 === 0 ? fmtPx((b.pHi + b.pLo) / 2) : ""}</div>
            <div className="heat-track">
              {b.long > 0 ? <div className="heat-bar long" style={{ width: ((b.long / mx) * 96) + "%" }} /> : null}
              {b.short > 0 ? <div className="heat-bar short" style={{ width: ((b.short / mx) * 96) + "%" }} /> : null}
            </div>
          </div>
        ))}
      </div>
      <div className="heat-foot">
        {hov && (hov.long || hov.short) ? (
          <>~{fmtPx((hov.pHi + hov.pLo) / 2)} · {hov.n} position{hov.n > 1 ? "s" : ""} · long-liq {fmtUsd(hov.long)} · short-liq {fmtUsd(hov.short)}</>
        ) : (
          <div className="legend">
            <span><span className="ldot" style={{ background: "#f6465d" }} />long liqs → forced sells</span>
            <span><span className="ldot" style={{ background: "#0ecb81" }} />short liqs → forced buys</span>
            <span><span className="ldot" style={{ background: "#eef1f7" }} />mark</span>
          </div>
        )}
      </div>
    </Panel>
  );
}

function oiLookback(oiHist, coin, minutes) {
  const snaps = oiHist.current;
  if (!snaps.length) return null;
  const cut = Date.now() - minutes * 60e3;
  for (let i = snaps.length - 1; i >= 0; i--) {
    if (snaps[i][0] <= cut) return snaps[i][1][coin] || null;
  }
  return null;
}

function FundingPanel({ markets, setSelSym }) {
  const d = markets.data;
  const rows = useMemo(() => d ? d.rows.filter((r) => r.vol > 2e5).map((r) => ({ ...r, aprAbs: Math.abs(r.apr) })) : null, [d]);
  const { sorted, TH } = useSort(rows, "aprAbs");
  return (
    <Panel title="Funding Monitor" icon={Zap} right={<span>hourly rate · APR = rate × 24 × 365</span>} bodyClass="pad0">
      {!sorted ? <SkeletonRows n={8} /> : (
        <div className="tbl-w scroll" style={{ maxHeight: 372 }}>
          <table className="tbl">
            <thead><tr><th>Asset</th><TH k="mark" right>Last</TH><TH k="funding" right>Rate / h</TH><TH k="aprAbs" right>APR</TH><TH k="oi" right>OI</TH></tr></thead>
            <tbody>
              {sorted.slice(0, 40).map((r) => {
                const hot = r.aprAbs >= 100;
                return (
                  <tr key={r.coin} className="row-click" onClick={() => setSelSym(r.coin)} style={hot ? { background: "rgba(255,255,255,.04)" } : null}>
                    <td><div className="coin-cell"><span className="coin-sym">{r.coin}</span>{hot ? <Flame size={10} className="accc" /> : null}</div></td>
                    <td className="ta-r"><Num v={r.mark} /></td>
                    <td className="ta-r"><span className={pctClass(r.funding)}>{(r.funding * 100).toFixed(4)}%</span></td>
                    <td className="ta-r"><span className={r.apr > 0 ? "up" : "dn"} style={hot ? { fontWeight: 700, textShadow: "0 0 8px currentColor" } : null}>{fmtPct(r.apr, 1)}</span></td>
                    <td className="ta-r dimtxt">{fmtUsd(r.oi)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function OIPanel({ markets, setSelSym }) {
  const d = markets.data;
  const rows = useMemo(() => {
    if (!d) return null;
    return d.rows.filter((r) => r.oi > 5e5).map((r) => {
      const h1 = oiLookback(markets.oiHist, r.coin, 58);
      const s0 = markets.oiHist.current[0];
      const sesBase = s0 ? s0[1][r.coin] : null;
      return {
        ...r,
        oi1h: h1 ? ((r.oi - h1) / h1) * 100 : null,
        oiSes: sesBase ? ((r.oi - sesBase) / sesBase) * 100 : null,
      };
    });
  }, [d]); // eslint-disable-line
  const { sorted, TH } = useSort(rows, "oi");
  return (
    <Panel title="Open Interest Tracker" icon={BarChart3} right={<span>Δ windows accumulate while the terminal runs</span>} bodyClass="pad0">
      {!sorted ? <SkeletonRows n={8} /> : (
        <div className="tbl-w scroll" style={{ maxHeight: 348 }}>
          <table className="tbl">
            <thead><tr><th>Asset</th><TH k="mark" right>Last</TH><TH k="chg" right>24h Px</TH><TH k="oi" right>OI</TH><TH k="oi1h" right>Δ OI 1h</TH><TH k="oiSes" right>Δ OI Session</TH><TH k="apr" right>Funding APR</TH><TH k="vol" right>24h Vol</TH></tr></thead>
            <tbody>
              {sorted.slice(0, 30).map((r) => (
                <tr key={r.coin} className="row-click" onClick={() => setSelSym(r.coin)}>
                  <td className="coin-sym">{r.coin}</td>
                  <td className="ta-r"><Num v={r.mark} /></td>
                  <td className="ta-r"><Pct v={r.chg} /></td>
                  <td className="ta-r"><Num v={r.oi} fmt={fmtUsd} /></td>
                  <td className="ta-r">{r.oi1h == null ? <span className="dim2" title="Collecting — needs ~1h of terminal uptime">…</span> : <Pct v={r.oi1h} />}</td>
                  <td className="ta-r">{r.oiSes == null ? <span className="dim2">…</span> : <Pct v={r.oiSes} />}</td>
                  <td className="ta-r"><span className={pctClass(r.apr)}>{fmtPct(r.apr, 1)}</span></td>
                  <td className="ta-r dimtxt">{fmtUsd(r.vol)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function LeaderboardPanel({ lb, setSelWallet }) {
  const [win, setWin] = useState("day");
  const WINS = [["day", "24H"], ["week", "7D"], ["month", "30D"], ["allTime", "ALL"]];
  const rows = useMemo(() => {
    if (!lb.rows) return null;
    return [...lb.rows]
      .map((r) => ({ ...r, w: r.windows[win] || { pnl: 0, roi: 0, vlm: 0 } }))
      .sort((a, b) => b.w.pnl - a.w.pnl)
      .slice(0, 30);
  }, [lb.rows, win]);

  return (
    <Panel title="Global Leaderboard" icon={TrendingUp}
      right={<>
        <div className="seg">{WINS.map(([k, l]) => <button key={k} className={"seg-btn" + (win === k ? " on" : "")} onClick={() => setWin(k)}>{l}</button>)}</div>
      </>} bodyClass="pad0">
      {lb.err && !lb.rows ? (
        <EmptyState icon={TrendingUp} title="Global leaderboard unavailable"
          sub="Hyperliquid's public leaderboard feed couldn't be reached from here. The tracked-wallet leaderboard below still works — add wallets to rank them." />
      ) : !rows ? <SkeletonRows n={8} /> : (
        <div className="tbl-w scroll" style={{ maxHeight: 360 }}>
          <table className="tbl">
            <thead><tr><th>#</th><th>Trader</th><th className="ta-r">PnL ({WINS.find((w) => w[0] === win)[1]})</th><th className="ta-r">ROI</th><th className="ta-r">Volume</th><th className="ta-r">Equity</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.addr} className="row-click" onClick={() => setSelWallet && setSelWallet(r.addr)}>
                  <td className="dim2">{i + 1}</td>
                  <td><div className="coin-cell"><span className="coin-sym">{r.displayName || shortAddr(r.addr)}</span></div></td>
                  <td className="ta-r"><span className={pctClass(r.w.pnl)}>{fmtUsd(r.w.pnl, { plus: true })}</span></td>
                  <td className="ta-r"><Pct v={r.w.roi * 100} dp={1} /></td>
                  <td className="ta-r dimtxt">{fmtUsd(r.w.vlm)}</td>
                  <td className="ta-r dimtxt">{fmtUsd(r.accountValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function PositioningPanel({ pos, markets, setSelSym }) {
  const [sort, setSort] = useState("total");
  const rows = useMemo(() => {
    if (!pos.agg) return null;
    return [...pos.agg.rows].sort((a, b) => (b[sort] === Infinity ? 1e18 : b[sort]) - (a[sort] === Infinity ? 1e18 : a[sort])).slice(0, 24);
  }, [pos.agg, sort]);
  const TH = ({ k, children }) => (
    <th className="ta-r"><span className={"th-btn" + (sort === k ? " on" : "")} onClick={() => setSort(k)}>{children}{sort === k ? " ↓" : ""}</span></th>
  );

  return (
    <Panel title="Cohort Positioning" icon={Layers}
      right={<>
        <span className="tag est">{pos.agg ? pos.agg.wallets + " wallets" : pos.progress > 0 ? Math.round(pos.progress * 100) + "%" : "…"}</span>
        <span className="dim2" style={{ fontSize: 9 }}>aggregated long vs short</span>
      </>} bodyClass="pad0">
      {pos.err && !pos.agg ? (
        <EmptyState icon={Layers} title="No positioning data"
          sub="This aggregates open positions across the leaderboard cohort (and your tracked wallets) to show where the crowd is long vs short. Add wallets or wait for the leaderboard feed." />
      ) : !rows ? <SkeletonRows n={8} /> : (
        <div className="tbl-w scroll" style={{ maxHeight: 360 }}>
          <table className="tbl">
            <thead><tr><th>Asset</th><th style={{ width: 150 }}>Long / Short</th><TH k="total">Total Notional</TH><TH k="lsRatio">L/S Ratio</TH><th className="ta-r">Maj. Side</th><th className="ta-r">Traders</th><TH k="pnl">Cohort uPnL</TH></tr></thead>
            <tbody>
              {rows.map((r) => {
                const longPct = r.total ? (r.longN / r.total) * 100 : 50;
                return (
                  <tr key={r.coin} className="row-click" onClick={() => setSelSym(r.coin)}>
                    <td className="coin-sym">{r.coin}</td>
                    <td>
                      <div style={{ display: "flex", height: 7, borderRadius: 3, overflow: "hidden", background: "var(--dn-soft)", minWidth: 120 }}>
                        <div style={{ width: longPct + "%", background: "var(--up)" }} />
                        <div style={{ width: (100 - longPct) + "%", background: "var(--dn)" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8.5, marginTop: 2 }}>
                        <span className="up">{longPct.toFixed(0)}%L</span><span className="dn">{(100 - longPct).toFixed(0)}%S</span>
                      </div>
                    </td>
                    <td className="ta-r"><Num v={r.total} fmt={fmtUsd} /></td>
                    <td className="ta-r dimtxt">{r.lsRatio === Infinity ? "∞" : r.lsRatio.toFixed(2)}</td>
                    <td className="ta-r"><span className={"tag " + (r.majSide === "LONG" ? "long" : "short")}>{r.majSide} {r.majPct.toFixed(0)}%</span></td>
                    <td className="ta-r dimtxt">{r.longC}<span className="up">L</span> / {r.shortC}<span className="dn">S</span></td>
                    <td className="ta-r"><span className={pctClass(r.pnl)}>{fmtUsd(r.pnl, { plus: true })}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function WhaleTab({ wallets, setWallets, whales, markets, setSelSym, lb, pos }) {
  return (
    <div className="grid">
      <div className="g12"><WalletBar wallets={wallets} setWallets={setWallets} whales={whales} /></div>
      <div className="g6"><LeaderboardPanel lb={lb} /></div>
      <div className="g6"><PositioningPanel pos={pos} markets={markets} setSelSym={setSelSym} /></div>
      <div className="g12"><PositionsPanel wallets={wallets} whales={whales} markets={markets} /></div>
      <div className="g6"><LiqHeatmap wallets={wallets} whales={whales} markets={markets} /></div>
      <div className="g6"><FundingPanel markets={markets} setSelSym={setSelSym} /></div>
      <div className="g12"><OIPanel markets={markets} setSelSym={setSelSym} /></div>
    </div>
  );
}

/* ════════════════════════════ TAB: NEWS & SENTIMENT ════════════════════════════ */

function NewsTab({ news, fng }) {
  const now = useNow(15000);
  const bias = useMemo(() => {
    if (!news.items || !news.items.length) return null;
    let num = 0, den = 0;
    const t = Date.now();
    news.items.slice(0, 45).forEach((n) => {
      const ageH = (t - n.ts) / 36e5;
      const w = 1 / (1 + Math.max(0, ageH));
      num += n.sent * w; den += w;
    });
    return den ? clamp(num / den / 3, -1, 1) * 100 : 0;
  }, [news.items]);
  const tags = useMemo(() => {
    if (!news.items) return [];
    const m = {};
    news.items.slice(0, 50).forEach((n) => n.cats.forEach((c) => { m[c] = (m[c] || 0) + 1; }));
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [news.items]);

  return (
    <div className="grid">
      <div className="g8">
        <Panel title="News Wire" icon={Newspaper} right={<span>CryptoCompare · refresh 3m</span>} bodyClass="pad0">
          {news.err && !news.items ? <ErrState msg={news.err} onRetry={news.reload} /> :
            !news.items ? <SkeletonRows n={11} /> : (
              <div className="scroll" style={{ maxHeight: "calc(100vh - 206px)" }}>
                {news.items.slice(0, 40).map((n) => (
                  <div key={n.id} className="news-item">
                    <div className="n-meta">
                      <span className="sdot" title={"headline sentiment " + (n.sent > 0 ? "+" : "") + n.sent + " (keyword heuristic)"}
                        style={{
                          background: n.sent > 0 ? "#0ecb81" : n.sent < 0 ? "#f6465d" : "#3a4257",
                          boxShadow: n.sent ? "0 0 6px " + (n.sent > 0 ? "rgba(14,203,129,.6)" : "rgba(246,70,93,.6)") : "none",
                        }} />
                      <span className="n-src">{n.source}</span>
                      <span>{ago(n.ts, now)} ago</span>
                    </div>
                    <a className="n-title" href={n.url} target="_blank" rel="noreferrer">
                      {n.title}
                      <ExternalLink size={10} className="dim2" style={{ flexShrink: 0, alignSelf: "center" }} />
                    </a>
                    {n.cats.length ? <div className="n-cats">{n.cats.map((c) => <span key={c} className="n-cat">{c}</span>)}</div> : null}
                  </div>
                ))}
              </div>
            )}
        </Panel>
      </div>
      <div className="g4" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Panel title="Fear & Greed Index" icon={Gauge} right={<span>alternative.me</span>}>
          {fng.err && !fng.v ? <ErrState msg={fng.err} /> :
            !fng.v ? <div className="skel" style={{ height: 96, margin: "6px 0" }} /> :
              <GaugeArc value={fng.v.value} label={fng.v.label} sub="official index · updates daily" />}
        </Panel>
        <Panel title="Headline Bias" icon={Activity} right={<span className="tag est">heuristic</span>}>
          {bias == null ? <div className="skel" style={{ height: 96, margin: "6px 0" }} /> :
            <GaugeArc value={bias} min={-100} max={100}
              label={bias > 20 ? "Bullish tilt" : bias < -20 ? "Bearish tilt" : "Neutral"}
              sub="keyword score · recency-weighted · last ~45 headlines"
              color={bias > 20 ? "#0ecb81" : bias < -20 ? "#f6465d" : "#9aa3b8"} />}
        </Panel>
        <Panel title="Hot Topics" icon={Flame}>
          {!tags.length ? <div className="mono dim2" style={{ fontSize: 10.5 }}>Waiting for headlines…</div> : (
            <div className="in-row">{tags.map(([c, n]) => <span key={c} className="chip">{c} <b className="accc">{n}</b></span>)}</div>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ════════════════════════════ ALERTS PANEL ════════════════════════════ */

const RULE_TYPES = [
  { id: "price_above", label: "Price above level" },
  { id: "price_below", label: "Price below level" },
  { id: "pct_move", label: "% move within window" },
  { id: "funding_apr", label: "Funding APR exceeds (abs)" },
  { id: "oi_change", label: "OI % change within window" },
  { id: "whale_open", label: "Whale opens position ≥ $N" },
];

function ruleText(r) {
  switch (r.type) {
    case "price_above": return r.coin + " price ≥ " + fmtPx(r.value);
    case "price_below": return r.coin + " price ≤ " + fmtPx(r.value);
    case "pct_move": return r.coin + " moves ±" + r.value + "% within " + r.windowMin + "m";
    case "funding_apr": return (r.coin === "ANY" ? "Any perp" : r.coin) + " |funding APR| ≥ " + r.value + "%";
    case "oi_change": return r.coin + " OI ±" + r.value + "% within " + r.windowMin + "m";
    case "whale_open": return "Tracked wallet opens ≥ " + fmtUsd(r.value);
    default: return r.type;
  }
}

function AlertsBody({ rules, setRules, log, setLog, universe, settings, setSettings }) {
  const [type, setType] = useState("pct_move");
  const [coin, setCoin] = useState("BTC");
  const [val, setVal] = useState("");
  const [win, setWin] = useState("15");
  const [once, setOnce] = useState(false);
  const [formErr, setFormErr] = useState("");
  const needCoin = type !== "whale_open";
  const needWin = type === "pct_move" || type === "oi_change";
  const allowAny = type === "funding_apr";

  const add = () => {
    const v = parseFloat(val);
    if (!isFinite(v) || v <= 0) { setFormErr("Enter a positive number for the threshold."); return; }
    let c = (coin || "").trim().toUpperCase();
    if (needCoin && !(allowAny && c === "ANY") && !universe.includes(c)) { setFormErr("Unknown symbol — pick one from the list" + (allowAny ? " or use ANY." : ".")); return; }
    setRules((rs) => [...rs, { id: uid(), type, coin: needCoin ? c : "", value: v, windowMin: needWin ? Math.max(1, parseInt(win) || 15) : 0, enabled: true, once }]);
    setVal(""); setFormErr("");
  };

  return (
    <>
      <div className="eyebrow" style={{ marginBottom: 9 }}>// sound</div>
      <div className="rule-item">
        <span className="rule-txt">Audio cue when an alert triggers</span>
        <Toggle on={!!settings.sound} onChange={(v) => { setSettings((s) => ({ ...s, sound: v })); if (v) beep(); }} />
      </div>
      <hr className="hr" />
      <div className="eyebrow" style={{ marginBottom: 9 }}>// new rule</div>
      <div className="form-row">
        <span className="lbl">Condition</span>
        <select className="select" style={{ width: "100%" }} value={type} onChange={(e) => { setType(e.target.value); setFormErr(""); }}>
          {RULE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      {needCoin ? (
        <div className="form-row">
          <span className="lbl">Asset{allowAny ? " — or ANY" : ""}</span>
          <input className="input" style={{ width: "100%" }} list="hl-universe" value={coin} onChange={(e) => { setCoin(e.target.value); setFormErr(""); }} />
        </div>
      ) : null}
      <div className="in-row form-row" style={{ alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <span className="lbl">{type === "whale_open" ? "Min notional ($)" : type.indexOf("price") === 0 ? "Price level" : "Threshold (%)"}</span>
          <input className="input" style={{ width: "100%" }} type="number" value={val} onChange={(e) => setVal(e.target.value)}
            placeholder={type === "whale_open" ? "250000" : type.indexOf("price") === 0 ? "105000" : "2"} />
        </div>
        {needWin ? (
          <div style={{ width: 112 }}>
            <span className="lbl">Window (min)</span>
            <input className="input" style={{ width: "100%" }} type="number" value={win} onChange={(e) => setWin(e.target.value)} />
          </div>
        ) : null}
      </div>
      {formErr ? <div className="mono dn" style={{ fontSize: 10, marginBottom: 9 }}>{formErr}</div> : null}
      <div className="in-row" style={{ justifyContent: "space-between", marginBottom: 13 }}>
        <span className="mono dimtxt" style={{ fontSize: 10.5, display: "flex", alignItems: "center", gap: 7 }}>
          <Toggle on={once} onChange={setOnce} /> fire once, then disable
        </span>
        <button className="btn btn-acc" onClick={add}><Plus size={11} /> Add rule</button>
      </div>
      <div className="eyebrow" style={{ marginBottom: 9 }}>// rules ({rules.length})</div>
      {rules.length === 0 ? <div className="mono dim2" style={{ fontSize: 10.5, marginBottom: 10 }}>No rules yet. Conditions are checked on every market refresh (~6s).</div> : null}
      {rules.map((r) => (
        <div key={r.id} className="rule-item">
          <Toggle on={r.enabled} onChange={(v) => setRules((rs) => rs.map((x) => x.id === r.id ? { ...x, enabled: v } : x))} />
          <span className="rule-txt" style={{ opacity: r.enabled ? 1 : 0.45 }}>{ruleText(r)}{r.once ? <span className="dim2"> · once</span> : null}</span>
          <Trash2 size={12} className="chip-x" onClick={() => setRules((rs) => rs.filter((x) => x.id !== r.id))} />
        </div>
      ))}
      <hr className="hr" />
      <div className="in-row" style={{ justifyContent: "space-between", marginBottom: 9 }}>
        <span className="eyebrow">// alert log ({log.length})</span>
        {log.length ? <button className="btn btn-ghost" onClick={() => setLog([])}>Clear</button> : null}
      </div>
      {log.length === 0 ? <div className="mono dim2" style={{ fontSize: 10.5 }}>Nothing triggered yet. Fired alerts persist here across sessions.</div> :
        log.slice(0, 80).map((e) => (
          <div key={e.id} className={"log-item " + e.sev}>
            <div className="log-t">{new Date(e.ts).toLocaleString()}</div>
            <div className="log-m">{e.msg}</div>
          </div>
        ))}
    </>
  );
}

/* ════════════════════════════ SHELL ════════════════════════════ */

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

const TABS = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "charts", label: "Charting", icon: LineChart },
  { id: "whale", label: "Smart Money", icon: Eye },
  { id: "news", label: "News & Sentiment", icon: Newspaper },
];

function Sidebar({ tab, setTab, tabs, markets, news, macro }) {
  const macroOk = macro.dxy || macro.glob;
  const { user, profile, signOut } = useAuth();
  const [acct, setAcct] = useState(false);
  return (
    <div className="sidebar">
      <div className="brand">
        <div className="brand-dot"><img src={logoImg} alt="" style={{ width: 28, height: 28, objectFit: "contain", position: "relative", zIndex: 1 }} /></div>
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
          <div className="hdr-right">
            <Clocks />
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
            <ErrorBoundary>
              {tab === "overview" ? <OverviewTab markets={markets} watchlist={watchlist} setWatchlist={setWatchlist} selSym={selSym} setSelSym={setSelSym} macro={macro} fng={fng} spot={spot} /> : null}
              {tab === "charts" ? <ChartTab markets={markets} selSym={selSym} setSelSym={setSelSym} watchlist={watchlist} settings={settings} setSettings={setSettings} /> : null}
              {tab === "whale" ? <WhaleTab wallets={wallets} setWallets={setWallets} whales={whales} markets={markets} setSelSym={setSelSym} lb={lb} pos={pos} /> : null}
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
    </div>
  );
}

/* ════════════════════════════ AUTH ROUTER ════════════════════════════ */

function AuthGlobalStyle() {
  return <style>{CSS + "\n" + AUTH_CSS + "\n" + LANDING_CSS}</style>;
}

function Splash() {
  return (
    <div className="auth-shell">
      <AuthGlobalStyle />
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div className="auth-logo" style={{ margin: "0 auto 16px" }}><img src={logoImg} alt="" /></div>
        <div className="auth-spin" />
      </div>
    </div>
  );
}

function Routed() {
  const { status } = useAuth();
  if (status === "loading") return <Splash />;
  if (status === "signedOut") return <><AuthGlobalStyle /><Landing /></>;
  if (status === "needsInvite") return <><AuthGlobalStyle /><InviteGate /></>;
  // ready
  return (
    <PrefsProvider>
      <Dashboard />
    </PrefsProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routed />
    </AuthProvider>
  );
}
