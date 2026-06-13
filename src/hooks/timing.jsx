import { useState, useEffect, useRef, useMemo } from "react";

function useInterval(cb, ms) {
  const ref = useRef(cb);
  useEffect(() => { ref.current = cb; }, [cb]);
  useEffect(() => {
    if (ms == null) return;
    const id = setInterval(() => ref.current && ref.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

function useNow(step = 1000) {
  const [now, setNow] = useState(Date.now());
  useInterval(() => setNow(Date.now()), step);
  return now;
}

/* ════════════════════════════ DATA: HYPERLIQUID MARKETS ════════════════════════════ */

function useSort(rows, initKey, initDir = "desc") {
  const [s, setS] = useState({ k: initKey, d: initDir });
  const sorted = useMemo(() => {
    if (!rows) return rows;
    const a = [...rows];
    a.sort((x, y) => {
      const xv = x[s.k], yv = y[s.k];
      const d = (xv == null ? -Infinity : xv) > (yv == null ? -Infinity : yv) ? 1 : (xv == null ? -Infinity : xv) < (yv == null ? -Infinity : yv) ? -1 : 0;
      return s.d === "asc" ? d : -d;
    });
    return a;
  }, [rows, s]);
  const TH = ({ k, children, right }) => (
    <th className={right ? "ta-r" : ""}>
      <span className={"th-btn" + (s.k === k ? " on" : "")} onClick={() => setS((p) => ({ k, d: p.k === k && p.d === "desc" ? "asc" : "desc" }))}>
        {children}{s.k === k ? (s.d === "desc" ? " ↓" : " ↑") : ""}
      </span>
    </th>
  );
  return { sorted, TH };
}

export { useInterval, useNow, useSort };
