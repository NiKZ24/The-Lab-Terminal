import React, { useCallback, useEffect, useState } from "react";
import { Copy, KeyRound, Plus, RefreshCw, Users } from "lucide-react";
import { supabase } from "../lib/supabase";

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return "THELAB-" + s;
}

export default function Admin() {
  const [codes, setCodes] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("invite_codes").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) setErr(error.message); else { setCodes(data); setErr(null); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setBusy(true); setErr(null);
    const code = genCode();
    const { error } = await supabase.from("invite_codes").insert({ code });
    setBusy(false);
    if (error) setErr(error.message); else load();
  };

  const copy = (c) => {
    try { navigator.clipboard.writeText(c); setCopied(c); setTimeout(() => setCopied(""), 1500); } catch (e) { /* ignore */ }
  };

  const used = codes ? codes.filter((c) => c.used_by) : [];
  const unused = codes ? codes.filter((c) => !c.used_by) : [];

  return (
    <div className="grid">
      <div className="g12">
        <div className="panel">
          <div className="panel-h">
            <KeyRound size={13} className="ph-ic" />
            <span className="ph-t">Invite Codes</span>
            <div className="ph-r">
              <span>{unused.length} unused · {used.length} redeemed</span>
              <button className="btn btn-ghost" onClick={load}><RefreshCw size={11} /> Refresh</button>
              <button className="btn btn-acc" onClick={create} disabled={busy}><Plus size={11} /> Generate code</button>
            </div>
          </div>
          <div className="panel-b">
            {err ? <div className="mono dn" style={{ fontSize: 11, marginBottom: 10 }}>{err}</div> : null}
            {!codes ? <div className="mono dim2" style={{ fontSize: 11 }}>Loading…</div> : !codes.length ? (
              <div className="mono dim2" style={{ fontSize: 11 }}>No codes yet — generate one above and share it with the person you're inviting.</div>
            ) : (
              <>
                <div className="eyebrow" style={{ marginBottom: 9 }}>// available ({unused.length})</div>
                {unused.length === 0 ? <div className="mono dim2" style={{ fontSize: 10.5, marginBottom: 14 }}>None left — generate a new one.</div> : null}
                {unused.map((c) => (
                  <div key={c.code} className="admin-code">
                    <span className="code accc">{c.code}</span>
                    <span className="dim2" style={{ fontSize: 9.5 }}>created {new Date(c.created_at).toLocaleString()}</span>
                    <button className="btn btn-ghost" onClick={() => copy(c.code)}><Copy size={10} /> {copied === c.code ? "Copied" : "Copy"}</button>
                  </div>
                ))}
                <hr className="hr" />
                <div className="eyebrow" style={{ marginBottom: 9 }}>// redeemed ({used.length})</div>
                {used.length === 0 ? <div className="mono dim2" style={{ fontSize: 10.5 }}>No one has redeemed a code yet.</div> : null}
                {used.map((c) => (
                  <div key={c.code} className="admin-code" style={{ opacity: 0.6 }}>
                    <span className="code dimtxt">{c.code}</span>
                    <span className="dim2" style={{ fontSize: 9.5, display: "flex", alignItems: "center", gap: 5 }}>
                      <Users size={10} /> {c.used_by_email || c.used_by} · {c.used_at ? new Date(c.used_at).toLocaleString() : ""}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
