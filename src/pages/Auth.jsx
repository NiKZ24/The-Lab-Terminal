import React, { useState, useEffect } from "react";
import { Activity, ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react";
import { supabase } from "../lib/supabase";
import logoImg from "../assets/logo.png";

const PENDING_CODE_KEY = "thelab:pendingInviteCode";

function Field({ label, type, value, onChange, placeholder, icon: I, right }) {
  return (
    <div className="auth-field">
      <label>{label}</label>
      <div style={{ position: "relative" }}>
        {I ? <I size={13} style={{ position: "absolute", left: 11, top: 12, color: "var(--txt3)" }} /> : null}
        <input
          className="auth-input"
          style={{ paddingLeft: I ? 32 : 12, paddingRight: right ? 36 : 12 }}
          type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete="off"
        />
        {right}
      </div>
    </div>
  );
}

export default function Auth() {
  const [mode, setMode] = useState("landing"); // landing | login | signup | forgot
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [code, setCode] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // {type: 'err'|'ok'|'info', text}

  // If we arrived from an email link that failed (expired/invalid), the URL carries
  // an #error=... hash. Surface it here cleanly instead of leaving a broken page.
  useEffect(() => {
    const h = window.location.hash || "";
    if (h.includes("error")) {
      const p = new URLSearchParams(h.replace(/^#/, ""));
      const desc = (p.get("error_description") || p.get("error") || "").replace(/\+/g, " ");
      if (desc) {
        setMode("login");
        setMsg({ type: "err", text: desc.charAt(0).toUpperCase() + desc.slice(1) + ". Please request a new link or log in." });
      }
      // clean the hash so the message doesn't persist on refresh
      try { window.history.replaceState(null, "", window.location.pathname + window.location.search); } catch (e) { /* ignore */ }
    }
  }, []);


  const reset = () => { setMsg(null); setPw(""); setPw2(""); setCode(""); };
  const goto = (m) => { reset(); setMode(m); };

  const doLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !pw) { setMsg({ type: "err", text: "Enter your email and password." }); return; }
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) setMsg({ type: "err", text: error.message });
    // on success, AuthProvider's onAuthStateChange takes over (and InviteGate will
    // pick up any pending invite code automatically)
  };

  const doSignup = async (e) => {
    e.preventDefault();
    const em = email.trim();
    if (!em || !pw || !pw2 || !code.trim()) { setMsg({ type: "err", text: "Fill in every field, including your invite code." }); return; }
    if (pw.length < 6) { setMsg({ type: "err", text: "Password must be at least 6 characters." }); return; }
    if (pw !== pw2) { setMsg({ type: "err", text: "Passwords don't match." }); return; }
    setBusy(true); setMsg(null);
    try { localStorage.setItem(PENDING_CODE_KEY, code.trim().toUpperCase()); } catch (e2) { /* ignore */ }
    const { data, error } = await supabase.auth.signUp({ email: em, password: pw });
    setBusy(false);
    if (error) { setMsg({ type: "err", text: error.message }); return; }
    if (data.session) {
      // Email confirmation disabled — signed in immediately; AuthProvider + InviteGate handle the rest.
      setMsg({ type: "ok", text: "Account created. Setting things up…" });
    } else {
      setMsg({ type: "ok", text: "Account created. Check " + em + " for a confirmation link, then log in here — your invite code will be applied automatically." });
      setMode("login");
    }
  };

  const doForgot = async (e) => {
    e.preventDefault();
    const em = email.trim();
    if (!em) { setMsg({ type: "err", text: "Enter your email first." }); return; }
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo: window.location.origin });
    setBusy(false);
    if (error) setMsg({ type: "err", text: error.message });
    else setMsg({ type: "ok", text: "If an account exists for " + em + ", a password reset link has been sent." });
  };

  const PwToggle = (
    <button type="button" onClick={() => setShowPw((v) => !v)}
      style={{ position: "absolute", right: 10, top: 10, background: "none", border: "none", color: "var(--txt3)", cursor: "pointer", display: "flex" }}>
      {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
    </button>
  );

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo"><img src={logoImg} alt="" /></div>
          <div>
            <div className="auth-title">THE LAB TERMINAL</div>
            <div className="auth-sub">PERPS · SPOT · ON-CHAIN · MACRO</div>
          </div>
        </div>

        {mode === "landing" ? (
          <>
            <div className="auth-tag">
              An invite-only crypto market intelligence terminal — live perp/spot data, whale position
              tracking, funding &amp; OI screens, news sentiment, and custom alerts. Monitoring only — no execution.
            </div>
            <button className="auth-btn" onClick={() => goto("login")}>Log in <ArrowRight size={12} style={{ display: "inline", verticalAlign: -1, marginLeft: 4 }} /></button>
            <button className="auth-btn2" onClick={() => goto("signup")}>Register now</button>
            <div className="auth-foot">Access requires an invite code from an existing member.</div>
          </>
        ) : null}

        {mode === "login" ? (
          <form onSubmit={doLogin}>
            <div className="auth-tabs">
              <button type="button" className="auth-tab on">Log in</button>
              <button type="button" className="auth-tab" onClick={() => goto("signup")}>Sign up</button>
            </div>
            {msg ? <div className={"auth-msg " + msg.type}>{msg.text}</div> : null}
            <Field label="Email" type="email" icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <Field label="Password" type={showPw ? "text" : "password"} icon={Lock} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" right={PwToggle} />
            <button className="auth-btn" disabled={busy}>{busy ? "Signing in…" : "Log in"}</button>
            <div className="auth-foot">
              <span className="auth-link" onClick={() => goto("forgot")}>Forgot password?</span>
              {" · "}
              <span className="auth-link" onClick={() => goto("landing")}>Back</span>
            </div>
          </form>
        ) : null}

        {mode === "signup" ? (
          <form onSubmit={doSignup}>
            <div className="auth-tabs">
              <button type="button" className="auth-tab" onClick={() => goto("login")}>Log in</button>
              <button type="button" className="auth-tab on">Sign up</button>
            </div>
            {msg ? <div className={"auth-msg " + msg.type}>{msg.text}</div> : null}
            <Field label="Email" type="email" icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <Field label="Password" type={showPw ? "text" : "password"} icon={Lock} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 6 characters" right={PwToggle} />
            <Field label="Confirm password" type={showPw ? "text" : "password"} icon={Lock} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Repeat password" />
            <Field label="Invite code" type="text" icon={KeyRound} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. THELAB-XXXXXX" />
            <button className="auth-btn" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
            <div className="auth-foot"><span className="auth-link" onClick={() => goto("landing")}>Back</span></div>
          </form>
        ) : null}

        {mode === "forgot" ? (
          <form onSubmit={doForgot}>
            <div className="auth-tag" style={{ marginBottom: 16, textAlign: "left" }}>Enter the email on your account and we'll send a password reset link.</div>
            {msg ? <div className={"auth-msg " + msg.type}>{msg.text}</div> : null}
            <Field label="Email" type="email" icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <button className="auth-btn" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
            <div className="auth-foot"><span className="auth-link" onClick={() => goto("login")}>Back to login</span></div>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export { PENDING_CODE_KEY };
