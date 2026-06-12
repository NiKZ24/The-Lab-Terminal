import React, { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import FlaskWireframe from "./ParticleHero";
import AuthCard from "./AuthCard";
import logoImg from "../assets/logo.png";

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false);
  const [startMode, setStartMode] = useState("login");
  const open = (m) => { setStartMode(m); setShowAuth(true); };

  return (
    <div className="landing">
      <FlaskWireframe />

      <nav className="landing-nav">
        <div className="ln-brand">
          <div className="ln-logo"><img src={logoImg} alt="" /></div>
          <div className="ln-name">THE LAB <span>TERMINAL</span></div>
        </div>
        <div className="ln-right">
          <span className="ln-link" style={{ cursor: "pointer" }} onClick={() => open("login")}>Log in</span>
          <button className="btn-enter2" style={{ padding: "9px 18px" }} onClick={() => open("signup")}>Register</button>
        </div>
      </nav>

      <div className="landing-hero">
        <div className="hero-eyebrow">Market Intelligence · Invite Only</div>
        <h1 className="hero-title">THE LAB<br />TERMINAL</h1>
        <div className="hero-powered">Powered by <b>Hyperliquid</b> · CoinGecko · Macro feeds</div>
        <p className="hero-sub">
          A precision monitoring terminal for crypto perps, spot &amp; macro — live whale positions,
          funding &amp; open-interest screens, liquidation maps, news sentiment and custom alerts.
          <br /><b style={{ color: "var(--txt)" }}>Pure situational awareness. No execution.</b>
        </p>
        <div className="hero-cta">
          <button className="btn-enter" onClick={() => open("login")}>Enter Terminal <ArrowRight size={14} /></button>
          <button className="btn-enter2" onClick={() => open("signup")}>Request Access</button>
        </div>
      </div>

      <div className="landing-foot">
        <span><span className="ft-dot" />Live feeds online</span>
        <span>Perps · Spot · On-Chain · Macro</span>
        <span>Monitoring only</span>
      </div>

      {showAuth ? (
        <div className="auth-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowAuth(false); }}>
          <button className="auth-close" onClick={() => setShowAuth(false)}><X size={15} /></button>
          <AuthCard startMode={startMode} />
        </div>
      ) : null}
    </div>
  );
}
