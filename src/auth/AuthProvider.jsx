import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, ADMIN_EMAIL } from "../lib/supabase";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

// "loading" | "signedOut" | "needsInvite" | "ready"
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = not yet checked
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async (user) => {
    if (!user) { setProfile(null); setStatus("signedOut"); return; }
    try {
      let { data, error: err } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (err) throw err;
      if (!data) {
        // Profile row not created yet by the trigger (race on first signup) — retry shortly.
        await new Promise((r) => setTimeout(r, 900));
        const retry = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        data = retry.data;
      }
      const isAdmin = (user.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const merged = data ? { ...data, is_admin: data.is_admin || isAdmin } : { id: user.id, email: user.email, approved: isAdmin, is_admin: isAdmin };
      setProfile(merged);
      setStatus(merged.approved ? "ready" : "needsInvite");
    } catch (e) {
      setError(String(e.message || e));
      setStatus("signedOut");
    }
  }, []);

  useEffect(() => {
    let on = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!on) return;
      setSession(data.session || null);
      loadProfile(data.session ? data.session.user : null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess || null);
      loadProfile(sess ? sess.user : null);
    });
    return () => { on = false; sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  const redeemInvite = useCallback(async (code) => {
    if (!session) return { ok: false, error: "Not signed in." };
    const clean = (code || "").trim().toUpperCase();
    if (clean.length < 4) return { ok: false, error: "Enter the full invite code." };
    const { data, error: err } = await supabase.rpc("redeem_invite_code", { p_code: clean });
    if (err) return { ok: false, error: err.message };
    if (!data || data.ok !== true) return { ok: false, error: (data && data.error) || "Invalid or already-used code." };
    await loadProfile(session.user);
    return { ok: true };
  }, [session, loadProfile]);

  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);

  const value = { session, user: session ? session.user : null, profile, status, error, redeemInvite, signOut, refresh: () => loadProfile(session ? session.user : null) };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
