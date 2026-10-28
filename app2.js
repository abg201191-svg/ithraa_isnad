/* ============ مساعدات مشتركة ============ */
var DAYORD = ["الأول", "الثاني", "الثالث", "الرابع"];
function dayLabel(d){ return "اليوم " + DAYORD[d - 1]; }
function kindName(D){ return D.kind === "up" ? "الجزء العلوي" : "الجزء السفلي"; }
function olist(a){ return '<ol>' + a.map(function(s){ return '<li>' + s + '</li>'; }).join("") + '</ol>'; }
function ulist(a){ return '<ul>' + a.map(function(s){ return '<li>' + s + '</li>'; }).join("") + '</ul>'; }
function dotsHTML(w){
  var h = "";
  for(var d = 1; d <= 4; d++){ h += '<i class="' + (dayDone(w, d) ? "on" : "") + '"></i>'; }
  return '<div class="dots" role="img" aria-label="' + sessionsDone(w) + ' من 4 جلسات مكتملة">' + h + '</div>';
}
/* أزرار الفيديو: بحث يوتيوب بالعربي وبالإنجليزي موجّه للنساء، وفيديو مباشر إن وُجد */
function vbar(o){
  var qa = o.qa || (o.ar + (o.en ? " " + o.en : "") + " للنساء");
  var qe = o.qe || ((o.en || o.ar) + " for women");
  var h = '<div class="vbar">';
  if(o.vid) h += '<a class="vbtn hi" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=' + o.vid + '">' + ico("play") + 'فيديو موجّه للنساء</a>';
  h += '<a class="vbtn" target="_blank" rel="noopener" href="' + yt(qa) + '">' + ico("play") + 'بحث بالعربي</a>' +
    '<a class="vbtn" target="_blank" rel="noopener" href="' + yt(qe) + '">' + ico("play") + 'بحث بالإنجليزي</a></div>';
  return h;
}
function enLine(en){ return en ? '<span class="en">' + esc(en) + '</span>' : ''; }
function setTarget(x, W, useAlt){
  var t = x.t, fx = x.fix;
  if(useAlt && x.alt){ if(x.alt.t) t = x.alt.t; if(x.alt.fix) fx = x.alt.fix; }
  if(t === "hold") return W.hold + " ثانية ثبات";
  if(t === "fixed") return fx;
  if(t === "alt") return W.reps + " تكراراً بالتبادل (المجموع)";
  if(t === "split") return W.reps + " تكراراً (المجموع)، نصفها لكل ساق";
  if(t === "arm") return W.reps + " تكراراً لكل ذراع";
  return W.reps + " تكراراً";
}
/* عند تفعيل البديل لا نعرض نصائح الحركة الأساسية (قد تذكر الحبل أو حركة مختلفة) */
function cueOf(x, useAlt){
  if(!useAlt || !x.alt) return x.cue;
  return x.alt.steps ? (x.alt.cue || "") : "";
}
/* بطاقة البديل: اسمه وشرح قصير وفيديو عربي وإنجليزي وزر التفعيل */
function altBlock(id){
  var x = EX[id]; if(!x.alt) return "";
  var a = x.alt, useAlt = !!S.alt[id];
  var h = '<div class="altc"><div class="altl">' + (x.band ? "البديل بدون حبل" : "بديل أخف") + (useAlt ? " · مفعّل الآن" : "") + '</div>' +
    '<div class="altn">' + a.ar + '</div>' + enLine(a.en) + '<p class="sm muted">' + a.why + '</p>';
  if(a.steps) h += olist(a.steps); else if(a.cue) h += '<p class="sm">' + a.cue + '</p>';
  h += vbar(a);
  h += '<button class="btn s ' + (useAlt ? "line" : "quiet") + '" data-act="alt" data-id="' + id + '">' + (useAlt ? "الرجوع للتمرين الأساسي" : "استخدمي البديل") + '</button></div>';
  return h;
}

