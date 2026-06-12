// Vercel serverless news aggregator.
// Strategy: try CryptoCompare's JSON feed first (richest, has categories);
// if it fails, fall back to merging several free crypto RSS feeds.
// Only headlines, source names, timestamps and links are returned — never article bodies.

const RSS_SOURCES = [
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss" },
  { name: "Decrypt", url: "https://decrypt.co/feed" },
  { name: "Bitcoin Magazine", url: "https://bitcoinmagazine.com/feed" },
  { name: "CryptoSlate", url: "https://cryptoslate.com/feed/" },
];

function decode(s) {
  if (!s) return "";
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#8217;/g, "\u2019").replace(/&#8216;/g, "\u2018")
    .replace(/&#8220;/g, "\u201C").replace(/&#8221;/g, "\u201D")
    .replace(/&hellip;/g, "\u2026").replace(/&nbsp;/g, " ")
    .trim();
}

function pick(block, tag) {
  const m = block.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">", "i"));
  return m ? m[1] : "";
}

function parseRss(xml, sourceName) {
  const items = [];
  const blocks = xml.split(/<item[ >]/i).slice(1);
  for (const raw of blocks) {
    const block = raw.split(/<\/item>/i)[0];
    const title = decode(pick(block, "title"));
    let link = decode(pick(block, "link"));
    if (!link) { const m = block.match(/<link[^>]*href="([^"]+)"/i); if (m) link = m[1]; }
    const date = pick(block, "pubDate") || pick(block, "dc:date") || pick(block, "published");
    if (!title || !link) continue;
    const ts = date ? Date.parse(decode(date)) : Date.now();
    items.push({
      id: link,
      title,
      url: link,
      source_info: { name: sourceName },
      source: sourceName,
      published_on: Math.floor((isFinite(ts) ? ts : Date.now()) / 1000),
      categories: "",
    });
  }
  return items;
}

async function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 TheLabTerminal" } });
    clearTimeout(id);
    return r;
  } catch (e) { clearTimeout(id); throw e; }
}

export default async function handler(req, res) {
  // 1) Try CryptoCompare JSON
  try {
    const r = await fetchWithTimeout("https://min-api.cryptocompare.com/data/v2/news/?lang=EN", 5000);
    if (r.ok) {
      const json = await r.json();
      if (json && Array.isArray(json.Data) && json.Data.length) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=600");
        return res.status(200).json(json);
      }
    }
  } catch (e) { /* fall through to RSS */ }

  // 2) Fallback: aggregate RSS feeds
  try {
    const results = await Promise.allSettled(
      RSS_SOURCES.map(async (s) => {
        const r = await fetchWithTimeout(s.url, 5000);
        if (!r.ok) throw new Error(s.name + " " + r.status);
        const xml = await r.text();
        return parseRss(xml, s.name);
      })
    );
    let all = [];
    for (const x of results) if (x.status === "fulfilled") all = all.concat(x.value);
    if (!all.length) throw new Error("no rss items");
    all.sort((a, b) => b.published_on - a.published_on);
    all = all.slice(0, 60);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=180, stale-while-revalidate=900");
    return res.status(200).json({ Data: all, _source: "rss" });
  } catch (e) {
    return res.status(502).json({ error: "all news sources unavailable" });
  }
}
