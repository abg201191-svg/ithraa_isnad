/* ============ مكوّنات مشتركة ============ */
function evBlock(k){
  var e = EVID[k];
  return '<div class="ev"><div class="row sp wrap"><span class="b">' + e.t + '</span><span class="chip ev-' + e.lv + '">' + LV[e.lv] + '</span></div><p>' + e.tx + '</p>' +
    (e.src.length ? '<div class="links">' + e.src.map(function(s){ return '<a class="lk" target="_blank" rel="noopener" href="' + s.u + '">' + s.t + '</a>'; }).join("") + '</div>' : '') + '</div>';
}
function acc(t, body, open){
  return '<details class="acc"' + (open ? " open" : "") + '><summary>' + t + ico("chev") + '</summary><div class="in">' + body + '</div></details>';
}
function accEv(k){
  var e = EVID[k], n = e.src.length;
  return '<details class="acc eva lv-' + e.lv + '"><summary><span class="evx"><span class="evt">' + e.t + '</span><span class="evm"><span class="chip ev-' + e.lv + '">' + LV[e.lv] + '</span>' + (n ? '<span class="xs muted">' + (n === 1 ? "مصدر واحد" : n === 2 ? "مصدران" : n + " مصادر") + '</span>' : '<span class="xs muted">بلا مصدر مباشر</span>') + '</span></span>' + ico("chev") + '</summary><div class="in"><p>' + e.tx + '</p>' +
    (n ? '<div class="links">' + e.src.map(function(s){ return '<a class="lk" target="_blank" rel="noopener" href="' + s.u + '">' + s.t + '</a>'; }).join("") + '</div>' : '<p class="xs muted">لا توجد مصادر مباشرة لهذه الفقرة، وهذا مذكور في القوة أعلاه.</p>') + '</div></details>';
}
function evChip(k, pre){
  var e = EVID[k];
  return '<button class="chip ev-' + e.lv + '" data-act="ev" data-k="' + k + '">' + (pre || "الدليل: ") + LV[e.lv] + '</button>';
}
function sech(icon, title, sub){
  return '<div class="sech"><span class="si">' + ico(icon) + '</span><div><h2>' + title + '</h2>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div></div>';
}
function segBar(act, cur, items){
  return '<div class="seg segx" role="tablist">' + items.map(function(i){
    return '<button role="tab" aria-selected="' + (cur === i[0]) + '" class="' + (cur === i[0] ? "on" : "") + '" data-act="' + act + '" data-v="' + i[0] + '">' + i[1] + '</button>';
  }).join("") + '</div>';
}
function phead(icon, title, sub, meta){
  return '<header class="phd"><span class="phi">' + ico(icon) + '</span><div class="phx"><h1 class="h1">' + title + '</h1>' + (sub ? '<p class="phs">' + sub + '</p>' : '') + '</div>' + (meta ? '<div class="phm">' + meta + '</div>' : '') + '</header>';
}
/* بطاقات تنقّل: أيقونة وعنوان، وإن كان العدد 5 يتمدد الأخير */
function tiles(act, cur, items, attr){
  attr = attr || "data-v";
  return '<div class="rtiles"' + (attr === "data-v" ? ' role="tablist"' : '') + '>' + items.map(function(i, n){
    var wide = (items.length % 3 === 2 && n === items.length - 1), on_ = (cur === i[0]);
    return '<button ' + (attr === "data-v" ? 'role="tab" aria-selected="' + on_ + '" ' : '') + 'class="rt' + (on_ ? " on" : "") + (wide ? " wide" : "") + '" data-act="' + act + '" ' + attr + '="' + i[0] + '"><span class="ri">' + ico(i[2]) + '</span><span>' + i[1] + '</span></button>';
  }).join("") + '</div>';
}
function chkBtn(act, on, text, sub, extra){
  return '<button class="chk" ' + (extra || "") + ' data-act="' + act + '" aria-pressed="' + on + '"><span class="ck' + (on ? " on" : "") + '">' + ico("check") + '</span><span><span class="b" style="display:block">' + text + '</span>' + (sub ? '<span class="xs muted" style="display:block">' + sub + '</span>' : '') + '</span></button>';
}

/* ============ سجلّي ============ */
function renderLog(){
  var h = phead("log", "سجلّي", "تقدّمك ونبضك وقياساتك في مكان واحد", syncHTML());
  h += '<div class="mt">' + segBar("lseg", UI.ls, [["ov", "نظرة عامة"], ["pu", "نبض الصباح"], ["wk", "قياسات الأسبوع"]]) + '</div>';
  if(UI.ls === "pu") h += logPulse();
  else if(UI.ls === "wk") h += logWeek();
  else h += logOverview();
  return h;
}