/* ============ العرض: الجدول (الرئيسية) ============ */
function flowHTML(w, D){
  var cm = totalMin(w, D.n) - 10 - finMin(w);
  var f = [["الإحماء", 5], ["التمارين", cm], ["الحرق", finMin(w)], ["التهدئة", 5]];
  return '<span class="dflow">' + f.map(function(x, i){ return '<span class="fs"><i class="num">' + (i + 1) + '</i><b>' + x[0] + '</b><em class="num">' + x[1] + ' د</em></span>'; }).join("") + '</span>';
}
function dayCard(w, D, nd){
  var st = dayStats(w, D.n), dn = dayDone(w, D.n), isNext = nd === D.n;
  return '<button class="dcard' + (isNext ? " next" : "") + (dn ? " dn" : "") + '" data-act="day" data-w="' + w + '" data-d="' + D.n + '">' +
    '<span class="dh"><span class="stat' + (dn ? " on" : (st.pct > 0 ? " part" : "")) + '">' + (dn ? ico("check") : '<b class="num">' + D.n + '</b>') + '</span>' +
    '<span class="grow"><span class="lab">' + dayLabel(D.n) + (isNext ? " · الجلسة التالية" : "") + '</span><span class="ttl">' + D.title + '</span>' +
    '<span class="mt1">نحو ' + totalMin(w, D.n) + ' دقيقة · ' + kindName(D) + '</span></span>' + ico("fwd", "chev-l") + '</span>' +
    flowHTML(w, D) +
    '<span class="dl">' + D.ex.map(function(id, i){ return '<span class="dli"><i class="num">' + (i + 1) + '</i>' + EX[id].ar + '</span>'; }).join("") + '</span>' +
    (st.pct > 0 && !dn ? '<span class="bar"><i style="width:' + st.pct + '%"></i></span>' : '') + '</button>';
}

function renderHome(){
  var w = S.week, W = wkd(w), nd = nextDay(w), done = sessionsDone(w), h = "";

  h += '<div class="qt" role="note">' + QUOTES[UI.qi] + '</div>';
  h += '<div class="cap">اختاري الأسبوع</div>';
  h += '<div class="wk" role="group" aria-label="الأسابيع">' + WEEKS.map(function(x){
    return '<button class="wkc' + (x.n === w ? " on" : "") + (sessionsDone(x.n) === 4 ? " dn" : "") + '" data-act="week" data-w="' + x.n + '" aria-label="الأسبوع ' + x.n + '" aria-pressed="' + (x.n === w) + '">' + x.n + '</button>';
  }).join("") + '</div>';

  h += '<section class="card col" style="margin-top:14px"><div class="row sp"><div class="h2">الأسبوع ' + w + ' · ' + W.name + '</div><span class="sm muted">' + done + ' من 4</span></div>' +
    dotsHTML(w) + '<p class="sm muted">' + W.desc + '</p>' +
    '<div class="chips"><span class="chip">' + jol(W.rounds) + ' × ' + W.reps + '</span><span class="chip">حرق ' + finMin(w) + ' دقائق</span><span class="chip">جهد ' + W.rpe + '</span></div></section>';

  h += '<div class="cap">الجلسات الأربع</div><div class="col">' + DAYS.map(function(D){ return dayCard(w, D, nd); }).join("") + '</div>';
  if(!nd){
    h += '<section class="card col" style="margin-top:12px"><div class="b">أنهيتِ جلسات هذا الأسبوع كلها</div><p class="sm muted">' +
      (w < TOTAL_WEEKS ? "ارتاحي أو امشي مشياً سريعاً، ثم انتقلي للأسبوع " + (w + 1) + " («" + wkd(w + 1).name + "»)." : "أنهيتِ برنامج الأسابيع الثمانية. كرري قياس النبض واختبار الحائط من تبويب «سجلّي»، ثم أعيدي الأسابيع 5 إلى 8 بأوزان أثقل قليلاً.") + '</p>' +
      (w < TOTAL_WEEKS ? '<button class="btn full" data-act="nextwk">الانتقال للأسبوع ' + (w + 1) + '</button>' : '<button class="btn full" data-act="week" data-w="5">العودة إلى الأسبوع 5</button>') + '</section>';
  }
  h += '<p class="sm muted" style="margin-top:12px">رتّبي الجلسات الأربع كما يناسبك، وتجنّبي جلستين متتاليتين من نفس الجزء (علوي أو سفلي). بين الجلسات يوم راحة أو مشي سريع.</p>';

  return h;
}

