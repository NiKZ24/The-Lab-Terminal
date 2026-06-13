export const CSS = `
:root{
  /* elevation — near-black monochrome chrome */
  --bg:#06070a; --bg2:#0a0c11; --panel:#0d1016; --panel2:#11141b; --panel3:#161a23;
  /* hairlines */
  --line:#1b2130; --line2:#2a3142;
  /* text — contrast vs panel surface: txt ~15.6:1, txt2 ~9.4:1, txt3 ~4.8:1 (AA at ≥11px) */
  --txt:#f4f6fb; --txt2:#c3cbd9; --txt3:#8a93a6;
  /* semantic — functional colour only (up/down, long/short, profit/loss) */
  --up:#16c98a; --up-soft:rgba(22,201,138,.12); --dn:#fb3e57; --dn-soft:rgba(251,62,87,.12);
  /* accent — one restrained cool-white for active/selected state */
  --acc:#eaf0fb; --acc-soft:rgba(234,240,251,.07); --acc-glow:rgba(234,240,251,.30);
  --mono:'JetBrains Mono',ui-monospace,'SF Mono','Cascadia Mono',Menlo,Consolas,monospace;
  --sans:'Space Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{background:var(--bg);overflow:hidden}
.app{display:grid;grid-template-columns:198px 1fr;height:100vh;width:100vw;background:var(--bg);
  color:var(--txt);font-family:var(--sans);font-size:13px;overflow:hidden;position:relative}
.app::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
  background:
    radial-gradient(900px 520px at 82% -8%, rgba(255,255,255,.05), transparent 60%),
    radial-gradient(820px 460px at -8% 108%, rgba(255,255,255,.03), transparent 55%);
  animation:ambient 22s ease-in-out infinite alternate}
@keyframes ambient{0%{opacity:.7;transform:translate3d(0,0,0)}100%{opacity:1;transform:translate3d(-1.5%,1%,0)}}
.app>*{position:relative;z-index:1}
::-webkit-scrollbar{width:7px;height:7px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#1d2433;border-radius:8px;border:2px solid var(--bg)}
::-webkit-scrollbar-thumb:hover{background:#2a3450}
.mono{font-family:var(--mono);font-variant-numeric:tabular-nums}
.eyebrow{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--txt3)}
.dimtxt{color:var(--txt2)} .dim2{color:var(--txt3)}
.up{color:var(--up)} .dn{color:var(--dn)} .accc{color:var(--acc)}
.link{color:var(--txt2);text-decoration:none} .link:hover{color:var(--acc)}
.ta-r{text-align:right}

/* ── sidebar ── */
.sidebar{display:flex;flex-direction:column;border-right:1px solid var(--line);background:linear-gradient(180deg,var(--bg2),var(--bg));min-width:0}
.brand{display:flex;align-items:center;gap:11px;padding:18px 14px 16px;border-bottom:1px solid var(--line)}
.brand-dot{width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:none;border:none;flex-shrink:0;position:relative;filter:drop-shadow(0 0 10px rgba(255,255,255,.18))}
@keyframes sheen{0%,55%{left:-60%}100%{left:160%}}
.brand-name{font-family:var(--mono);font-weight:700;font-size:12.5px;letter-spacing:.06em;line-height:1.25}
.brand-sub{font-family:var(--mono);font-size:9.5px;color:var(--txt3);letter-spacing:.14em}
.nav{padding:10px 8px;display:flex;flex-direction:column;gap:2px}
.nav-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:4px;border:1px solid transparent;color:var(--txt2);cursor:pointer;font-size:12.5px;font-weight:500;letter-spacing:.02em;transition:all .15s ease;background:none;text-align:left;width:100%;font-family:var(--sans)}
.nav-item:hover{color:var(--txt);background:rgba(255,255,255,.03)}
.nav-item.on{color:var(--acc);background:var(--acc-soft);border-color:rgba(255,255,255,.25)}
.nav-ic{flex-shrink:0;opacity:.9}
.side-foot{margin-top:auto;padding:12px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:8px}
.src-row{display:flex;align-items:center;justify-content:space-between;font-family:var(--mono);font-size:10px;color:var(--txt3);letter-spacing:.05em}
.src-row b{color:var(--txt2);font-weight:500}
.dot{width:7px;height:7px;border-radius:50%;display:inline-block;flex-shrink:0}
.dot.ok{background:var(--up);box-shadow:0 0 7px rgba(22,201,138,.7);animation:pulseOk 2.4s ease-in-out infinite}
@keyframes pulseOk{0%,100%{box-shadow:0 0 6px rgba(22,201,138,.55)}50%{box-shadow:0 0 12px rgba(22,201,138,.95)}}
.dot.warn{background:var(--acc);box-shadow:0 0 7px var(--acc-glow)}
.dot.err{background:var(--dn);box-shadow:0 0 7px rgba(251,62,87,.7)}
.side-tag{font-family:var(--mono);font-size:9px;color:var(--txt3);letter-spacing:.1em;line-height:1.6;padding-top:4px;border-top:1px dashed var(--line)}

/* ── header ── */
.main-col{display:flex;flex-direction:column;min-width:0;height:100vh}
.hdr{display:flex;align-items:center;gap:14px;padding:0 16px;height:52px;border-bottom:1px solid var(--line);background:rgba(10,12,18,.7);backdrop-filter:blur(8px);flex-shrink:0}
.hdr-title{font-size:14px;font-weight:600;letter-spacing:.02em}
.hdr-sub{font-family:var(--mono);font-size:10px;color:var(--txt3);letter-spacing:.12em;margin-top:1px}
.hdr-sym{display:flex;align-items:center;gap:9px;margin-left:16px;padding:5px 12px;border:1px solid var(--line2);border-radius:4px;background:var(--bg2);font-family:var(--mono);font-size:12.5px}
.hs-lab{font-size:8.5px;letter-spacing:.18em;color:var(--txt3)}
.hs-sym{font-weight:700;color:var(--txt)}
@media(max-width:980px){.hdr-sym{display:none}}
.hdr-right{margin-left:auto;display:flex;align-items:center;gap:10px}
.clockbox{display:flex;flex-direction:column;align-items:flex-end;line-height:1.3;margin-right:2px}
.clock-utc{font-family:var(--mono);font-size:12px;color:var(--txt);letter-spacing:.04em}
.clock-loc{font-family:var(--mono);font-size:9.5px;color:var(--txt3);letter-spacing:.06em}
.icon-btn{position:relative;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:4px;border:1px solid var(--line);background:var(--panel);color:var(--txt2);cursor:pointer;transition:all .15s ease}
.icon-btn:hover{color:var(--txt);border-color:var(--line2)}
.icon-btn.on{color:var(--acc);border-color:rgba(255,255,255,.4);background:var(--acc-soft);box-shadow:0 0 12px rgba(255,255,255,.12)}
.bell-badge{position:absolute;top:-5px;right:-5px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:var(--dn);color:#fff;font-family:var(--mono);font-size:9.5px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px rgba(251,62,87,.6)}

/* ── main / grid ── */
.main{flex:1;overflow-y:auto;overflow-x:hidden;padding:12px;min-height:0;
  background-image:linear-gradient(rgba(255,255,255,.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px);
  background-size:52px 52px}
.tabfade{animation:tabIn .18s ease}
@keyframes tabIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:10px}
.g4{grid-column:span 4}.g5{grid-column:span 5}.g6{grid-column:span 6}.g7{grid-column:span 7}.g8{grid-column:span 8}.g12{grid-column:span 12}
@media(max-width:1180px){.g4,.g5,.g6,.g7,.g8{grid-column:span 12}}
.sect-gap{height:12px}

/* ── panel ── */
.panel{background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:3px;display:flex;flex-direction:column;min-width:0;box-shadow:0 1px 0 rgba(255,255,255,.022) inset, 0 6px 22px rgba(0,0,0,.28);transition:border-color .18s ease, box-shadow .18s ease}
.panel:hover{border-color:var(--line2);box-shadow:0 1px 0 rgba(255,255,255,.04) inset, 0 12px 34px rgba(0,0,0,.34)}
.panel-h{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--line);flex-shrink:0}
.panel-h::before{content:"";width:3px;height:11px;background:linear-gradient(180deg,#ffffff,rgba(255,255,255,.18));flex-shrink:0;border-radius:1px}
.ph-ic{color:var(--acc);opacity:.85;flex-shrink:0}
.ph-t{font-family:var(--mono);font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#d4dae7}
.ph-r{margin-left:auto;display:flex;align-items:center;gap:9px;font-family:var(--mono);font-size:10px;color:var(--txt3)}
/* ── standardized panel chrome: source tag · last-updated · live state ── */
.src-tag{font-family:var(--mono);font-size:8.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--txt3);border:1px solid var(--line);border-radius:2px;padding:1px 5px;white-space:nowrap}
.upd{font-family:var(--mono);font-size:9px;color:var(--txt3);letter-spacing:.02em;white-space:nowrap}
.live{display:inline-flex;align-items:center;gap:5px;font-family:var(--mono);font-size:9px;letter-spacing:.06em;color:var(--up);white-space:nowrap}
.live::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--up);box-shadow:0 0 7px rgba(22,201,138,.75);animation:pulseOk 2.4s ease-in-out infinite}
.live.stale{color:var(--txt3)} .live.stale::before{background:var(--txt3);box-shadow:none;animation:none}
.live.down{color:var(--dn)} .live.down::before{background:var(--dn);box-shadow:0 0 7px rgba(251,62,87,.6);animation:none}
.panel-b{padding:9px 11px;min-height:0}
.pad0{padding:0}
.scroll{overflow-y:auto}

/* ── tables ── */
.tbl-w{overflow:auto;min-width:0}
.tbl{width:100%;border-collapse:collapse;font-family:var(--mono);font-size:12px;font-variant-numeric:tabular-nums;white-space:nowrap}
.tbl th{position:sticky;top:0;z-index:2;background:var(--panel2);font-size:10px;font-weight:600;letter-spacing:.11em;text-transform:uppercase;color:#9aa4bb;text-align:left;padding:6px 10px;border-bottom:1px solid var(--line);user-select:none}
.tbl td{padding:6px 10px;border-bottom:1px solid rgba(25,30,43,.6);color:var(--txt)}
.tbl tbody tr{transition:background .12s ease}
.tbl tbody tr:hover{background:rgba(255,255,255,.045)}
.tbl tbody tr:last-child td{border-bottom:none}
.th-btn{cursor:pointer;display:inline-flex;align-items:center;gap:3px}
.th-btn:hover{color:var(--txt2)}
.th-btn.on{color:var(--acc)}
.row-click{cursor:pointer}
.row-click.sel{background:var(--acc-soft)!important;box-shadow:inset 2px 0 0 var(--acc)}
.coin-cell{display:flex;align-items:center;gap:7px}
.coin-sym{font-weight:700;letter-spacing:.03em}
.coin-x{opacity:0;color:var(--txt3);cursor:pointer;transition:opacity .12s}
tr:hover .coin-x{opacity:1}
.coin-x:hover{color:var(--dn)}

/* ── numbers / flash ── */
.num{font-family:var(--mono);font-variant-numeric:tabular-nums}
.fl-up{animation:flUp .7s ease-out}
.fl-dn{animation:flDn .7s ease-out}
@keyframes flUp{0%{color:var(--up);text-shadow:0 0 9px rgba(22,201,138,.65);background:rgba(22,201,138,.08)}100%{}}
@keyframes flDn{0%{color:var(--dn);text-shadow:0 0 9px rgba(251,62,87,.65);background:rgba(251,62,87,.08)}100%{}}

/* ── tags / chips / pills ── */
.tag{display:inline-flex;align-items:center;gap:4px;font-family:var(--mono);font-size:9.5px;font-weight:700;letter-spacing:.08em;padding:2px 7px;border-radius:3px;text-transform:uppercase}
.tag.long{color:var(--up);background:var(--up-soft);border:1px solid rgba(22,201,138,.3)}
.tag.short{color:var(--dn);background:var(--dn-soft);border:1px solid rgba(251,62,87,.3)}
.tag.warn{color:var(--acc);background:var(--acc-soft);border:1px solid rgba(255,255,255,.3)}
.tag.crit{color:var(--dn);background:var(--dn-soft);border:1px solid rgba(251,62,87,.4);box-shadow:0 0 10px rgba(251,62,87,.15)}
.tag.info{color:var(--txt2);background:rgba(255,255,255,.04);border:1px solid var(--line2)}
.tag.est{color:var(--txt3);background:rgba(255,255,255,.03);border:1px dashed var(--line2);text-transform:none;letter-spacing:.03em;font-weight:500}
.pills{display:flex;gap:4px;flex-wrap:wrap}
.pill{font-family:var(--mono);font-size:10px;padding:3px 9px;border-radius:3px;border:1px solid var(--line);background:var(--panel);color:var(--txt2);cursor:pointer;letter-spacing:.05em;transition:all .13s ease}
.pill:hover{color:var(--txt);border-color:var(--line2)}
.pill.on{color:var(--acc);border-color:rgba(255,255,255,.45);background:var(--acc-soft)}
.seg{display:flex;border:1px solid var(--line);border-radius:4px;overflow:hidden}
.seg-btn{font-family:var(--mono);font-size:10px;letter-spacing:.06em;padding:4px 10px;background:var(--panel);border:none;color:var(--txt3);cursor:pointer;transition:all .13s}
.seg-btn:not(:last-child){border-right:1px solid var(--line)}
.seg-btn:hover{color:var(--txt2)}
.seg-btn.on{color:var(--acc);background:var(--acc-soft)}
.chip{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:10.5px;padding:4px 9px;border-radius:4px;border:1px solid var(--line2);background:var(--panel2);color:var(--txt2)}
.chip-x{cursor:pointer;color:var(--txt3);display:flex}
.chip-x:hover{color:var(--dn)}

/* ── inputs / buttons ── */
.input{font-family:var(--mono);font-size:11.5px;background:var(--bg2);border:1px solid var(--line);border-radius:4px;color:var(--txt);padding:6px 9px;outline:none;transition:border .13s, box-shadow .13s;min-width:0}
.input:focus{border-color:rgba(255,255,255,.5);box-shadow:0 0 0 2px rgba(255,255,255,.12)}
.input::placeholder{color:var(--txt3)}
.select{font-family:var(--mono);font-size:11px;background:var(--bg2);border:1px solid var(--line);border-radius:4px;color:var(--txt);padding:6px 8px;outline:none;cursor:pointer}
.select:focus{border-color:rgba(255,255,255,.5)}
.btn{font-family:var(--mono);font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;font-weight:600;padding:6px 12px;border-radius:4px;border:1px solid var(--line2);background:var(--panel3);color:var(--txt2);cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all .14s ease}
.btn:hover{color:var(--txt);border-color:#39456b}
.btn-acc{color:#0a0a0a;background:linear-gradient(180deg,#ffffff,#c9ced9);border-color:rgba(255,255,255,.55);box-shadow:0 0 14px rgba(255,255,255,.12)}
.btn-acc:hover{color:#000;box-shadow:0 0 20px rgba(255,255,255,.22);border-color:#fff}
.btn-ghost{background:transparent;border-color:var(--line)}
.btn:disabled{opacity:.45;cursor:not-allowed}
.in-row{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
.lbl{font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt3);margin-bottom:4px;display:block}
.form-row{margin-bottom:11px}

/* ── skeletons ── */
.skel{position:relative;overflow:hidden;background:rgba(255,255,255,.035);border-radius:3px}
.skel::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.05),transparent);animation:shim 1.4s infinite}
@keyframes shim{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.skel-row{height:13px;margin:11px 12px}

/* ── stat cards ── */
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.stat-card{background:var(--bg2);border:1px solid var(--line);border-radius:4px;padding:9px 10px;display:flex;flex-direction:column;gap:4px;transition:border .15s}
.stat-card:hover{border-color:var(--line2)}
.stat-l{font-family:var(--mono);font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;color:var(--txt3);display:flex;align-items:center;gap:6px}
.stat-v{font-family:var(--mono);font-size:17px;font-weight:600;letter-spacing:.01em}
.stat-s{font-family:var(--mono);font-size:10px;color:var(--txt3)}

/* ── ticker ── */
.ticker{height:30px;border-top:1px solid var(--line);background:var(--bg2);overflow:hidden;position:relative;flex-shrink:0;display:flex;align-items:center}
.ticker::before,.ticker::after{content:'';position:absolute;top:0;bottom:0;width:50px;z-index:2;pointer-events:none}
.ticker::before{left:0;background:linear-gradient(90deg,var(--bg2),transparent)}
.ticker::after{right:0;background:linear-gradient(-90deg,var(--bg2),transparent)}
.tk-inner{display:flex;gap:30px;white-space:nowrap;animation:tk 52s linear infinite;padding-left:10px}
.ticker:hover .tk-inner{animation-play-state:paused}
@keyframes tk{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.tk-item{display:inline-flex;align-items:center;gap:7px;font-family:var(--mono);font-size:11px}
.tk-sym{color:var(--txt2);font-weight:700;letter-spacing:.04em}

/* ── toasts ── */
.toasts{position:fixed;right:14px;bottom:44px;display:flex;flex-direction:column;gap:8px;z-index:200;width:330px}
.toast{display:flex;gap:9px;padding:10px 11px;border-radius:6px;background:rgba(14,17,26,.92);backdrop-filter:blur(10px);border:1px solid var(--line2);animation:toastIn .22s ease;cursor:pointer}
.toast.warn{border-color:rgba(255,255,255,.5);box-shadow:0 0 22px rgba(255,255,255,.16), 0 10px 30px rgba(0,0,0,.5)}
.toast.crit{border-color:rgba(251,62,87,.55);box-shadow:0 0 22px rgba(251,62,87,.2), 0 10px 30px rgba(0,0,0,.5)}
.toast.info{box-shadow:0 10px 30px rgba(0,0,0,.5)}
@keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
.toast-t{font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:3px}
.toast.warn .toast-t{color:var(--acc)} .toast.crit .toast-t{color:var(--dn)} .toast.info .toast-t{color:var(--txt2)}
.toast-m{font-family:var(--mono);font-size:11px;color:var(--txt);line-height:1.45;word-break:break-word}
.toast-x{margin-left:auto;color:var(--txt3);flex-shrink:0}

/* ── slideover ── */
.sl-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(2px);z-index:150;animation:fIn .15s ease}
@keyframes fIn{from{opacity:0}to{opacity:1}}
.slideover{position:fixed;top:0;right:0;bottom:0;width:392px;max-width:92vw;background:var(--panel);border-left:1px solid var(--line2);z-index:160;display:flex;flex-direction:column;animation:slIn .2s ease;box-shadow:-20px 0 50px rgba(0,0,0,.5)}
@keyframes slIn{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}
.sl-h{display:flex;align-items:center;gap:9px;padding:13px 14px;border-bottom:1px solid var(--line);flex-shrink:0}
.sl-b{flex:1;overflow-y:auto;padding:13px 14px}
.rule-item{display:flex;align-items:center;gap:9px;padding:8px 9px;border:1px solid var(--line);border-radius:4px;margin-bottom:7px;background:var(--bg2)}
.rule-txt{font-family:var(--mono);font-size:10.5px;line-height:1.5;color:var(--txt);flex:1;min-width:0}
.log-item{padding:8px 9px;border-left:2px solid var(--line2);margin-bottom:7px;background:var(--bg2);border-radius:0 6px 6px 0}
.log-item.warn{border-left-color:var(--acc)} .log-item.crit{border-left-color:var(--dn)}
.log-t{font-family:var(--mono);font-size:9px;color:var(--txt3);letter-spacing:.07em;margin-bottom:2px}
.log-m{font-family:var(--mono);font-size:10.5px;color:var(--txt);line-height:1.5}

/* ── toggle ── */
.tgl{position:relative;width:30px;height:17px;border-radius:9px;background:var(--line);cursor:pointer;transition:background .15s;flex-shrink:0;border:none}
.tgl::after{content:'';position:absolute;top:2px;left:2px;width:13px;height:13px;border-radius:50%;background:var(--txt3);transition:all .15s}
.tgl.on{background:rgba(255,255,255,.35)}
.tgl.on::after{left:15px;background:var(--acc);box-shadow:0 0 8px var(--acc-glow)}

/* ── liq heatmap ── */
.heat{display:flex;flex-direction:column;height:312px;position:relative}
.heat-row{flex:1;display:flex;align-items:stretch;gap:7px;min-height:0}
.heat-lab{width:74px;font-family:var(--mono);font-size:9px;color:var(--txt3);display:flex;align-items:center;justify-content:flex-end;flex-shrink:0;letter-spacing:.02em}
.heat-track{flex:1;display:flex;align-items:center;gap:2px;border-left:1px solid var(--line);padding-left:5px;position:relative}
.heat-bar{height:62%;border-radius:2px;min-width:0;transition:width .35s ease}
.heat-bar.long{background:linear-gradient(90deg,rgba(251,62,87,.85),rgba(251,62,87,.35));box-shadow:0 0 8px rgba(251,62,87,.25)}
.heat-bar.short{background:linear-gradient(90deg,rgba(22,201,138,.85),rgba(22,201,138,.35));box-shadow:0 0 8px rgba(22,201,138,.25)}
.heat-mark{position:absolute;left:74px;right:0;height:0;border-top:1.5px dashed var(--acc);z-index:3;pointer-events:none;filter:drop-shadow(0 0 4px var(--acc-glow))}
.heat-mark span{position:absolute;right:0;top:-9px;font-family:var(--mono);font-size:9px;color:#0a0a0a;background:var(--acc);padding:1px 6px;border-radius:3px;font-weight:700}
.heat-foot{font-family:var(--mono);font-size:10px;color:var(--txt3);padding-top:8px;border-top:1px dashed var(--line);margin-top:8px;min-height:30px;line-height:1.5}
.legend{display:flex;gap:13px;align-items:center;font-family:var(--mono);font-size:9.5px;color:var(--txt3);letter-spacing:.04em}
.ldot{width:8px;height:8px;border-radius:2px;display:inline-block;margin-right:5px;vertical-align:-1px}

/* ── states ── */
.err-box{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;padding:26px 14px;color:var(--txt3);font-family:var(--mono);font-size:11px;text-align:center}
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:30px 18px;text-align:center}
.e-ic{width:38px;height:38px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:var(--panel3);border:1px solid var(--line2);color:var(--txt3);margin-bottom:3px}
.e-t{font-size:12.5px;font-weight:600;color:var(--txt2)}
.e-s{font-family:var(--mono);font-size:10.5px;color:var(--txt3);line-height:1.6;max-width:330px}

/* ── news ── */
.news-item{display:flex;flex-direction:column;gap:4px;padding:10px 12px;border-bottom:1px solid rgba(27,33,48,.55);transition:background .12s}
.news-item:hover{background:rgba(255,255,255,.02)}
.n-meta{display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:9.5px;color:var(--txt3);letter-spacing:.05em}
.n-src{color:var(--txt2);font-weight:600;text-transform:uppercase;letter-spacing:.08em}
.n-title{font-size:12.5px;line-height:1.45;color:var(--txt);text-decoration:none;display:flex;gap:6px;align-items:baseline}
.n-title:hover{color:var(--acc)}
.n-cats{display:flex;gap:4px;flex-wrap:wrap;margin-top:1px}
.n-cat{font-family:var(--mono);font-size:8.5px;letter-spacing:.06em;color:var(--txt3);border:1px solid var(--line);border-radius:3px;padding:1px 5px}
.sdot{width:7px;height:7px;border-radius:50%;flex-shrink:0}

/* ── chart ── */
.chart-box{height:calc(100vh - 332px);min-height:430px;position:relative;background:var(--bg2);border-radius:0 0 4px 4px;overflow:hidden}
.tv-wrap{position:absolute;inset:0}
.native-wrap{position:absolute;inset:0;cursor:crosshair}
.ohlc-chip{position:absolute;top:9px;left:11px;z-index:5;font-family:var(--mono);font-size:10.5px;background:rgba(10,12,18,.85);border:1px solid var(--line2);border-radius:6px;padding:5px 9px;pointer-events:none;display:flex;gap:11px;backdrop-filter:blur(6px)}
.cb-notice{position:absolute;bottom:10px;left:10px;z-index:6;display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:10px;color:var(--acc);background:rgba(16,18,26,.92);border:1px solid rgba(255,255,255,.4);border-radius:6px;padding:6px 10px;box-shadow:0 0 16px rgba(255,255,255,.12)}
.mini-item{display:flex;align-items:center;justify-content:space-between;padding:6px 9px;border-radius:4px;cursor:pointer;font-family:var(--mono);font-size:11px;transition:background .12s;border:1px solid transparent}
.mini-item:hover{background:rgba(255,255,255,.03)}
.mini-item.sel{background:var(--acc-soft);border-color:rgba(255,255,255,.3)}
.kpi-row{display:flex;gap:0;border-bottom:1px solid var(--line);background:var(--panel2);border-radius:4px 4px 0 0;overflow-x:auto}
.kpi{padding:10px 16px;border-right:1px solid var(--line);min-width:108px}
.kpi-l{font-family:var(--mono);font-size:9px;letter-spacing:.11em;text-transform:uppercase;color:var(--txt3);margin-bottom:3px}
.kpi-v{font-family:var(--mono);font-size:14.5px;font-weight:600}

/* ── misc ── */
.addr{font-family:var(--mono);font-size:10px;color:var(--txt3);letter-spacing:.02em}
.wal-head{display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--panel3);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.spark{display:block}
.hr{border:none;border-top:1px solid var(--line);margin:12px 0}
.basis{font-size:9.5px}
@media(max-width:1020px){.app{grid-template-columns:60px 1fr}.brand-name,.brand-sub,.nav-item span,.side-foot{display:none}.nav-item{justify-content:center;padding:9px 0}}

/* ── command palette ── */
.cmdk-bg{position:fixed;inset:0;z-index:240;background:rgba(3,4,6,.66);backdrop-filter:blur(5px);display:flex;align-items:flex-start;justify-content:center;padding-top:13vh;animation:fIn .14s ease}
.cmdk{width:560px;max-width:92vw;background:var(--panel2);border:1px solid var(--line2);border-radius:8px;box-shadow:0 30px 80px rgba(0,0,0,.6);overflow:hidden;animation:cmdkIn .16s ease}
@keyframes cmdkIn{from{opacity:0;transform:translateY(-8px) scale(.985)}to{opacity:1;transform:none}}
.cmdk-head{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line)}
.cmdk-input{flex:1;background:none;border:none;outline:none;color:var(--txt);font-family:var(--mono);font-size:13.5px}
.cmdk-input::placeholder{color:var(--txt3)}
.cmdk-list{max-height:340px;overflow-y:auto;padding:6px}
.cmdk-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:4px;cursor:pointer;font-family:var(--mono);font-size:12px}
.cmdk-item.on{background:rgba(255,255,255,.06)}
.cmdk-tag{font-size:8.5px;letter-spacing:.12em;color:var(--txt3);border:1px solid var(--line2);border-radius:3px;padding:2px 6px;flex-shrink:0;text-transform:uppercase}
.cmdk-lab{font-weight:700;color:var(--txt)}
.cmdk-px{margin-left:auto;color:var(--txt2)}
.cmdk-empty{padding:18px;text-align:center;font-family:var(--mono);font-size:11px;color:var(--txt3)}
.cmdk-foot{display:flex;gap:16px;padding:9px 14px;border-top:1px solid var(--line);font-family:var(--mono);font-size:9.5px;color:var(--txt3)}
.kbd{display:inline-block;font-family:var(--mono);font-size:9px;color:var(--txt2);border:1px solid var(--line2);border-bottom-width:2px;border-radius:3px;padding:1px 5px;background:var(--bg2);margin-right:4px}
/* ── orderbook ── */
.ob{display:grid;grid-template-columns:1fr 1fr;gap:0}
.ob-col{min-width:0}
.ob-col:first-child{border-right:1px solid var(--line)}
.ob-head{display:flex;justify-content:space-between;font-family:var(--mono);font-size:8.5px;letter-spacing:.12em;color:var(--txt3);padding:6px 10px;border-bottom:1px solid var(--line)}
.ob-row{position:relative;display:flex;justify-content:space-between;gap:8px;padding:3.5px 10px;font-family:var(--mono);font-size:11.5px;overflow:hidden}
.ob-row .num{position:relative;z-index:1}
.ob-bar{position:absolute;top:0;bottom:0;opacity:.14}
.ob-row.bid .ob-bar{right:0;background:var(--up)}
.ob-row.ask .ob-bar{left:0;background:var(--dn)}
/* ── whale tape ── */
.tape-row{animation:tapeIn .55s ease}
@keyframes tapeIn{0%{background:rgba(255,255,255,.10)}100%{background:transparent}}

.sub-h{font-family:var(--mono);font-size:9.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--txt3);margin:4px 0 7px}
.big-notional{color:#fff;font-weight:700;text-shadow:0 0 12px rgba(255,255,255,.3)}
.src-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;display:inline-block}
.src-dot.ok{background:var(--up);box-shadow:0 0 7px rgba(22,201,138,.7)}
.src-dot.warn{background:#d4dae7;box-shadow:0 0 7px rgba(255,255,255,.5)}
.src-dot.down{background:var(--dn);box-shadow:0 0 7px rgba(251,62,87,.6)}
`;

