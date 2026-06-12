import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

const Ctx = createContext(null);

// Holds the whole prefs blob for the signed-in user, loads once, debounce-saves.
export function PrefsProvider({ children }) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(null); // null = not loaded yet
  const [ready, setReady] = useState(false);
  const saveTimer = useRef(null);
  const latest = useRef({});

  useEffect(() => {
    let on = true;
    setReady(false); setPrefs(null);
    if (!user) return;
    supabase.from("profiles").select("prefs").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (!on) return;
      const p = (data && data.prefs) || {};
      latest.current = p;
      setPrefs(p);
      setReady(true);
    });
    return () => { on = false; };
  }, [user ? user.id : null]); // eslint-disable-line

  const persist = useCallback(() => {
    if (!user) return;
    supabase.from("profiles").update({ prefs: latest.current }).eq("id", user.id).then(() => {});
  }, [user]);

  const setKey = useCallback((key, updater, initial) => {
    setPrefs((prev) => {
      const base = prev || {};
      const cur = key in base ? base[key] : initial;
      const nv = typeof updater === "function" ? updater(cur) : updater;
      const merged = { ...base, [key]: nv };
      latest.current = merged;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(persist, 500);
      return merged;
    });
  }, [persist]);

  return <Ctx.Provider value={{ prefs, ready, setKey }}>{children}</Ctx.Provider>;
}

// Drop-in replacement for usePersistent: returns [value, setValue, ready].
export function usePref(key, initial) {
  const ctx = useContext(Ctx);
  if (!ctx) return useLocalFallback(key, initial); // eslint-disable-line
  const { prefs, ready, setKey } = ctx;
  const value = prefs && key in prefs ? prefs[key] : initial;
  const setValue = useCallback((v) => setKey(key, v, initial), [key]); // eslint-disable-line
  return [value, setValue, ready];
}

// Used only if somehow rendered outside a provider (shouldn't happen in the dashboard).
function useLocalFallback(key, initial) {
  const [v, setV] = useState(initial);
  return [v, setV, true];
}