/* ============ عناصر الإحماء والتهدئة ============ */
function chkRow(w, d, blk, j, x){
  var k = K(w, d, blk, j), dn = on(k);
  return '<div class="it"><button class="ck' + (dn ? " on" : "") + '" data-act="chk" data-w="' + w + '" data-d="' + d + '" data-b="' + blk + '" data-j="' + j + '" aria-label="تمّ: ' + x.ar + '" aria-pressed="' + dn + '">' + ico("check") + '</button>' +
    '<div class="grow"><div class="nm">' + x.ar + ' <span class="dur num">' + x.sec + ' ث</span></div><div class="cu">' + x.cue + '</div></div>' +
    '<div class="itb"><button class="sq" data-act="steps" data-d="' + d + '" data-b="' + blk + '" data-j="' + j + '" aria-label="شرح وفيديو: ' + x.ar + '">' + ico("info") + '</button>' +
    '<button class="sq" data-act="runitem" data-w="' + w + '" data-d="' + d + '" data-b="' + blk + '" data-j="' + j + '" aria-label="ابدئي العدّاد: ' + x.ar + '">' + ico("play") + '</button></div></div>';
}
function itemSheet(blk, kind, j){
  var x = (blk === "w" ? WU : CD)[kind][j];
  return '<div class="info"><div class="h2">' + x.ar + '</div>' + enLine(x.en) +
    '<div class="chips"><span class="chip">' + x.sec + ' ثانية</span>' + (x.evk ? '<span class="chip ev-' + EVID[x.evk].lv + '">الدليل: ' + LVS[EVID[x.evk].lv] + '</span>' : '') + '</div>' +
    '<p>' + x.cue + '</p>' +
    (x.steps ? '<div><h4>الخطوات</h4>' + olist(x.steps) + '</div>' : '') +
    (x.bad ? '<div><h4>أخطاء شائعة</h4>' + ulist(x.bad) + '</div>' : '') +
    vbar(x) + '</div>';
}

/* ============ العرض: صفحة اليوم (قائمة الحركات) ============ */
function exCard(w, d, i, id){
  var W = wkd(w), x = EX[id], useAlt = !!S.alt[id] && !!x.alt, key = posKey(w, d) + "." + i, open = !!UI.open[key];
  var e = entryOf(id, w, d), le = lastEntry(id, w, d), kgv = e && typeof e.kg === "number" ? e.kg : (le ? le.kg : null);
  var nDone = 0; for(var r0 = 0; r0 < W.rounds; r0++){ if(on(K(w, d, "s", i, r0))) nDone++; }
  var allOn = nDone === W.rounds;
  var nm = useAlt ? x.alt.ar : x.ar, en = useAlt ? x.alt.en : x.en;
  var h = '<div class="excard' + (open ? " open" : "") + (allOn ? " dn" : "") + '">';
  h += '<button class="exh" data-act="tog" data-key="' + key + '" aria-expanded="' + open + '"><span class="idx">' + (allOn ? ico("check") : '<b class="num">' + (i + 1) + '</b>') + '</span>' +
    '<span class="exm"><span class="ar">' + nm + '</span>' + enLine(en) + '<span class="sum">' + jol(W.rounds) + ' × ' + setTarget(x, W, useAlt) + (useAlt ? " · البديل" : "") + '</span></span>' + ico("chev", "chv") + '</button>';
  h += '<div class="exrow"><span class="lab">الجولات</span><div class="bub">';
  for(var r = 0; r < W.rounds; r++){
    var dn = on(K(w, d, "s", i, r));
    h += '<button class="sb' + (dn ? " on" : "") + '" data-act="bub" data-w="' + w + '" data-d="' + d + '" data-i="' + i + '" data-r="' + r + '" aria-label="الجولة ' + (r + 1) + '" aria-pressed="' + dn + '">' + (dn ? ico("check") : (r + 1)) + '</button>';
  }
  h += '</div></div>';
  if(open){
    h += '<div class="exb">';
    var chips = "";
    if(x.area) chips += '<span class="chip">استقامة · ' + AREAS[x.area] + '</span>';
    if(x.band) chips += '<span class="chip">' + (useAlt ? "بديل بدون حبل" : "حبل اختياري") + '</span>';
    if(x.evk) chips += '<button class="chip ev-' + EVID[x.evk].lv + '" data-act="ev" data-k="' + x.evk + '">الدليل: ' + LVS[EVID[x.evk].lv] + '</button>';
    if(chips) h += '<div class="chips">' + chips + '</div>';
    if(cueOf(x, useAlt)) h += '<div class="cue">' + cueOf(x, useAlt) + '</div>';
    if(x.t === "hold") h += '<button class="btn quiet full" data-act="hold" data-id="' + id + '">' + ico("play") + 'عدّاد ' + W.hold + ' ثانية</button>';
    if(!x.nokg){
      h += '<div class="kgbox"><div class="kgb"><button data-act="kg" data-id="' + id + '" data-w="' + w + '" data-d="' + d + '" data-s="-0.5" aria-label="أنقصي الوزن">−</button>' +
        '<input type="number" inputmode="decimal" step="0.5" min="0" max="60" id="kg-' + id + '" data-act="kgset" data-id="' + id + '" data-w="' + w + '" data-d="' + d + '" value="' + (kgv == null ? "" : fmtKg(kgv)) + '" placeholder="0" aria-label="الوزن بالكيلوغرام">' +
        '<button data-act="kg" data-id="' + id + '" data-w="' + w + '" data-d="' + d + '" data-s="0.5" aria-label="زيدي الوزن">+</button></div><div class="xs muted">كجم</div></div>';
      h += hintHTML(id, w, d);
    }
    h += '<div><div class="lbl2">' + (useAlt ? "فيديو الحركة الأساسية" : "فيديو شرح الحركة") + '</div>' + vbar(x) + '</div>';
    h += altBlock(id);
    h += '<details class="how"><summary>' + (useAlt ? "خطوات الحركة الأساسية وأخطاؤها" : "الخطوات وأخطاء شائعة") + ico("chev") + '</summary><div class="in"><div><h4>الخطوات</h4>' + olist(x.steps) + '</div><div><h4>أخطاء شائعة</h4>' + ulist(x.bad) + '</div></div></details>';
    if(!x.nokg){
      h += '<div><div class="lbl2">كيف كان الوزن اليوم؟</div><div class="feel">' +
        [["easy", "سهل"], ["ok", "مناسب"], ["hard", "صعب"]].map(function(f){ return '<button class="' + (e && e.feel === f[0] ? "on" : "") + '" data-act="feel" data-id="' + id + '" data-w="' + w + '" data-d="' + d + '" data-v="' + f[0] + '" aria-pressed="' + !!(e && e.feel === f[0]) + '">' + f[1] + '</button>'; }).join("") + '</div></div>';
    }
    h += '</div>';
  }
  return h + '</div>';
}

