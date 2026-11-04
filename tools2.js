/* ============ أدواتي: السعرات والماكروز وتذكير الأدوية ============ */
function gz(f, m){ return (S.cal && S.cal.sex === "m") ? m : f; }
function fmtN(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function rnd(x, step){ return Math.round(x / step) * step; }

/* معاملات النشاط من فئات FAO/WHO/UNU (خفيف 1.40–1.69، نشط 1.70–1.99، شديد 2.00 فأكثر)، وأخذتُ قيماً داخل كل فئة لا الحد الأعلى */
var CAL_ACT = [
  {id:"low", n:"قليلة الحركة", d:"جلوس معظم اليوم وبلا تمرين منتظم", f:1.4},
  {id:"light", n:"خفيفة", d:"مشي يومي أو عمل واقف مع 3 إلى 4 جلسات تمرين خفيفة أسبوعياً", f:1.55},
  {id:"mod", n:"متوسطة", d:"نشاط يومي واضح مع 4 إلى 5 جلسات تمرين بجهد متوسط", f:1.7},
  {id:"high", n:"عالية", d:"عمل بدني أو تمرين شبه يومي بجهد عالٍ", f:1.9}
];
var CAL_GOALS = [["lose", "أنزّل دهوناً"], ["keep", "أثبّت وزني"], ["gain", "أزيد عضلاً"]];
var CAL_PACES = {lose:[["slow", "هادئ"], ["mid", "متوسط"], ["fast", "أسرع"]], gain:[["slow", "هادئ"], ["mid", "متوسط"]]};
var CAL_PCT = {slow:0.25, mid:0.5, fast:0.75};
var CAL_UP = {slow:0.05, mid:0.10};
/* [الاسم، حصة السعرات %، حصة البروتين %] */
var MEAL_SCH = {
  3:[["الفطور", 30, 33], ["الغداء", 40, 34], ["العشاء", 30, 33]],
  4:[["الفطور", 25, 27], ["الغداء", 35, 31], ["وجبة خفيفة", 10, 15], ["العشاء", 30, 27]],
  5:[["الفطور", 25, 24], ["خفيفة صباحية", 10, 12], ["الغداء", 30, 28], ["خفيفة مسائية", 10, 12], ["العشاء", 25, 24]]
};

function calOf(){
  var c = S.cal || {};
  return {sex:c.sex || "", age:+S.age || 0, h:+c.h || 0, w:+S.wt || 0, bf:+c.bf || 0, act:c.act || "light", goal:c.goal || "lose", pace:c.pace || "mid", tw:+c.tw || 0,
    meals:(+c.meals === 3 || +c.meals === 5) ? +c.meals : 4, pg:!!c.pg};
}

/* الحساب: حرق أساسي ← احتياج يومي ← هدف بنسبة من وزنك ← ماكروز ← توزيع على الوجبات */
function calcPlan(c){
  var miss = [];
  if(c.sex !== "f" && c.sex !== "m") miss.push("الجنس");
  if(!(c.age >= 18 && c.age <= 80)) miss.push("العمر (من 18 إلى 80)");
  if(!(c.h >= 130 && c.h <= 220)) miss.push("الطول (من 130 إلى 220 سم)");
  if(!(c.w >= 35 && c.w <= 250)) miss.push("الوزن (من 35 إلى 250 كجم)");
  if(miss.length) return {ok:false, miss:miss};
  var hm = c.h / 100, bmi = c.w / (hm * hm), flags = [];
  var bfOk = c.bf >= 5 && c.bf <= 60, ffm = bfOk ? c.w * (1 - c.bf / 100) : null, bmr, method;
  if(bfOk){ bmr = 500 + 22 * ffm; method = "cun"; }
  else { bmr = 10 * c.w + 6.25 * c.h - 5 * c.age + (c.sex === "m" ? 5 : -161); method = "mif"; }
  var act = CAL_ACT.filter(function(a){ return a.id === c.act; })[0] || CAL_ACT[1];
  var tdee = bmr * act.f, goal = c.goal, pace = c.pace, floor = c.sex === "m" ? 1500 : 1200, target = tdee;
  if(goal === "lose" && bmi < 18.5){ goal = "keep"; flags.push("nolose"); }
  if(goal === "lose" && bmi < 20 && pace !== "slow"){ pace = "slow"; flags.push("slowcap"); }
  if(goal === "gain" && !CAL_UP[pace]) pace = "mid";
  if(goal === "lose"){
    var def = (CAL_PCT[pace] || 0.5) / 100 * c.w * 7700 / 7;
    if(def > 0.25 * tdee){ def = 0.25 * tdee; flags.push("defcap"); }
    target = tdee - def;
    if(target < floor){ target = Math.min(floor, tdee); flags.push(floor >= tdee ? "nodef" : "floor"); }
  }else if(goal === "gain"){
    target = tdee * (1 + CAL_UP[pace]);
  }
  target = rnd(target, 10);
  var tdeeR = Math.round(tdee), diff = target - tdeeR;
  var kgWk = Math.abs(diff) * 7 / 7700;
  if(goal === "lose" && target < bmr) flags.push("belowbmr");

  var ideal = 25 * hm * hm, refW = bmi >= 30 ? ideal + 0.25 * (c.w - ideal) : c.w;
  var pr = {lose:[1.8, 1.6, 2.2], keep:[1.4, 1.2, 1.8], gain:[1.8, 1.6, 2.2]}[goal];
  var Pmax = 0.35 * target / 4, P = pr[0] * refW, Plo = pr[1] * refW, Phi = pr[2] * refW;
  if(P > Pmax){ P = Pmax; flags.push("pcap"); }
  Plo = Math.min(Plo, P); Phi = Math.min(Phi, Pmax);
  var F = Math.max(0.25 * target / 9, 0.6 * refW), Fmin = 0.20 * target / 9;
  F = Math.min(F, 0.35 * target / 9);
  var C = (target - 4 * P - 9 * F) / 4;
  if(C < 100){ F = Fmin; C = (target - 4 * P - 9 * F) / 4; }
  if(C < 100 && P > Plo){ P = Plo; C = (target - 4 * P - 9 * F) / 4; }
  if(C < 100) flags.push("lowcarb");
  P = Math.round(P); F = Math.round(F); C = Math.max(0, Math.round((target - 4 * P - 9 * F) / 4));
  var tot = 4 * P + 9 * F + 4 * C;

  var meals = MEAL_SCH[c.meals].map(function(m){
    var kc = target * m[1] / 100, p = P * m[2] / 100, f = F * m[1] / 100;
    return {n:m[0], kc:rnd(kc, 10), p:Math.round(p), f:Math.round(f), c:Math.max(0, Math.round((kc - 4 * p - 9 * f) / 4))};
  });

  var weeks = null, twLow = false;
  if(goal === "lose" && c.tw >= 35 && c.tw < c.w){
    if(c.tw / (hm * hm) < 18.5) twLow = true;
    else if(kgWk > 0) weeks = Math.ceil((c.w - c.tw) / kgWk);
  }
  if(twLow) flags.push("twlow");
  return {ok:true, flags:flags, bmi:bmi, method:method, act:act, goal:goal, pace:pace, bmr:Math.round(bmr), tdee:tdeeR, target:target, diff:diff, kgWk:kgWk, pctBw:kgWk / c.w * 100,
    defPct:Math.abs(diff) / tdeeR * 100, refW:refW, P:P, Plo:Math.round(Plo), Phi:Math.round(Phi), F:F, C:C, tot:tot, meals:meals, weeks:weeks, floor:floor, sex:c.sex, w:c.w, tw:c.tw};
}

function calFlagText(R, f){
  var g = (R.sex === "m");
  switch(f){
    case "nolose": return "مؤشر كتلة جسمك " + R.bmi.toFixed(1) + " (أقل من 18.5، دون الطبيعي)، فلا يُنصح بعجز في السعرات. عُرضت سعرات الثبات. " + (g ? "استشر" : "استشيري") + " مختصاً إن أردت تغيير وزنك.";
    case "slowcap": return "وزنك قريب من الحد الأدنى للطبيعي، فاقتصرتُ على الوتيرة الهادئة.";
    case "defcap": return "حدّدتُ العجز بـ 25% من احتياجك، لأن العجز الأكبر يزيد خسارة العضل ويصعّب الالتزام.";
    case "floor": return "رفعتُ الهدف إلى الحد الأدنى الشائع للأمان (" + fmtN(R.floor) + " سعرة)، فالعجز الذي اخترتَه كان سينزل بك تحته. لذلك سيكون نزولك أبطأ من الوتيرة المختارة. وهذا ما يحدث عند من احتياجه أقل، فخصم 500 ثابتاً يصير قليلاً جداً.";
    case "nodef": return "احتياجك المقدّر قريب من الحد الأدنى للأمان (" + fmtN(R.floor) + " سعرة)، فلا مجال لعجز بسعرات الطعام. ركّز على التمرين والمشي وجودة الأكل.";
    case "belowbmr": return "الهدف أقل من حرقك الأساسي المقدّر. لا " + (g ? "تستمر" : "تستمري") + " عليه أكثر من بضعة أسابيع، و" + (g ? "راقب" : "راقبي") + " طاقتك ونومك.";
    case "pcap": return "خفّضتُ البروتين إلى 35% من سعراتك، وهو الحد الأعلى في التوصيات.";
    case "lowcarb": return "الكارب أقل من 100 جم وهو منخفض. إن شعرتَ بإرهاق أو دوخة فارفع السعرات أو اختر وتيرة أهدأ.".replace("شعرتَ", g ? "شعرتَ" : "شعرتِ").replace("فارفع", g ? "فارفع" : "فارفعي").replace("اختر", g ? "اختر" : "اختاري");
    case "twlow": return "وزنك المستهدف يعطي مؤشر كتلة جسم أقل من 18.5 (دون الطبيعي)، فاختر هدفاً أعلى.".replace("فاختر", g ? "فاختر" : "فاختاري");
  }
  return "";
}

function calText(){
  var c = calOf(), R = calcPlan(c);
  if(!R.ok) return "";
  var gl = {lose:"إنزال الدهون", keep:"تثبيت الوزن", gain:"زيادة العضل"}[R.goal];
  var pc = {slow:"هادئة", mid:"متوسطة", fast:"أسرع"}[R.pace];
  var t = "خطة السعرات · لياقة أشواق · " + dfmt(dkey()) + "\n";
  t += "الهدف: " + gl + (R.goal !== "keep" ? " بوتيرة " + pc : "") + "\n";
  t += "عمر " + c.age + " · طول " + c.h + " سم · وزن " + fmtKg(c.w) + " كجم · نشاط " + R.act.n + "\n\n";
  t += "الحرق الأساسي المقدّر: " + fmtN(R.bmr) + " سعرة (" + (R.method === "cun" ? "كانينغهام، من نسبة الدهون" : "ميفلين–سانت جور") + ")\n";
  t += "احتياجي للثبات: " + fmtN(R.tdee) + " سعرة\n";
  t += "هدفي اليومي: " + fmtN(R.target) + " سعرة";
  if(R.goal === "lose") t += " (عجز " + fmtN(-R.diff) + "، نحو " + Math.round(R.defPct) + "% من احتياجي)";
  if(R.goal === "gain") t += " (زيادة " + fmtN(R.diff) + "، نحو " + Math.round(R.defPct) + "%)";
  t += "\n\nالبروتين: " + R.P + " جم (المدى " + R.Plo + " إلى " + R.Phi + ")\nالكارب: " + R.C + " جم\nالدهون: " + R.F + " جم\n\n";
  t += "التوزيع على " + R.meals.length + " وجبات:\n";
  R.meals.forEach(function(m){ t += "- " + m.n + ": " + fmtN(m.kc) + " سعرة · بروتين " + m.p + " · كارب " + m.c + " · دهون " + m.f + "\n"; });
  if(R.goal !== "keep" && R.kgWk > 0) t += "\nالمتوقع في البداية: نحو " + (Math.round(R.kgWk * 100) / 100) + " كجم أسبوعياً (" + (Math.round(R.pctBw * 100) / 100) + "% من الوزن)، ثم يبطؤ.";
  t += "\nتقدير يخطئ نحو ±10%. أعدّل بعد 2 إلى 3 أسابيع حسب متوسط وزني.";
  return t;
}

function shareText(title, txt, okMsg){
  if(typeof navigator.share === "function"){
    navigator.share({title:title, text:txt}).catch(function(e){ if(e && e.name !== "AbortError") copyText(txt, okMsg); });
  }else copyText(txt, okMsg);
}

function calSeg(act, cur, items, cls){
  return '<div class="seg ' + (cls || "") + '" role="group">' + items.map(function(i){
    var on_ = String(cur) === String(i[0]);
    return '<button type="button" class="' + (on_ ? "on" : "") + '" data-act="' + act + '" data-v="' + i[0] + '" aria-pressed="' + on_ + '">' + i[1] + '</button>';
  }).join("") + '</div>';
}

function calOutHTML(){
  if(S.cal && S.cal.pg) return '<div class="warn">الحمل والرضاعة لهما احتياجات خاصة، ولا تناسبهما حاسبة عامة. اسألي طبيبتك أو اختصاصية التغذية عن سعراتك.</div>';
  var c = calOf(), R = calcPlan(c);
  if(!R.ok) return '<p class="xs muted">' + gz("أكملي", "أكمل") + ' الحقول التالية لتظهر خطتك: ' + R.miss.join("، ") + '.</p>';
  var g = c.sex === "m";
  var lab = {lose:"هدفك اليومي لإنزال الدهون", keep:"سعراتك اليومية للثبات", gain:"هدفك اليومي لزيادة العضل"}[R.goal];
  var sub = "";
  if(R.goal === "lose") sub = "عجز نحو " + fmtN(-R.diff) + " سعرة (" + Math.round(R.defPct) + "% من احتياجك). المتوقع في البداية نحو " + (Math.round(R.kgWk * 100) / 100) + " كجم أسبوعياً (" + (Math.round(R.pctBw * 100) / 100) + "% من وزنك).";
  else if(R.goal === "gain") sub = "زيادة نحو " + fmtN(R.diff) + " سعرة (" + Math.round(R.defPct) + "%). المتوقع نحو " + (Math.round(R.kgWk * 100) / 100) + " كجم أسبوعياً إن لم يذهب بعضها دهوناً.";
  else sub = "هذا تقدير لما يحافظ على وزنك الحالي.";
  var h = '<div class="pres' + (R.flags.indexOf("floor") >= 0 || R.flags.indexOf("belowbmr") >= 0 ? " info" : "") + '" role="status"><div class="xs muted">' + lab + '</div><div class="big num">' + fmtN(R.target) + '<small> سعرة</small></div><p>' + sub + '</p></div>';
  h += '<div class="tiles3"><div><div class="v num">' + fmtN(R.bmr) + '</div><div class="l">حرق أساسي</div></div><div><div class="v num">' + fmtN(R.tdee) + '</div><div class="l">احتياج الثبات</div></div><div><div class="v num"><bdi dir="ltr">' + (R.diff > 0 ? "+" : (R.diff < 0 ? "\u2212" : "")) + fmtN(Math.abs(R.diff)) + '</bdi></div><div class="l">الفرق</div></div></div>';
  h += '<div class="tbw"><table class="tb"><thead><tr><th>العنصر</th><th>جرام</th><th>سعرة</th><th>من طاقتك</th></tr></thead><tbody>' +
    '<tr><td>بروتين<div class="xs muted num">مدى ' + R.Plo + '–' + R.Phi + '</div></td><td class="num b">' + R.P + '</td><td class="num">' + fmtN(4 * R.P) + '</td><td class="num">' + Math.round(400 * R.P / R.tot) + '%</td></tr>' +
    '<tr><td>كارب</td><td class="num b">' + R.C + '</td><td class="num">' + fmtN(4 * R.C) + '</td><td class="num">' + Math.round(400 * R.C / R.tot) + '%</td></tr>' +
    '<tr><td>دهون</td><td class="num b">' + R.F + '</td><td class="num">' + fmtN(9 * R.F) + '</td><td class="num">' + Math.round(900 * R.F / R.tot) + '%</td></tr></tbody></table></div>';
  h += '<div class="lbl2">توزيعها على الوجبات</div>' + calSeg("cmeals", c.meals, [[3, "3 وجبات"], [4, "4 وجبات"], [5, "5 وجبات"]], "s3");
  h += '<div class="tbw"><table class="tb"><thead><tr><th>الوجبة</th><th>سعرة</th><th>بروتين</th><th>كارب</th><th>دهون</th></tr></thead><tbody>' +
    R.meals.map(function(m){ return '<tr><td>' + m.n + '</td><td class="num b">' + fmtN(m.kc) + '</td><td class="num">' + m.p + '</td><td class="num">' + m.c + '</td><td class="num">' + m.f + '</td></tr>'; }).join("") + '</tbody></table></div>';
  h += '<p class="xs muted">الأرقام بالجرام ما عدا السعرات. التوزيع تقريبي، والأهم مجموع اليوم لا تطابق كل وجبة.</p>';
  var notes = R.flags.map(function(f){ return calFlagText(R, f); }).filter(Boolean);
  if(R.weeks) notes.push("للوصول إلى " + fmtKg(R.tw) + " كجم: نحو " + R.weeks + " أسبوعاً لو بقي المعدل ثابتاً. الواقع يبطؤ مع الوقت، فاعتبرها أقل مدة ممكنة.");
  if(R.goal === "lose" && R.sex === "f") notes.push("إن تأخرت الدورة أو " + gz("شعرتِ", "شعرتَ") + " بدوار أو برد دائم أو تساقط شعر فارفعي السعرات وراجعي طبيبتك.");
  if(notes.length) h += '<ul class="lst">' + notes.map(function(n){ return '<li>' + n + '</li>'; }).join("") + '</ul>';
  h += '<div class="row wrap" style="gap:10px"><button class="btn" style="flex:1 1 150px" data-act="ccopy">نسخ النتيجة</button>' +
    (typeof navigator.share === "function" ? '<button class="btn quiet" style="flex:1 1 150px" data-act="cshare">حفظ في الملاحظات</button>' : '') + '</div>';
  h += '<p class="xs muted">' + (typeof navigator.share === "function" ? '«حفظ في الملاحظات» يفتح قائمة المشاركة في جوالك، ' + gz("واختاري", "واختر") + ' منها «الملاحظات». أو ' + gz("انسخي", "انسخ") + ' النتيجة و' + gz("الصقيها", "الصقها") + ' هناك.' : gz("انسخي", "انسخ") + ' النتيجة و' + gz("الصقيها", "الصقها") + ' في تطبيق الملاحظات.') + '</p>';
  var adj = {
    lose:["نزل وزنك أقل من نصف المتوقع: " + gz("انقصي", "انقص") + " 100 إلى 150 سعرة أو " + gz("زيدي", "زد") + " المشي.", "نزل أكثر من 1% من وزنك أسبوعياً: " + gz("زيدي", "زد") + " 100 إلى 200 سعرة، فالسرعة الزائدة تضرّ العضل."],
    keep:["زاد وزنك باطراد: " + gz("انقصي", "انقص") + " 100 إلى 150 سعرة.", "نزل وزنك باطراد: " + gz("زيدي", "زد") + " 100 إلى 150 سعرة.", "ثبت وزنك: الرقم صحيح."],
    gain:["لم يزد وزنك خلال 2 إلى 3 أسابيع: " + gz("زيدي", "زد") + " 100 إلى 150 سعرة.", "زاد أكثر من 0.5% أسبوعياً: غالباً يذهب بعضه دهوناً، " + gz("انقصي", "انقص") + " 100 إلى 150 سعرة."]
  }[R.goal];
  h += '<details class="how"><summary>كيف أعدّل الرقم بعد بدء الالتزام؟' + ico("chev") + '</summary><div class="in"><p class="sm">هذه نقطة بداية وليست حكماً. أي معادلة تخطئ نحو ±10% لدى الفرد الواحد. ' + gz("التزمي", "التزم") + ' 2 إلى 3 أسابيع، و' + gz("زني", "زن") + ' نفسك بنفس الشروط (صباحاً بعد الحمام) عدة مرات أسبوعياً، و' + gz("قارني", "قارن") + ' متوسط الأسبوع بالذي قبله. ثم عدّل بحسب ما يلي (تقديرات مني لا من دراسة):</p>' +
    '<ul class="lst">' + adj.map(function(x){ return '<li>' + x + '</li>'; }).join("") + '</ul></div></details>';
  return h;
}

function calCardHTML(){
  var c = calOf(), cc = S.cal || {};
  var body = '<div class="fld"><span class="lbl">الجنس</span>' + calSeg("csex", c.sex, [["f", "أنثى"], ["m", "ذكر"]], "") + '</div>' +
    '<div class="cgrid">' +
    '<div class="fld"><label for="cage">العمر (سنة)</label><input class="inp num" id="cage" type="number" inputmode="numeric" min="18" max="80" placeholder="مثلاً 28" value="' + (S.age ? esc(S.age) : "") + '" data-act="age"></div>' +
    '<div class="fld"><label for="ch">الطول (سم)</label><input class="inp num" id="ch" type="number" inputmode="numeric" min="130" max="220" placeholder="مثلاً 165" value="' + (cc.h ? esc(cc.h) : "") + '" data-act="ch"></div>' +
    '<div class="fld"><label for="cwt">الوزن (كجم)</label><input class="inp num" id="cwt" type="number" inputmode="decimal" min="35" max="250" placeholder="مثلاً 65" value="' + (S.wt ? esc(S.wt) : "") + '" data-act="wt"></div>' +
    '<div class="fld"><label for="cbf">نسبة الدهون % <span class="xs muted">(اختياري)</span></label><input class="inp num" id="cbf" type="number" inputmode="decimal" min="5" max="60" placeholder="إن عرفتها" value="' + (cc.bf ? esc(cc.bf) : "") + '" data-act="cbf"></div></div>' +
    '<div class="fld"><span class="lbl">مستوى نشاطك اليومي</span><div class="opts">' + CAL_ACT.map(function(a){
      var on_ = c.act === a.id;
      return '<button type="button" class="opt' + (on_ ? " on" : "") + '" data-act="cact" data-v="' + a.id + '" aria-pressed="' + on_ + '"><span class="b">' + a.n + '</span><span class="xs muted">' + a.d + '</span></button>';
    }).join("") + '</div></div>' +
    '<div class="fld"><span class="lbl">هدفك</span>' + calSeg("cgoal", c.goal, CAL_GOALS, "s3") + '</div>';
  if(c.goal === "lose" || c.goal === "gain"){
    body += '<div class="fld"><span class="lbl">الوتيرة</span>' + calSeg("cpace", c.pace, CAL_PACES[c.goal], c.goal === "lose" ? "s3" : "") +
      '<p class="xs muted">' + (c.goal === "lose" ? "الوتيرة نسبة من وزنك أسبوعياً: هادئ 0.25% ومتوسط 0.5% وأسرع 0.75%. هذا بدل خصم 500 ثابتاً للجميع، فالخصم الواحد كبير على الأخفّ وزناً. وللمقارنة، مراجعة لنزول الدهون عند الرياضيين توصي بنحو 0.5 إلى 1% أسبوعياً." : "الزيادة نسبة من احتياجك: هادئ 5% ومتوسط 10%. الزيادة الأكبر تذهب غالباً دهوناً لا عضلاً.") + '</p></div>';
  }
  if(c.goal === "lose") body += '<div class="fld"><label for="ctw">' + gz("الوزن الذي تريدين الوصول إليه", "الوزن الذي تريد الوصول إليه") + ' (كجم) <span class="xs muted">(اختياري)</span></label><input class="inp num" id="ctw" type="number" inputmode="decimal" min="35" max="250" placeholder="مثلاً 58" value="' + (cc.tw ? esc(cc.tw) : "") + '" data-act="ctw"></div>';
  body += '<div class="group">' + chkBtn("cpg", !!(S.cal && S.cal.pg), "أنا حامل أو مرضعة", "تظهر لك رسالة بدل الأرقام", "") + '</div>' +
    '<div id="cout" class="col">' + calOutHTML() + '</div>' +
    '<div class="warn">للبالغين الأصحاء من 18 سنة فأكثر. لا تناسب الحمل والرضاعة ولا من لديه سكري أو مرض كلوي أو قلبي أو تاريخ اضطراب أكل. هذه تقديرات عامة لا تغني عن طبيب أو اختصاصي تغذية.</div>' +
    '<div class="tfoot"><span class="xs muted">قوة الدليل · اضغطي لترين المصدر</span><div class="row wrap" style="gap:8px">' + evChip("energy", "السعرات: ") + evChip("protein", "البروتين: ") + evChip("macros", "التوزيع: ") + '</div></div>';
  return '<section class="card col tool" id="t-cal"><div class="th"><span class="si">' + ico("flame") + '</span><div class="grow"><h2 class="h3">السعرات والماكروز</h2><div class="tsub">' + gz("اختاري هدفك فتعرفي", "اختر هدفك فتعرف") + ' كم تأكل' + gz("ين", "") + ' من السعرات والبروتين والكارب والدهون</div></div></div>' + body + '</section>';
}
function calRepaint(){ var el = document.getElementById("t-cal"); if(el) el.outerHTML = calCardHTML(); }
function calPaintOut(){ var o = document.getElementById("cout"); if(o) o.innerHTML = calOutHTML(); }

/* ============ تذكير الأدوية ============ */
function medData(){
  if(!S.med || typeof S.med !== "object") S.med = {list:[], taken:{}};
  if(!Array.isArray(S.med.list)) S.med.list = [];
  if(!S.med.taken || typeof S.med.taken !== "object") S.med.taken = {};
  return S.med;
}
function medOn(m, dk){
  if(!m || m.x) return false;
  if(m.s && dk < m.s) return false;
  if(m.days > 0 && m.s){ var e = dparse(m.s); e.setDate(e.getDate() + m.days - 1); if(dk > dkey(e)) return false; }
  return true;
}
function medDoses(dk){
  var out = [];
  medData().list.forEach(function(m){
    if(!medOn(m, dk)) return;
    (m.t || []).forEach(function(t){ out.push({k:m.id + "@" + t, id:m.id, n:m.n, d:m.d || "", t:t}); });
  });
  out.sort(function(a, b){ return a.t < b.t ? -1 : (a.t > b.t ? 1 : 0); });
  return out;
}
function medTaken(dk, k){ var t = medData().taken[dk], e = t && t[k]; return !!(e && e.v); }
function medAdh(){
  var tot = 0, got = 0, i, d;
  for(i = 0; i < 7; i++){ d = new Date(); d.setDate(d.getDate() - i); var dk = dkey(d); medDoses(dk).forEach(function(x){ tot++; if(medTaken(dk, x.k)) got++; }); }
  return {tot:tot, got:got};
}
function medNewForm(){ return {id:null, n:"", d:"", t:["08:00"], days:""}; }
function medFormHTML(){
  var f = UI.mf;
  return '<div class="medform col"><div class="lbl">' + (f.id ? "تعديل الدواء" : "دواء جديد") + '</div>' +
    '<div class="fld"><label for="mname">اسم الدواء</label><input class="inp" id="mname" type="text" maxlength="40" placeholder="كما هو على العلبة" value="' + esc(f.n) + '" data-act="mname"></div>' +
    '<div class="fld"><label for="mnote">ملاحظة <span class="xs muted">(اختياري)</span></label><input class="inp" id="mnote" type="text" maxlength="60" placeholder="مثلاً: بعد الأكل" value="' + esc(f.d) + '" data-act="mnote"></div>' +
    '<div class="fld"><span class="lbl">أوقات التذكير يومياً</span>' + f.t.map(function(t, i){
      return '<div class="row" style="gap:8px"><input class="inp num grow" type="time" step="60" value="' + esc(t) + '" data-act="mtime" data-i="' + i + '" aria-label="الوقت ' + (i + 1) + '" style="direction:ltr;text-align:center">' +
        (f.t.length > 1 ? '<button type="button" class="ibtn" data-act="mtdel" data-i="' + i + '" aria-label="حذف الوقت ' + (i + 1) + '">حذف</button>' : '') + '</div>';
    }).join("") + (f.t.length < 6 ? '<button type="button" class="btn s quiet" data-act="mtadd">+ وقت آخر</button>' : '') + '</div>' +
    '<div class="fld"><label for="mdays">لمدة كم يوماً؟ <span class="xs muted">(' + gz("اتركيه", "اتركه") + ' فارغاً إن كان مستمراً)</span></label><input class="inp num" id="mdays" type="number" inputmode="numeric" min="1" max="365" placeholder="مثلاً 7" value="' + esc(f.days) + '" data-act="mdays"></div>' +
    '<div class="row wrap" style="gap:10px"><button type="button" class="btn" style="flex:1 1 130px" data-act="msave">حفظ</button><button type="button" class="btn quiet" style="flex:1 1 110px" data-act="mcancel">إلغاء</button></div></div>';
}
function medCardHTML(){
  var dk = dkey(), doses = medDoses(dk), now = new Date(), hm = pad2(now.getHours()) + ":" + pad2(now.getMinutes());
  var live = medData().list.filter(function(m){ return !m.x; });
  var body = '<div class="warn">الجرعات ومواعيدها يحدّدها طبيبك أو الصيدلي. هذه أداة تذكير فقط، ' + gz("اكتبي", "اكتب") + ' فيها ما وُصف لك و' + gz("لا تغيّريه", "لا تغيّره") + ' بناءً عليها.</div>';
  if(live.length){
    body += '<div class="lbl">جرعات اليوم</div>';
    if(doses.length){
      body += '<div class="group">' + doses.map(function(x){
        var tk = medTaken(dk, x.k), late = !tk && x.t < hm;
        return '<button type="button" class="chk' + (late ? " late" : "") + '" data-act="mtake" data-k="' + esc(x.k) + '" aria-pressed="' + tk + '"><span class="ck' + (tk ? " on" : "") + '">' + ico("check") + '</span><span class="grow"><span class="b" style="display:block">' + esc(x.n) + '</span><span class="xs muted" style="display:block">' + (x.d ? esc(x.d) + " · " : "") + (tk ? "تم أخذها" : (late ? "فات موعدها، " + gz("اضغطي إن أخذتِها", "اضغط إن أخذتَها") : "قادمة")) + '</span></span><span class="mtm num">' + x.t + '</span></button>';
      }).join("") + '</div>';
      var a = medAdh();
      if(a.tot) body += '<p class="xs muted num">آخر 7 أيام: ' + a.got + ' من ' + a.tot + ' جرعة.</p>';
    }else body += '<p class="xs muted">لا جرعات اليوم، فأدويتك المضافة خارج مدّتها.</p>';
    body += '<div class="lbl">أدويتي</div><div class="group">' + live.map(function(m){
      var cf = UI.mdel === m.id;
      return '<div class="hrow"><div class="grow"><div class="b">' + esc(m.n) + '</div><div class="xs muted num">' + (m.t || []).join(" · ") + (m.days > 0 ? " · " + m.days + " يوماً" : " · مستمر") + '</div></div>' +
        '<button type="button" class="ibtn" data-act="medit" data-id="' + esc(m.id) + '">تعديل</button><button type="button" class="ibtn" data-act="mdel" data-id="' + esc(m.id) + '">' + (cf ? "تأكيد الحذف" : "حذف") + '</button></div>';
    }).join("") + '</div>';
  }else if(!UI.mf){
    body += '<p class="sm muted">لم تُضف أي دواء بعد. ' + gz("أضيفي", "أضف") + ' اسم الدواء ومواعيده، وسيظهر لك كل يوم ل' + gz("تعلّمي ما أخذتِ", "تعلّم ما أخذتَ") + '.</p>';
  }
  body += UI.mf ? medFormHTML() : '<button type="button" class="btn quiet full" data-act="madd">' + (live.length ? "+ إضافة دواء آخر" : "+ إضافة دواء") + '</button>';
  if(live.length){
    if(icsOk()){
      body += '<div class="group"><div class="gi" style="display:block"><div class="t">تنبيهات في تقويم الجوال</div><div class="m">ينزّل ملف تقويم فيه تنبيه يومي لكل موعد. ' + gz("افتحيه", "افتحه") + ' من التنزيلات و' + gz("اضغطي", "اضغط") + ' «إضافة الكل»، فينبّهك الجوال في الوقت حتى والموقع مغلق.</div></div></div>' +
        '<button type="button" class="btn full" data-act="mics">تنزيل ملف التنبيهات</button>' +
        '<p class="xs muted">وأثناء فتح هذه الصفحة أنبّهك بنفسي برسالة وصوت عند موعد الدواء، لكن الموقع لا يستطيع التنبيه وهو مغلق، ولذلك أنصح بتقويم الجوال.</p>';
    }else{
      body += '<p class="xs muted">أنبّهك برسالة وصوت عند موعد الدواء ما دامت هذه الصفحة مفتوحة. تنزيل ملف تنبيهات التقويم يعمل في الموقع حين يُفتح مباشرة من سفاري، لا من داخل هذا العرض.</p>';
    }
  }
  body += '<div class="tfoot"><span class="xs muted">قوة الدليل · اضغطي لترين المصدر</span>' + evChip("meds") + '</div>';
  return '<section class="card col tool" id="t-med"><div class="th"><span class="si">' + ico("pill") + '</span><div class="grow"><h2 class="h3">تذكير الأدوية</h2><div class="tsub">مواعيد دوائك وتعليم ما ' + gz("أخذتِ", "أخذتَ") + ' كل يوم</div></div></div>' + body + '</section>';
}
function medRepaint(){ var el = document.getElementById("t-med"); if(el) el.outerHTML = medCardHTML(); }
function medPrune(){
  var t = medData().taken, lim = new Date(); lim.setDate(lim.getDate() - 60); var lk = dkey(lim);
  Object.keys(t).forEach(function(d){ if(d < lk) delete t[d]; });
}
function medSave(){
  var f = UI.mf, n = (f.n || "").trim(), ts = [];
  f.t.forEach(function(t){ if(/^\d{2}:\d{2}$/.test(t) && ts.indexOf(t) < 0) ts.push(t); });
  ts.sort();
  if(!n){ toast(gz("اكتبي", "اكتب") + " اسم الدواء"); return false; }
  if(!ts.length){ toast(gz("اختاري", "اختر") + " وقتاً واحداً على الأقل"); return false; }
  var days = parseInt(f.days, 10); if(!(days >= 1 && days <= 365)) days = 0;
  var D = medData(), m = null;
  if(f.id){ D.list.forEach(function(x){ if(x.id === f.id) m = x; }); }
  if(!m){ m = {id:"m" + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36), s:dkey()}; D.list.push(m); }
  m.n = n; m.d = (f.d || "").trim(); m.t = ts; m.days = days; m.u = Date.now(); delete m.x;
  if(f.id && days > 0 && !m.s) m.s = dkey();
  medPrune(); save(); return true;
}

