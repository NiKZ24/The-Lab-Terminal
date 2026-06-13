import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Toggle } from "../components/index";
import { beep, fmtPx, fmtUsd, uid } from "../lib/format";

const RULE_TYPES = [
  { id: "price_above", label: "Price above level" },
  { id: "price_below", label: "Price below level" },
  { id: "pct_move", label: "% move within window" },
  { id: "funding_apr", label: "Funding APR exceeds (abs)" },
  { id: "oi_change", label: "OI % change within window" },
  { id: "whale_open", label: "Whale opens position ≥ $N" },
];

function ruleText(r) {
  switch (r.type) {
    case "price_above": return r.coin + " price ≥ " + fmtPx(r.value);
    case "price_below": return r.coin + " price ≤ " + fmtPx(r.value);
    case "pct_move": return r.coin + " moves ±" + r.value + "% within " + r.windowMin + "m";
    case "funding_apr": return (r.coin === "ANY" ? "Any perp" : r.coin) + " |funding APR| ≥ " + r.value + "%";
    case "oi_change": return r.coin + " OI ±" + r.value + "% within " + r.windowMin + "m";
    case "whale_open": return "Tracked wallet opens ≥ " + fmtUsd(r.value);
    default: return r.type;
  }
}

function AlertsBody({ rules, setRules, log, setLog, universe, settings, setSettings }) {
  const [type, setType] = useState("pct_move");
  const [coin, setCoin] = useState("BTC");
  const [val, setVal] = useState("");
  const [win, setWin] = useState("15");
  const [once, setOnce] = useState(false);
  const [formErr, setFormErr] = useState("");
  const needCoin = type !== "whale_open";
  const needWin = type === "pct_move" || type === "oi_change";
  const allowAny = type === "funding_apr";

  const add = () => {
    const v = parseFloat(val);
    if (!isFinite(v) || v <= 0) { setFormErr("Enter a positive number for the threshold."); return; }
    let c = (coin || "").trim().toUpperCase();
    if (needCoin && !(allowAny && c === "ANY") && !universe.includes(c)) { setFormErr("Unknown symbol — pick one from the list" + (allowAny ? " or use ANY." : ".")); return; }
    setRules((rs) => [...rs, { id: uid(), type, coin: needCoin ? c : "", value: v, windowMin: needWin ? Math.max(1, parseInt(win) || 15) : 0, enabled: true, once }]);
    setVal(""); setFormErr("");
  };

  return (
    <>
      <div className="eyebrow" style={{ marginBottom: 9 }}>// sound</div>
      <div className="rule-item">
        <span className="rule-txt">Audio cue when an alert triggers</span>
        <Toggle on={!!settings.sound} onChange={(v) => { setSettings((s) => ({ ...s, sound: v })); if (v) beep(); }} />
      </div>
      <hr className="hr" />
      <div className="eyebrow" style={{ marginBottom: 9 }}>// new rule</div>
      <div className="form-row">
        <span className="lbl">Condition</span>
        <select className="select" style={{ width: "100%" }} value={type} onChange={(e) => { setType(e.target.value); setFormErr(""); }}>
          {RULE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      {needCoin ? (
        <div className="form-row">
          <span className="lbl">Asset{allowAny ? " — or ANY" : ""}</span>
          <input className="input" style={{ width: "100%" }} list="hl-universe" value={coin} onChange={(e) => { setCoin(e.target.value); setFormErr(""); }} />
        </div>
      ) : null}
      <div className="in-row form-row" style={{ alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <span className="lbl">{type === "whale_open" ? "Min notional ($)" : type.indexOf("price") === 0 ? "Price level" : "Threshold (%)"}</span>
          <input className="input" style={{ width: "100%" }} type="number" value={val} onChange={(e) => setVal(e.target.value)}
            placeholder={type === "whale_open" ? "250000" : type.indexOf("price") === 0 ? "105000" : "2"} />
        </div>
        {needWin ? (
          <div style={{ width: 112 }}>
            <span className="lbl">Window (min)</span>
            <input className="input" style={{ width: "100%" }} type="number" value={win} onChange={(e) => setWin(e.target.value)} />
          </div>
        ) : null}
      </div>
      {formErr ? <div className="mono dn" style={{ fontSize: 10, marginBottom: 9 }}>{formErr}</div> : null}
      <div className="in-row" style={{ justifyContent: "space-between", marginBottom: 13 }}>
        <span className="mono dimtxt" style={{ fontSize: 10.5, display: "flex", alignItems: "center", gap: 7 }}>
          <Toggle on={once} onChange={setOnce} /> fire once, then disable
        </span>
        <button className="btn btn-acc" onClick={add}><Plus size={11} /> Add rule</button>
      </div>
      <div className="eyebrow" style={{ marginBottom: 9 }}>// rules ({rules.length})</div>
      {rules.length === 0 ? <div className="mono dim2" style={{ fontSize: 10.5, marginBottom: 10 }}>No rules yet. Conditions are checked on every market refresh (~6s).</div> : null}
      {rules.map((r) => (
        <div key={r.id} className="rule-item">
          <Toggle on={r.enabled} onChange={(v) => setRules((rs) => rs.map((x) => x.id === r.id ? { ...x, enabled: v } : x))} />
          <span className="rule-txt" style={{ opacity: r.enabled ? 1 : 0.45 }}>{ruleText(r)}{r.once ? <span className="dim2"> · once</span> : null}</span>
          <Trash2 size={12} className="chip-x" onClick={() => setRules((rs) => rs.filter((x) => x.id !== r.id))} />
        </div>
      ))}
      <hr className="hr" />
      <div className="in-row" style={{ justifyContent: "space-between", marginBottom: 9 }}>
        <span className="eyebrow">// alert log ({log.length})</span>
        {log.length ? <button className="btn btn-ghost" onClick={() => setLog([])}>Clear</button> : null}
      </div>
      {log.length === 0 ? <div className="mono dim2" style={{ fontSize: 10.5 }}>Nothing triggered yet. Fired alerts persist here across sessions.</div> :
        log.slice(0, 80).map((e) => (
          <div key={e.id} className={"log-item " + e.sev}>
            <div className="log-t">{new Date(e.ts).toLocaleString()}</div>
            <div className="log-m">{e.msg}</div>
          </div>
        ))}
    </>
  );
}

/* ════════════════════════════ SHELL ════════════════════════════ */

export { AlertsBody, RULE_TYPES, ruleText };