function finCard(w, d){
  var W = wkd(w), D = DAYS[d - 1], moves = FIN[D.kind].slice(0, W.fin), dn = on(K(w, d, "f", 0));
  return '<section class="card col"><div class="row sp"><div class="h3">' + W.fin + ' حركات، مرتان لكل حركة</div>' + (dn ? '<span class="tag">تمّ</span>' : '') + '</div>' +
    '<p class="rule">30 ثانية عمل ثم 30 ثانية راحة، بلا قفز. الجهد: <b>' + W.fe + '</b>. توقفي فوراً إن شعرتِ بدوار أو ألم في الصدر.</p>' +
    '<div class="moves">' + moves.map(function(id){ var m = FINMV[id]; return '<div><b>' + m.ar + '</b>' + enLine(m.en) + '<div class="c">' + m.cue + '</div>' + vbar(m) + '</div>'; }).join("") + '</div>' +
    '<details class="how"><summary>كيف أعرف الجهد؟' + ico("chev") + '</summary><div class="in"><p class="sm">اختبار الكلام: في الجهد المتوسط تتكلمين لكن لا تغنين، وفي الجهد العالي تقولين كلمات قليلة بين النفَسين.</p></div></details>' +
    '<div class="row wrap"><button class="btn grow" data-act="finstart" data-w="' + w + '" data-d="' + d + '">' + ico("play") + 'ابدئي المؤقّت</button><button class="btn quiet" data-act="finmark">' + (dn ? "إلغاء التأشير" : "تمّ يدوياً") + '</button></div>' +
    '<div class="chips"><button class="chip ev-logic" data-act="ev" data-k="lowimp">الدليل: ' + LVS.logic + '</button></div></section>';
}

