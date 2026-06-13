import { useState, useEffect, useRef, useCallback } from "react";

const memStore = new Map();

const hasClaudeStore = typeof window !== "undefined" && window.storage && typeof window.storage.get === "function";

async function stGet(key, fb) {
  try {
    if (hasClaudeStore) {
      const r = await window.storage.get(key);
      if (r && r.value != null) return JSON.parse(r.value);
      return fb;
    }
    const v = localStorage.getItem(key);
    return v != null ? JSON.parse(v) : fb;
  } catch (e) {
    return memStore.has(key) ? memStore.get(key) : fb;
  }
}

async function stSet(key, val) {
  memStore.set(key, val);
  try {
    if (hasClaudeStore) { await window.storage.set(key, JSON.stringify(val)); return; }
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) { /* persist unavailable — in-memory only */ }
}

function usePersistent(key, initial) {
  const [val, setVal] = useState(initial);
  const [ready, setReady] = useState(false);
  const tRef = useRef(null);
  useEffect(() => {
    let on = true;
    stGet(key, initial).then((v) => { if (on) { setVal(v); setReady(true); } });
    return () => { on = false; };
  }, []); // eslint-disable-line
  const set = useCallback((v) => {
    setVal((prev) => {
      const nv = typeof v === "function" ? v(prev) : v;
      clearTimeout(tRef.current);
      tRef.current = setTimeout(() => stSet(key, nv), 350);
      return nv;
    });
  }, [key]);
  return [val, set, ready];
}

/* ════════════════════════════ AUDIO ════════════════════════════ */

export { hasClaudeStore, memStore, stGet, stSet, usePersistent };
