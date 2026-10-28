/* ============ الحالة والمساعدات ============ */
var S = {week:1, done:{}, log:{}, walks:{}, body:{}, alt:{}, gear:{}, pos:{}, chk:{}, pal:"rose", theme:"light", sound:true};
var PALS = ["rose", "lilac", "sage", "sand"];
var LVS = {strong:"قوي", mid:"متوسط", low:"محدود", logic:"منطقي"};
var UI = {view:"home", w:1, d:1, open:{}, stg:{}, wipe:false, ls:"ov", rs:"prog", hall:false};
var VOLATILE = {qi:1, qbag:1, qh:1, ts:1, synced:1};
var SYNCH = "";

function freshState(){ return {week:1, done:{}, log:{}, walks:{}, body:{}, alt:{}, gear:{}, pos:{}, chk:{}, pal:"rose", theme:"light", sound:true, tv:2, ord:2}; }
/* بعد تدقيق الترتيب: تُنقل علامات الإنجاز المحفوظة (مفتاحها رقم الحركة) إلى موضع الحركة الجديد، مرة واحدة لكل نسخة حالة */
function migrateOrd(o){
  if(!o || typeof o !== "object" || o.ord === 2) return o;
  if(o.done && typeof o.done === "object"){
    var out = {};
    Object.keys(o.done).forEach(function(k){
      var p = k.split("."), d = +p[1], b = p[2], i = +p[3], list = null, now = null, D = DAYS[d - 1];
      if(D && b === "s" && OLDORD.s[d]){ list = OLDORD.s[d]; now = D.ex; }
      else if(D && (b === "w" || b === "c")){
        var tab = (b === "w" ? OLDORD.w : OLDORD.c)[D.kind];
        if(tab){ list = tab; now = (b === "w" ? WU : CD)[D.kind].map(function(x){ return x.id; }); }
      }
      if(list && i >= 0 && i < list.length){ var ni = now.indexOf(list[i]); if(ni >= 0) p[3] = ni; }
      out[p.join(".")] = o.done[k];
    });
    o.done = out;
  }
  if(o.pos && typeof o.pos === "object"){ Object.keys(o.pos).forEach(function(k){ var d = +k.split(".")[1]; if(d === 1 || d === 4) delete o.pos[k]; }); }
  o.ord = 2;
  return o;
}
function normState(){
  ["done","log","walks","body","alt","gear","pos","chk"].forEach(function(k){ if(!S[k] || typeof S[k] !== "object") S[k] = {}; });
  if(!(S.week >= 1 && S.week <= TOTAL_WEEKS)) S.week = 1;
  if(PALS.indexOf(S.pal) < 0) S.pal = "rose";
  if(S.tv !== 2){ if(S.theme === "auto") S.theme = "light"; S.tv = 2; }
  if(typeof S.ts !== "number") S.ts = 0;
  if(typeof S.synced !== "number") S.synced = 0;
  migrateOrd(S);
}
function canon(v){
  if(Array.isArray(v)) return v.map(canon);
  if(v && typeof v === "object"){ var o = {}; Object.keys(v).sort().forEach(function(k){ o[k] = canon(v[k]); }); return o; }
  return v;
}
function stateHash(o){
  o = o || S; var c = {};
  Object.keys(o).forEach(function(k){ if(!VOLATILE[k]) c[k] = o[k]; });
  return JSON.stringify(canon(c));
}
function lsWrite(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(S)); }catch(e){} }
function load(){
  try{
    var r = localStorage.getItem(STORE_KEY);
    if(r){ var o = JSON.parse(r); if(o && typeof o === "object"){ for(var k in o){ S[k] = o[k]; } } }
  }catch(e){}
  normState();
  SYNCH = stateHash();
}
/* عبارة تحفيزية جديدة عند كل فتح: كيس عشوائي، لا تتكرر عبارة قبل أن تظهر كل العبارات */
function pickQuote(){
  var n = QUOTES.length, last = typeof S.qi === "number" ? S.qi : -1;
  var bag = Array.isArray(S.qbag) ? S.qbag.filter(function(i){ return typeof i === "number" && i >= 0 && i < n; }) : [];
  var hist = Array.isArray(S.qh) ? S.qh.slice(-12) : [];
  if(!bag.length){
    for(var i = 0; i < n; i++) bag.push(i);
    for(var j = n - 1; j > 0; j--){ var r = Math.floor(Math.random() * (j + 1)), t = bag[j]; bag[j] = bag[r]; bag[r] = t; }
    /* ما ظهر مؤخراً يُدفع إلى آخر الكيس فلا يعود قبل مرور عدة فتحات */
    var recent = bag.filter(function(x){ return hist.indexOf(x) >= 0 || x === last; }), rest = bag.filter(function(x){ return hist.indexOf(x) < 0 && x !== last; });
    bag = recent.concat(rest);
  }
  var pick = bag.pop(); S.qbag = bag; S.qi = pick; hist.push(pick); S.qh = hist.slice(-12); save(); return pick;
}
/* الحفظ: دائماً على الجهاز، ومتى تغيّر شيء فعلي نختم الوقت ونجدول الحفظ السحابي */
function save(){
  try{
    var h = stateHash();
    if(h !== SYNCH){ SYNCH = h; S.ts = Date.now(); if(typeof cloudQueue === "function") cloudQueue(); }
  }catch(e){}
  lsWrite();
}
function $(s, r){ return (r || document).querySelector(s); }
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function wkd(n){ return WEEKS[(n || S.week) - 1]; }
function K(w, d, b, i, r){ var a = [w, d, b, i]; if(r != null) a.push(r); return a.join("."); }
function on(k){ return !!S.done[k]; }
function toggleKey(k){ if(S.done[k]) delete S.done[k]; else S.done[k] = 1; }
function jol(n){ return n === 2 ? "جولتان" : n + " جولات"; }
function fmtKg(v){ var n = Math.round(parseFloat(v) * 10) / 10; return isNaN(n) ? "" : String(n); }
function yt(q){ return "https://www.youtube.com/results?search_query=" + encodeURIComponent(q); }