export const AUTH_CSS = `
.auth-shell{min-height:100vh;width:100%;display:flex;align-items:center;justify-content:center;background:var(--bg);color:var(--txt);font-family:var(--sans);position:relative;overflow:hidden;padding:24px}
.auth-shell::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(900px 520px at 82% -8%, rgba(255,255,255,.06), transparent 60%),radial-gradient(820px 460px at -8% 108%, rgba(255,255,255,.04), transparent 55%);
  animation:ambient 22s ease-in-out infinite alternate}
.auth-card{position:relative;z-index:1;width:100%;max-width:392px;background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:12px;padding:30px 28px;box-shadow:0 1px 0 rgba(255,255,255,.03) inset, 0 20px 60px rgba(0,0,0,.5)}
.auth-brand{display:flex;flex-direction:column;align-items:center;gap:12px;margin-bottom:22px;text-align:center}
.auth-logo{width:74px;height:74px;display:flex;align-items:center;justify-content:center;background:none;border:none;position:relative;filter:drop-shadow(0 0 16px rgba(255,255,255,.22))}
.auth-title{font-family:var(--sans);font-weight:700;font-size:17px;letter-spacing:.14em;color:#ffffff}
.auth-sub{font-family:var(--mono);font-size:10px;color:#9aa3b8;letter-spacing:.16em}
.auth-tag{font-family:var(--mono);font-size:10.5px;color:var(--txt2);line-height:1.7;text-align:center;margin-bottom:22px}
.auth-tabs{display:flex;border:1px solid var(--line);border-radius:8px;overflow:hidden;margin-bottom:20px}
.auth-tab{flex:1;text-align:center;padding:9px 0;font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt3);background:var(--bg2);cursor:pointer;border:none;transition:all .15s ease}
.auth-tab:not(:last-child){border-right:1px solid var(--line)}
.auth-tab.on{color:var(--acc);background:var(--acc-soft)}
.auth-field{margin-bottom:14px}
.auth-field label{display:block;font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--txt3);margin-bottom:6px}
.auth-input{width:100%;font-family:var(--mono);font-size:13px;background:var(--bg2);border:1px solid var(--line);border-radius:7px;color:var(--txt);padding:10px 12px;outline:none;transition:border .15s, box-shadow .15s}
.auth-input:focus{border-color:rgba(255,255,255,.4);box-shadow:0 0 0 2px rgba(255,255,255,.08)}
.auth-btn{width:100%;font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;padding:11px 0;border-radius:7px;border:1px solid rgba(255,255,255,.55);background:linear-gradient(180deg,#ffffff,#c9ced9);color:#0a0a0a;cursor:pointer;transition:all .15s ease;margin-top:6px}
.auth-btn:hover{box-shadow:0 0 22px rgba(255,255,255,.22)}
.auth-btn:disabled{opacity:.5;cursor:not-allowed}
.auth-btn2{width:100%;font-family:var(--mono);font-size:10.5px;letter-spacing:.08em;padding:9px 0;border-radius:7px;border:1px solid var(--line2);background:var(--panel3);color:var(--txt2);cursor:pointer;margin-top:8px;transition:all .14s ease}
.auth-btn2:hover{color:var(--txt);border-color:#39456b}
.auth-msg{font-family:var(--mono);font-size:10.5px;line-height:1.6;padding:9px 11px;border-radius:7px;margin-bottom:14px}
.auth-msg.err{color:var(--dn);background:var(--dn-soft);border:1px solid rgba(251,62,87,.3)}
.auth-msg.ok{color:var(--up);background:var(--up-soft);border:1px solid rgba(22,201,138,.3)}
.auth-msg.info{color:var(--txt2);background:rgba(255,255,255,.03);border:1px solid var(--line2)}
.auth-foot{text-align:center;margin-top:16px;font-family:var(--mono);font-size:10.5px;color:var(--txt3)}
.auth-foot a, .auth-link{color:var(--txt2);cursor:pointer;text-decoration:underline;text-decoration-color:var(--line2)}
.auth-foot a:hover, .auth-link:hover{color:var(--acc)}
.auth-spin{width:28px;height:28px;border-radius:50%;border:2px solid var(--line2);border-top-color:var(--acc);animation:spin .8s linear infinite;margin:0 auto}
@keyframes spin{to{transform:rotate(360deg)}}
.invite-boxes{display:flex;gap:8px;justify-content:center;margin-bottom:6px}
.invite-box{width:38px;height:46px;text-align:center;font-family:var(--mono);font-size:18px;font-weight:700;background:var(--bg2);border:1px solid var(--line);border-radius:7px;color:var(--txt);outline:none;text-transform:uppercase}
.invite-box:focus{border-color:rgba(255,255,255,.4);box-shadow:0 0 0 2px rgba(255,255,255,.08)}
.admin-code{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border:1px solid var(--line);border-radius:4px;background:var(--bg2);margin-bottom:7px;font-family:var(--mono);font-size:11.5px}
.admin-code .code{letter-spacing:.12em;font-weight:700}
.acct-pop{position:absolute;top:46px;right:0;width:230px;background:var(--panel2);border:1px solid var(--line2);border-radius:6px;box-shadow:0 16px 40px rgba(0,0,0,.5);z-index:50;overflow:hidden;animation:slIn .15s ease}
.acct-row{padding:11px 13px;border-bottom:1px solid var(--line);font-family:var(--mono)}
.acct-email{font-size:11px;color:var(--txt);word-break:break-all}
.acct-badge{display:inline-block;margin-top:5px;font-size:9px;letter-spacing:.1em;color:var(--acc);background:var(--acc-soft);border:1px solid rgba(255,255,255,.2);border-radius:4px;padding:1px 6px}
.acct-item{display:flex;align-items:center;gap:9px;padding:10px 13px;font-family:var(--mono);font-size:11px;color:var(--txt2);cursor:pointer;transition:background .12s;border:none;background:none;width:100%;text-align:left}
.acct-item:hover{background:rgba(255,255,255,.04);color:var(--txt)}
`;
export const LANDING_CSS = `
.landing{position:fixed;inset:0;overflow:hidden;background:#050608;display:flex;flex-direction:column}
.landing::before{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
  background-image:linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);
  background-size:50px 50px;mask-image:radial-gradient(circle at 58% 46%, black, transparent 76%);-webkit-mask-image:radial-gradient(circle at 58% 46%, black, transparent 76%)}
.landing::after{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(700px 560px at 58% 42%, rgba(255,255,255,.06), transparent 64%),
    radial-gradient(1100px 700px at 100% 0%, rgba(70,90,140,.10), transparent 60%),
    radial-gradient(900px 600px at 0% 100%, rgba(40,60,110,.10), transparent 58%),
    linear-gradient(180deg, transparent 38%, rgba(5,6,8,.78) 100%)}
.cursor-glow{position:absolute;inset:0;z-index:2;pointer-events:none;
  background:radial-gradient(280px circle at var(--mx,-999px) var(--my,-999px), rgba(255,255,255,.07), transparent 70%);
  transition:background .06s linear}
.ph-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:1;display:block}
.landing-nav{position:relative;z-index:6;display:flex;align-items:center;gap:11px;padding:22px 30px}
.landing-nav .ln-brand{display:flex;align-items:center;gap:10px}
.ln-logo{width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:none;border:none;filter:drop-shadow(0 0 8px rgba(255,255,255,.2))}
.ln-name{font-family:var(--sans);font-weight:700;font-size:13.5px;letter-spacing:.2em;color:#fff}
.landing-nav .ln-right{margin-left:auto;display:flex;gap:12px;align-items:center}
.ln-icon{color:#8a93a8;display:flex;align-items:center;transition:color .15s,transform .15s}
.ln-icon:hover{color:#5865F2;transform:translateY(-1px)}
.ln-link{font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#8a93a8;text-decoration:none;padding:8px 12px;border-radius:6px;transition:color .15s}
.ln-link:hover{color:#fff}
.landing-hero{position:relative;z-index:6;flex:1;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;text-align:left;padding:0 0 5vh 6vw;max-width:720px;pointer-events:none}
.hero-eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.42em;text-transform:uppercase;color:#9aa3b8;margin-bottom:18px;opacity:0;animation:upIn .7s 1.0s ease forwards}
.hero-title{font-family:var(--sans);font-weight:700;font-size:clamp(46px,8.5vw,104px);letter-spacing:-.02em;line-height:.92;color:#ffffff;margin-bottom:22px;opacity:0;animation:upIn .85s 1.16s ease forwards;text-shadow:0 4px 60px rgba(0,0,0,.85),0 0 60px rgba(255,255,255,.10)}
.hero-sub{font-family:var(--sans);font-size:15.5px;line-height:1.7;color:#b3bacb;max-width:560px;margin-bottom:8px;opacity:0;animation:upIn .8s 1.36s ease forwards;text-shadow:0 1px 24px rgba(0,0,0,.95)}
.hero-sub-strong{font-family:var(--sans);font-size:15.5px;font-weight:600;color:#fff;margin-bottom:34px;opacity:0;animation:upIn .8s 1.5s ease forwards;text-shadow:0 1px 24px rgba(0,0,0,.95)}
.hero-cta{display:flex;gap:12px;align-items:center;pointer-events:auto;opacity:0;animation:upIn .8s 1.64s ease forwards;flex-wrap:wrap}
@keyframes upIn{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}
.btn-enter{font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;padding:15px 30px;border-radius:10px;border:1px solid rgba(255,255,255,.7);background:linear-gradient(180deg,#fff,#d2d7e0);color:#060708;cursor:pointer;transition:all .18s ease;display:inline-flex;align-items:center;gap:9px}
.btn-enter:hover{box-shadow:0 0 38px rgba(255,255,255,.4);transform:translateY(-1px)}
.btn-enter2{font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:600;padding:15px 26px;border-radius:10px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.04);color:#cdd3e0;cursor:pointer;transition:all .18s ease;backdrop-filter:blur(6px)}
.btn-enter2:hover{color:#fff;border-color:rgba(255,255,255,.5);background:rgba(255,255,255,.08)}
.btn-discord{font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;padding:15px 22px;border-radius:10px;border:1px solid rgba(88,101,242,.4);background:rgba(88,101,242,.12);color:#aab4ff;cursor:pointer;transition:all .18s ease;display:inline-flex;align-items:center;gap:9px;text-decoration:none}
.btn-discord:hover{color:#fff;background:rgba(88,101,242,.24);border-color:rgba(88,101,242,.8);box-shadow:0 0 26px rgba(88,101,242,.3)}
.landing-foot{position:relative;z-index:6;display:flex;align-items:center;gap:22px;padding:16px 6vw 24px;font-family:var(--mono);font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:#707892;opacity:0;animation:upIn .8s 1.78s ease forwards}
.landing-foot .ft-dot{width:5px;height:5px;border-radius:50%;background:var(--up);box-shadow:0 0 7px rgba(22,201,138,.8);display:inline-block;margin-right:7px;vertical-align:1px}
.auth-overlay{position:fixed;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;background:rgba(4,5,7,.74);backdrop-filter:blur(8px);animation:fIn .25s ease;padding:24px}
.auth-close{position:absolute;top:18px;right:20px;width:34px;height:34px;border-radius:8px;border:1px solid var(--line2);background:var(--panel);color:var(--txt2);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:30}
.auth-close:hover{color:var(--txt)}
@media(max-width:640px){.landing-nav .ln-name span{display:none}.landing-hero{padding-left:7vw;padding-right:7vw}.landing-foot{flex-wrap:wrap;gap:10px}}
`;
