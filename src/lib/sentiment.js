import { clamp } from "./format";

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

export { BEAR_RX, BULL_RX, parseRssClient, scoreHeadline };
