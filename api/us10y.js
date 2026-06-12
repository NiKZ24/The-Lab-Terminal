// Vercel serverless function: proxies the official US Treasury daily yield XML
// so the browser doesn't depend on third-party CORS relays (allorigins).
export default async function handler(req, res) {
  const year = String(req.query.year || new Date().getUTCFullYear()).slice(0, 4);
  const url =
    "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=" +
    year;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("upstream " + r.status);
    const txt = await r.text();
    res.setHeader("Content-Type", "text/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).send(txt);
  } catch (e) {
    res.status(502).send("upstream error");
  }
}