function logOverview(){
  var w = S.week, tot = allSessions(), full = TOTAL_WEEKS * 4, pct = Math.round(100 * tot / full);
  var fins = 0; for(var q = 1; q <= TOTAL_WEEKS; q++){ for(var dd = 1; dd <= 4; dd++){ if(on(K(q, dd, "f", 0))) fins += finMin(q); } }
  var h = '<section class="lhero mt"><div class="ring" style="--p:' + pct + '" role="img" aria-label="أنهيتِ ' + pct + '% من البرنامج"><b class="num">' + pct + '%</b></div>' +
    '<div class="grow"><div class="h3 num">' + tot + ' من ' + full + ' جلسة</div><div class="xs muted">أنتِ في الأسبوع ' + w + ' من ' + TOTAL_WEEKS + ' (' + wkd(w).name + ')</div><div class="xs muted num">جلسات هذا الأسبوع: ' + sessionsDone(w) + ' من 4</div></div></section>';
  h += '<div class="stats mt">' +
    '<div><span class="sti">' + ico("check") + '</span><div class="v num">' + tot + '</div><div class="l">جلسة مكتملة</div></div>' +
    '<div><span class="sti">' + ico("dumb") + '</span><div class="v num">' + prCount() + '</div><div class="l">وزن جديد</div></div>' +
    '<div><span class="sti">' + ico("heart") + '</span><div class="v num">' + fins + '</div><div class="l">دقيقة حرق للقلب</div></div></div>';

  /* بطاقة النبض المختصرة */
  var te = S.chk[dkey()], t = pulseTrend(), mini;
  if(te && te.p){ var bd = pulseBand(te.p); mini = '<span class="mi">' + ico("heart") + '</span><span class="grow"><span class="b" style="display:block">نبض اليوم <span class="num">' + te.p + '</span></span><span class="xs muted" style="display:block">' + bd.t + '</span></span>'; }
  else if(t.last){ mini = '<span class="mi">' + ico("heart") + '</span><span class="grow"><span class="b" style="display:block">سجّلي نبض اليوم</span><span class="xs muted" style="display:block">آخر قراءة: <span class="num">' + t.last.p + '</span> يوم ' + dfmt(t.last.k) + '</span></span>'; }
  else mini = '<span class="mi">' + ico("heart") + '</span><span class="grow"><span class="b" style="display:block">نبض الصباح</span><span class="xs muted" style="display:block">اكتبي رقمك ويخبرك الموقع ماذا يعني</span></span>';
  h += '<button class="pmini mt" data-act="lseg" data-v="pu">' + mini + ico("fwd", "chev-l") + '</button>';

  h += sech("log", "الجلسات في كل أسبوع", "الارتفاع الكامل = 4 جلسات") +
    '<section class="card col"><div class="wbars" role="img" aria-label="عدد الجلسات المكتملة في كل أسبوع من 4">' +
    WEEKS.map(function(x){
      var n = sessionsDone(x.n);
      return '<div class="wbar' + (x.n === w ? " cur" : "") + '"><b class="num">' + (n || "") + '</b><i class="' + (n ? "" : "z") + '" style="height:' + (n ? n * 25 : 3) + '%"></i><small class="num">' + x.n + '</small></div>';
    }).join("") + '</div><p class="xs muted">الأرقام تحت الأعمدة هي الأسابيع.</p></section>';

  var ids = Object.keys(S.log).filter(function(id){ return EX[id] && S.log[id].some(function(e){ return typeof e.kg === "number"; }); });
  h += sech("dumb", "أوزان الدمبلات", "تنتقل أوزانك تلقائياً بين الجلسات");
  if(!ids.length){
    h += '<section class="card"><p class="muted sm">ستظهر هنا أوزانك بعد أول جلسة. يُحفظ الوزن باسم الحركة، فينتقل تلقائياً بين الجلسات المشتركة وبين الأسابيع.</p></section>';
  }else{
    h += '<div class="group">' + ids.map(function(id){
      var arr = S.log[id].filter(function(e){ return typeof e.kg === "number"; }).sort(function(a, c){ return a.ts - c.ts; });
      var vals = arr.map(function(e){ return e.kg; }), first = vals[0], lastv = vals[vals.length - 1], diff = Math.round((lastv - first) * 10) / 10;
      var dtx = vals.length > 1 ? (diff > 0 ? "زيادة " + fmtKg(diff) + " كجم منذ البداية" : (diff < 0 ? "نقص " + fmtKg(-diff) + " كجم" : "ثابت")) : "أول تسجيل";
      var dcl = vals.length > 1 ? (diff > 0 ? "up" : (diff < 0 ? "dn" : "")) : "";
      return '<div class="exl"><div class="exi"><div class="b">' + EX[id].ar + '</div><div class="xs delta ' + dcl + '">' + dtx + '</div></div>' + sparkSVG(vals) + '<div class="exv num">' + fmtKg(lastv) + '<small>كجم</small></div></div>';
    }).join("") + '</div>';
  }

  h += sech("check", "الحفظ والنسخ", "") +
    '<section class="card col"><div class="row sp wrap">' + syncHTML() + '</div><p class="xs muted">' + saveHelp() + '</p>' +
    '<button class="btn quiet full" data-act="export">نسخ ملخص تقدّمي</button></section>';
  return h;
}
function saveHelp(){
  if(CL.st === "ok" || CL.st === "wait" || CL.st === "err") return "يُحفظ تقدمك تلقائياً على هذا الجهاز، ويُرسل نسخة إلى حسابك فتجدينه حين تفتحين الصفحة من جهاز آخر وأنتِ مسجّلة الدخول. عند تعارض جهازين أدمج البيانات ولا أمسح شيئاً.";
  if(CL.st === "ro") return "يُحفظ تقدمك تلقائياً على هذا الجهاز. للحفظ في الحساب يلزم أن تكون صلاحيتك على الصفحة «مشارِك» (Contributor) أو أعلى.";
  return "يُحفظ تقدمك تلقائياً على هذا الجهاز. الحفظ في الحساب يعمل فقط حين تفتحين الصفحة من claude.ai وأنتِ مسجّلة الدخول، وإلا يبقى على هذا المتصفح، فاحتفظي بنسخة احتياطية من الإعدادات.";
}

