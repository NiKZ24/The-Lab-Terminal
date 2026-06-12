// Vercel serverless: fetch Hyperliquid's public leaderboard (top traders) server-side
// to avoid browser CORS. The leaderboard endpoint is not part of the documented info
// API, so we handle multiple possible shapes and fail gracefully.
const ENDPOINTS = [
  "https://stats-data.hyperliquid.xyz/Mainnet/leaderboard",
];

function num(v) { const n = +v; return isFinite(n) ? n : 0; }

// Normalize a leaderboard row into { addr, pnlAll, roiAll, volAll, accountValue }
function normalizeRow(r) {
  if (!r || typeof r !== "object") return null;
  const addr = r.ethAddress || r.user || r.address || r.account || null;
  if (!addr) return null;
  const out = { addr, accountValue: num(r.accountValue), windows: {} };
  // windowPerformances: [["day",{pnl,roi,vlm}],["week",...],["month",...],["allTime",...]]
  if (Array.isArray(r.windowPerformances)) {
    for (const w of r.windowPerformances) {
      if (Array.isArray(w) && w[1]) out.windows[w[0]] = { pnl: num(w[1].pnl), roi: num(w[1].roi), vlm: num(w[1].vlm) };
    }
  }
  out.displayName = r.displayName || null;
  return out;
}

export default async function handler(req, res) {
  for (const url of ENDPOINTS) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "TheLabTerminal" } });
      if (!r.ok) continue;
      const j = await r.json();
      const rows = j.leaderboardRows || j.rows || (Array.isArray(j) ? j : null);
      if (!rows || !rows.length) continue;
      const out = rows.map(normalizeRow).filter(Boolean);
      if (!out.length) continue;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=1800");
      return res.status(200).json({ rows: out });
    } catch (e) { /* try next */ }
  }
  return res.status(502).json({ error: "leaderboard unavailable" });
}
