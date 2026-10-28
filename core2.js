/* ============ نبض الصباح: النموذج والتفسير ============ */
var DAYN = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
function pad2(n){ return (n < 10 ? "0" : "") + n; }
function dkey(d){ d = d || new Date(); return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
function dparse(k){ var p = String(k).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
function dfmt(k){ var d = dparse(k); return DAYN[d.getDay()] + " " + d.getDate() + "/" + (d.getMonth() + 1); }
function dshort(k){ var d = dparse(k); return d.getDate() + "/" + (d.getMonth() + 1); }
function chkRows(){
  return Object.keys(S.chk || {}).sort().filter(function(k){ var e = S.chk[k]; return e && typeof e.p === "number" && e.p > 0; })
    .map(function(k){ var e = S.chk[k]; return {k:k, p:e.p, s:(typeof e.s === "number" ? e.s : null), f:!!e.f}; });
}
function avg(a){ return a.length ? a.reduce(function(x, y){ return x + y; }, 0) / a.length : 0; }
function r1(x){ return Math.round(x * 10) / 10; }

/* تفسير رقم واحد. المصدر: Mayo Clinic (المدى 60 إلى 100، ومتى تُراجَع مختصة) */
function pulseBand(b){
  if(!(b >= 30 && b <= 200)) return {lv:"warn", t:"الرقم يبدو غير صحيح", tx:"قد يكون العدّ أو الضرب مختلاً.", act:"أعيدي القياس: اجلسي هادئة دقيقتين، وعدّي النبضات 30 ثانية ثم اضربيها في 2."};
  if(b < 40) return {lv:"warn", t:"منخفض جداً", tx:"قرب 40 يُرى عند الرياضيين المدرَّبين جداً. إن لم تكوني كذلك فهذا أقل بكثير من المعتاد.", act:"أعيدي القياس بعد قليل. إن تكرر، أو صاحبه دوار أو إغماء أو ضيق نفَس، فراجعي طبيبتك."};
  if(b < 60) return {lv:"info", t:"أقل من 60", tx:"شائع عند من يمارسن الرياضة الهوائية بانتظام، وقد يكون طبيعياً لدى بعض الناس.", act:"إن لم تكوني رياضية مدرَّبة وكان الرقم يتكرر هكذا، فاذكريه لطبيبتك، وخاصة مع دوار أو تعب غير معتاد أو إغماء."};
  if(b < 70) return {lv:"ok", t:"طبيعي، في الجزء المنخفض من النطاق", tx:"المعتاد للبالغين بين 60 و100. والرقم الأقل ضمن هذا النطاق يعكس غالباً لياقة أفضل.", act:"لا شيء مطلوب. تابعي القراءة أسبوعاً بعد أسبوع."};
  if(b < 85) return {lv:"ok", t:"طبيعي، في وسط النطاق", tx:"ضمن المعتاد (60 إلى 100). يتأثر الرقم بالنوم والانفعال والأدوية، فالأهم اتجاهه عبر أسابيع لا قراءة يوم واحد.", act:"لا شيء مطلوب. تابعي القراءة أسبوعاً بعد أسبوع."};
  if(b <= 100) return {lv:"ok", t:"طبيعي، في الجزء المرتفع من النطاق", tx:"ما زال ضمن 60 إلى 100. قد يرتفع قليلاً بقلة النوم أو التوتر أو الحرارة، ويميل إلى الانخفاض قليلاً مع انتظام التمرين الهوائي.", act:"لا شيء مطلوب. جربي القياس في وقت ثابت كل صباح لمقارنة أدق."};
  if(b < 120) return {lv:"info", t:"فوق 100", tx:"إن كان بعد جهد أو انفعال أو حرارة أو مرض فقد يكون مؤقتاً.", act:"أعيدي القياس بعد جلوس هادئ 5 دقائق. إن تكرر فوق 100 وأنتِ في الراحة فراجعي طبيبتك."};
  return {lv:"warn", t:"مرتفع جداً في الراحة", tx:"هذا أعلى بكثير من المعتاد في الراحة.", act:"أعيدي القياس بعد الجلوس هادئة. إن بقي مرتفعاً أو صاحبه خفقان أو ضيق نفَس أو ألم صدر أو دوار فاطلبي رعاية طبية."};
}
function sleepNote(h){
  if(!(h > 0)) return "";
  if(h >= 7) return "نومك " + h + " ساعات: ضمن الموصى به للبالغين (7 ساعات فأكثر بانتظام).";
  if(h >= 6) return "نومك " + h + " ساعات: أقل قليلاً من 7 ساعات الموصى بها بانتظام. ليلة واحدة لا تقلق، والمهم المعتاد.";
  return "نومك " + h + " ساعات: أقل بوضوح من 7 ساعات الموصى بها بانتظام. النوم من العوامل التي تؤثر في النبض، فخذي قراءة اليوم بحذر.";
}
function bandHTML(b, id){
  var x = pulseBand(b), bad = !(b >= 30 && b <= 200);
  return '<div class="pres ' + x.lv + '"' + (id ? ' id="' + id + '"' : '') + ' role="status">' +
    (bad ? '' : '<div class="big num">' + b + '<small> نبضة في الدقيقة</small></div>') +
    '<div class="b">' + x.t + '</div><p>' + x.tx + '</p><p class="b2">' + x.act + '</p></div>';
}
/* الاتجاه: متوسط آخر 7 مقابل أول 7، بعد استبعاد الأيام غير المعتادة (راجعي «كيف يقرأ الموقع اتجاه نبضك؟») */
function pulseTrend(){
  var rows = chkRows(), used = rows.filter(function(r){ return !r.f; });
  if(used.length < 3) used = rows;
  var out = {n:rows.length, used:used.length, last:rows.length ? rows[rows.length - 1] : null};
  if(!used.length) return out;
  var l7 = used.slice(-7).map(function(r){ return r.p; });
  out.avg7 = r1(avg(l7));
  var sl = used.slice(-7).filter(function(r){ return r.s != null; }).map(function(r){ return r.s; });
  if(sl.length >= 3) out.sleep7 = r1(avg(sl));
  if(used.length >= 14){
    out.first7 = r1(avg(used.slice(0, 7).map(function(r){ return r.p; })));
    out.diff = r1(out.avg7 - out.first7);
  }
  return out;
}
function trendText(t){
  if(t.diff == null) return "تحتاجين 14 قراءة على الأقل لأقارن أول أسبوع بآخر أسبوع. الآن لديك " + t.n + ".";
  var d = t.diff, a = Math.abs(d);
  if(a < 2) return "متوسطك ثابت تقريباً (فرق أقل من نبضتين). هذا متوقع: التغيّر المتوسط من برامج التمرين نحو 3 نبضات، والقوة وحدها لم تُظهر أثراً واضحاً.";
  if(d < 0) return "انخفض متوسطك نحو " + r1(a) + " نبضة منذ البداية. اتجاه يتوافق مع تحسّن اللياقة، لكن النوم والتوتر وغيرهما يحرّكان الرقم أيضاً، فلا تنسبيه للتمرين وحده.";
  return "ارتفع متوسطك نحو " + r1(a) + " نبضة منذ البداية. يحدث مع قلة النوم أو التوتر أو المرض أو الحرارة. إن استمر أسابيع مع تعب غير معتاد فاذكريه لطبيبتك.";
}
/* رسم النبض: خط واحد ونطاق الطبيعي 60 إلى 100 مظلّل، ونقاط مفرغة للأيام غير المعتادة */
function pulseChart(rows){
  rows = rows.slice(-30);
  if(rows.length < 2) return "";
  /* الزمن يسير من اليمين إلى اليسار كبقية رسوم الموقع، ومحور القيم على اليمين */
  var W = 320, H = 150, PL = 10, PR = 32, T = 12, B = 24, XR = W - PR;
  var vs = rows.map(function(r){ return r.p; }), mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs);
  mn = Math.min(mn, 55) - 3; mx = Math.max(mx, 75) + 3;
  if(mx - mn < 24){ var c = (mx + mn) / 2; mn = c - 12; mx = c + 12; }
  var X = function(i){ return XR - (XR - PL) * i / (rows.length - 1); };
  var Y = function(v){ return T + (H - T - B) * (1 - (v - mn) / (mx - mn)); };
  var bt = Y(Math.min(100, mx)), bb = Y(Math.max(60, mn));
  var pts = rows.map(function(r, i){ return X(i).toFixed(1) + "," + Y(r.p).toFixed(1); }).join(" ");
  var tk = [], v;
  for(v = Math.ceil(mn / 10) * 10; v <= mx; v += 10) tk.push(v);
  if(tk.length > 5) tk = tk.filter(function(x, i){ return i % 2 === 0; });
  var svg = '<svg class="pchart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="رسم لنبض الصباح في آخر ' + rows.length + ' قراءة، من ' + Math.min.apply(null, vs) + ' إلى ' + Math.max.apply(null, vs) + ' نبضة، والنطاق الطبيعي 60 إلى 100 مظلّل">';
  if(bb > bt) svg += '<rect class="band" x="' + PL + '" y="' + bt.toFixed(1) + '" width="' + (XR - PL) + '" height="' + (bb - bt).toFixed(1) + '" rx="4"/>';
  tk.forEach(function(t){ svg += '<line class="gl" x1="' + PL + '" x2="' + XR + '" y1="' + Y(t).toFixed(1) + '" y2="' + Y(t).toFixed(1) + '"/><text x="' + (W - 4) + '" y="' + (Y(t) + 3.5).toFixed(1) + '" text-anchor="end">' + t + '</text>'; });
  svg += '<polyline class="ln" points="' + pts + '"/>';
  rows.forEach(function(r, i){ svg += '<circle class="' + (r.f ? "fl" : "") + '" cx="' + X(i).toFixed(1) + '" cy="' + Y(r.p).toFixed(1) + '" r="' + (rows.length > 18 ? 3 : 4) + '"><title>' + dfmt(r.k) + ": " + r.p + (r.f ? " (يوم غير معتاد)" : "") + '</title></circle>'; });
  svg += '<text x="' + XR + '" y="' + (H - 6) + '" text-anchor="end">' + dshort(rows[0].k) + '</text><text x="' + PL + '" y="' + (H - 6) + '" text-anchor="start">' + dshort(rows[rows.length - 1].k) + '</text></svg>';
  return svg;
}

/* ============ أدوات الحساب ============ */
function zonesFor(age){
  var g = age >= 35, mx = g ? 206 - 0.88 * age : 208 - 0.7 * age;
  return {g:g, mx:Math.round(mx), mod:[Math.round(mx * 0.5), Math.round(mx * 0.7)], vig:[Math.round(mx * 0.7), Math.round(mx * 0.85)]};
}
function zonesHTML(age){
  if(!(age >= 18 && age <= 80)) return '<p class="xs muted">اكتبي عمرك (من 18 إلى 80) لتظهر المناطق.</p>';
  var z = zonesFor(age);
  return '<div class="zrow"><div><div class="xs muted">النبض الأقصى التقديري</div><div class="big num">' + z.mx + '</div></div><div class="xs muted">بمعادلة ' + (z.g ? "غولاتي للنساء" : "تاناكا") + '<br>' + (z.g ? "206 − 0.88 × العمر" : "208 − 0.7 × العمر") + '</div></div>' +
    '<div class="tbw"><table class="tb"><thead><tr><th>الجهد</th><th>نسبة</th><th>نبضة/دقيقة</th></tr></thead><tbody>' +
    '<tr><td>متوسط</td><td class="num">50–70%</td><td class="num b">' + z.mod[0] + ' إلى ' + z.mod[1] + '</td></tr>' +
    '<tr><td>شديد</td><td class="num">70–85%</td><td class="num b">' + z.vig[0] + ' إلى ' + z.vig[1] + '</td></tr></tbody></table></div>' +
    '<p class="xs muted">تقدير متوسط يخطئ فردياً. في الحرق الخفيف اعتمدي على اختبار الكلام أولاً: تتكلمين لكن لا تغنين = متوسط.</p>';
}
function proteinHTML(kg){
  if(!(kg >= 30 && kg <= 200)) return '<p class="xs muted">اكتبي وزنك بالكيلوجرام (من 30 إلى 200) ليظهر المدى.</p>';
  var lo = Math.round(kg * 0.8), hi = Math.round(kg * 1.6);
  return '<div class="zrow"><div><div class="xs muted">المدى التقريبي يومياً</div><div class="big num">' + lo + ' – ' + hi + '<small> جم</small></div></div></div>' +
    '<p class="xs muted">من 0.8 إلى 1.6 جم لكل كجم. لبرنامج خفيف مثل برنامجك أقدّر أن الجزء الأدنى إلى الأوسط من المدى يكفي (تقدير مني لا من دراسة). عند مرض كلوي أو حمل أو رضاعة اسألي طبيبتك أولاً.</p>';
}

/* ============ عدّاد النبض بالضغط ============ */
var PC = {on:false, taps:0, t0:0, tick:null, done:false, bpm:0};
function pcStop(){ if(PC.tick){ clearInterval(PC.tick); PC.tick = null; } PC.on = false; }
function countHTML(){
  PC = {on:false, taps:0, t0:0, tick:null, done:false, bpm:0};
  return '<div class="info"><h2 class="h2">عدّاد النبض</h2>' +
    '<p class="sm">ضعي إصبعين (لا الإبهام) على معصمك تحت قاعدة الإبهام، أو على جانب الرقبة. عندما تحسّين النبض اضغطي الزر الكبير مع كل نبضة. يبدأ العدّ من أول ضغطة ويستمر 30 ثانية، ثم أضرب الرقم في 2.</p>' +
    '<div class="pcbox"><div class="pct num" id="pct" aria-live="off">30</div><div class="xs muted" id="pcl">ثانية متبقية</div>' +
    '<button class="pcbtn" id="pcbtn" data-act="ptap" aria-label="اضغطي مع كل نبضة"><span class="num" id="pcn">0</span><small id="pcs">اضغطي مع أول نبضة</small></button></div>' +
    '<div id="pcres"></div></div>';
}
function pcPaint(){
  var n = document.getElementById("pcn"); if(!n){ pcStop(); return; }
  n.textContent = PC.taps;
  var left = Math.max(0, 30 - Math.floor((Date.now() - PC.t0) / 1000));
  var t = document.getElementById("pct"); if(t) t.textContent = left;
  if(Date.now() - PC.t0 >= 30000) pcFinish();
}
function pcFinish(){
  pcStop(); PC.done = true; PC.bpm = PC.taps * 2;
  var t = document.getElementById("pct"); if(t) t.textContent = "0";
  var s = document.getElementById("pcs"); if(s) s.textContent = "انتهى العدّ";
  var b = document.getElementById("pcbtn"); if(b) b.disabled = true;
  var r = document.getElementById("pcres"); if(!r) return;
  if(PC.taps < 15){ r.innerHTML = '<div class="warn">عدد الضغطات قليل (' + PC.taps + ')، ربما فاتتك نبضات. أعيدي المحاولة.</div><button class="btn quiet full" data-act="pagain">إعادة العدّ</button>'; return; }
  r.innerHTML = bandHTML(PC.bpm) + '<div class="row" style="gap:10px;margin-top:12px"><button class="btn" style="flex:1" data-act="puse">استخدمي هذه القراءة</button><button class="btn quiet" data-act="pagain">إعادة</button></div>';
}
function pcTap(){
  if(PC.done) return;
  if(!PC.on){ PC.on = true; PC.t0 = Date.now(); PC.taps = 0; var s = document.getElementById("pcs"); if(s) s.textContent = "اضغطي مع كل نبضة"; PC.tick = setInterval(pcPaint, 250); }
  PC.taps++; pcPaint();
}

/* ============ الدمج عند تعارض جهازين ============ */
function mergeStates(L, C){
  var newer = (C.ts || 0) > (L.ts || 0) ? C : L, older = newer === C ? L : C, M = {}, k;
  for(k in older) M[k] = older[k];
  for(k in newer) M[k] = newer[k];
  var un = function(a, b){ return Object.assign({}, a || {}, b || {}); };
  M.done = un(older.done, newer.done);
  ["alt", "gear", "pos", "walks"].forEach(function(f){ M[f] = un(older[f], newer[f]); });
  M.log = {};
  var ids = {}; Object.keys(older.log || {}).concat(Object.keys(newer.log || {})).forEach(function(i){ ids[i] = 1; });
  Object.keys(ids).forEach(function(id){
    var map = {};
    ((older.log || {})[id] || []).concat(((newer.log || {})[id] || [])).forEach(function(e){
      var key = e.w + "." + e.d; if(!map[key] || (e.ts || 0) >= (map[key].ts || 0)) map[key] = e;
    });
    M.log[id] = Object.keys(map).map(function(q){ return map[q]; });
  });
  M.chk = {};
  var dk = {}; Object.keys(older.chk || {}).concat(Object.keys(newer.chk || {})).forEach(function(d){ dk[d] = 1; });
  Object.keys(dk).forEach(function(d){
    var a = (older.chk || {})[d], b = (newer.chk || {})[d];
    M.chk[d] = !a ? b : (!b ? a : ((b.u || 0) >= (a.u || 0) ? b : a));
  });
  M.body = {};
  var wk = {}; Object.keys(older.body || {}).concat(Object.keys(newer.body || {})).forEach(function(w){ wk[w] = 1; });
  Object.keys(wk).forEach(function(w){
    var a = (older.body || {})[w] || {wall:[0, 0, 0], pulse:"", note:""}, b = (newer.body || {})[w] || {wall:[0, 0, 0], pulse:"", note:""};
    M.body[w] = {pulse:(b.pulse !== "" && b.pulse != null ? b.pulse : (a.pulse || "")),
      wall:[0, 1, 2].map(function(i){ return (a.wall && a.wall[i]) || (b.wall && b.wall[i]) ? 1 : 0; }),
      note:((b.note || "").length >= (a.note || "").length ? b.note : a.note) || ""};
  });
  return M;
}

/* ============ الحفظ السحابي (اختياري، يتحسّن به الحفظ المحلي ولا يستبدله) ============ */
var CL = {st:"local", na:false, at:0, uid:null, ref:null, timer:null, busy:false, again:false, retry:null, lastPull:0};
function hasProgress(o){
  o = o || S;
  return !!(Object.keys(o.done || {}).length || Object.keys(o.log || {}).length || Object.keys(o.chk || {}).length ||
    Object.keys(o.body || {}).some(function(w){ var b = o.body[w]; return b && ((b.pulse !== "" && b.pulse != null) || (b.wall || []).some(function(x){ return x; }) || b.note); }));
}
function cloudJson(){
  var c = {}; Object.keys(S).forEach(function(k){ if(k !== "synced" && k !== "qi" && k !== "qbag" && k !== "qh") c[k] = S[k]; });
  return JSON.stringify(c);
}
function syncLabel(){
  if(CL.st === "ok") return "محفوظ في حسابك وعلى هذا الجهاز";
  if(CL.st === "wait") return "جارٍ الحفظ…";
  if(CL.st === "err") return "تعذّر الحفظ السحابي الآن، وتقدمك محفوظ على هذا الجهاز";
  if(CL.st === "ro") return "الحفظ السحابي يحتاج صلاحية «مشارِك». تقدمك محفوظ على هذا الجهاز فقط";
  return "محفوظ على هذا الجهاز";
}
function syncHTML(){ return '<span class="sync ' + CL.st + '" data-sync>' + syncLabel() + '</span>'; }
function paintSync(){
  var els = document.querySelectorAll("[data-sync]");
  for(var i = 0; i < els.length; i++){ els[i].className = "sync " + CL.st; els[i].textContent = syncLabel(); }
}
function cloudQueue(now){
  if(!CL.ref) return;
  CL.st = "wait"; paintSync();
  clearTimeout(CL.timer); CL.timer = setTimeout(cloudPush, now ? 0 : 1800);
}
function cloudPush(){
  if(!CL.ref) return;
  if(CL.busy){ CL.again = true; return; }
  CL.busy = true; clearTimeout(CL.retry);
  if(!S.ts) S.ts = Date.now();
  var ts = S.ts, json = cloudJson();
  CL.ref.set({v:1, ts:ts, json:json}).then(function(){
    CL.busy = false; CL.st = "ok"; CL.at = Date.now();
    if(S.synced !== ts){ S.synced = ts; lsWrite(); }
    paintSync();
    if(CL.again){ CL.again = false; if(S.ts !== ts) cloudPush(); }
  }, function(e){
    CL.busy = false; CL.again = false;
    CL.st = (e && e.code === "invalid_argument") ? "ro" : "err";
    paintSync();
    if(CL.st === "err") CL.retry = setTimeout(function(){ cloudQueue(true); }, 20000);
  });
}
function adoptState(o){
  var q = {qi:S.qi, qbag:S.qbag};
  try{ localStorage.setItem(STORE_KEY + "-prev", JSON.stringify(S)); }catch(e){}
  S = freshState();
  Object.keys(o).forEach(function(k){ S[k] = o[k]; });
  S.qi = q.qi; S.qbag = q.qbag;
  normState(); SYNCH = stateHash(); lsWrite();
  var ae = document.activeElement;
  if(!(typeof TM !== "undefined" && TM) && !(ae && /INPUT|TEXTAREA/.test(ae.tagName)) && $("#shade").hidden) render();
  else paintSync();
}
function cloudMerge(snap){
  CL.lastPull = Date.now();
  var cloud = null;
  if(snap && snap.exists){
    try{ var d = snap.data(); cloud = migrateOrd(JSON.parse(d.json)); cloud.ts = d.ts || cloud.ts || 0; }catch(e){ cloud = null; }
  }
  if(!cloud){
    if(hasProgress()){ if(!S.ts){ S.ts = Date.now(); lsWrite(); } cloudQueue(true); }
    else { CL.st = "ok"; CL.at = Date.now(); paintSync(); }
    return;
  }
  var lts = S.ts || 0, cts = cloud.ts || 0, sy = S.synced || 0;
  if(stateHash(cloud) === SYNCH){ S.synced = Math.max(lts, cts); S.ts = S.synced; lsWrite(); CL.st = "ok"; CL.at = Date.now(); paintSync(); return; }
  if(!hasProgress()){ adoptState(cloud); S.synced = cts; lsWrite(); CL.st = "ok"; CL.at = Date.now(); paintSync(); return; }
  if(sy > 0 && lts <= sy && cts > sy){ adoptState(cloud); S.synced = cts; lsWrite(); CL.st = "ok"; CL.at = Date.now(); paintSync(); return; }
  if(sy > 0 && cts <= sy && lts > sy){ cloudQueue(true); return; }
  /* تغيّر الطرفان: ندمج دون خسارة أي شيء */
  var m = mergeStates(S, cloud);
  adoptState(m);
  S.ts = Date.now(); SYNCH = stateHash(); lsWrite();
  cloudQueue(true);
}
function cloudPull(){
  if(!CL.ref || CL.busy) return;
  CL.ref.get().then(cloudMerge, function(){});
}
function cloudInit(){
  var c = null;
  try{ c = window.claude; }catch(e){}
  if(!c || typeof c.use !== "function"){ CL.na = true; return; }
  CL.st = "wait"; paintSync();
  Promise.all([c.use("db"), c.use("user")]).then(function(r){
    var db = r[0], user = r[1];
    if(!db || !user || typeof user.id !== "function"){ CL.st = "local"; paintSync(); return null; }
    return user.id().then(function(id){
      if(!id){ CL.st = "local"; paintSync(); return null; }
      CL.uid = id; CL.ref = db.doc("data/users/" + id + "/progress");
      return CL.ref.get().then(cloudMerge);
    });
  }).catch(function(e){ CL.st = (CL.ref ? "err" : "local"); paintSync(); });
  document.addEventListener("visibilitychange", function(){
    if(document.visibilityState === "hidden"){ if(CL.timer && CL.ref && !CL.busy){ clearTimeout(CL.timer); cloudPush(); } }
    else if(CL.ref && Date.now() - CL.lastPull > 60000){ cloudPull(); }
  });
}
