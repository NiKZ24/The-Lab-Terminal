import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { CG_IDS, DXY_W, INTERVALS } from "../lib/constants";
import { hlPost } from "../lib/hl";
import { parseRssClient, scoreHeadline } from "../lib/sentiment";
import { useInterval } from "./timing";

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


/* ════════════════════════════ DATA: ORDERBOOK (l2Book) ════════════════════════════ */

function useOrderbook(coin) {
  const [book, setBook] = useState(null);
  const [err, setErr] = useState(null);
  const seq = useRef(0);
  const load = useCallback(async () => {
    const my = ++seq.current;
    try {
      const j = await hlPost({ type: "l2Book", coin });
      if (my !== seq.current) return;
      const lv = j && j.levels ? j.levels : [[], []];
      const norm = (arr) => (arr || []).map((l) => ({ px: +l.px, sz: +l.sz, n: l.n }));
      let bids = norm(lv[0]).sort((x, y) => y.px - x.px).slice(0, 13);
      let asks = norm(lv[1]).sort((x, y) => x.px - y.px).slice(0, 13);
      let cum = 0; bids = bids.map((b) => ({ ...b, cum: (cum += b.sz) }));
      cum = 0; asks = asks.map((q) => ({ ...q, cum: (cum += q.sz) }));
      setBook({ bids, asks, ts: Date.now() });
      setErr(null);
    } catch (e) { if (my === seq.current) setErr(String(e.message || e)); }
  }, [coin]);
  useEffect(() => { setBook(null); load(); }, [load]);
  useInterval(load, 2500);
  return { book, err, reload: load };
}

/* ════════════════════════════ DATA: LIVE TRADE TAPE (websocket) ════════════════════════════ */

function useTradeTape(coins, minNotional) {
  const [trades, setTrades] = useState([]);
  const [status, setStatus] = useState("connecting");
  const wsRef = useRef(null);
  const minRef = useRef(minNotional);
  useEffect(() => { minRef.current = minNotional; }, [minNotional]);
  const coinsKey = coins.join(",");
  useEffect(() => {
    let dead = false, retry = 0, pingId = null;
    const connect = () => {
      if (dead) return;
      setStatus("connecting");
      let ws;
      try { ws = new WebSocket("wss://api.hyperliquid.xyz/ws"); } catch (e) { setStatus("down"); return; }
      wsRef.current = ws;
      ws.onopen = () => {
        retry = 0; setStatus("live");
        coins.forEach((c) => { try { ws.send(JSON.stringify({ method: "subscribe", subscription: { type: "trades", coin: c } })); } catch (e) { /* noop */ } });
        pingId = setInterval(() => { try { ws.send(JSON.stringify({ method: "ping" })); } catch (e) { /* noop */ } }, 45000);
      };
      ws.onmessage = (ev) => {
        try {
          const m = JSON.parse(ev.data);
          if (m.channel !== "trades" || !Array.isArray(m.data)) return;
          const now = Date.now();
          const add = m.data.map((t) => {
            const px = +t.px, sz = +t.sz;
            return { id: t.tid || t.hash || (t.coin + "-" + t.time + "-" + px + "-" + sz), coin: t.coin, px, sz, notional: px * sz, side: (t.side === "B" || t.side === "buy") ? "BUY" : "SELL", time: t.time || now };
          }).filter((t) => isFinite(t.notional) && t.notional >= minRef.current);
          if (add.length) setTrades((prev) => [...add.reverse(), ...prev].slice(0, 80));
        } catch (e) { /* ignore malformed */ }
      };
      ws.onclose = () => { clearInterval(pingId); if (!dead) { setStatus("down"); retry++; setTimeout(connect, Math.min(15000, 1000 * Math.pow(2, retry))); } };
      ws.onerror = () => { try { ws.close(); } catch (e) { /* noop */ } };
    };
    connect();
    return () => { dead = true; clearInterval(pingId); try { wsRef.current && wsRef.current.close(); } catch (e) { /* noop */ } };
  }, [coinsKey]); // eslint-disable-line
  return { trades, status };
}

/* ════════════════════════════ DATA: FUNDING HISTORY (7d hourly) ════════════════════════════ */

function useFundingHist(coin) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const seq = useRef(0);
  const load = useCallback(async () => {
    const my = ++seq.current;
    try {
      const j = await hlPost({ type: "fundingHistory", coin, startTime: Date.now() - 7 * 864e5 });
      if (my !== seq.current) return;
      const arr = (Array.isArray(j) ? j : []).map((f) => ({ t: f.time, r: +f.fundingRate })).filter((f) => isFinite(f.r));
      setData(arr);
      setErr(arr.length ? null : "no funding history returned");
    } catch (e) { if (my === seq.current) setErr(String(e.message || e)); }
  }, [coin]);
  useEffect(() => { setData(null); load(); }, [load]);
  useInterval(load, 5 * 60e3);
  return { data, err, reload: load };
}

/* ════════════════════════════ DATA: WALLET PROFILE (state + fills) ════════════════════════════ */

function useWalletProfile(addr) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let on = true;
    setData(null); setErr(null);
    if (!addr) return undefined;
    setLoading(true);
    (async () => {
      try {
        const [st, fills] = await Promise.all([
          hlPost({ type: "clearinghouseState", user: addr }),
          hlPost({ type: "userFills", user: addr }),
        ]);
        if (!on) return;
        const positions = (st.assetPositions || []).map((ap) => {
          const p = ap.position || {};
          const szi = +p.szi || 0;
          return { coin: p.coin, szi, side: szi > 0 ? "LONG" : "SHORT", notional: Math.abs(+p.positionValue || 0), upnl: +p.unrealizedPnl || 0, lev: (p.leverage && p.leverage.value) || 0, entry: +p.entryPx || 0 };
        }).filter((p) => p.szi !== 0);
        const fl = (Array.isArray(fills) ? fills : []).slice(0, 400);
        let vol = 0, realized = 0, wins = 0, closes = 0;
        const byCoin = {};
        fl.forEach((f) => {
          const n = Math.abs((+f.px || 0) * (+f.sz || 0));
          vol += n;
          byCoin[f.coin] = (byCoin[f.coin] || 0) + n;
          const cp = +f.closedPnl || 0;
          if (cp !== 0) { closes++; realized += cp; if (cp > 0) wins++; }
        });
        const topCoins = Object.entries(byCoin).sort((x, y) => y[1] - x[1]).slice(0, 5);
        setData({
          equity: +((st.marginSummary || {}).accountValue) || 0,
          positions,
          fills: fl.slice(0, 30),
          stats: { vol, realized, winRate: closes ? (wins / closes) * 100 : null, closes, fillCount: fl.length },
          topCoins,
        });
      } catch (e) { if (on) setErr(String(e.message || e)); }
      finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, [addr]);
  return { data, err, loading };
}

/* ════════════════════════════ DATA: NEWS (multi-source via serverless) ════════════════════════════ */

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

export { useCandles, useFng, useFundingHist, useLeaderboard, useMacro, useMarkets, useNews, useOrderbook, usePositioning, useSpot, useTradeTape, useWalletProfile, useWhales };