function logPulse(){
  var tk = dkey(), cur = S.chk[tk] || null, rows = chkRows(), t = pulseTrend();
  var pre = UI.pfill != null ? UI.pfill : (cur ? cur.p : ""); UI.pfill = null;
  var h = '<section class="card col mt"><div class="row sp wrap"><h2 class="h3">قراءة الاستيقاظ</h2>' + evChip("rhr") + '</div>' +
    '<p class="sm muted">قيسي نبضك صباحاً بعد الاستيقاظ وأنتِ هادئة وساكنة، جالسة أو مستلقية. اكتبي الرقم الآن، وسيخبرك الموقع ماذا يعني.</p>' +
    '<div class="fld"><label for="pdate">اليوم</label><input class="inp" type="date" id="pdate" value="' + tk + '" max="' + tk + '" data-act="pdate"></div>' +
    '<div class="fld"><label for="pbpm">نبضات القلب في الدقيقة</label><div class="row" style="gap:10px"><input class="inp num bigin" id="pbpm" type="number" inputmode="numeric" min="30" max="200" placeholder="مثلاً 72" value="' + esc(pre) + '" data-act="pbpm" style="flex:1;min-width:0"><button class="btn quiet" data-act="pcount">' + ico("heart") + 'عدّيني</button></div>' +
    '<span class="xs muted">لا تعرفين كيف تعدّين؟ اضغطي «عدّيني» وسأحسب لك.</span></div>' +
    '<div id="plive">' + (pre !== "" && +pre >= 30 ? bandHTML(+pre) : "") + '</div>' +
    '<div class="fld"><label for="psleep">ساعات نومك الليلة الماضية (اختياري)</label><input class="inp num" id="psleep" type="number" inputmode="decimal" step="0.5" min="0" max="16" placeholder="مثلاً 7" value="' + (cur && cur.s != null ? cur.s : "") + '" data-act="psleep"><span class="xs muted" id="pslnote">' + (cur && cur.s ? sleepNote(cur.s) : "") + '</span></div>' +
    '<div class="group">' + chkBtn("pflag", !!(cur && cur.f), "يوم غير معتاد", "مرض أو توتر أو قهوة قبل القياس أو قلة نوم. لا يدخل في المتوسط والمقارنة.", 'id="pflag"') + '</div>' +
    '<button class="btn full" data-act="psave">احفظي القراءة</button></section>';

  if(rows.length){
    var last = rows[rows.length - 1];
    h += sech("heart", "اتجاه نبضك", rows.length + " قراءة محفوظة") +
      '<section class="card col"><div class="tiles3"><div><div class="v num">' + last.p + '</div><div class="l">آخر قراءة</div></div>' +
      '<div><div class="v num">' + (t.avg7 != null ? t.avg7 : "—") + '</div><div class="l">متوسط آخر 7</div></div>' +
      '<div><div class="v num">' + (t.diff != null ? '<bdi dir="ltr">' + (t.diff > 0 ? "+" : (t.diff < 0 ? "\u2212" : "")) + Math.abs(t.diff) + '</bdi>' : "—") + '</div><div class="l">' + (t.diff != null ? "الفرق منذ البداية" : "الفرق (بعد 14 يوماً)") + '</div></div></div>' +
      pulseChart(rows) +
      (rows.length > 1 ? '<p class="xs muted">المظلّل هو النطاق الطبيعي (60 إلى 100). النقاط المفرغة أيام علّمتِها «غير معتادة».</p>' : '<p class="xs muted">سجّلي قراءة ثانية ليظهر الرسم.</p>') +
      '<p class="sm">' + trendText(t) + '</p>' +
      (t.sleep7 != null ? '<p class="xs muted num">متوسط نومك في آخر قراءاتك: ' + t.sleep7 + ' ساعة. ' + (t.sleep7 >= 7 ? "ضمن الموصى به." : "أقل من 7 ساعات الموصى بها للبالغين بانتظام.") + '</p>' : '') +
      '<div class="chips">' + evChip("trend", "كيف تُحسب؟ ") + evChip("rhrex", "هل ينزل بالتمرين؟ ") + '</div></section>';

    var all = rows.slice().reverse(), shown = UI.hall ? all : all.slice(0, 7);
    h += sech("list", "قراءاتي", "اضغطي «تعديل» لتغيير قراءة") +
      '<div class="group">' + shown.map(function(r){
        return '<div class="hrow"><div class="grow"><div class="b">' + dfmt(r.k) + '</div><div class="xs muted">' + pulseBand(r.p).t + (r.s != null ? " · نوم " + r.s + " س" : "") + (r.f ? " · غير معتاد" : "") + '</div></div><div class="hv num">' + r.p + '</div>' +
          '<button class="ibtn" data-act="pedit" data-k="' + r.k + '">تعديل</button><button class="ibtn" data-act="pdel" data-k="' + r.k + '" aria-label="حذف قراءة ' + dfmt(r.k) + '">حذف</button></div>';
      }).join("") + '</div>' +
      (all.length > 7 ? '<button class="btn quiet full mt" data-act="pall">' + (UI.hall ? "عرض آخر 7 فقط" : "عرض كل القراءات (" + all.length + ")") + '</button>' : '');
  }else{
    h += '<section class="card mt"><p class="sm muted">لم تُحفظ أي قراءة بعد. بعد أسبوعين ستظهر لك المقارنة بين أول أسبوع وآخر أسبوع، ورسم يوضّح الاتجاه.</p></section>';
  }
  h += '<div class="warn mt">هذه أداة لمتابعتك لنفسك وليست تشخيصاً. إن كان نبضك في الراحة فوق 100 بانتظام، أو أقل من 60 وأنتِ لستِ رياضية مدرَّبة، أو صاحبه دوار أو إغماء أو ضيق نفَس، فاذكري ذلك لطبيبتك.</div>';
  return h;
}

