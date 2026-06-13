import React, { useState, useMemo } from "react";
import { BarChart3, Gauge, Layers, Plus, TrendingUp, X } from "lucide-react";
import { ErrState, Num, Panel, Pct, SkeletonRows, Spark, Stat } from "../components/index";
import { useNow } from "../hooks/timing";
import { CG_IDS } from "../lib/constants";
import { ago, fmtPct, fmtUsd, pctClass } from "../lib/format";
import { HL } from "../lib/hl";

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
      source="HYPERLIQUID" status={markets.err ? "down" : markets.data ? "live" : "stale"} age={d ? ago(d.ts, now) : undefined}>
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
    <Panel title="Scanner — Top Movers" icon={BarChart3} bodyClass="pad0" source="HYPERLIQUID" status={markets.err ? "down" : markets.data ? "live" : "stale"}
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

function MacroPanel({ macro, fng, markets }) {
  const eth = markets.data && markets.data.byCoin.ETH, btc = markets.data && markets.data.byCoin.BTC;
  const ethbtc = eth && btc ? eth.mark / btc.mark : null;
  return (
    <Panel title="Macro & Regime" icon={Gauge} source="FREE FEEDS" status={(macro.glob || macro.dxy) ? "live" : (macro.globErr && macro.dxyErr ? "down" : "stale")}>
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
    <Panel title="Spot Snapshot" icon={TrendingUp} source="COINGECKO" status={spot.err && !spot.data ? "down" : spot.data ? "live" : "stale"} bodyClass="pad0">
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

export { MacroPanel, OverviewTab, ScannerPanel, SpotPanel, WatchlistPanel };
