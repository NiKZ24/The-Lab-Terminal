export const CSS = `
:root{
  --bg:#07080c; --bg2:#0a0c12; --panel:#0e1118; --panel2:#121622; --panel3:#161b2a;
  --line:#1b2130; --line2:#27304a;
  --txt:#e8ebf2; --txt2:#9aa3b8; --txt3:#5b6478;
  --up:#0ecb81; --up-soft:rgba(14,203,129,.12); --dn:#f6465d; --dn-soft:rgba(246,70,93,.12);
  --acc:#eef1f7; --acc-soft:rgba(238,241,247,.07); --acc-glow:rgba(238,241,247,.35);
  --mono:'JetBrains Mono',ui-monospace,'SF Mono','Cascadia Mono',Menlo,Consolas,monospace;
  --sans:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
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
::-webkit-scrollbar{width:9px;height:9px}
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
.brand-dot{width:38px;height:38px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(255,255,255,.10),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.16);color:var(--acc);flex-shrink:0;box-shadow:0 0 18px rgba(255,255,255,.07);position:relative;overflow:hidden}
.brand-dot::after{content:'';position:absolute;top:-50%;left:-60%;width:40%;height:200%;background:linear-gradient(115deg,transparent,rgba(255,255,255,.35),transparent);transform:rotate(20deg);animation:sheen 5s ease-in-out infinite}
@keyframes sheen{0%,55%{left:-60%}100%{left:160%}}
.brand-name{font-family:var(--mono);font-weight:700;font-size:12.5px;letter-spacing:.06em;line-height:1.25}
.brand-sub{font-family:var(--mono);font-size:9.5px;color:var(--txt3);letter-spacing:.14em}
.nav{padding:10px 8px;display:flex;flex-direction:column;gap:2px}
.nav-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:7px;border:1px solid transparent;color:var(--txt2);cursor:pointer;font-size:12.5px;font-weight:500;letter-spacing:.02em;transition:all .15s ease;background:none;text-align:left;width:100%;font-family:var(--sans)}
.nav-item:hover{color:var(--txt);background:rgba(255,255,255,.03)}
.nav-item.on{color:var(--acc);background:var(--acc-soft);border-color:rgba(245,166,35,.25)}
.nav-ic{flex-shrink:0;opacity:.9}
.side-foot{margin-top:auto;padding:12px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:8px}
.src-row{display:flex;align-items:center;justify-content:space-between;font-family:var(--mono);font-size:10px;color:var(--txt3);letter-spacing:.05em}
.src-row b{color:var(--txt2);font-weight:500}
.dot{width:7px;height:7px;border-radius:50%;display:inline-block;flex-shrink:0}
.dot.ok{background:var(--up);box-shadow:0 0 7px rgba(14,203,129,.7);animation:pulseOk 2.4s ease-in-out infinite}
@keyframes pulseOk{0%,100%{box-shadow:0 0 6px rgba(14,203,129,.55)}50%{box-shadow:0 0 12px rgba(14,203,129,.95)}}
.dot.warn{background:var(--acc);box-shadow:0 0 7px var(--acc-glow)}
.dot.err{background:var(--dn);box-shadow:0 0 7px rgba(246,70,93,.7)}
.side-tag{font-family:var(--mono);font-size:9px;color:var(--txt3);letter-spacing:.1em;line-height:1.6;padding-top:4px;border-top:1px dashed var(--line)}

/* ── header ── */
.main-col{display:flex;flex-direction:column;min-width:0;height:100vh}
.hdr{display:flex;align-items:center;gap:14px;padding:0 16px;height:52px;border-bottom:1px solid var(--line);background:rgba(10,12,18,.7);backdrop-filter:blur(8px);flex-shrink:0}
.hdr-title{font-size:14px;font-weight:600;letter-spacing:.02em}
.hdr-sub{font-family:var(--mono);font-size:10px;color:var(--txt3);letter-spacing:.12em;margin-top:1px}
.hdr-right{margin-left:auto;display:flex;align-items:center;gap:10px}
.clockbox{display:flex;flex-direction:column;align-items:flex-end;line-height:1.3;margin-right:2px}
.clock-utc{font-family:var(--mono);font-size:12px;color:var(--txt);letter-spacing:.04em}
.clock-loc{font-family:var(--mono);font-size:9.5px;color:var(--txt3);letter-spacing:.06em}
.icon-btn{position:relative;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:7px;border:1px solid var(--line);background:var(--panel);color:var(--txt2);cursor:pointer;transition:all .15s ease}
.icon-btn:hover{color:var(--txt);border-color:var(--line2)}
.icon-btn.on{color:var(--acc);border-color:rgba(245,166,35,.4);background:var(--acc-soft);box-shadow:0 0 12px rgba(245,166,35,.12)}
.bell-badge{position:absolute;top:-5px;right:-5px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:var(--dn);color:#fff;font-family:var(--mono);font-size:9.5px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px rgba(246,70,93,.6)}

/* ── main / grid ── */
.main{flex:1;overflow-y:auto;overflow-x:hidden;padding:14px;min-height:0}
.tabfade{animation:tabIn .18s ease}
@keyframes tabIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:12px}
.g4{grid-column:span 4}.g5{grid-column:span 5}.g6{grid-column:span 6}.g7{grid-column:span 7}.g8{grid-column:span 8}.g12{grid-column:span 12}
@media(max-width:1180px){.g4,.g5,.g6,.g7,.g8{grid-column:span 12}}
.sect-gap{height:12px}

/* ── panel ── */
.panel{background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:9px;display:flex;flex-direction:column;min-width:0;box-shadow:0 1px 0 rgba(255,255,255,.025) inset, 0 8px 24px rgba(0,0,0,.25);transition:border-color .2s ease, box-shadow .2s ease, transform .2s ease}
.panel:hover{border-color:var(--line2);box-shadow:0 1px 0 rgba(255,255,255,.04) inset, 0 12px 34px rgba(0,0,0,.34)}
.panel-h{display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:1px solid var(--line);flex-shrink:0}
.ph-ic{color:var(--acc);opacity:.85;flex-shrink:0}
.ph-t{font-family:var(--mono);font-size:10.5px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--txt2)}
.ph-r{margin-left:auto;display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:10px;color:var(--txt3)}
.panel-b{padding:10px 12px;min-height:0}
.pad0{padding:0}
.scroll{overflow-y:auto}

/* ── tables ── */
.tbl-w{overflow:auto;min-width:0}
.tbl{width:100%;border-collapse:collapse;font-family:var(--mono);font-size:11.5px;font-variant-numeric:tabular-nums;white-space:nowrap}
.tbl th{position:sticky;top:0;z-index:2;background:var(--panel2);font-size:9.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--txt3);text-align:left;padding:7px 10px;border-bottom:1px solid var(--line);user-select:none}
.tbl td{padding:6.5px 10px;border-bottom:1px solid rgba(27,33,48,.55);color:var(--txt)}
.tbl tbody tr{transition:background .12s ease}
.tbl tbody tr:hover{background:rgba(255,255,255,.025)}
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
@keyframes flUp{0%{color:var(--up);text-shadow:0 0 9px rgba(14,203,129,.65);background:rgba(14,203,129,.08)}100%{}}
@keyframes flDn{0%{color:var(--dn);text-shadow:0 0 9px rgba(246,70,93,.65);background:rgba(246,70,93,.08)}100%{}}

/* ── tags / chips / pills ── */
.tag{display:inline-flex;align-items:center;gap:4px;font-family:var(--mono);font-size:9.5px;font-weight:700;letter-spacing:.08em;padding:2px 7px;border-radius:4px;text-transform:uppercase}
.tag.long{color:var(--up);background:var(--up-soft);border:1px solid rgba(14,203,129,.3)}
.tag.short{color:var(--dn);background:var(--dn-soft);border:1px solid rgba(246,70,93,.3)}
.tag.warn{color:var(--acc);background:var(--acc-soft);border:1px solid rgba(245,166,35,.3)}
.tag.crit{color:var(--dn);background:var(--dn-soft);border:1px solid rgba(246,70,93,.4);box-shadow:0 0 10px rgba(246,70,93,.15)}
.tag.info{color:var(--txt2);background:rgba(255,255,255,.04);border:1px solid var(--line2)}
.tag.est{color:var(--txt3);background:rgba(255,255,255,.03);border:1px dashed var(--line2);text-transform:none;letter-spacing:.03em;font-weight:500}
.pills{display:flex;gap:4px;flex-wrap:wrap}
.pill{font-family:var(--mono);font-size:10px;padding:3px 9px;border-radius:5px;border:1px solid var(--line);background:var(--panel);color:var(--txt2);cursor:pointer;letter-spacing:.05em;transition:all .13s ease}
.pill:hover{color:var(--txt);border-color:var(--line2)}
.pill.on{color:var(--acc);border-color:rgba(245,166,35,.45);background:var(--acc-soft)}
.seg{display:flex;border:1px solid var(--line);border-radius:6px;overflow:hidden}
.seg-btn{font-family:var(--mono);font-size:10px;letter-spacing:.06em;padding:4px 10px;background:var(--panel);border:none;color:var(--txt3);cursor:pointer;transition:all .13s}
.seg-btn:not(:last-child){border-right:1px solid var(--line)}
.seg-btn:hover{color:var(--txt2)}
.seg-btn.on{color:var(--acc);background:var(--acc-soft)}
.chip{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:10.5px;padding:4px 9px;border-radius:6px;border:1px solid var(--line2);background:var(--panel2);color:var(--txt2)}
.chip-x{cursor:pointer;color:var(--txt3);display:flex}
.chip-x:hover{color:var(--dn)}

/* ── inputs / buttons ── */
.input{font-family:var(--mono);font-size:11.5px;background:var(--bg2);border:1px solid var(--line);border-radius:6px;color:var(--txt);padding:6px 9px;outline:none;transition:border .13s, box-shadow .13s;min-width:0}
.input:focus{border-color:rgba(245,166,35,.5);box-shadow:0 0 0 2px rgba(245,166,35,.12)}
.input::placeholder{color:var(--txt3)}
.select{font-family:var(--mono);font-size:11px;background:var(--bg2);border:1px solid var(--line);border-radius:6px;color:var(--txt);padding:6px 8px;outline:none;cursor:pointer}
.select:focus{border-color:rgba(245,166,35,.5)}
.btn{font-family:var(--mono);font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;font-weight:600;padding:6px 12px;border-radius:6px;border:1px solid var(--line2);background:var(--panel3);color:var(--txt2);cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all .14s ease}
.btn:hover{color:var(--txt);border-color:#39456b}
.btn-acc{color:#0a0a0a;background:linear-gradient(180deg,#ffffff,#c9ced9);border-color:rgba(255,255,255,.55);box-shadow:0 0 14px rgba(255,255,255,.12)}
.btn-acc:hover{color:#000;box-shadow:0 0 20px rgba(255,255,255,.22);border-color:#fff}
.btn-ghost{background:transparent;border-color:var(--line)}
.btn:disabled{opacity:.45;cursor:not-allowed}
.in-row{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
.lbl{font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt3);margin-bottom:4px;display:block}
.form-row{margin-bottom:11px}

/* ── skeletons ── */
.skel{position:relative;overflow:hidden;background:rgba(255,255,255,.035);border-radius:5px}
.skel::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.05),transparent);animation:shim 1.4s infinite}
@keyframes shim{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.skel-row{height:13px;margin:11px 12px}

/* ── stat cards ── */
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.stat-card{background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:10px 11px;display:flex;flex-direction:column;gap:4px;transition:border .15s}
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
.toast{display:flex;gap:9px;padding:10px 11px;border-radius:8px;background:rgba(14,17,26,.92);backdrop-filter:blur(10px);border:1px solid var(--line2);animation:toastIn .22s ease;cursor:pointer}
.toast.warn{border-color:rgba(245,166,35,.5);box-shadow:0 0 22px rgba(245,166,35,.16), 0 10px 30px rgba(0,0,0,.5)}
.toast.crit{border-color:rgba(246,70,93,.55);box-shadow:0 0 22px rgba(246,70,93,.2), 0 10px 30px rgba(0,0,0,.5)}
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
.rule-item{display:flex;align-items:center;gap:9px;padding:8px 9px;border:1px solid var(--line);border-radius:7px;margin-bottom:7px;background:var(--bg2)}
.rule-txt{font-family:var(--mono);font-size:10.5px;line-height:1.5;color:var(--txt);flex:1;min-width:0}
.log-item{padding:8px 9px;border-left:2px solid var(--line2);margin-bottom:7px;background:var(--bg2);border-radius:0 6px 6px 0}
.log-item.warn{border-left-color:var(--acc)} .log-item.crit{border-left-color:var(--dn)}
.log-t{font-family:var(--mono);font-size:9px;color:var(--txt3);letter-spacing:.07em;margin-bottom:2px}
.log-m{font-family:var(--mono);font-size:10.5px;color:var(--txt);line-height:1.5}

/* ── toggle ── */
.tgl{position:relative;width:30px;height:17px;border-radius:9px;background:var(--line);cursor:pointer;transition:background .15s;flex-shrink:0;border:none}
.tgl::after{content:'';position:absolute;top:2px;left:2px;width:13px;height:13px;border-radius:50%;background:var(--txt3);transition:all .15s}
.tgl.on{background:rgba(245,166,35,.35)}
.tgl.on::after{left:15px;background:var(--acc);box-shadow:0 0 8px var(--acc-glow)}

/* ── liq heatmap ── */
.heat{display:flex;flex-direction:column;height:312px;position:relative}
.heat-row{flex:1;display:flex;align-items:stretch;gap:7px;min-height:0}
.heat-lab{width:74px;font-family:var(--mono);font-size:9px;color:var(--txt3);display:flex;align-items:center;justify-content:flex-end;flex-shrink:0;letter-spacing:.02em}
.heat-track{flex:1;display:flex;align-items:center;gap:2px;border-left:1px solid var(--line);padding-left:5px;position:relative}
.heat-bar{height:62%;border-radius:2px;min-width:0;transition:width .35s ease}
.heat-bar.long{background:linear-gradient(90deg,rgba(246,70,93,.85),rgba(246,70,93,.35));box-shadow:0 0 8px rgba(246,70,93,.25)}
.heat-bar.short{background:linear-gradient(90deg,rgba(14,203,129,.85),rgba(14,203,129,.35));box-shadow:0 0 8px rgba(14,203,129,.25)}
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
.chart-box{height:calc(100vh - 332px);min-height:430px;position:relative;background:var(--bg2);border-radius:0 0 9px 9px;overflow:hidden}
.tv-wrap{position:absolute;inset:0}
.native-wrap{position:absolute;inset:0;cursor:crosshair}
.ohlc-chip{position:absolute;top:9px;left:11px;z-index:5;font-family:var(--mono);font-size:10.5px;background:rgba(10,12,18,.85);border:1px solid var(--line2);border-radius:6px;padding:5px 9px;pointer-events:none;display:flex;gap:11px;backdrop-filter:blur(6px)}
.cb-notice{position:absolute;bottom:10px;left:10px;z-index:6;display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:10px;color:var(--acc);background:rgba(20,16,6,.9);border:1px solid rgba(245,166,35,.4);border-radius:6px;padding:6px 10px;box-shadow:0 0 16px rgba(245,166,35,.12)}
.mini-item{display:flex;align-items:center;justify-content:space-between;padding:6px 9px;border-radius:6px;cursor:pointer;font-family:var(--mono);font-size:11px;transition:background .12s;border:1px solid transparent}
.mini-item:hover{background:rgba(255,255,255,.03)}
.mini-item.sel{background:var(--acc-soft);border-color:rgba(245,166,35,.3)}
.kpi-row{display:flex;gap:0;border-bottom:1px solid var(--line);background:var(--panel2);border-radius:9px 9px 0 0;overflow-x:auto}
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
`;

