import React, { useMemo } from "react";
import { Activity, ExternalLink, Flame, Gauge, Newspaper } from "lucide-react";
import { ErrState, GaugeArc, Panel, SkeletonRows } from "../components/index";
import { useNow } from "../hooks/timing";
import { ago, clamp } from "../lib/format";

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
        <Panel title="News Wire" icon={Newspaper} source="CRYPTOCOMPARE" status={news.err && !news.items ? "down" : news.items ? "live" : "stale"} bodyClass="pad0">
          {news.err && !news.items ? <ErrState msg={news.err} onRetry={news.reload} /> :
            !news.items ? <SkeletonRows n={11} /> : (
              <div className="scroll" style={{ maxHeight: "calc(100vh - 206px)" }}>
                {news.items.slice(0, 40).map((n) => (
                  <div key={n.id} className="news-item">
                    <div className="n-meta">
                      <span className="sdot" title={"headline sentiment " + (n.sent > 0 ? "+" : "") + n.sent + " (keyword heuristic)"}
                        style={{
                          background: n.sent > 0 ? "#16c98a" : n.sent < 0 ? "#fb3e57" : "#3a4257",
                          boxShadow: n.sent ? "0 0 6px " + (n.sent > 0 ? "rgba(22,201,138,.6)" : "rgba(251,62,87,.6)") : "none",
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
        <Panel title="Fear & Greed Index" icon={Gauge} source="ALTERNATIVE.ME" status={fng.err && !fng.v ? "down" : fng.v ? "live" : "stale"}>
          {fng.err && !fng.v ? <ErrState msg={fng.err} /> :
            !fng.v ? <div className="skel" style={{ height: 96, margin: "6px 0" }} /> :
              <GaugeArc value={fng.v.value} label={fng.v.label} sub="official index · updates daily" />}
        </Panel>
        <Panel title="Headline Bias" icon={Activity} right={<span className="tag est">heuristic</span>} status={news.items ? "live" : "stale"}>
          {bias == null ? <div className="skel" style={{ height: 96, margin: "6px 0" }} /> :
            <GaugeArc value={bias} min={-100} max={100}
              label={bias > 20 ? "Bullish tilt" : bias < -20 ? "Bearish tilt" : "Neutral"}
              sub="keyword score · recency-weighted · last ~45 headlines"
              color={bias > 20 ? "#16c98a" : bias < -20 ? "#fb3e57" : "#9aa3b8"} />}
        </Panel>
        <Panel title="Hot Topics" icon={Flame} status={news.items ? "live" : "stale"}>
          {!tags.length ? <div className="mono dim2" style={{ fontSize: 10.5 }}>Waiting for headlines…</div> : (
            <div className="in-row">{tags.map(([c, n]) => <span key={c} className="chip">{c} <b className="accc">{n}</b></span>)}</div>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ════════════════════════════ COMMAND PALETTE ════════════════════════════ */

export { NewsTab };
