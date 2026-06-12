import React, { useEffect, useRef, useState } from "react";
import { KeyRound, LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import logoImg from "../assets/logo.png";
import { PENDING_CODE_KEY } from "./AuthCard";

export default function InviteGate() {
  const { redeemInvite, signOut, user } = useAuth();
  const [boxes, setBoxes] = useState(["", "", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [autoTried, setAutoTried] = useState(false);
  const refs = useRef([]);

  const submit = async (codeStr) => {
    setBusy(true); setMsg(null);
    const r = await redeemInvite(codeStr);
    setBusy(false);
    if (r.ok) { try { localStorage.removeItem(PENDING_CODE_KEY); } catch (e) { /* ignore */ } }
    else setMsg({ type: "err", text: r.error || "Invalid or already-used code." });
  };

  // Auto-redeem a code saved during signup, once.
  useEffect(() => {
    if (autoTried) return;
    setAutoTried(true);
    let pending = null;
    try { pending = localStorage.getItem(PENDING_CODE_KEY); } catch (e) { /* ignore */ }
    if (pending && pending.length >= 4) {
      setBusy(true);
      redeemInvite(pending).then((r) => {
        setBusy(false);
        if (r.ok) { try { localStorage.removeItem(PENDING_CODE_KEY); } catch (e) { /* ignore */ } }
        else setMsg({ type: "info", text: "We tried your signup invite code automatically but it didn't work — enter it below." });
      });
    }
  }, [autoTried, redeemInvite]);

  const onChange = (i, v) => {
    const ch = v.replace(/[^a-zA-Z0-9]/g, "").slice(-1).toUpperCase();
    const next = [...boxes]; next[i] = ch; setBoxes(next);
    if (ch && i < 5) refs.current[i + 1] && refs.current[i + 1].focus();
    if (next.every((x) => x) && next.join("").length === 6) submit(next.join(""));
  };
  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !boxes[i] && i > 0) refs.current[i - 1] && refs.current[i - 1].focus();
  };
  const onPaste = (e) => {
    const txt = (e.clipboardData.getData("text") || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
    if (!txt) return;
    e.preventDefault();
    const next = txt.split(""); while (next.length < 6) next.push("");
    setBoxes(next);
    if (txt.length === 6) submit(txt);
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo"><img src={logoImg} alt="" /></div>
          <div>
            <div className="auth-title">THE LAB TERMINAL</div>
            <div className="auth-sub">ONE STEP LEFT</div>
          </div>
        </div>
        <div className="auth-tag">
          You're signed in as <b style={{ color: "var(--txt)" }}>{user && user.email}</b>.
          Enter your invite code to unlock the dashboard.
        </div>
        {msg ? <div className={"auth-msg " + msg.type}>{msg.text}</div> : null}
        <div className="invite-boxes" onPaste={onPaste}>
          {boxes.map((b, i) => (
            <input key={i} ref={(el) => (refs.current[i] = el)} className="invite-box" maxLength={1} value={b}
              disabled={busy} onChange={(e) => onChange(i, e.target.value)} onKeyDown={(e) => onKeyDown(i, e)} />
          ))}
        </div>
        <div className="auth-foot" style={{ marginTop: 4, marginBottom: 14 }}>
          <KeyRound size={11} style={{ display: "inline", verticalAlign: -1, marginRight: 4 }} />
          {busy ? "Checking…" : "Code auto-submits once all 6 characters are entered"}
        </div>
        <button className="auth-btn2" onClick={signOut}><LogOut size={11} style={{ display: "inline", verticalAlign: -1, marginRight: 6 }} />Sign out</button>
      </div>
    </div>
  );
}