/* ملف تقويم (iCalendar): حدث يومي لكل موعد وتنبيه عند الوقت. التوقيت عائم فيتبع ساعة الجوال */
function icsEsc(s){ return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
function icsFold(line){
  var out = [], cur = "", n = 0, lim = 73;
  Array.from(line).forEach(function(ch){
    var cp = ch.codePointAt(0), b = cp < 0x80 ? 1 : (cp < 0x800 ? 2 : (cp < 0x10000 ? 3 : 4));
    if(n + b > lim){ out.push(cur); cur = " "; n = 1; lim = 73; }
    cur += ch; n += b;
  });
  out.push(cur);
  return out.join("\r\n");
}
function icsStamp(d, z){ return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + "T" + pad2(d.getHours()) + pad2(d.getMinutes()) + "00"; }
function medICS(){
  var live = medData().list.filter(function(m){ return !m.x && (m.t || []).length; });
  if(!live.length) return "";
  var now = new Date(), stamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  var L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ashwaq-fitness//meds//AR", "CALSCALE:GREGORIAN"];
  live.forEach(function(m){
    var s = m.s || dkey();
    m.t.forEach(function(t){
      var st = dparse(s); st.setHours(+t.slice(0, 2), +t.slice(3), 0, 0);
      var en = new Date(st.getTime() + 15 * 60000);
      L.push("BEGIN:VEVENT", "UID:" + m.id + "-" + t.replace(":", "") + "@ashwaq-fitness", "DTSTAMP:" + stamp, "DTSTART:" + icsStamp(st), "DTEND:" + icsStamp(en),
        "RRULE:FREQ=DAILY" + (m.days > 0 ? ";COUNT=" + m.days : ""), "SUMMARY:" + icsEsc("دواء: " + m.n),
        "DESCRIPTION:" + icsEsc((m.d ? m.d + ". " : "") + "تذكير من لياقة أشواق"), "TRANSP:TRANSPARENT",
        "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEsc("موعد دواء: " + m.n), "TRIGGER:PT0M", "END:VALARM", "END:VEVENT");
    });
  });
  L.push("END:VCALENDAR");
  return L.map(icsFold).join("\r\n") + "\r\n";
}
function icsOk(){ try{ return !(window.claude && typeof window.claude.use === "function"); }catch(e){ return true; } }
function medDownload(){
  if(!icsOk()){ toast("التنزيل غير متاح في هذا العرض"); return; }
  var ics = medICS();
  if(!ics){ toast(gz("أضيفي", "أضف") + " دواءً أولاً"); return; }
  try{
    var blob = new Blob([ics], {type:"text/calendar;charset=utf-8"}), url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = "medicine-reminders.ics"; document.body.appendChild(a); a.click();
    setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 4000);
    toast("نُزّل الملف، " + gz("افتحيه", "افتحه") + " من التنزيلات", 4000);
  }catch(e){ toast("تعذّر إنشاء الملف هنا. " + gz("افتحي", "افتح") + " الموقع من سفاري."); }
}

/* تنبيه داخل الصفحة وهي مفتوحة: رسالة وصوت خلال 20 دقيقة من الموعد، مرة واحدة لكل جرعة */
var MEDAL = {};
function medTick(){
  try{
    var dk = dkey(), now = new Date(), nm = now.getHours() * 60 + now.getMinutes(), due = [];
    medDoses(dk).forEach(function(x){
      var tm = +x.t.slice(0, 2) * 60 + +x.t.slice(3), key = dk + "|" + x.k;
      if(!medTaken(dk, x.k) && nm >= tm && nm - tm <= 20 && !MEDAL[key]){ MEDAL[key] = 1; due.push(x); }
    });
    if(due.length){
      toast("حان موعد دوائك: " + due.map(function(x){ return x.n; }).join("، "), 7000);
      beep(660, 180); setTimeout(function(){ beep(880, 220); }, 260); buzz([120, 80, 120]);
    }
    if(UI.view === "tools" && !UI.mf && document.getElementById("t-med")) medRepaint();
  }catch(e){}
}
function medStart(){
  setInterval(medTick, 30000);
  document.addEventListener("visibilitychange", function(){ if(document.visibilityState === "visible") medTick(); });
  setTimeout(medTick, 1500);
}
