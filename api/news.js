// Vercel serverless function: proxies CryptoCompare news so the browser
// doesn't depend on the upstream CORS headers (which can be flaky).
export default async function handler(req, res) {
  try {
    const r = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN");
    if (!r.ok) throw new Error("upstream " + r.status);
    const json = await r.json();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=600");
    res.status(200).json(json);
  } catch (e) {
    res.status(502).json({ error: "upstream error" });
  }
}
