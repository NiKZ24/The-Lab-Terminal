import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, X } from "lucide-react";
import FlaskWireframe from "./ParticleHero";
import AuthCard from "./AuthCard";
import { LogoMark } from "../brand/Logo";

const DISCORD_URL = "https://discord.gg/wqCbPrDQmD";

// Inline Discord glyph (no extra icon dep needed)
function DiscordIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.1 16.1 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.22.17.33.26.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.68 1.19 1.07 1.74.03.02.06.03.09.02 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.04-.02ZM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12Zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12Z" />
    </svg>
  );
}

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false);
  const [startMode, setStartMode] = useState("login");
  const glowRef = useRef(null);
  const open = (m) => { setStartMode(m); setShowAuth(true); };

  // Cursor glow that follows the mouse across the landing.
  useEffect(() => {
    const onMove = (e) => {
      const g = glowRef.current;
      if (g) { g.style.setProperty("--mx", e.clientX + "px"); g.style.setProperty("--my", e.clientY + "px"); }
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="landing">
      <div className="cursor-glow" ref={glowRef} />
      <FlaskWireframe />

      <nav className="landing-nav">
        <div className="ln-brand">
          <div className="ln-logo"><LogoMark size={26} glow style={{ color: "#f4f6fb" }} /></div>
          <div className="ln-name">THE LAB <span>TERMINAL</span></div>
        </div>
        <div className="ln-right">
          <a className="ln-icon" href={DISCORD_URL} target="_blank" rel="noreferrer" title="Join the Discord"><DiscordIcon size={17} /></a>
          <span className="ln-link" style={{ cursor: "pointer" }} onClick={() => open("login")}>Log in</span>
          <button className="btn-enter2" style={{ padding: "9px 18px" }} onClick={() => open("signup")}>Register</button>
        </div>
      </nav>

      <div className="landing-hero">
        <div className="hero-eyebrow">Market Intelligence · Invite Only</div>
        <h1 className="hero-title">THE&nbsp;LAB<br />TERMINAL</h1>
        <p className="hero-sub">
          A precision monitoring terminal for crypto perps, spot &amp; macro — live whale positions,
          funding &amp; open-interest screens, liquidation maps, news sentiment and custom alerts.
        </p>
        <p className="hero-sub-strong">Pure situational awareness. No execution.</p>
        <div className="hero-cta">
          <button className="btn-enter" onClick={() => open("login")}>Enter Terminal <ArrowRight size={14} /></button>
          <button className="btn-enter2" onClick={() => open("signup")}>Request Access</button>
          <a className="btn-discord" href={DISCORD_URL} target="_blank" rel="noreferrer"><DiscordIcon size={15} /> Discord</a>
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
