import React, { useMemo } from "react";
import { Activity, BarChart3, Flame, Layers, Zap } from "lucide-react";
import { ErrState, Num, Panel, Pct, SkeletonRows } from "../components/index";
import { useFundingHist, useOrderbook } from "../hooks/data";
import { useSort } from "../hooks/timing";
import { ago, fmtPct, fmtPx, fmtUsd, oiLookback, pctClass } from "../lib/format";
import { HL } from "../lib/hl";
import { TapePanel } from "./smartMoney";

function FundingPanel({ markets, setSelSym }) {
  const d = markets.data;
  const rows = useMemo(() => d ? d.rows.filter((r) => r.vol > 2e5).map((r) => ({ ...r, aprAbs: Math.abs(r.apr) })) : null, [d]);
  const { sorted, TH } = useSort(rows, "aprAbs");
  return (
    <Panel title="Funding Monitor" icon={Zap} right={<span>APR = rate × 24 × 365</span>} source="HYPERLIQUID" status={markets.err ? "down" : markets.data ? "live" : "stale"} bodyClass="pad0">
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
    <Panel title="Open Interest Tracker" icon={BarChart3} right={<span className="tag est">session-relative Δ</span>} source="HYPERLIQUID" status={markets.err ? "down" : markets.data ? "live" : "stale"} bodyClass="pad0">
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

function OrderbookPanel({ selSym, markets }) {
  const ob = useOrderbook(selSym);
  const mid = markets.data && markets.data.byCoin[selSym] ? markets.data.byCoin[selSym].mark : null;
  const maxCum = ob.book ? Math.max(...ob.book.bids.map((b) => b.cum), ...ob.book.asks.map((q) => q.cum), 1) : 1;
  const spread = ob.book && ob.book.asks[0] && ob.book.bids[0] ? ob.book.asks[0].px - ob.book.bids[0].px : null;
  const spreadBp = spread != null && mid ? (spread / mid) * 1e4 : null;
  return (
    <Panel title={"Order Book · " + selSym} icon={Layers}
      right={spreadBp != null ? <span>spread {spreadBp.toFixed(1)} bp</span> : null} source="HL · l2Book" status={ob.err && !ob.book ? "down" : ob.book ? "live" : "stale"} bodyClass="pad0">
      {ob.err && !ob.book ? <ErrState msg={"Order book unavailable — " + ob.err} onRetry={ob.reload} /> :
        !ob.book ? <SkeletonRows n={10} /> : (
          <div className="ob">
            <div className="ob-col">
              <div className="ob-head"><span>BID SIZE</span><span>PRICE</span></div>
              {ob.book.bids.map((b, i) => (
                <div key={i} className="ob-row bid">
                  <div className="ob-bar" style={{ width: (b.cum / maxCum * 100) + "%" }} />
                  <span className="num dim2">{b.sz.toFixed(3)}</span><span className="num up">{fmtPx(b.px)}</span>
                </div>
              ))}
            </div>
            <div className="ob-col">
              <div className="ob-head"><span>PRICE</span><span>ASK SIZE</span></div>
              {ob.book.asks.map((q, i) => (
                <div key={i} className="ob-row ask">
                  <div className="ob-bar" style={{ width: (q.cum / maxCum * 100) + "%" }} />
                  <span className="num dn">{fmtPx(q.px)}</span><span className="num dim2">{q.sz.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
    </Panel>
  );
}

/* ════════════════════════════ WHALE TAPE PANEL ════════════════════════════ */

function FundingHistPanel({ selSym }) {
  const fh = useFundingHist(selSym);
  const view = useMemo(() => {
    if (!fh.data || !fh.data.length) return null;
    const d = fh.data.slice(-168);
    const max = Math.max(...d.map((x) => Math.abs(x.r)), 1e-6);
    const sum = d.reduce((s, x) => s + x.r, 0);
    return { d, max, sumApr: sum * 24 * 365 * 100 / d.length * d.length, avg: (sum / d.length) };
  }, [fh.data]);
  return (
    <Panel title={"Funding History · " + selSym} icon={Activity}
      right={view ? <span>7d · avg {(view.avg * 100).toFixed(4)}%/hr</span> : null} source="HL · funding" status={fh.err && !fh.data ? "down" : fh.data ? "live" : "stale"} bodyClass="pad0">
      {fh.err && !fh.data ? <ErrState msg={"Funding history unavailable — " + fh.err} onRetry={fh.reload} /> :
        !view ? <SkeletonRows n={5} /> : (
          <div style={{ padding: "14px 12px 10px" }}>
            <svg width="100%" height="150" viewBox={"0 0 660 150"} preserveAspectRatio="none">
              <line x1="0" y1="75" x2="660" y2="75" stroke="var(--line2)" strokeWidth="1" />
              {view.d.map((x, i) => {
                const w = 660 / view.d.length;
                const h = Math.abs(x.r) / view.max * 64;
                const pos = x.r >= 0;
                return <rect key={i} x={i * w} y={pos ? 75 - h : 75} width={Math.max(1, w - 0.5)} height={h}
                  fill={pos ? "var(--up)" : "var(--dn)"} opacity="0.8" />;
              })}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 9, color: "var(--txt3)", marginTop: 4 }}>
              <span>7d ago</span><span>positive = longs pay shorts</span><span>now</span>
            </div>
          </div>
        )}
    </Panel>
  );
}

/* ════════════════════════════ WALLET PROFILE (slide-over) ════════════════════════════ */

function DerivTab({ markets, selSym, setSelSym, watchlist }) {
  return (
    <div className="grid">
      <div className="g5"><OrderbookPanel selSym={selSym} markets={markets} /></div>
      <div className="g7"><TapePanel watchlist={watchlist} /></div>
      <div className="g12"><FundingHistPanel selSym={selSym} /></div>
      <div className="g6"><FundingPanel markets={markets} setSelSym={setSelSym} /></div>
      <div className="g6"><OIPanel markets={markets} setSelSym={setSelSym} /></div>
    </div>
  );
}

/* ════════════════════════════ ALERTS PANEL ════════════════════════════ */

export { DerivTab, FundingHistPanel, FundingPanel, OIPanel, OrderbookPanel };
