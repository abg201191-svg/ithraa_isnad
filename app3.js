/* ============ مساعدات السجل ============ */
function sparkSVG(vals){
  if(vals.length < 1) return "";
  var W = 96, H = 34, p = 5, mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), rg = mx - mn || 1;
  var pts = vals.map(function(v, i){
    var x = vals.length === 1 ? W / 2 : p + (W - 2 * p) * i / (vals.length - 1);
    var y = vals.length === 1 || mx === mn ? H / 2 : H - p - (H - 2 * p) * (v - mn) / rg;
    return [x.toFixed(1), y.toFixed(1)];
  });
  var last = pts[pts.length - 1];
  return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + (pts.length > 1 ? '<polyline points="' + pts.map(function(q){ return q.join(","); }).join(" ") + '"/>' : '') + '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="4"/></svg>';
}
function bodyOf(w){ if(!S.body[w]) S.body[w] = {pulse:"", wall:[0, 0, 0], note:""}; return S.body[w]; }
function wallScore(w){ var b = S.body[w]; return b ? b.wall.reduce(function(a, c){ return a + (c ? 1 : 0); }, 0) : 0; }

/* ============ الإعدادات ============ */
function settingsHTML(){
  var pals = [["rose", "#a63f5c"], ["lilac", "#6b4aa0"], ["sage", "#3d7266"], ["sand", "#7d5f26"]];
  var names = {rose:"وردي", lilac:"لافندر", sage:"أخضر هادئ", sand:"رملي"};
  return '<div class="h2">الإعدادات</div>' +
    '<div class="fld"><span class="lbl">الحفظ</span><div>' + syncHTML() + '</div><p class="xs muted">' + saveHelp() + '</p></div>' +
    '<div class="fld"><span class="lbl">اللون</span><div class="pal">' + pals.map(function(p){ return '<button class="pdot' + (S.pal === p[0] ? " on" : "") + '" style="background:' + p[1] + '" data-act="pal" data-v="' + p[0] + '" aria-label="' + names[p[0]] + '" aria-pressed="' + (S.pal === p[0]) + '"></button>'; }).join("") + '</div></div>' +
    '<div class="fld"><span class="lbl">المظهر</span><div class="seg">' + [["auto", "تلقائي"], ["light", "فاتح"], ["dark", "داكن"]].map(function(t){ return '<button class="' + (S.theme === t[0] ? "on" : "") + '" data-act="theme" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join("") + '</div></div>' +
    '<div class="fld"><span class="lbl">الصوت والاهتزاز في المؤقّت</span><div class="seg"><button class="' + (S.sound ? "on" : "") + '" data-act="sound" data-v="1">تشغيل</button><button class="' + (!S.sound ? "on" : "") + '" data-act="sound" data-v="0">إيقاف</button></div></div>' +
    '<div class="fld"><span class="lbl">نسخة احتياطية</span><p class="xs muted">نسخة يدوية تحتفظين بها بنفسك. انسخي النص التالي واحتفظي به، وألصقيه في الأسفل لاستعادته على أي جهاز.</p>' +
    '<textarea class="inp" id="bk" readonly style="min-height:70px;direction:ltr;font-size:11px">' + esc(cloudJson()) + '</textarea>' +
    '<button class="btn s quiet" data-act="copybk">نسخ النسخة الاحتياطية</button></div>' +
    '<div class="fld"><label class="lbl" for="rs">استعادة نسخة</label><textarea class="inp" id="rs" placeholder="ألصقي النسخة هنا" style="min-height:70px;direction:ltr;font-size:11px"></textarea><button class="btn s quiet" data-act="restore">استعادة</button></div>' +
    '<div class="fld"><span class="lbl">البدء من جديد</span><button class="btn s line" data-act="wipe" style="color:var(--acc)">' + (UI.wipe ? "اضغطي مرة ثانية لمسح كل التقدم" : "مسح كل التقدم") + '</button></div>';
}

function exportText(){
  var w = S.week, t = "لياقة أشواق · الأسبوع " + w + " (" + wkd(w).name + ")\n";
  t += "الجلسات: " + sessionsDone(w) + " من 4\n";
  t += "دقائق القلب: " + cardioMin(w) + " من 150\n";
  var ids = Object.keys(S.log).filter(function(id){ return EX[id]; });
  ids.forEach(function(id){
    var arr = S.log[id].filter(function(e){ return typeof e.kg === "number"; }).sort(function(a, b){ return a.ts - b.ts; });
    if(arr.length) t += EX[id].ar + ": " + fmtKg(arr[arr.length - 1].kg) + " كجم\n";
  });
  var pt = pulseTrend();
  if(pt.last) t += "نبض الصباح: آخر قراءة " + pt.last.p + " (" + dfmt(pt.last.k) + ")، متوسط آخر 7 قراءات " + pt.avg7 + "\n";
  var b = S.body[w]; if(b && b.pulse !== "" && b.pulse != null) t += "نبض أسبوعي (سابق): " + b.pulse + "\n";
  if(b) t += "اختبار الحائط: " + wallScore(w) + " من 3\n";
  return t;
}
function copyText(txt, ok){
  var done = function(){ toast(ok); };
  var fallback = function(){
    var ta = document.createElement("textarea"); ta.value = txt; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
    try{ document.execCommand("copy"); done(); }catch(e){ toast("حدّدي النص وانسخيه يدوياً"); }
    document.body.removeChild(ta);
  };
  try{ navigator.clipboard.writeText(txt).then(done, fallback); }catch(e){ fallback(); }
}

/* ============ الرسم والأحداث ============ */
function applyTheme(){
  var r = document.documentElement;
  r.setAttribute("data-pal", S.pal);
  if(S.theme === "light" || S.theme === "dark") r.setAttribute("data-theme", S.theme); else r.removeAttribute("data-theme");
}
function render(){
  applyTheme();
  var v = UI.view, h;
  if(v === "home") h = renderHome();
  else if(v === "day") h = renderDay(UI.w, UI.d);
  else if(v === "play") h = renderPlay(UI.w, UI.d);
  else if(v === "log") h = renderLog();
  else if(v === "tools") h = renderTools();
  else h = renderRef();
  document.body.classList.toggle("sessmode", v === "play");
  document.body.classList.toggle("sub", v === "day" || v === "play");
  $("#main").innerHTML = h;
  var tab = (v === "day" || v === "play") ? "home" : v;
  document.querySelectorAll(".nb").forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-v") === tab); });
}
function goView(v){ UI.view = v; UI.wipe = false; render(); window.scrollTo(0, 0); }
function goDay(w, d){ UI.view = "day"; UI.w = w; UI.d = d; S.week = w; UI.stg[posKey(w, d)] = 0; save(); render(); window.scrollTo(0, 0); }
function openStage(w, d, n, tog){
  var k = posKey(w, d); UI.stg[k] = (tog && UI.stg[k] === n) ? 0 : n; render();
  if(UI.stg[k]){ var el = document.getElementById("stg-" + n); if(el) el.scrollIntoView({block:"start"}); }
}
function goPlay(w, d){
  UI.view = "play"; UI.w = w; UI.d = d; S.week = w;
  if(typeof S.pos[posKey(w, d)] !== "number") S.pos[posKey(w, d)] = firstOpenIdx(w, d);
  save(); render(); window.scrollTo(0, 0);
}
function stepGo(p){ setPos(UI.w, UI.d, p); save(); render(); window.scrollTo(0, 0); }

document.addEventListener("click", function(ev){
  var t = ev.target.closest("[data-act]");
  if(!t) {
    if(ev.target.id === "shade") closeSheet();
    return;
  }
  var a = t.getAttribute("data-act"), ds = t.dataset;
  if(a === "kgset" || a === "pulse" || a === "note") return;
  var w, d, id, i, r, k;
  switch(a){
    case "go": goView(ds.v); break;
    case "day": goDay(+ds.w, +ds.d); break;
    case "week": S.week = +ds.w; save(); UI.view = "home"; render(); break;
    case "play": goPlay(+ds.w, +ds.d); break;
    case "stage": openStage(+ds.w, +ds.d, +ds.n, true); break;
    case "stagego": openStage(+ds.w, +ds.d, +ds.n, false); break;
    case "tog": k = ds.key; UI.open[k] = !UI.open[k]; render(); break;
    case "bub":
      w = +ds.w; d = +ds.d; i = +ds.i; r = +ds.r; k = K(w, d, "s", i, r);
      var was = on(k); toggleKey(k);
      if(!was){
        id = DAYS[d - 1].ex[i];
        if(!EX[id].nokg && !entryOf(id, w, d)){ var le1 = lastEntry(id, w, d); if(le1) setKg(id, w, d, le1.kg); }
      }
      save(); render();
      if(!was){
        var Wb = wkd(w), nb = DAYS[d - 1].ex.length;
        if(i < nb - 1) startRest(15, "انتقلي إلى: " + stepName(w, d, {t:"set", i:i + 1, r:r}));
        else if(r < Wb.rounds - 1) startRest(40, "راحة، ثم الجولة " + (r + 2) + " من الحركة 1");
        else toast("انتهت الحركات، انتقلي للحرق");
      }
      break;
    case "nextwk": S.week = Math.min(TOTAL_WEEKS, S.week + 1); save(); goView("home"); toast("أسبوع جديد: " + wkd().name); break;
    case "closeses": tmStop(); goDay(UI.w, UI.d); break;
    case "prev": stepGo(curPos(UI.w, UI.d) - 1); break;
    case "next": stepGo(curPos(UI.w, UI.d) + 1); break;
    case "overview": openSheet(overviewHTML(UI.w, UI.d)); break;
    case "stepto": closeSheet(); stepGo(+ds.i); break;
    case "setdone":
      w = UI.w; d = UI.d;
      var stp = stepsOf(w, d), p0 = curPos(w, d), s0 = stp[p0], nx = stp[p0 + 1];
      if(s0 && s0.t === "set"){
        k = K(w, d, "s", s0.i, s0.r);
        if(!on(k)){
          S.done[k] = 1;
          id = DAYS[d - 1].ex[s0.i];
          if(!EX[id].nokg && !entryOf(id, w, d)){ var le = lastEntry(id, w, d); if(le) setKg(id, w, d, le.kg); }
        }
        stepGo(p0 + 1);
        if(nx && nx.t === "set"){
          if(nx.r === s0.r) startRest(15, "انتقلي إلى: " + stepName(w, d, nx));
          else startRest(40, "راحة، ثم الجولة " + (nx.r + 1) + ": " + stepName(w, d, nx));
        }else toast("انتهت الحركات، انتقلي للحرق");
      }
      break;
    case "setundo":
      w = UI.w; d = UI.d;
      var s1 = stepsOf(w, d)[curPos(w, d)];
      if(s1 && s1.t === "set"){ delete S.done[K(w, d, "s", s1.i, s1.r)]; save(); render(); }
      break;
    case "finskip": stepGo(curPos(UI.w, UI.d) + 1); break;
    case "kg":
      id = ds.id; w = +ds.w; d = +ds.d;
      var e0 = entryOf(id, w, d), le0 = lastEntry(id, w, d), base = e0 && typeof e0.kg === "number" ? e0.kg : (le0 ? le0.kg : 0);
      setKg(id, w, d, Math.max(0, Math.min(60, Math.round((base + parseFloat(ds.s)) * 2) / 2))); save(); render(); break;
    case "kgto": setKg(ds.id, UI.w, UI.d, parseFloat(ds.kg)); save(); render(); break;
    case "feel": setFeel(ds.id, +ds.w, +ds.d, ds.v); save(); render(); break;
    case "alt": S.alt[ds.id] = S.alt[ds.id] ? 0 : 1; save(); render(); break;
    case "hold":
      var Wh = wkd(UI.w); tmStart({segs:[{sec:3, kind:"ready", label:"استعدي"}, {sec:Wh.hold, kind:"work", label:EX[ds.id].ar, cue:"تنفّسي بانتظام"}], big:false, onDone:function(){ toast("أحسنتِ، سجّلي الجولة"); }}); break;
    case "chk": toggleKey(K(+ds.w, +ds.d, ds.b, +ds.j)); save(); render(); break;
    case "runitem": startItem(+ds.w, +ds.d, ds.b, +ds.j); break;
    case "steps": openSheet(itemSheet(ds.b, DAYS[+ds.d - 1].kind, +ds.j)); break;
    case "ev": openSheet('<div class="info">' + evBlock(ds.k) + '</div>'); break;
    case "finstart": startFinisher(+ds.w, +ds.d); break;
    case "finmark": toggleKey(K(UI.w, UI.d, "f", 0)); save(); render(); break;
    case "walk": if(!S.walks[S.week]) S.walks[S.week] = []; S.walks[S.week].push(+ds.min); save(); render(); toast("سُجّل مشي " + ds.min + " دقيقة"); break;
    case "unwalk": if(S.walks[S.week] && S.walks[S.week].length){ S.walks[S.week].pop(); save(); render(); } break;
    case "wall": var bb = bodyOf(S.week); bb.wall[+ds.i] = bb.wall[+ds.i] ? 0 : 1; save(); render(); break;
    case "gear": S.gear[ds.id] = S.gear[ds.id] ? 0 : 1; save(); render(); break;
    case "export": copyText(exportText(), "نُسخ الملخص"); break;
    case "settings": openSheet(settingsHTML()); break;
    case "closesheet": closeSheet(); break;
    case "pal": S.pal = ds.v; save(); applyTheme(); openSheet(settingsHTML()); break;
    case "theme": S.theme = ds.v; save(); applyTheme(); openSheet(settingsHTML()); break;
    case "sound": S.sound = ds.v === "1"; save(); openSheet(settingsHTML()); break;
    case "copybk": copyText(cloudJson(), "نُسخت النسخة الاحتياطية"); break;
    case "restore":
      try{
        var o = JSON.parse(($("#rs").value || "").trim());
        if(!o || typeof o !== "object" || !o.done || !o.log) throw new Error("bad");
        S = freshState();
        for(var q in o){ S[q] = o[q]; }
        save(); load(); closeSheet(); render(); toast("تمت الاستعادة");
      }catch(e){ toast("النص غير صالح، انسخيه كاملاً"); }
      break;
    case "wipe":
      if(!UI.wipe){ UI.wipe = true; openSheet(settingsHTML()); }
      else { var keep = {pal:S.pal, theme:S.theme, sound:S.sound, qi:S.qi, qbag:S.qbag, synced:S.synced}; S = freshState(); for(var kq in keep){ S[kq] = keep[kq]; } UI.wipe = false; UI.open = {}; save(); closeSheet(); goView("home"); toast("بدأتِ من جديد"); }
      break;
    case "lseg": UI.ls = ds.v; UI.hall = false; UI.view = "log"; render(); break;
    case "rseg": UI.rs = ds.v; render(); break;
    case "tjump": var tj = document.getElementById(ds.id); if(tj) tj.scrollIntoView({behavior:"smooth", block:"start"}); break;
    case "topulse": UI.ls = "pu"; closeSheet(); goView("log"); break;
    case "pcount": openSheet(countHTML()); break;
    case "ptap": pcTap(); break;
    case "pagain": openSheet(countHTML()); break;
    case "puse":
      UI.pfill = PC.bpm; UI.ls = "pu"; closeSheet(); goView("log");
      var pe = document.getElementById("pbpm"); if(pe && pe.scrollIntoView) pe.scrollIntoView({block:"center"});
      break;
    case "pflag":
      var fl = t.getAttribute("aria-pressed") === "true"; t.setAttribute("aria-pressed", String(!fl));
      var ckf = t.querySelector(".ck"); if(ckf) ckf.classList.toggle("on", !fl);
      break;
    case "psave":
      var pv = parseFloat(($("#pbpm") || {}).value), pd = ($("#pdate") || {}).value || dkey();
      if(!(pv >= 30 && pv <= 200)){ toast("اكتبي نبضاً بين 30 و200"); break; }
      if(pd > dkey()) pd = dkey();
      var psv = parseFloat(($("#psleep") || {}).value), ent = {p:Math.round(pv), u:Date.now()};
      if(psv > 0 && psv <= 16) ent.s = Math.round(psv * 2) / 2;
      if(($("#pflag") || t).getAttribute("aria-pressed") === "true") ent.f = 1;
      S.chk[pd] = ent; save(); render(); toast("حُفظت قراءة " + dfmt(pd));
      break;
    case "pedit":
      var ee = S.chk[ds.k]; if(!ee) break;
      var sd = $("#pdate"), sb = $("#pbpm"), ss = $("#psleep"), sf = $("#pflag");
      if(sd) sd.value = ds.k; if(sb) sb.value = ee.p; if(ss) ss.value = ee.s != null ? ee.s : "";
      if(sf){ sf.setAttribute("aria-pressed", String(!!ee.f)); var ck2 = sf.querySelector(".ck"); if(ck2) ck2.classList.toggle("on", !!ee.f); }
      var pl = $("#plive"); if(pl) pl.innerHTML = bandHTML(ee.p);
      var sn = $("#pslnote"); if(sn) sn.textContent = ee.s ? sleepNote(ee.s) : "";
      if(sb && sb.scrollIntoView) sb.scrollIntoView({block:"center"});
      break;
    case "pdel": delete S.chk[ds.k]; save(); render(); toast("حُذفت القراءة"); break;
    case "pall": UI.hall = !UI.hall; render(); break;
    case "tpause":
      if(TM){ if(TM.paused){ TM.end = Date.now() + TM.rem; TM.paused = false; } else { TM.rem = Math.max(0, TM.end - Date.now()); TM.paused = true; } tmBuild(); }
      break;
    case "tskip": tmNext(); break;
    case "tadd": if(TM){ if(TM.paused) TM.rem += 15000; else TM.end += 15000; tmPaint(); } break;
    case "tstop": tmStop(); break;
  }
});
document.addEventListener("change", function(ev){
  var t = ev.target;
  if(t.getAttribute && t.getAttribute("data-act") === "pdate"){
    var e0 = S.chk[t.value], sb0 = document.getElementById("pbpm"), ss0 = document.getElementById("psleep"), sf0 = document.getElementById("pflag"), pl0 = document.getElementById("plive"), sn0 = document.getElementById("pslnote");
    if(sb0) sb0.value = e0 ? e0.p : ""; if(ss0) ss0.value = e0 && e0.s != null ? e0.s : "";
    if(sf0){ sf0.setAttribute("aria-pressed", String(!!(e0 && e0.f))); var c0 = sf0.querySelector(".ck"); if(c0) c0.classList.toggle("on", !!(e0 && e0.f)); }
    if(pl0) pl0.innerHTML = e0 ? bandHTML(e0.p) : ""; if(sn0) sn0.textContent = e0 && e0.s ? sleepNote(e0.s) : "";
  }
  if(t.getAttribute && t.getAttribute("data-act") === "kgset"){
    var v = parseFloat(t.value);
    if(!isNaN(v) && v >= 0 && v <= 60){ setKg(t.dataset.id, +t.dataset.w, +t.dataset.d, Math.round(v * 2) / 2); save(); render(); }
  }
});
document.addEventListener("input", function(ev){
  var t = ev.target, a = t.getAttribute && t.getAttribute("data-act");
  if(a === "note"){ bodyOf(S.week).note = t.value; save(); }
  if(a === "pbpm"){
    var pl = document.getElementById("plive"), n = parseFloat(t.value);
    if(pl) pl.innerHTML = (String(t.value).length >= 2 && !isNaN(n)) ? bandHTML(n) : "";
  }
  if(a === "psleep"){ var sn = document.getElementById("pslnote"), hv = parseFloat(t.value); if(sn) sn.textContent = hv > 0 ? sleepNote(hv) : ""; }
  if(a === "age"){ var av = parseFloat(t.value); S.age = (av >= 18 && av <= 80) ? Math.round(av) : ""; save(); var zo = document.getElementById("zout"); if(zo) zo.innerHTML = zonesHTML(isNaN(av) ? 0 : av); }
  if(a === "wt"){ var wv = parseFloat(t.value); S.wt = (wv >= 30 && wv <= 200) ? Math.round(wv * 10) / 10 : ""; save(); var po = document.getElementById("pout"); if(po) po.innerHTML = proteinHTML(isNaN(wv) ? 0 : wv); }
});
document.addEventListener("keydown", function(ev){ if(ev.key === "Escape") closeSheet(); });

(function init(){
  document.documentElement.setAttribute("dir", "rtl");
  document.documentElement.setAttribute("lang", "ar");
  load();
  UI.w = S.week;
  UI.qi = pickQuote();
  render();
  cloudInit();
})();