function logWeek(){
  var w = S.week, b = bodyOf(w);
  var h = sech("check", "قياسات الأسبوع " + w, "قيسي في الأسبوع 1 والأسبوع 8 على الأقل") +
    '<section class="card col"><div class="row sp wrap"><p class="sm muted">قارني نفسك بنفسك لا بأحد غيرك.</p><button class="chip ev-logic" data-act="ev" data-k="wall">الدليل: ' + LVS.logic + '</button></div>' +
    '<div class="lbl">اختبار الحائط (ظهرك وأردافك وكعباك على الحائط)</div><div class="group">' +
    ['الرأس يلامس الحائط دون رفع الذقن', 'الكتفان كلاهما يلامسان الحائط براحة', 'فراغ أسفل الظهر بسمك كفّ يدك تقريباً (لا أكثر)'].map(function(t, i){
      return chkBtn("wall", !!b.wall[i], t, "", 'data-i="' + i + '"');
    }).join("") + '</div>' +
    '<div class="fld"><label for="bnote">ملاحظة (اختياري)</label><textarea class="inp" id="bnote" data-act="note" placeholder="كيف تشعرين برقبتك وكتفيك؟">' + esc(b.note) + '</textarea></div>' +
    '<p class="xs muted">نبض الاستيقاظ صار له تبويب خاص يوميّ: «نبض الصباح».</p></section>';
  var legacy = WEEKS.some(function(x){ return S.body[x.n] && S.body[x.n].pulse !== "" && S.body[x.n].pulse != null; });
  var hist = WEEKS.filter(function(x){ var bb = S.body[x.n]; return bb && ((bb.pulse !== "" && bb.pulse != null) || wallScore(x.n) > 0); });
  if(hist.length){
    h += sech("list", "سجلّ الأسابيع", "") + '<div class="tbw"><table class="tb"><thead><tr><th>الأسبوع</th><th>اختبار الحائط</th>' + (legacy ? '<th>نبض أسبوعي (سابق)</th>' : '') + '</tr></thead><tbody>' +
      hist.map(function(x){ var bb = S.body[x.n]; return '<tr><td class="num">' + x.n + '</td><td class="num">' + wallScore(x.n) + ' من 3</td>' + (legacy ? '<td class="num">' + (bb.pulse === "" || bb.pulse == null ? "—" : esc(bb.pulse)) + '</td>' : '') + '</tr>'; }).join("") + '</tbody></table></div>';
  }
  return h;
}

