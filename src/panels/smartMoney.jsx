import React, { useState, useEffect, useMemo } from "react";
import { ExternalLink, Eye, Flame, Layers, Plus, Radio, TrendingUp, User, Wallet } from "lucide-react";
import { EmptyState, ErrState, Num, Panel, Pct, SkeletonRows, Slideover, Stat } from "../components/index";
import { useTradeTape, useWalletProfile } from "../hooks/data";
import { useNow } from "../hooks/timing";
import { ago, clamp, fmtPct, fmtPx, fmtUsd, pctClass, shortAddr } from "../lib/format";
import { HL } from "../lib/hl";

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
    <Panel title="Tracked Wallets" icon={Wallet} right={<span>{wallets.length} tracked</span>} source="HL CLEARINGHOUSE" status={wallets.length ? (whales.data ? "live" : "stale") : "stale"}>
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

function PositionsPanel({ wallets, whales, markets, onProfile }) {
  const now = useNow(10000);
  if (!wallets.length) {
    return (
      <Panel title="Open Positions" icon={Eye} source="HL CLEARINGHOUSE" status="stale" bodyClass="pad0">
        <EmptyState icon={Eye} title="No wallets tracked yet"
          sub="Paste Hyperliquid wallet addresses above to monitor live perp positions — entries, leverage, liquidation prices and uPnL come straight from the public clearinghouse endpoint." />
      </Panel>
    );
  }
  return (
    <Panel title="Open Positions — Live Clearinghouse" icon={Eye} right={<span>not estimates</span>} source="HL CLEARINGHOUSE" status={whales.data ? "live" : "stale"} bodyClass="pad0">
      {wallets.map((w) => {
        const _onProfile = onProfile;
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
      <Panel title="Liquidation Map" icon={Flame} right={<span className="tag est">tracked wallets only</span>} status="stale" bodyClass="pad0">
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
    <Panel title="Liquidation Map" icon={Flame} status={whales.data ? "live" : "stale"}
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
            <span><span className="ldot" style={{ background: "#fb3e57" }} />long liqs → forced sells</span>
            <span><span className="ldot" style={{ background: "#16c98a" }} />short liqs → forced buys</span>
            <span><span className="ldot" style={{ background: "#eaf0fb" }} />mark</span>
          </div>
        )}
      </div>
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
    <Panel title="Global Leaderboard" icon={TrendingUp} source="HL · UNOFFICIAL" status={lb.err ? "down" : lb.rows ? "live" : "stale"}
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
    <Panel title="Cohort Positioning" icon={Layers} source="DERIVED" status={pos.err ? "down" : pos.agg ? "live" : "stale"}
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

function WhaleTab({ wallets, setWallets, whales, markets, setSelSym, lb, pos, onProfile }) {
  return (
    <div className="grid">
      <div className="g12"><WalletBar wallets={wallets} setWallets={setWallets} whales={whales} onProfile={onProfile} /></div>
      <div className="g6"><LeaderboardPanel lb={lb} setSelWallet={onProfile} /></div>
      <div className="g6"><PositioningPanel pos={pos} markets={markets} setSelSym={setSelSym} /></div>
      <div className="g12"><PositionsPanel wallets={wallets} whales={whales} markets={markets} onProfile={onProfile} /></div>
      <div className="g12"><LiqHeatmap wallets={wallets} whales={whales} markets={markets} /></div>
    </div>
  );
}

/* ════════════════════════════ TAB: NEWS & SENTIMENT ════════════════════════════ */

function TapePanel({ watchlist }) {
  const [minN, setMinN] = useState(100000);
  const coins = useMemo(() => watchlist.slice(0, 8), [watchlist.join(",")]); // eslint-disable-line
  const tape = useTradeTape(coins, minN);
  const now = useNow(5000);
  return (
    <Panel title="Whale Tape — Live Trades" icon={Radio}
      source="HL · ws trades" status={tape.status === "live" ? "live" : tape.status === "connecting" ? "stale" : "down"}
      right={<>
        <select className="select" value={minN} onChange={(e) => setMinN(+e.target.value)}>
          <option value={50000}>≥ $50K</option>
          <option value={100000}>≥ $100K</option>
          <option value={250000}>≥ $250K</option>
          <option value={1000000}>≥ $1M</option>
        </select>
      </>} bodyClass="pad0">
      {tape.trades.length === 0 ? (
        <EmptyState icon={Radio} title={tape.status === "live" ? "Watching the tape…" : "Connecting to trade stream…"}
          sub={"Live fills from your watchlist (top 8 symbols) at or above the selected size threshold stream in here via the Hyperliquid websocket."} />
      ) : (
        <div className="tbl-w scroll" style={{ maxHeight: 380 }}>
          <table className="tbl">
            <thead><tr><th>Time</th><th>Coin</th><th>Side</th><th className="ta-r">Price</th><th className="ta-r">Size</th><th className="ta-r">Notional</th></tr></thead>
            <tbody>
              {tape.trades.map((t) => (
                <tr key={t.id} className="tape-row">
                  <td className="dim2">{ago(t.time, now)}</td>
                  <td className="coin-sym">{t.coin}</td>
                  <td><span className={"tag " + (t.side === "BUY" ? "long" : "short")}>{t.side}</span></td>
                  <td className="ta-r">{fmtPx(t.px)}</td>
                  <td className="ta-r dimtxt">{t.sz.toFixed(4)}</td>
                  <td className={"ta-r " + (t.notional >= 1e6 ? "big-notional" : "")}>{fmtUsd(t.notional)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/* ════════════════════════════ FUNDING HISTORY PANEL ════════════════════════════ */

function WalletProfile({ addr, onClose, onTrack, isTracked }) {
  const prof = useWalletProfile(addr);
  const now = useNow(10000);
  return (
    <Slideover open={!!addr} onClose={onClose} title={"Wallet · " + shortAddr(addr)} icon={User}>
      {addr ? (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <a className="btn" href={"https://hypurrscan.io/address/" + addr} target="_blank" rel="noreferrer"><ExternalLink size={11} /> Explorer</a>
          {onTrack ? <button className="btn btn-acc" onClick={() => onTrack(addr)} disabled={isTracked}>{isTracked ? "Tracking" : <><Plus size={11} /> Track wallet</>}</button> : null}
        </div>
      ) : null}
      {prof.err ? <ErrState msg={"Could not load wallet — " + prof.err} /> :
        !prof.data ? <SkeletonRows n={8} /> : (
          <>
            <div className="stat-grid" style={{ marginBottom: 12 }}>
              <Stat label="Account Equity" v={fmtUsd(prof.data.equity)} />
              <Stat label="Realized PnL (recent)" v={fmtUsd(prof.data.stats.realized, { plus: true })} cls={pctClass(prof.data.stats.realized)} />
              <Stat label="Win Rate" v={prof.data.stats.winRate == null ? "—" : prof.data.stats.winRate.toFixed(0) + "%"} sub={prof.data.stats.closes + " closes"} />
              <Stat label="Volume (recent)" v={fmtUsd(prof.data.stats.vol)} sub={prof.data.stats.fillCount + " fills"} />
            </div>
            <div className="sub-h">Open Positions</div>
            {prof.data.positions.length === 0 ? <div className="mono dim2" style={{ fontSize: 11, padding: "6px 0 12px" }}>No open positions.</div> : (
              <div className="tbl-w" style={{ marginBottom: 14 }}>
                <table className="tbl"><thead><tr><th>Coin</th><th>Side</th><th className="ta-r">Notional</th><th className="ta-r">Lev</th><th className="ta-r">uPnL</th></tr></thead>
                  <tbody>{prof.data.positions.map((p) => (
                    <tr key={p.coin}><td className="coin-sym">{p.coin}</td><td><span className={"tag " + (p.side === "LONG" ? "long" : "short")}>{p.side}</span></td>
                      <td className="ta-r">{fmtUsd(p.notional)}</td><td className="ta-r dim2">{p.lev}x</td>
                      <td className={"ta-r " + pctClass(p.upnl)}>{fmtUsd(p.upnl, { plus: true })}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            <div className="sub-h">Recent Fills</div>
            <div className="tbl-w scroll" style={{ maxHeight: 260 }}>
              <table className="tbl"><thead><tr><th>Time</th><th>Coin</th><th>Dir</th><th className="ta-r">Px</th><th className="ta-r">Sz</th><th className="ta-r">PnL</th></tr></thead>
                <tbody>{prof.data.fills.map((f, i) => (
                  <tr key={i}><td className="dim2">{ago(f.time, now)}</td><td className="coin-sym">{f.coin}</td>
                    <td className="dim2">{f.dir || f.side}</td><td className="ta-r">{fmtPx(+f.px)}</td>
                    <td className="ta-r dimtxt">{(+f.sz).toFixed(3)}</td>
                    <td className={"ta-r " + pctClass(+f.closedPnl || 0)}>{(+f.closedPnl) ? fmtUsd(+f.closedPnl, { plus: true }) : "—"}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </>
        )}
    </Slideover>
  );
}

/* ════════════════════════════ DERIVATIVES TAB ════════════════════════════ */

export { LeaderboardPanel, LiqHeatmap, PositioningPanel, PositionsPanel, TapePanel, WalletBar, WalletProfile, WhaleTab };
