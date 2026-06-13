import React from "react";
import { AlertTriangle } from "lucide-react";
import { Dashboard } from "./Dashboard";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { PrefsProvider } from "./auth/prefs";
import { LogoMark } from "./brand/Logo";
import InviteGate from "./pages/InviteGate";
import Landing from "./pages/Landing";
import { AUTH_CSS, CSS, LANDING_CSS } from "./styles";

function AuthGlobalStyle() {
  return <style>{CSS + "\n" + AUTH_CSS + "\n" + LANDING_CSS}</style>;
}

function Splash() {
  return (
    <div className="auth-shell">
      <AuthGlobalStyle />
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div className="auth-logo" style={{ margin: "0 auto 16px" }}><LogoMark size={54} glow style={{ color: "#f4f6fb" }} /></div>
        <div className="auth-spin" />
      </div>
    </div>
  );
}

function Routed() {
  const { status } = useAuth();
  if (status === "loading") return <Splash />;
  if (status === "signedOut") return <><AuthGlobalStyle /><Landing /></>;
  if (status === "needsInvite") return <><AuthGlobalStyle /><InviteGate /></>;
  // ready
  return (
    <PrefsProvider>
      <Dashboard />
    </PrefsProvider>
  );
}

class RootBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  render() {
    if (this.state.err) return (
      <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "#050608", color: "#f1f4f9", fontFamily: "var(--mono), monospace", textAlign: "center", padding: 24 }}>
        <AlertTriangle size={30} style={{ opacity: 0.8 }} />
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: ".05em" }}>The terminal hit an unexpected error</div>
        <div style={{ fontSize: 12, color: "#aeb7ca", maxWidth: 420, lineHeight: 1.6 }}>Your data is safe. Reloading usually clears it — if it persists, your session is still intact on the server.</div>
        <button onClick={() => window.location.reload()} style={{ marginTop: 6, padding: "10px 20px", borderRadius: 4, border: "1px solid #252d40", background: "#10131c", color: "#f1f4f9", cursor: "pointer", fontFamily: "inherit", fontSize: 12, letterSpacing: ".08em" }}>RELOAD TERMINAL</button>
      </div>
    );
    return this.props.children;
  }
}

export default function App() {
  return (
    <RootBoundary>
      <AuthProvider>
        <Routed />
      </AuthProvider>
    </RootBoundary>
  );
}
