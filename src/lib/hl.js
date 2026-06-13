const HL = "https://api.hyperliquid.xyz/info";

async function hlPost(body) {
  const r = await fetch(HL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

export { HL, hlPost };