/* أقسام الجلسة بالترتيب: الإحماء ثم التمارين ثم الحرق ثم التهدئة */
function stageList(w, d){
  var D = DAYS[d - 1], st = dayStats(w, d), cm = totalMin(w, d) - 10 - finMin(w);
  return [
    {n:1, ic:"sun", name:"الإحماء", min:5, got:st.wu, tot:WU[D.kind].length, meta:st.wu + "/" + WU[D.kind].length + " حركات"},
    {n:2, ic:"dumb", name:"التمارين", min:cm, got:st.sets, tot:st.setsT, meta:st.sets + "/" + st.setsT + " جولة"},
    {n:3, ic:"heart", name:"الحرق بلا قفز", min:finMin(w), got:st.fin ? 1 : 0, tot:1, meta:st.fin ? "تمّ" : wkd(w).fin + " حركات للقلب"},
    {n:4, ic:"leaf", name:"التهدئة والاستقامة", min:5, got:st.cd, tot:CD[D.kind].length, meta:st.cd + "/" + CD[D.kind].length + " حركات"}
  ];
}
function firstOpenStage(w, d){
  var L = stageList(w, d);
  if(L[1].got === 0 && !L[2].got && L[0].got < L[0].tot) return 1;
  if(L[1].got < L[1].tot) return 2;
  if(!L[2].got) return 3;
  return 4;
}
function stageNext(w, d, n, label){
  return '<button class="btn full" data-act="stagego" data-w="' + w + '" data-d="' + d + '" data-n="' + n + '">' + label + '</button>';
}
function stageBody(w, d, n){
  var W = wkd(w), D = DAYS[d - 1];
  if(n === 1){
    return '<p class="rule">5 دقائق خفيفة ترفع حرارة الجسم وتحرّك الكتفين والورك قبل الحمل.</p><div class="group">' +
      WU[D.kind].map(function(x, j){ return chkRow(w, d, "w", j, x); }).join("") + '</div>' +
      '<p class="sm muted">علّمي كل حركة بعد أن تنهيها، أو اضغطي التشغيل ليعدّ لك الوقت. التأشير اختياري.</p>' +
      stageNext(w, d, 2, "التالي: التمارين");
  }
  if(n === 2){
    return '<p class="rule">انتقلي بين الحركات بالترتيب (15 ثانية انتقال)، وبعد الحركة السادسة ارتاحي 40 ثانية ثم ابدئي جولة جديدة من الحركة 1. الجهد <b>' + W.rpe + '</b>. اضغطي دائرة الجولة بعد كل جولة ويبدأ مؤقت الانتقال.</p>' +
      '<div class="col">' + D.ex.map(function(id, i){ return exCard(w, d, i, id); }).join("") + '</div>' +
      stageNext(w, d, 3, "التالي: الحرق بلا قفز");
  }
  if(n === 3){
    return finCard(w, d) + stageNext(w, d, 4, "التالي: التهدئة والاستقامة");
  }
  var nd = d < 4 ? d + 1 : 0;
  return '<p class="rule">تمدد وحركات هادئة تُرجع النبض وتدعم الاستقامة. التأشير اختياري.</p><div class="group">' +
    CD[D.kind].map(function(x, j){ return chkRow(w, d, "c", j, x); }).join("") + '</div>' +
    '<div class="h3" style="margin-top:6px">الختام</div><div class="col">' + stepEnd(w, d).replace(/<h1 class="st-title">/, '<h2 class="h2">').replace('</h1>', '</h2>') +
    (nd ? '<button class="btn full" data-act="day" data-w="' + w + '" data-d="' + nd + '">' + dayLabel(nd) + ': ' + DAYS[nd - 1].title + '</button>'
        : '<button class="btn full" data-act="go" data-v="home">العودة إلى الجدول</button>') + '</div>';
}

function renderDay(w, d){
  var W = wkd(w), D = DAYS[d - 1], st = dayStats(w, d), h = "";
  h += '<div class="stop"><div class="r"><button class="icobtn" data-act="go" data-v="home" aria-label="الرجوع إلى الجدول">' + ico("back") + '</button>' +
    '<div class="ttl">الأسبوع ' + w + ' · ' + dayLabel(d) + '</div><span style="width:44px"></span></div></div>';
  h += '<header class="dhead"><div class="dk">' + W.name + '</div><h1 class="dt">' + D.title + '</h1>' +
    '<p class="dfocus">' + D.focus + '</p>' +
    '<div class="dmeta"><span class="dm">' + ico("clock") + 'نحو ' + totalMin(w, d) + ' دقيقة</span><span class="dm">' + kindName(D) + '</span><span class="dm">' + D.ex.length + ' حركات · ' + jol(W.rounds) + '</span></div>' +
    '<div class="dprog"><div class="bar"><i style="width:' + st.pct + '%"></i></div><div class="dpl"><span>أنجزتِ</span><b class="num">' + st.pct + '%</b><span>من هذه الجلسة</span></div></div></header>';

  var cur = UI.stg[posKey(w, d)] || 0;
  h += '<div class="tl" role="list">' + stageList(w, d).map(function(sg){
    var open = cur === sg.n, dn = sg.got >= sg.tot;
    return '<section class="stg' + (open ? " open" : "") + (dn ? " dn" : "") + '" id="stg-' + sg.n + '" role="listitem">' +
      '<button class="stgh" data-act="stage" data-w="' + w + '" data-d="' + d + '" data-n="' + sg.n + '" aria-expanded="' + open + '">' +
      '<span class="stgn" style="--p:' + Math.round(100 * Math.min(1, sg.got / sg.tot)) + '">' + ico(dn ? "check" : sg.ic) + '</span>' +
      '<span class="grow"><span class="stgk">الخطوة ' + sg.n + ' من 4</span><span class="stgt">' + sg.name + '</span><span class="stgm"><span>' + ico("clock") + 'نحو ' + sg.min + ' د</span><span>' + sg.meta + '</span></span></span>' + ico("chev", "chv") + '</button>' +
      (open ? '<div class="stgb">' + stageBody(w, d, sg.n) + '</div>' : '') + '</section>';
  }).join("") + '</div>';
  return h;
}