var ICO = {
  home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  plan:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  log:'<path d="M5 20V11M12 20V4M19 20v-6"/>',
  ref:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  gear:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  chev:'<path d="M6 9l6 6 6-6"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/>',
  dumb:'<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  leaf:'<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19l8-8"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  fwd:'<path d="M15 6l-6 6 6 6"/>',
  list:'<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  back:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  play:'<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5v.01"/>',
  walk:'<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6-2.5-2.5 1.5-4.5 3 1.5 2.5 3M12 15l3 2.5V21M9.5 8.5L7 11"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  calc:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h2M14 13h2M8 17h2M14 17h2"/>',
  shield:'<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  user:'<circle cx="12" cy="5" r="2"/><path d="M12 8v6M8 10h8M12 14l-3 7M12 14l3 7"/>',
  moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  flask:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M8 15h8"/>'
};
function ico(n, c){ return '<svg class="' + (c || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICO[n] + '</svg>'; }

/* ============ الحسابات ============ */
function circuitSec(w, d){
  var W = wkd(w), sec = 0;
  DAYS[d - 1].ex.forEach(function(id){
    var x = EX[id];
    var u = x.t === "hold" ? W.hold : (x.t === "fixed" ? x.fixN * 3 : W.rmax * 3);
    sec += u + 15;
  });
  return sec * W.rounds + 40 * (W.rounds - 1);
}
function finMin(w){ return wkd(w).fin * 2; }
function totalMin(w, d){ return Math.round((300 + circuitSec(w, d) + finMin(w) * 60 + 300) / 60); }

function nowCell(w, d){
  var W = wkd(w), ex = DAYS[d - 1].ex;
  for(var r = 0; r < W.rounds; r++){
    for(var i = 0; i < ex.length; i++){ if(!on(K(w, d, "s", i, r))) return {i:i, r:r}; }
  }
  return null;
}
function dayStats(w, d){
  var W = wkd(w), D = DAYS[d - 1], sets = 0, setsT = 0, wu = 0, cd = 0;
  D.ex.forEach(function(id, i){ for(var r = 0; r < W.rounds; r++){ setsT++; if(on(K(w, d, "s", i, r))) sets++; } });
  WU[D.kind].forEach(function(x, j){ if(on(K(w, d, "w", j))) wu++; });
  CD[D.kind].forEach(function(x, j){ if(on(K(w, d, "c", j))) cd++; });
  var fin = on(K(w, d, "f", 0));
  var tot = setsT + 3 + WU[D.kind].length + CD[D.kind].length;
  var got = sets + (fin ? 3 : 0) + wu + cd;
  return {sets:sets, setsT:setsT, fin:fin, wu:wu, cd:cd, pct:Math.round(100 * got / tot)};
}
function dayDone(w, d){ var s = dayStats(w, d); return s.sets === s.setsT && s.fin; }
function sessionsDone(w){ var n = 0; for(var d = 1; d <= 4; d++){ if(dayDone(w, d)) n++; } return n; }
function nextDay(w){ for(var d = 1; d <= 4; d++){ if(!dayDone(w, d)) return d; } return 0; }
function allSessions(){ var n = 0; for(var w = 1; w <= TOTAL_WEEKS; w++) n += sessionsDone(w); return n; }
function walkList(w){ return (S.walks[w] || []); }
function walkMin(w){ return walkList(w).reduce(function(a, b){ return a + b; }, 0); }
function cardioMin(w){
  var n = walkMin(w);
  for(var d = 1; d <= 4; d++){ if(on(K(w, d, "f", 0))) n += finMin(w); }
  return n;
}
function postOn(w, d, key){
  var p = key.split(":"), D = DAYS[d - 1];
  if(p[0] === "x"){
    var i = D.ex.indexOf(p[1]); if(i < 0) return false;
    for(var r = 0; r < wkd(w).rounds; r++){ if(!on(K(w, d, "s", i, r))) return false; }
    return true;
  }
  var j = -1; CD[D.kind].forEach(function(x, q){ if(x.id === p[1]) j = q; });
  return j >= 0 && on(K(w, d, "c", j));
}
function postPips(w, area){
  var out = [];
  DAYS.forEach(function(D){
    var keys = D.post[area];
    if(keys){ out.push({d:D.n, on:keys.every(function(k){ return postOn(w, D.n, k); })}); }
  });
  return out;
}
function partnerOf(d){
  for(var i = 0; i < DAYS.length; i++){ if(DAYS[i].n !== d && DAYS[i].kind === DAYS[d - 1].kind) return DAYS[i]; }
  return null;
}
function sharedIds(d){
  var p = partnerOf(d); if(!p) return [];
  return DAYS[d - 1].ex.filter(function(id){ return p.ex.indexOf(id) >= 0; });
}
function muscleDays(mid){
  var out = [];
  DAYS.forEach(function(D){
    var s = 0; D.ex.forEach(function(id){ s += (EX[id].m[mid] || 0); });
    if(s >= 0.5) out.push(D.n);
  });
  return out;
}

/* ============ خطوات الجلسة: إحماء، ثم الحركات جولة بجولة، ثم الحرق، ثم التهدئة، ثم الختام ============ */
function stepsOf(w, d){
  var W = wkd(w), D = DAYS[d - 1], out = [{t:"warm"}];
  for(var r = 0; r < W.rounds; r++){ for(var i = 0; i < D.ex.length; i++){ out.push({t:"set", i:i, r:r}); } }
  out.push({t:"fin"}, {t:"cool"}, {t:"end"});
  return out;
}
function stepIndex(w, d, t){ var a = stepsOf(w, d); for(var i = 0; i < a.length; i++){ if(a[i].t === t) return i; } return -1; }
function posKey(w, d){ return w + "." + d; }
function curPos(w, d){ var n = stepsOf(w, d).length, p = S.pos[posKey(w, d)]; return (typeof p === "number" && p >= 0 && p < n) ? p : 0; }
function setPos(w, d, p){ var n = stepsOf(w, d).length; S.pos[posKey(w, d)] = Math.max(0, Math.min(n - 1, p)); }
function firstOpenIdx(w, d){
  var a = stepsOf(w, d);
  for(var k = 0; k < a.length; k++){
    if((a[k].t === "set" || a[k].t === "fin") && !stepDone(w, d, a[k])) return k === 1 ? 0 : k;
  }
  return a.length - 1;
}
function stepDone(w, d, s){
  var D = DAYS[d - 1];
  if(s.t === "set") return on(K(w, d, "s", s.i, s.r));
  if(s.t === "fin") return on(K(w, d, "f", 0));
  if(s.t === "warm") return WU[D.kind].every(function(x, j){ return on(K(w, d, "w", j)); });
  if(s.t === "cool") return CD[D.kind].every(function(x, j){ return on(K(w, d, "c", j)); });
  return dayDone(w, d);
}
function stepName(w, d, s){
  var D = DAYS[d - 1];
  if(s.t === "warm") return "الإحماء";
  if(s.t === "set"){ var id = D.ex[s.i], x = EX[id]; return (S.alt[id] && x.alt) ? x.alt.ar : x.ar; }
  if(s.t === "fin") return "الحرق بلا قفز";
  if(s.t === "cool") return "التهدئة والاستقامة";
  return "الختام";
}

/* سجل الأوزان: الوزن يُحفظ باسم التمرين، فينتقل تلقائياً بين الأيام والأسابيع */
function entries(id){ return S.log[id] || []; }
function entryOf(id, w, d){ var a = entries(id).filter(function(e){ return e.w === w && e.d === d; }); return a[0] || null; }
function lastEntry(id, w, d){
  var pool = entries(id).filter(function(e){ return !(e.w === w && e.d === d) && typeof e.kg === "number"; });
  var viaLike = false;
  if(!pool.length && EX[id].like){
    pool = entries(EX[id].like).filter(function(e){ return typeof e.kg === "number"; });
    viaLike = true;
  }
  if(!pool.length) return null;
  pool.sort(function(a, b){ return a.ts - b.ts; });
  var le = pool[pool.length - 1];
  return {w:le.w, d:le.d, kg:le.kg, feel:le.feel || "", like:viaLike};
}
function setKg(id, w, d, kg){
  if(!S.log[id]) S.log[id] = [];
  var e = entryOf(id, w, d);
  if(!e){ e = {w:w, d:d, kg:null, feel:"", ts:Date.now()}; S.log[id].push(e); }
  e.kg = kg; e.ts = Date.now();
}
function setFeel(id, w, d, f){
  if(!S.log[id]) S.log[id] = [];
  var e = entryOf(id, w, d);
  if(!e){ e = {w:w, d:d, kg:null, feel:"", ts:Date.now()}; S.log[id].push(e); }
  e.feel = (e.feel === f ? "" : f);
}
function prCount(){
  var n = 0;
  Object.keys(S.log).forEach(function(id){
    var arr = S.log[id].filter(function(e){ return typeof e.kg === "number"; }).sort(function(a, b){ return a.ts - b.ts; });
    var mx = -1;
    arr.forEach(function(e, j){ if(j > 0 && e.kg > mx) n++; if(e.kg > mx) mx = e.kg; });
  });
  return n;
}
function dayPRs(w, d){
  var n = 0;
  DAYS[d - 1].ex.forEach(function(id){
    var e = entryOf(id, w, d); if(!e || typeof e.kg !== "number") return;
    var prev = entries(id).filter(function(x){ return x !== e && typeof x.kg === "number" && x.ts < e.ts; });
    if(prev.length && e.kg > Math.max.apply(null, prev.map(function(x){ return x.kg; }))) n++;
  });
  return n;
}
function hintHTML(id, w, d){
  var x = EX[id];
  if(x.nokg) return "";
  var le = lastEntry(id, w, d), cur = entryOf(id, w, d);
  if(!le){
    return '<div class="hint">أول مرة تعملين هذه الحركة. ابدئي بوزن خفيف: <b>' + esc(x.kg) + '</b>. اختاري وزناً تبقى معه 3 إلى 4 تكرارات في آخر جولة.</div>';
  }
  var src = 'الأسبوع ' + le.w + ' · ' + dayLabel(le.d);
  if(le.like) src = 'من «جسر الورك» في ' + src;
  var adv = le.feel === "easy" ? 'كان سهلاً، فجرّبي أصغر زيادة متاحة (من 0.5 إلى 1 كجم) أو أضيفي تكراراً.'
          : le.feel === "hard" ? 'كان صعباً، فثبّتي الوزن أو انزلي قليلاً.'
          : 'كان مناسباً، فثبّتي الوزن وزيديه حين يصير سهلاً.';
  var btns = '<button class="btn s quiet" data-act="kgto" data-id="' + id + '" data-kg="' + le.kg + '">نفس الوزن ' + fmtKg(le.kg) + '</button>';
  if(le.feel === "easy"){ var up = le.kg + (le.kg < 5 ? 0.5 : 1); btns += '<button class="btn s quiet" data-act="kgto" data-id="' + id + '" data-kg="' + up + '">زيادة إلى ' + fmtKg(up) + '</button>'; }
  return '<div class="hint">آخر مرة (' + src + '): <b>' + fmtKg(le.kg) + ' كجم</b>. ' + adv + '<div class="row wrap" style="margin-top:8px;gap:8px">' + btns + '</div></div>';
}

/* ============ المؤقّت والصوت ============ */
var TM = null, AC = null, WL = null;
function beep(f, ms){
  if(!S.sound) return;
  try{
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if(AC.state === "suspended") AC.resume();
    var o = AC.createOscillator(), g = AC.createGain();
    o.type = "sine"; o.frequency.value = f; o.connect(g); g.connect(AC.destination);
    var t = AC.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    o.start(t); o.stop(t + ms / 1000 + 0.03);
  }catch(e){}
}
function buzz(p){ try{ if(S.sound && navigator.vibrate) navigator.vibrate(p); }catch(e){} }
function wake(on_){
  try{
    if(on_){ if(navigator.wakeLock && !WL){ navigator.wakeLock.request("screen").then(function(l){ WL = l; }).catch(function(){}); } }
    else if(WL){ WL.release().catch(function(){}); WL = null; }
  }catch(e){}
}
function tmStart(o){
  tmStop(true);
  TM = {segs:o.segs, i:0, big:!!o.big, onDone:o.onDone || null, paused:false, rem:0, last:-1, total:o.segs.reduce(function(a, s){ return a + s.sec; }, 0)};
  TM.end = Date.now() + TM.segs[0].sec * 1000;
  if(TM.big) wake(true);
  beep(700, 120); buzz(40);
  tmBuild();
}
function tmStop(silent){
  if(TM && TM.big) wake(false);
  TM = null;
  var el = $("#tm"); if(el){ el.hidden = true; el.className = "tm"; el.innerHTML = ""; }
}
function tmLeft(){ return TM.paused ? TM.rem : Math.max(0, TM.end - Date.now()); }
function tmNext(){
  if(!TM) return;
  if(TM.i + 1 >= TM.segs.length){
    var cb = TM.onDone; beep(960, 450); buzz([120, 80, 120]); tmStop(); if(cb) cb(); return;
  }
  TM.i++; TM.end = Date.now() + TM.segs[TM.i].sec * 1000; TM.paused = false; TM.last = -1;
  var k = TM.segs[TM.i].kind;
  beep(k === "work" ? 880 : 560, 220); buzz(k === "work" ? 90 : 40);
  tmBuild();
}
function tmBuild(){
  var el = $("#tm"); if(!el || !TM) return;
  var s = TM.segs[TM.i], left = Math.ceil(tmLeft() / 1000);
  el.hidden = false;
  if(TM.big){
    var nxt = "";
    for(var j = TM.i + 1; j < TM.segs.length; j++){ if(TM.segs[j].kind === "work"){ nxt = "التالي: " + TM.segs[j].label; break; } }
    if(!nxt) nxt = "آخر حركة، أحسنتِ";
    var kindTxt = s.kind === "work" ? "عمل" : (s.kind === "ready" ? "استعدي" : "راحة");
    var c = 2 * Math.PI * 46;
    el.className = "tm big";
    el.innerHTML = '<div class="tmb">' +
      '<span class="kind ' + s.kind + '">' + kindTxt + (s.round ? ' · الجولة ' + s.round + ' من 2' : '') + '</span>' +
      '<div class="tr"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="var(--s2)" stroke-width="7"/><circle id="tmr" cx="50" cy="50" r="46" fill="none" stroke="var(--acc)" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="0"/></svg><div class="c"><b id="tmt">' + left + '</b></div></div>' +
      '<div class="mv">' + esc(s.label) + '</div>' +
      '<div class="nx">' + esc(s.cue || "") + (s.cue ? '<br>' : '') + esc(nxt) + '</div>' +
      '<div class="btns"><button class="btn quiet" data-act="tpause">' + (TM.paused ? "استمري" : "إيقاف مؤقت") + '</button><button class="btn line" data-act="tskip">تخطي</button><button class="btn line" data-act="tstop">إنهاء</button></div>' +
      '</div>';
  }else{
    el.className = "tm";
    el.innerHTML = '<div class="tmin"><div class="t num" id="tmt">' + left + '</div><div class="l">' + esc(s.label) + '</div><button data-act="tadd">+15</button><button data-act="tskip">تخطي</button></div>';
  }
  tmPaint();
}
function tmPaint(){
  if(!TM) return;
  var s = TM.segs[TM.i], left = tmLeft(), t = $("#tmt");
  if(t) t.textContent = Math.ceil(left / 1000);
  var r = $("#tmr");
  if(r){ var c = 2 * Math.PI * 46; r.setAttribute("stroke-dashoffset", (c * (1 - left / (s.sec * 1000))).toFixed(1)); }
}
setInterval(function(){
  if(!TM || TM.paused) return;
  var left = TM.end - Date.now(), sec = Math.ceil(left / 1000);
  if(sec !== TM.last){ TM.last = sec; if(sec >= 1 && sec <= 3) beep(540, 90); }
  if(left <= 0){ tmNext(); return; }
  tmPaint();
}, 200);

function startRest(sec, label){ tmStart({segs:[{sec:sec, kind:"rest", label:label}], big:false}); }
function startFinisher(w, d){
  var W = wkd(w), D = DAYS[d - 1], moves = FIN[D.kind].slice(0, W.fin), segs = [{sec:5, kind:"ready", label:"استعدي للحرق", cue:"خمس ثوانٍ وتبدأ أول حركة"}];
  for(var r = 1; r <= 2; r++){
    moves.forEach(function(id, j){
      var m = FINMV[id], nextId = moves[j + 1] || (r === 1 ? moves[0] : null);
      segs.push({sec:30, kind:"work", label:m.ar, cue:m.cue, round:r});
      segs.push({sec:30, kind:"rest", label:"استراحة", cue:nextId ? "حضّري: " + FINMV[nextId].ar : "", round:r});
    });
  }
  tmStart({segs:segs, big:true, onDone:function(){
    S.done[K(w, d, "f", 0)] = 1;
    if(UI.view === "play" && UI.w === w && UI.d === d){ var ix = stepIndex(w, d, "cool"); if(ix >= 0) setPos(w, d, ix); }
    save(); render(); window.scrollTo(0, 0); toast("أنهيتِ الحرق، أحسنتِ");
  }});
}
function startItem(w, d, blk, j){
  var D = DAYS[d - 1], list = blk === "w" ? WU[D.kind] : CD[D.kind], x = list[j];
  tmStart({segs:[{sec:x.sec, kind:"work", label:x.ar, cue:x.cue}], big:false, onDone:function(){
    S.done[K(w, d, blk, j)] = 1; save(); render();
  }});
}

var toastT = null;
function toast(m){
  var el = $("#toast"); if(!el) return;
  el.hidden = false; el.innerHTML = '<span>' + esc(m) + '</span>';
  clearTimeout(toastT); toastT = setTimeout(function(){ el.hidden = true; }, 2400);
}
function openSheet(html){
  var sh = $("#shade"); sh.hidden = false;
  sh.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><div class="gr"></div>' + html + '<button class="btn line full" data-act="closesheet">إغلاق</button></div>';
}
function closeSheet(){ var sh = $("#shade"); sh.hidden = true; sh.innerHTML = ""; }