export const AUTH_CSS = `
.auth-shell{min-height:100vh;width:100%;display:flex;align-items:center;justify-content:center;background:var(--bg);color:var(--txt);font-family:var(--sans);position:relative;overflow:hidden;padding:24px}
.auth-shell::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(900px 520px at 82% -8%, rgba(255,255,255,.06), transparent 60%),radial-gradient(820px 460px at -8% 108%, rgba(255,255,255,.04), transparent 55%);
  animation:ambient 22s ease-in-out infinite alternate}
.auth-card{position:relative;z-index:1;width:100%;max-width:392px;background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:12px;padding:30px 28px;box-shadow:0 1px 0 rgba(255,255,255,.03) inset, 0 20px 60px rgba(0,0,0,.5)}
.auth-brand{display:flex;flex-direction:column;align-items:center;gap:12px;margin-bottom:22px;text-align:center}
.auth-logo{width:54px;height:54px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(255,255,255,.10),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.16);box-shadow:0 0 24px rgba(255,255,255,.08);position:relative;overflow:hidden}
.auth-logo::after{content:'';position:absolute;top:-50%;left:-60%;width:40%;height:200%;background:linear-gradient(115deg,transparent,rgba(255,255,255,.4),transparent);transform:rotate(20deg);animation:sheen 5s ease-in-out infinite}
.auth-logo img{width:36px;height:36px;object-fit:contain;position:relative;z-index:1}
.auth-title{font-family:var(--mono);font-weight:700;font-size:16px;letter-spacing:.12em}
.auth-sub{font-family:var(--mono);font-size:10px;color:var(--txt3);letter-spacing:.16em}
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
.auth-msg.err{color:var(--dn);background:var(--dn-soft);border:1px solid rgba(246,70,93,.3)}
.auth-msg.ok{color:var(--up);background:var(--up-soft);border:1px solid rgba(14,203,129,.3)}
.auth-msg.info{color:var(--txt2);background:rgba(255,255,255,.03);border:1px solid var(--line2)}
.auth-foot{text-align:center;margin-top:16px;font-family:var(--mono);font-size:10.5px;color:var(--txt3)}
.auth-foot a, .auth-link{color:var(--txt2);cursor:pointer;text-decoration:underline;text-decoration-color:var(--line2)}
.auth-foot a:hover, .auth-link:hover{color:var(--acc)}
.auth-spin{width:28px;height:28px;border-radius:50%;border:2px solid var(--line2);border-top-color:var(--acc);animation:spin .8s linear infinite;margin:0 auto}
@keyframes spin{to{transform:rotate(360deg)}}
.invite-boxes{display:flex;gap:8px;justify-content:center;margin-bottom:6px}
.invite-box{width:38px;height:46px;text-align:center;font-family:var(--mono);font-size:18px;font-weight:700;background:var(--bg2);border:1px solid var(--line);border-radius:7px;color:var(--txt);outline:none;text-transform:uppercase}
.invite-box:focus{border-color:rgba(255,255,255,.4);box-shadow:0 0 0 2px rgba(255,255,255,.08)}
.admin-code{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border:1px solid var(--line);border-radius:7px;background:var(--bg2);margin-bottom:7px;font-family:var(--mono);font-size:11.5px}
.admin-code .code{letter-spacing:.12em;font-weight:700}
.acct-pop{position:absolute;top:46px;right:0;width:230px;background:var(--panel2);border:1px solid var(--line2);border-radius:9px;box-shadow:0 16px 40px rgba(0,0,0,.5);z-index:50;overflow:hidden;animation:slIn .15s ease}
.acct-row{padding:11px 13px;border-bottom:1px solid var(--line);font-family:var(--mono)}
.acct-email{font-size:11px;color:var(--txt);word-break:break-all}
.acct-badge{display:inline-block;margin-top:5px;font-size:9px;letter-spacing:.1em;color:var(--acc);background:var(--acc-soft);border:1px solid rgba(255,255,255,.2);border-radius:4px;padding:1px 6px}
.acct-item{display:flex;align-items:center;gap:9px;padding:10px 13px;font-family:var(--mono);font-size:11px;color:var(--txt2);cursor:pointer;transition:background .12s;border:none;background:none;width:100%;text-align:left}
.acct-item:hover{background:rgba(255,255,255,.04);color:var(--txt)}
`;