/* ============ وضع الجلسة خطوة بخطوة ============ */
function stepWarm(w, d){
  var W = wkd(w), D = DAYS[d - 1];
  return '<div class="where">البداية · 5 دقائق</div><h1 class="st-title">إحماء قصير</h1>' +
    '<p class="rule">جلسة اليوم نحو <b>' + totalMin(w, d) + ' دقيقة</b>: هذا الإحماء، ثم <b>6 حركات × ' + jol(W.rounds) + '</b> بالترتيب، ثم <b>حرق ' + finMin(w) + ' دقائق</b>، ثم تهدئة 5 دقائق. بين الحركات 15 ثانية انتقال، وبين الجولات 40 ثانية راحة. الجهد <b>' + W.rpe + '</b>.</p>' +
    '<div class="group">' + WU[D.kind].map(function(x, j){ return chkRow(w, d, "w", j, x); }).join("") + '</div>' +
    '<p class="sm muted">علّمي كل حركة بعد أن تنهيها، أو اضغطي التشغيل ليعدّ لك الوقت. التأشير اختياري ولا يمنع إكمال الجلسة.</p>';
}

function stepSet(w, d, s, steps, p){
  var W = wkd(w), D = DAYS[d - 1], id = D.ex[s.i], x = EX[id], useAlt = !!S.alt[id] && !!x.alt, h = "";
  var e = entryOf(id, w, d), le = lastEntry(id, w, d), kgv = e && typeof e.kg === "number" ? e.kg : (le ? le.kg : null);
  var dn = on(K(w, d, "s", s.i, s.r)), nx = steps[p + 1];

  h += '<div class="where">الحركة ' + (s.i + 1) + ' من ' + D.ex.length + ' · الجولة ' + (s.r + 1) + ' من ' + W.rounds + '</div>';
  h += '<div><h1 class="st-title">' + (useAlt ? x.alt.ar : x.ar) + '</h1>' + enLine(useAlt ? x.alt.en : x.en) + '</div>';
  h += '<div class="st-target">' + setTarget(x, W, useAlt) + '</div>';

  var chips = "";
  if(x.area) chips += '<span class="chip">استقامة · ' + AREAS[x.area] + '</span>';
  if(x.band) chips += '<span class="chip">' + (useAlt ? "بديل بدون حبل" : "حبل اختياري") + '</span>';
  if(useAlt && !x.band) chips += '<span class="chip">البديل الأخف</span>';
  if(x.evk) chips += '<button class="chip ev-' + EVID[x.evk].lv + '" data-act="ev" data-k="' + x.evk + '">الدليل: ' + LVS[EVID[x.evk].lv] + '</button>';
  if(chips) h += '<div class="chips">' + chips + '</div>';

  if(!x.nokg){
    h += '<div class="kgbox"><div class="kgb"><button data-act="kg" data-id="' + id + '" data-w="' + w + '" data-d="' + d + '" data-s="-0.5" aria-label="أنقصي الوزن">−</button>' +
      '<input type="number" inputmode="decimal" step="0.5" min="0" max="60" id="kg-' + id + '" data-act="kgset" data-id="' + id + '" data-w="' + w + '" data-d="' + d + '" value="' + (kgv == null ? "" : fmtKg(kgv)) + '" placeholder="0" aria-label="الوزن بالكيلوغرام">' +
      '<button data-act="kg" data-id="' + id + '" data-w="' + w + '" data-d="' + d + '" data-s="0.5" aria-label="زيدي الوزن">+</button></div><div class="xs muted">كجم</div></div>';
    h += hintHTML(id, w, d);
  }
  if(x.t === "hold"){
    h += '<button class="btn quiet full" data-act="hold" data-id="' + id + '">' + ico("play") + 'عدّاد ' + W.hold + ' ثانية</button>';
  }
  if(cueOf(x, useAlt)) h += '<div class="cue">' + cueOf(x, useAlt) + '</div>';
  if(x.alt){
    h += '<button class="btn quiet full" data-act="alt" data-id="' + id + '">' + (useAlt ? "الرجوع للتمرين الأساسي" : (x.band ? "ما عندي حبل: استخدمي البديل" : "صعب عليّ: استخدمي البديل الأخف")) + '</button>';
  }

  var how = '<div><h4>فيديو شرح الحركة</h4>' + vbar(useAlt ? x.alt : x) + '</div>' +
    '<div><h4>الخطوات' + (useAlt ? ' (للحركة الأساسية)' : '') + '</h4>' + olist(x.steps) + '</div>' +
    '<div><h4>أخطاء شائعة</h4>' + ulist(x.bad) + '</div>' + altBlock(id);
  h += '<details class="how"><summary>كيف أؤديها؟ والبديل' + ico("chev") + '</summary><div class="in">' + how + '</div></details>';

  if(!x.nokg && s.r === W.rounds - 1){
    h += '<div><div class="b" style="margin-bottom:8px">كيف كان الوزن اليوم؟</div><div class="feel">' +
      [["easy", "سهل"], ["ok", "مناسب"], ["hard", "صعب"]].map(function(f){ return '<button class="' + (e && e.feel === f[0] ? "on" : "") + '" data-act="feel" data-id="' + id + '" data-w="' + w + '" data-d="' + d + '" data-v="' + f[0] + '" aria-pressed="' + !!(e && e.feel === f[0]) + '">' + f[1] + '</button>'; }).join("") + '</div></div>';
  }
  if(dn) h += '<button class="link" data-act="setundo" style="align-self:flex-start">إلغاء تأشير هذه الجولة</button>';
  if(nx){
    var rest = (nx.t === "set" && nx.r !== s.r) ? "راحة 40 ثانية ثم " : "";
    h += '<div class="next-up">بعدها: <b>' + rest + stepName(w, d, nx) + (nx.t === "set" && nx.r !== s.r ? " (الجولة " + (nx.r + 1) + ")" : "") + '</b></div>';
  }
  return h;
}