/* ============ أدواتي ============ */
function tcard(id, icon, title, sub, evk, body){
  return '<section class="card col tool" id="' + id + '"><div class="th"><span class="si">' + ico(icon) + '</span><div class="grow"><h2 class="h3">' + title + '</h2>' + (sub ? '<div class="tsub">' + sub + '</div>' : '') + '</div></div>' + body +
    (evk ? '<div class="tfoot"><span class="xs muted">قوة الدليل · اضغطي لترين المصدر</span>' + evChip(evk) + '</div>' : '') + '</section>';
}
function renderTools(){
  var h = phead("calc", "أدواتي", "حاسبات صغيرة مبنية على مصادر. كل بطاقة تذكر قوة دليلها، واضغطي على الشارة لترين المصدر.");
  h += tiles("tjump", "", [["t-heart", "عدّاد النبض", "heart"], ["t-zones", "مناطق النبض", "clock"], ["t-protein", "البروتين", "leaf"], ["t-talk", "شدة الجهد", "sun"], ["t-sleep", "النوم", "moon"]], "data-id");
  h += '<div class="col">';
  h += tcard("t-heart", "heart", "عدّاد النبض", "عدّي نبضك بالضغط مع كل نبضة", "rhr",
    '<p class="sm">تعدّين نبضك 30 ثانية بالضغط مع كل نبضة، ويضرب الموقع الرقم في 2 ويفسّره لك. الطريقة نفسها التي يذكرها المرجع الطبي (30 ثانية × 2).</p>' +
    '<div class="row wrap" style="gap:10px"><button class="btn" style="flex:1 1 140px" data-act="pcount">ابدئي العدّ</button><button class="btn quiet" style="flex:1 1 120px" data-act="topulse">سجلّ النبض</button></div>');
  h += tcard("t-zones", "clock", "مناطق نبض التمرين", "نبضك الأقصى ومناطق الجهد حسب عمرك", "zones",
    '<div class="fld"><label for="age">عمرك بالسنوات</label><input class="inp num" id="age" type="number" inputmode="numeric" min="18" max="80" placeholder="مثلاً 28" value="' + (S.age ? esc(S.age) : "") + '" data-act="age"></div><div id="zout" class="col">' + zonesHTML(+S.age) + '</div>');
  h += tcard("t-protein", "leaf", "احتياجك من البروتين", "مدى يومي تقريبي حسب وزنك", "protein",
    '<div class="fld"><label for="wt">وزنك بالكيلوجرام</label><input class="inp num" id="wt" type="number" inputmode="decimal" min="30" max="200" placeholder="مثلاً 60" value="' + (S.wt ? esc(S.wt) : "") + '" data-act="wt"></div><div id="pout" class="col">' + proteinHTML(+S.wt) + '</div>');
  h += tcard("t-talk", "sun", "كيف أعرف شدة جهدي؟", "اختبار الكلام بلا أي جهاز", "talk",
    '<ul class="lst"><li><b>خفيف:</b> تتكلمين وتغنين بسهولة.</li><li><b>متوسط:</b> تتكلمين لكن لا تقدرين على الغناء. هذا هدفك في معظم الحرق.</li><li><b>شديد:</b> كلمات قليلة قبل أن تلتقطي نفَسك.</li></ul>' +
    '<p class="xs muted">اختبار الكلام يغنيك عن أي جهاز، ويناسب كل الأعمار واللياقات.</p>');
  h += tcard("t-sleep", "moon", "النوم والتعافي", "ساعات نومك وأثرها على تعافيك", "sleep",
    '<p class="sm">يُنصح البالغون بـ <b>7 ساعات نوم فأكثر</b> بانتظام. اكتبي ساعات نومك مع نبض الصباح لتري متوسطها بجانب اتجاه نبضك.</p>' +
    '<button class="btn quiet full" data-act="topulse">سجّلي نومي مع النبض</button>');
  h += '</div><div class="warn mt">الأرقام هنا تقديرات عامة لا تشخّص حالتك. مع أي دواء للقلب أو الضغط أو حالة صحية اسألي طبيبتك عن النبض المناسب لك.</div>';
  return h;
}