export const LANDING_CSS = `
.landing{position:fixed;inset:0;overflow:hidden;background:var(--bg);display:flex;flex-direction:column}
.landing::before{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
  background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);
  background-size:46px 46px;mask-image:radial-gradient(circle at 50% 44%, black, transparent 72%);-webkit-mask-image:radial-gradient(circle at 50% 44%, black, transparent 72%)}
.landing::after{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
  background:radial-gradient(680px 480px at 50% 42%, rgba(255,255,255,.05), transparent 65%)}
.ph-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:1;display:block}
.landing-nav{position:relative;z-index:5;display:flex;align-items:center;gap:11px;padding:20px 26px}
.landing-nav .ln-brand{display:flex;align-items:center;gap:10px}
.ln-logo{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(255,255,255,.10),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.16);overflow:hidden;position:relative}
.ln-logo img{width:21px;height:21px;object-fit:contain}
.ln-name{font-family:var(--mono);font-weight:700;font-size:12.5px;letter-spacing:.16em}
.landing-nav .ln-right{margin-left:auto;display:flex;gap:9px;align-items:center}
.ln-link{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--txt3);text-decoration:none;padding:7px 11px;border-radius:6px;transition:color .15s}
.ln-link:hover{color:var(--txt)}
.landing-center{position:relative;z-index:5;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 24px;pointer-events:none}
.hero-flask{width:124px;height:124px;display:flex;align-items:center;justify-content:center;margin-bottom:26px;position:relative;opacity:0;filter:blur(14px);animation:flaskIn 1.4s .25s ease forwards}
.hero-flask::after{content:'';position:absolute;inset:-14%;border-radius:50%;background:radial-gradient(circle, rgba(255,255,255,.14), transparent 62%);animation:breathe 4.5s ease-in-out infinite;z-index:0}
.hero-flask img{width:96px;height:96px;object-fit:contain;position:relative;z-index:1;filter:drop-shadow(0 0 22px rgba(255,255,255,.28))}
@keyframes flaskIn{to{opacity:1;filter:blur(0)}}
@keyframes breathe{0%,100%{opacity:.5;transform:scale(.94)}50%{opacity:1;transform:scale(1.06)}}
.hero-eyebrow{font-family:var(--mono);font-size:10.5px;letter-spacing:.42em;text-transform:uppercase;color:var(--txt3);margin-bottom:18px;opacity:0;animation:upIn .7s 1.0s ease forwards}
.hero-title{font-family:var(--mono);font-weight:700;font-size:clamp(30px,6vw,62px);letter-spacing:.04em;line-height:1.02;color:var(--txt);margin-bottom:18px;opacity:0;animation:upIn .8s 1.18s ease forwards;text-shadow:0 0 40px rgba(255,255,255,.12)}
.hero-sub{font-family:var(--sans);font-size:14.5px;line-height:1.65;color:var(--txt2);max-width:520px;margin-bottom:34px;opacity:0;animation:upIn .8s 1.36s ease forwards}
.hero-cta{display:flex;gap:12px;align-items:center;pointer-events:auto;opacity:0;animation:upIn .8s 1.54s ease forwards}
@keyframes upIn{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
.btn-enter{font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;padding:14px 30px;border-radius:9px;border:1px solid rgba(255,255,255,.6);background:linear-gradient(180deg,#fff,#cfd4de);color:#070708;cursor:pointer;transition:all .18s ease;display:inline-flex;align-items:center;gap:9px}
.btn-enter:hover{box-shadow:0 0 30px rgba(255,255,255,.32);transform:translateY(-1px)}
.btn-enter2{font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:600;padding:14px 26px;border-radius:9px;border:1px solid var(--line2);background:rgba(255,255,255,.02);color:var(--txt2);cursor:pointer;transition:all .18s ease}
.btn-enter2:hover{color:var(--txt);border-color:rgba(255,255,255,.4)}
.landing-foot{position:relative;z-index:5;display:flex;align-items:center;justify-content:center;gap:18px;padding:18px;font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--txt3);opacity:0;animation:upIn .8s 1.7s ease forwards}
.landing-foot .ft-dot{width:5px;height:5px;border-radius:50%;background:var(--up);box-shadow:0 0 7px rgba(14,203,129,.7);display:inline-block;margin-right:6px;vertical-align:1px}
.auth-overlay{position:fixed;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;background:rgba(5,6,9,.72);backdrop-filter:blur(7px);animation:fIn .25s ease;padding:24px}
.auth-close{position:absolute;top:18px;right:20px;width:34px;height:34px;border-radius:8px;border:1px solid var(--line2);background:var(--panel);color:var(--txt2);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:30}
.auth-close:hover{color:var(--txt)}
@media(max-width:640px){.landing-nav .ln-name span{display:none}}
`;