function stepFin(w, d){
  var W = wkd(w), D = DAYS[d - 1], moves = FIN[D.kind].slice(0, W.fin), dn = on(K(w, d, "f", 0));
  var h = '<div class="where">الحرق · ' + finMin(w) + ' دقائق</div><h1 class="st-title">حرق بلا قفز</h1>' +
    '<div class="st-target">' + W.fin + ' حركات، مرتان لكل حركة</div>' +
    '<p class="rule">30 ثانية عمل ثم 30 ثانية راحة، بلا قفز. الجهد: <b>' + W.fe + '</b>. توقفي فوراً إن شعرتِ بدوار أو ألم في الصدر.</p>' +
    '<details class="how"><summary>كيف أعرف الجهد؟' + ico("chev") + '</summary><div class="in"><p class="sm">اختبار الكلام: في الجهد المتوسط تتكلمين لكن لا تغنين، وفي الجهد العالي تقولين كلمات قليلة بين النفَسين.</p></div></details>' +
    '<div class="moves">' + moves.map(function(id){ var m = FINMV[id]; return '<div><b>' + m.ar + '</b>' + enLine(m.en) + '<div class="c">' + m.cue + '</div>' + vbar(m) + '</div>'; }).join("") + '</div>' +
    '<div class="chips"><button class="chip ev-logic" data-act="ev" data-k="lowimp">الدليل: ' + LVS.logic + '</button></div>';
  if(dn){
    h += '<div class="warn">تمّ الحرق، أحسنتِ.</div><button class="link" data-act="finmark" style="align-self:flex-start">إلغاء التأشير</button>';
  }else{
    h += '<div class="row wrap"><button class="link" data-act="finmark">أنهيته دون المؤقّت</button><button class="link" data-act="finskip">تخطي الحرق</button></div>';
  }
  return h;
}

function stepCool(w, d){
  var D = DAYS[d - 1];
  return '<div class="where">النهاية · 5 دقائق</div><h1 class="st-title">تهدئة واستقامة</h1>' +
    '<p class="muted">تمدد وسحب للذقن ' + (D.kind === "up" ? "يفتح الصدر ويعدّل الرقبة والكتفين" : "يفتح الورك ويريح الأرجل") + '. اضغطي الأيقونة (i) لخطوات كل حركة وفيديوها.</p>' +
    '<div class="group">' + CD[D.kind].map(function(x, j){ return chkRow(w, d, "c", j, x); }).join("") + '</div>';
}

function stepEnd(w, d){
  var st = dayStats(w, d), dn = dayDone(w, d), prs = dayPRs(w, d), p = partnerOf(d), sh = sharedIds(d);
  var h = '<div class="where">' + (dn ? "اكتملت الجلسة" : "الجلسة لم تكتمل بعد") + '</div>' +
    '<h1 class="st-title">' + (dn ? "أحسنتِ، أنهيتِ جلسة اليوم" : "ما تبقى من جلسة اليوم") + '</h1>' +
    '<p class="muted">' + (dn ? "ارتاحي وتناولي الماء. الجلسة القادمة جاهزة بأوزانك المحفوظة." : "أكملي الحركات والحرق لتُحتسب الجلسة. الإحماء والتهدئة يحسّنان الاستقامة لكنهما لا يمنعان الإكمال.") + '</p>' +
    '<div class="sumrow"><div><div class="v num">' + st.sets + '/' + st.setsT + '</div><div class="l">جولات</div></div>' +
    '<div><div class="v num">' + (st.fin ? finMin(w) : 0) + '</div><div class="l">دقائق حرق</div></div>' +
    '<div><div class="v num">' + prs + '</div><div class="l">أوزان جديدة</div></div></div>';
  if(sh.length && p){
    var names = sh.map(function(id){ return EX[id].ar; }).join(" و");
    h += '<div class="card"><div class="b">رابط بين الأيام</div><p class="sm muted" style="margin-top:4px">' +
      (p.n > d ? 'تتكرر في ' + dayLabel(p.n) + ' هذه الحركات: ' + names + '. وزن اليوم يظهر لك هناك ويُعبَّأ تلقائياً.' : 'هذه الحركات جاءت من ' + dayLabel(p.n) + ': ' + names + '. وزنها انتقل إلى هنا تلقائياً.') + '</p></div>';
  }
  return h;
}