/* ============ المرجع ============ */
var REFSEG = [["prog", "البرنامج"], ["evid", "الأدلة"], ["post", "الاستقامة"], ["day", "صحتك اليومية"], ["safe", "الأمان والأسئلة"]];
var REFICO = {prog:"plan", evid:"flask", post:"user", day:"sun", safe:"shield"};
function stepsHtml(arr){
  return arr.map(function(x){
    return '<div class="ev"><div class="row sp wrap"><span class="b">' + x.ar + '</span>' + (x.evk ? '<button class="chip ev-' + EVID[x.evk].lv + '" data-act="ev" data-k="' + x.evk + '">' + LV[EVID[x.evk].lv] + '</button>' : '') + '</div><ol class="lst2">' + x.steps.map(function(s){ return '<li>' + s + '</li>'; }).join("") + '</ol></div>';
  }).join("");
}
function renderRef(){
  var n = Object.keys(EVID).length;
  var h = phead("ref", "المرجع", "كل ما في البرنامج مبني على مصادر راجعتُها، وأُشير إلى قوة الدليل بصراحة، وأذكر ما لم أجد له دراسة مباشرة.");
  h += tiles("rseg", UI.rs, REFSEG.map(function(x){ return [x[0], x[1], REFICO[x[0]]]; }));
  h += '<div class="col">';
  if(UI.rs === "evid") h += refEvid();
  else if(UI.rs === "post") h += refPost();
  else if(UI.rs === "day") h += refDay();
  else if(UI.rs === "safe") h += refSafe();
  else h += refProg();
  return h + '</div>';
}
function sessionRanges(){
  var c = [], t = [];
  WEEKS.forEach(function(W){ DAYS.forEach(function(D){ c.push(circuitSec(W.n, D.n) / 60); t.push(totalMin(W.n, D.n)); }); });
  return {c0: Math.round(Math.min.apply(null, c)), c1: Math.round(Math.max.apply(null, c)), t0: Math.min.apply(null, t), t1: Math.max.apply(null, t)};
}
function refProg(){
  var h = '', R = sessionRanges();
  var fmin = Math.min.apply(null, WEEKS.map(function(x){ return x.fin * 2; })), fmax = Math.max.apply(null, WEEKS.map(function(x){ return x.fin * 2; }));
  var flow = [["sun", "c1", "إحماء", WU.up.length + " حركات خفيفة لرفع الحرارة وتحريك الكتفين والورك", "5 د"],
    ["dumb", "c2", "الدائرة", "6 محطات بالدمبل × جولتين أو ثلاث، بجهد خفيف إلى متوسط. تقصر في الأسبوع الأول وتطول تدريجياً", R.c0 + "–" + R.c1 + " د"],
    ["heart", "c3", "الحرق", "حركات بلا قفز، 30 ثانية عمل و30 راحة، لتقوية القلب والتعرّق", fmin + "–" + fmax + " د"],
    ["leaf", "c4", "تهدئة واستقامة", "تمدد وسحب الذقن وملاك الحائط (علوي) أو تمدد الورك (سفلي)", "5 د"]];
  h += acc("كيف تُبنى الجلسة (من " + R.t0 + " إلى " + R.t1 + " دقيقة)",
    '<div class="flow">' + flow.map(function(r, i){
      return '<div class="fr ' + r[1] + '"><span class="fn">' + ico(r[0]) + '</span><div class="fx"><div class="fh"><b>' + (i + 1) + '. ' + r[2] + '</b><span class="fd num">' + r[4] + '</span></div><span>' + r[3] + '</span></div></div>';
    }).join("") + '<div class="ft"><span>المجموع التقريبي للجلسة</span><b class="num">' + R.t0 + "–" + R.t1 + ' د</b></div></div>' +
    '<p>المدد المعروضة في كل جلسة تقدير يحسبه الموقع لكل أسبوع (يشمل الانتقال والراحة بين الجولات)، ويبقى لك هامش للماء وتبديل الأوزان، وأطول جلسة لا تتجاوز ' + R.t1 + ' دقيقة.</p>' +
    '<div class="warn">الجلسات 1 و3 علوية، و2 و4 سفلية. الحركات الأساسية (التجديف، الضغط، السكوات، الرفعة الرومانية، الخطوات الجانبية) تتكرر في الجلستين المتشابهتين حتى ينتقل وزنك بينهما.</div>', true);
  h += acc("الجهد: ماذا تعني الأرقام؟",
    '<p>الجهد من 10: <b>5</b> مريح، <b>6</b> تبقى لك نحو 4 تكرارات، <b>7</b> نحو 3 تكرارات. لا تصلي إلى الإجهاد الكامل في هذا البرنامج.</p>' +
    '<p>للقلب: <b>اختبار الكلام</b>. متوسط: تتكلمين لكن لا تغنين. عالٍ: كلمات قليلة قبل التقاط النفس.</p>' +
    '<div class="tbw"><table class="tb"><thead><tr><th>أسبوع</th><th>الاسم</th><th>الدائرة</th><th>الحرق</th></tr></thead><tbody>' +
    WEEKS.map(function(x){ return '<tr' + (x.n === S.week ? ' class="cur"' : '') + '><td class="num">' + x.n + '</td><td>' + x.name + '</td><td>' + jol(x.rounds) + ' × ' + x.reps + '</td><td class="num">' + (x.fin * 2) + ' د</td></tr>'; }).join("") + '</tbody></table></div>');
  h += acc("المعدات",
    '<p>علّمي ما اشتريتِه. الحبال اختيارية وكل حركة بها بديل بدونها.</p><div class="group">' +
    GEAR.map(function(g){
      var o = !!S.gear[g.id];
      return '<button class="chk" data-act="gear" data-id="' + g.id + '" aria-pressed="' + o + '"><span class="ck' + (o ? " on" : "") + '">' + ico("check") + '</span><span><span class="b" style="display:block">' + g.ar + (g.must ? "" : " (اختياري)") + '</span><span class="xs muted" style="display:block">' + g.note + '</span></span></button>';
    }).join("") + '</div>');
  return h;
}
var EVGROUPS = [
  ["dumb", "الحركة والقوة", ["who", "talk", "acsm", "lowload", "circuit"]],
  ["ref", "الاستقامة", ["neck", "sh", "kyph", "hip", "glute", "core", "wall"]],
  ["heart", "القلب والنبض", ["lowimp", "rhr", "rhrex", "zones", "trend"]],
  ["leaf", "الصحة اليومية", ["sleep", "protein", "cycle"]]
];
function refEvid(){
  var cnt = {strong:0, mid:0, low:0, logic:0}, tot = 0;
  Object.keys(EVID).forEach(function(k){ cnt[EVID[k].lv]++; tot++; });
  var h = '<section class="card col"><div class="b">كيف أقرأ شارات القوة؟</div><div class="lgrid">' +
    [["strong", "قوي", "إرشادات رسمية أو إجماع خبراء"], ["mid", "متوسط", "مراجعات وتجارب لها حدود"], ["low", "محدود", "دراسات قليلة أو أدلة ضعيفة"], ["logic", "منطقي", "منطق عملي بلا دراسة مباشرة"]]
      .map(function(l){ return '<div class="lgt lv-' + l[0] + '"><div class="lgh"><b class="num">' + cnt[l[0]] + '</b><span class="chip ev-' + l[0] + '">' + l[1] + '</span></div><span class="xs muted">' + l[2] + '</span></div>'; }).join("") +
    '</div><p class="xs muted">' + tot + ' موضوعاً. أذكر في كل موضوع ما وجدتُه وما لم أجده، ولا أبالغ في الوعود.</p></section>';
  EVGROUPS.forEach(function(g){
    h += sech(g[0], g[1], g[2].length + " مواضيع") + g[2].map(accEv).join("");
  });
  return h;
}
function refPost(){
  return acc("حركات الاستقامة للرقبة والكتفين", stepsHtml(CD.up)) + acc("حركات الورك والتمدد", stepsHtml(CD.low)) +
    '<div class="row" style="gap:8px;flex-wrap:wrap">' + evChip("neck", "الرقبة: ") + evChip("sh", "الكتفان: ") + evChip("hip", "الورك: ") + evChip("kyph", "الانحناء: ") + '</div>';
}
function refDay(){
  var h = '';
  h += acc("نبض الاستيقاظ: كيف أقيسه وماذا يعني؟",
    '<div class="row sp wrap"><span class="b">القياس</span>' + evChip("rhr") + '</div>' +
    '<ol class="lst2"><li>في الصباح بعد الاستيقاظ، وأنتِ هادئة وساكنة.</li><li>ضعي إصبعين (لا الإبهام) على المعصم تحت قاعدة الإبهام، أو على جانب الرقبة بجوار القصبة.</li><li>عدّي النبضات 30 ثانية واضربيها في 2، أو 15 ثانية في 4.</li><li>كرّري في وقت قريب كل يوم، فالمقارنة بين أيام متشابهة الظروف أدق.</li></ol>' +
    '<div class="bands">' +
    '<div class="brw bw"><b class="num">أقل من 40</b><span>منخفض جداً. يُرى عند الرياضيين المدرَّبين جداً، وإلا فراجعي طبيبتك.</span></div>' +
    '<div class="brw bi"><b class="num">40 إلى 59</b><span>شائع عند الرياضيات المدرَّبات. إن لم تكوني رياضية وتكرر فاذكريه لطبيبتك.</span></div>' +
    '<div class="brw bo"><b class="num">60 إلى 100</b><span>المعتاد للبالغين. الأقل غالباً أكثر لياقة.</span></div>' +
    '<div class="brw bi"><b class="num">101 إلى 119</b><span>أعيدي القياس بعد جلوس هادئ. إن تكرر في الراحة فراجعي طبيبتك.</span></div>' +
    '<div class="brw bw"><b class="num">120 فأكثر</b><span>مرتفع جداً في الراحة. أعيدي القياس، وإن بقي أو صاحبه أعراض فاطلبي رعاية طبية.</span></div></div>' +
    '<p>التمرين يخفض نبض الراحة قليلاً في المتوسط (نحو 3 نبضات)، والأثر أوضح مع التمرين الهوائي. قد لا يتغيّر رقمك مع برنامج قوة، وهذا لا يعني أنه بلا فائدة.</p>' +
    '<div class="row" style="gap:10px"><button class="btn" style="flex:1" data-act="topulse">سجّلي نبضي</button>' + evChip("rhrex", "") + '</div>');
  h += acc("النوم والتعافي",
    '<div class="row sp wrap"><span class="b">كم أنام؟</span>' + evChip("sleep") + '</div>' +
    '<p>يوصي بيان الأكاديمية الأمريكية لطب النوم بـ <b>7 ساعات فأكثر</b> للبالغين بانتظام. ليلة واحدة أقل من ذلك لا تضر، المهم المعتاد.</p>' +
    '<p>اقتراح عملي مني بلا دراسة مباشرة: إن نمتِ قليلاً وشعرتِ بثقل، فخففي الوزن درجة أو أنهي بجولة أقل بدل أن تتركي الجلسة.</p>');
  h += acc("البروتين والأكل",
    '<div class="row sp wrap"><span class="b">كم أحتاج؟</span>' + evChip("protein") + '</div>' +
    '<p>تتوقف الفائدة الإضافية في بناء العضلات عند نحو 1.6 جم لكل كجم يومياً بحسب تحليل تجميعي، وأقل رقم شائع للبالغين 0.8 جم/كجم. ستجدين مدى يخصّك بوزنك في «أدواتي».</p>' +
    '<button class="btn quiet full" data-act="go" data-v="tools">افتحي الحاسبة</button>');
  h += acc("الدورة الشهرية والتمرين",
    '<div class="row sp wrap"><span class="b">هل أغيّر برنامجي؟</span>' + evChip("cycle") + '</div>' +
    '<p>الأدلة ضعيفة وتشير إلى فرق ضئيل جداً في الأداء بين أطوار الدورة، ولا تكفي لتعميم تعديل واحد على الجميع. الأنسب أن تتبعي ما تشعرين به أنتِ.</p>' +
    '<p>اقتراح عملي: في الأيام الثقيلة خففي الوزن أو اكتفي بجولة أقل، ولا تتركي الجلسة إن كنتِ قادرة.</p>');
  return h;
}
function refSafe(){
  var h = acc("السلامة ومتى تتوقفين",
    '<div class="warn">توقفي فوراً واستشيري طبيباً عند: ألم في الصدر، دوار شديد أو إغماء، ضيق نفس غير متناسب مع الجهد، ألم حاد في مفصل، أو تنميل وخدر في الذراع أو الساق.</div>' +
    '<p>استشيري طبيبتك أو أخصائية علاج طبيعي قبل البدء إن كنتِ حاملاً أو بعد ولادة قريبة، أو لديك إصابة أو ألم مزمن في الظهر أو الرقبة أو الكتف، أو ضغط أو سكري أو مشكلة في القلب.</p>' +
    '<p>الألم العضلي الخفيف بعد الجلسات الأولى شائع ويزول خلال أيام. الألم الحاد أو المفاجئ أو المستمر ليس منه.</p>' +
    '<p>هذا البرنامج للّياقة العامة والاستقامة، وليس علاجاً لحالة طبية ولا بديلاً عن تقييم مختصة.</p>', true);
  h += acc("أسئلة شائعة",
    '<div class="ev"><div class="b">فاتتني جلسة؟</div><p>لا تضاعفي. أكملي بالجلسة التالية في الترتيب. ثلاث جلسات في الأسبوع أفضل بكثير من لا شيء.</p></div>' +
    '<div class="ev"><div class="b">كيف أختار الوزن؟</div><p>اختاري وزناً تنتهين به من آخر جولة وقد بقيت لك 3 إلى 4 تكرارات. إن كان أول تكرار صعباً فهو ثقيل، وإن لم تشعري بشيء فهو خفيف.</p></div>' +
    '<div class="ev"><div class="b">ليس عندي الحبل؟</div><p>افتحي بطاقة التمرين واضغطي «استخدمي البديل». سحب الحبل له بديل منبطح، والخطوات الجانبية لها رفع ساق وقوفاً.</p></div>' +
    '<div class="ev"><div class="b">عن روابط الفيديو؟</div><p>الأزرار تفتح بحث يوتيوب باسم التمرين المعروف بالعربي والإنجليزي مع كلمة «للنساء». تأكدتُ أن أسماء التمارين موجودة على يوتيوب، لكن يوتيوب هو من يرتّب النتائج ولا أستطيع ضمان أن تكون المقدِّمة امرأة في كل نتيجة. زر «فيديو موجّه للنساء» اخترته من عنوانه (Female / Ladies / Women) دون أن أراجع الأداء بنفسي، فاختاري ما يناسبك ومن مدرّب أو مدرّبة تثقين بها. عند الشك في الأداء قدّمي الأمان على الشكل.</p></div>' +
    '<div class="ev"><div class="b">متى تظهر النتيجة؟</div><p>لا أضمن أرقاماً. التحسن في الطاقة والقوة والنَّفَس عادة يُحَسّ خلال أسابيع قليلة. أما الاستقامة فالمراجعات تشير إلى أن البرامج الأطول (8 أسابيع فأكثر) قد تكون أفضل، لذلك صُمّم البرنامج لثمانية أسابيع.</p></div>' +
    '<div class="ev"><div class="b">عادات يومية تدعم الاستقامة؟</div><p>قومي وتحرّكي دقيقة أو دقيقتين كل ساعة جلوس، وارفعي الشاشة إلى مستوى العينين، واسحبي الذقن للداخل بضع مرات أثناء اليوم. هذه ممارسة عامة شائعة ولم أتحقق منها كدراسة مستقلة.</p></div>' +
    '<div class="ev"><div class="b">كيف أحفظ تقدمي؟</div><p>يُحفظ تلقائياً على هذا الجهاز، ويُرسل أيضاً إلى حسابك عندما تفتحين الصفحة من claude.ai وأنتِ مسجّلة الدخول بصلاحية «مشارِك». يمكنك دائماً نسخ نسخة احتياطية من الإعدادات.</p></div>' +
    '<div class="ev"><div class="b">هل حاسبات النبض والبروتين تشخّص؟</div><p>لا. هي تقديرات عامة من دراسات على مجموعات كبيرة، وتخطئ فردياً. لا تغني عن طبيبتك، خاصة مع الأدوية أو الحمل أو الأمراض المزمنة.</p></div>');
  return h;
}