function sessionBar(w, d, s, p, n){
  var done = stepDone(w, d, s), nd = d < 4 ? d + 1 : 0, q = "", pr = "";
  if(p > 0 && s.t !== "end") q = '<button class="btn quiet" data-act="prev">السابق</button>';
  if(s.t === "end") q = '<button class="btn quiet" data-act="closeses">قائمة اليوم</button>';
  if(s.t === "warm") pr = '<button class="btn" data-act="next">ابدئي الحركات</button>';
  else if(s.t === "set") pr = done ? '<button class="btn" data-act="next">التالي</button>' : '<button class="btn" data-act="setdone">' + ico("check") + 'تمّت الجولة</button>';
  else if(s.t === "fin") pr = done ? '<button class="btn" data-act="next">التالي</button>' : '<button class="btn" data-act="finstart" data-w="' + w + '" data-d="' + d + '">' + ico("play") + 'ابدئي المؤقّت</button>';
  else if(s.t === "cool") pr = '<button class="btn" data-act="next">إنهاء الجلسة</button>';
  else if(!dayDone(w, d)) pr = '<button class="btn" data-act="overview">عرض الخطوات</button>';
  else if(nd) pr = '<button class="btn" data-act="day" data-w="' + w + '" data-d="' + nd + '">' + dayLabel(nd) + ': ' + DAYS[nd - 1].title + '</button>';
  else if(sessionsDone(w) === 4 && w < TOTAL_WEEKS) pr = '<button class="btn" data-act="nextwk">الانتقال للأسبوع ' + (w + 1) + '</button>';
  else pr = '<button class="btn" data-act="go" data-v="home">العودة للجدول</button>';
  return '<div class="sact"><div class="sacti">' + q + pr + '</div></div>';
}

function renderPlay(w, d){
  var steps = stepsOf(w, d), n = steps.length, p = curPos(w, d), s = steps[p], h = "";
  h += '<div class="stop"><div class="r"><button class="icobtn" data-act="closeses" aria-label="الخروج إلى قائمة اليوم">' + ico("x") + '</button>' +
    '<div class="ttl">' + dayLabel(d) + ' · الخطوة ' + (p + 1) + ' من ' + n + '</div>' +
    '<button class="icobtn" data-act="overview" aria-label="كل خطوات الجلسة">' + ico("list") + '</button></div>' +
    '<div class="sprog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(100 * p / (n - 1)) + '"><i style="width:' + Math.round(100 * p / (n - 1)) + '%"></i></div></div>';
  h += '<div class="sbody">';
  if(s.t === "warm") h += stepWarm(w, d);
  else if(s.t === "set") h += stepSet(w, d, s, steps, p);
  else if(s.t === "fin") h += stepFin(w, d);
  else if(s.t === "cool") h += stepCool(w, d);
  else h += stepEnd(w, d);
  h += '</div>' + sessionBar(w, d, s, p, n);
  return h;
}

function overviewHTML(w, d){
  var steps = stepsOf(w, d), p = curPos(w, d), W = wkd(w), lastR = -1, h = '<div class="h2">خطوات الجلسة</div><div class="steps-l">';
  steps.forEach(function(s, q){
    if(s.t === "set" && s.r !== lastR){ lastR = s.r; h += '<div class="rd">الجولة ' + (s.r + 1) + ' من ' + W.rounds + '</div>'; }
    var dn = stepDone(w, d, s) && s.t !== "end";
    h += '<button data-act="stepto" data-i="' + q + '"' + (q === p ? ' aria-current="step"' : '') + '><span class="stat' + (dn ? " on" : "") + '">' + ico("check") + '</span><span class="grow' + (q === p ? " b" : "") + '">' + stepName(w, d, s) + '</span>' + (q === p ? '<span class="xs muted">أنتِ هنا</span>' : '') + '</button>';
  });
  return h + '</div>';
}
