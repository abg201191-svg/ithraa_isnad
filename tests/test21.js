// اختبار أدواتي v12: حاسبة السعرات والماكروز، تذكير الأدوية، حذف البروتين والنوم
const { chromium } = require('playwright');
const URL = 'file://' + process.cwd() + '/index.html';
let fails = 0, passes = 0;
function ok(c, m){ if(!c){ fails++; console.log('FAIL ' + m); } else { passes++; } }
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'ar', acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload(); await p.waitForTimeout(300);

  // ---------- 1) المحرك: حالات مرجعية
  const ref = await p.evaluate(() => {
    var base = {sex:'f', age:28, h:165, w:65, bf:0, act:'light', goal:'lose', pace:'mid', tw:58, meals:4};
    var R = calcPlan(base);
    var keep = calcPlan(Object.assign({}, base, {goal:'keep'}));
    var gain = calcPlan(Object.assign({}, base, {goal:'gain'}));
    var light = calcPlan({sex:'f', age:40, h:150, w:48, bf:0, act:'low', goal:'lose', pace:'fast', tw:0, meals:4});
    var thin = calcPlan({sex:'f', age:25, h:160, w:45, bf:0, act:'light', goal:'lose', pace:'mid', tw:0, meals:4});
    var male = calcPlan({sex:'m', age:35, h:180, w:90, bf:0, act:'mod', goal:'lose', pace:'mid', tw:0, meals:4});
    var cun = calcPlan(Object.assign({}, base, {bf:30}));
    var missing = calcPlan({sex:'', age:0, h:0, w:0, bf:0, act:'light', goal:'lose', pace:'mid', tw:0, meals:4});
    var obese = calcPlan({sex:'f', age:35, h:160, w:110, bf:0, act:'low', goal:'lose', pace:'mid', tw:0, meals:4});
    var twlow = calcPlan(Object.assign({}, base, {tw:40}));
    return {R:R, keep:keep, gain:gain, light:light, thin:thin, male:male, cun:cun, missing:missing, obese:obese, twlow:twlow};
  });
  ok(ref.R.ok && ref.R.method === 'mif', 'طريقة ميفلين افتراضياً');
  ok(ref.R.bmr === 1380 && ref.R.tdee === 2139, 'امرأة 28/165/65: حرق 1380 واحتياج 2139 (' + ref.R.bmr + '/' + ref.R.tdee + ')');
  ok(ref.R.target === 1780 && ref.R.diff === -359, 'هدف الإنزال المتوسط 1780 والعجز 359 وليس 500 ثابتاً (' + ref.R.target + '/' + ref.R.diff + ')');
  ok(ref.R.P === 117 && ref.R.F === 49 && ref.R.C === 218, 'ماكروز 117/218/49 (' + ref.R.P + '/' + ref.R.C + '/' + ref.R.F + ')');
  ok(Math.abs(ref.R.tot - ref.R.target) <= 12, 'مجموع سعرات الماكروز يطابق الهدف (' + ref.R.tot + ' مقابل ' + ref.R.target + ')');
  ok(ref.R.weeks === 22, 'المدة إلى 58 كجم: 22 أسبوعاً (' + ref.R.weeks + ')');
  ok(ref.keep.target === ref.keep.tdee - (ref.keep.tdee - ref.keep.target) && Math.abs(ref.keep.target - ref.keep.tdee) <= 5 && ref.keep.diff <= 5 && ref.keep.diff >= -5, 'الثبات = الاحتياج');
  ok(ref.keep.P === Math.round(1.4 * 65), 'بروتين الثبات 1.4 جم/كجم (' + ref.keep.P + ')');
  ok(ref.gain.target > ref.gain.tdee && Math.abs(ref.gain.diff - 0.10 * ref.gain.tdee) <= 6, 'زيادة العضل +10% (' + ref.gain.diff + ')');
  ok(ref.light.flags.indexOf('floor') >= 0 && ref.light.target === 1200, 'رفع الهدف إلى حد 1200 للأنثى (' + ref.light.target + ' ' + ref.light.flags + ')');
  ok(ref.thin.goal === 'keep' && ref.thin.flags.indexOf('nolose') >= 0, 'BMI تحت 18.5 لا يُخفَّض');
  ok(ref.male.bmr === 1855 && Math.abs(ref.male.tdee - 3154) <= 1, 'رجل: حرق 1855 واحتياج ~3154 (' + ref.male.bmr + '/' + ref.male.tdee + ')');
  ok(ref.male.target >= 1500, 'حد الرجل 1500');
  ok(ref.cun.method === 'cun' && ref.cun.bmr === Math.round(500 + 22 * 65 * 0.7), 'كانينغهام عند إدخال نسبة الدهون (' + ref.cun.bmr + ')');
  ok(ref.missing.ok === false && ref.missing.miss.length === 4, 'حقول ناقصة تُسمّى');
  ok(ref.obese.refW < 90 && ref.obese.refW > 70, 'وزن معدّل للبروتين عند BMI 30+ (' + Math.round(ref.obese.refW) + ')');
  ok(ref.twlow.flags.indexOf('twlow') >= 0 && ref.twlow.weeks === null, 'هدف وزن منخفض جداً لا تُحسب له مدة');

  // ---------- 2) مسح شامل للثوابت
  const sweep = await p.evaluate(() => {
    var bad = [], n = 0;
    ['f', 'm'].forEach(function(sex){
      [18, 30, 45, 62, 80].forEach(function(age){
        [140, 155, 170, 185, 205].forEach(function(h){
          [40, 52, 65, 80, 100, 130, 180].forEach(function(w){
            ['low', 'light', 'mod', 'high'].forEach(function(act){
              ['lose', 'keep', 'gain'].forEach(function(goal){
                ['slow', 'mid', 'fast'].forEach(function(pace){
                  [3, 4, 5].forEach(function(meals){
                    var c = {sex:sex, age:age, h:h, w:w, bf:0, act:act, goal:goal, pace:pace, tw:0, meals:meals}, R = calcPlan(c); n++;
                    var why = [];
                    if(!R.ok) why.push('notok');
                    else {
                      ['bmr', 'tdee', 'target', 'P', 'C', 'F'].forEach(function(k){ if(!isFinite(R[k]) || R[k] < 0) why.push(k + '=' + R[k]); });
                      if(Math.abs(R.tot - R.target) > 12) why.push('tot ' + R.tot + ' vs ' + R.target);
                      var ms = R.meals.reduce(function(a, m){ return a + m.kc; }, 0);
                      if(Math.abs(ms - R.target) > 30) why.push('meals ' + ms + ' vs ' + R.target);
                      var floor = sex === 'm' ? 1500 : 1200;
                      if(R.goal === 'lose' && R.target < Math.min(floor, R.tdee) - 10) why.push('below floor ' + R.target);
                      if(R.goal === 'lose' && R.tdee - R.target > 0.25 * R.tdee + 10) why.push('deficit>25% ' + (R.tdee - R.target));
                      if(R.goal === 'lose' && R.target > R.tdee + 5) why.push('lose above tdee');
                      if(R.goal === 'gain' && R.target < R.tdee) why.push('gain below tdee');
                      if(4 * R.P > 0.35 * R.target + 8) why.push('protein>35% ' + (4 * R.P) + '/' + R.target);
                      if(R.meals.length !== meals) why.push('meal count');
                      R.meals.forEach(function(m){ if(!(m.c >= 0) || !(m.p >= 0) || !(m.f >= 0)) why.push('meal neg'); });
                    }
                    if(why.length && bad.length < 8) bad.push(JSON.stringify(c) + ' => ' + why.join(','));
                    else if(why.length) bad.push('x');
                  });
                });
              });
            });
          });
        });
      });
    });
    return {n:n, bad:bad};
  });
  ok(sweep.bad.length === 0, 'مسح ' + sweep.n + ' حالة بلا خلل: ' + sweep.bad.slice(0, 6).join(' | '));

  // ---------- 3) الواجهة: التبويب
  await p.click('.nb[data-v="tools"]'); await p.waitForTimeout(100);
  for (const id of ['t-heart', 't-cal', 't-med', 't-zones', 't-talk']) ok(await p.locator('#' + id).count() === 1, 'بطاقة ' + id);
  for (const id of ['t-protein', 't-sleep']) ok(await p.locator('#' + id).count() === 0, 'حُذفت بطاقة ' + id);
  ok(await p.locator('[data-act="tjump"]').count() === 5, '5 اختصارات علوية');
  const tt = await p.locator('#main').innerText();
  ok(!/النوم والتعافي|احتياجك من البروتين/.test(tt), 'لا نص قديم للنوم والبروتين في الأدوات');
  ok(/أكمل/.test(await p.locator('#cout').innerText()), 'رسالة إكمال الحقول قبل الإدخال');

  await p.click('[data-act="csex"][data-v="f"]');
  await p.fill('#cage', '28'); await p.fill('#ch', '165'); await p.fill('#cwt', '65');
  ok(await p.inputValue('#age') === '28', 'العمر يتزامن مع بطاقة المناطق');
  ok((await p.locator('#zout').innerText()).includes('188'), 'مناطق النبض تتحدّث من نفس العمر');
  await p.click('[data-act="cact"][data-v="light"]'); await p.click('[data-act="cgoal"][data-v="lose"]'); await p.click('[data-act="cpace"][data-v="mid"]');
  let out = await p.locator('#cout').innerText();
  ok(out.includes('1,780') && out.includes('2,139') && out.includes('1,380'), 'تظهر 1,780 و2,139 و1,380');
  ok(/117/.test(out) && /218/.test(out) && /49/.test(out), 'ماكروز في الجدول');
  await p.fill('#ctw', '58');
  ok((await p.locator('#cout').innerText()).includes('22 أسبوعاً'), 'مدة الوصول 22 أسبوعاً');
  ok(await p.evaluate(() => S.cal.h === 165 && S.cal.sex === 'f' && S.cal.goal === 'lose' && S.age === 28 && S.wt === 65 && S.cal.tw === 58), 'الحالة محفوظة');
  for (const n of [3, 5, 4]) {
    await p.click('[data-act="cmeals"][data-v="' + n + '"]');
    const rows = await p.locator('#cout table.tb').nth(1).locator('tbody tr').count();
    ok(rows === n, 'جدول الوجبات ' + n + ' صفوف (' + rows + ')');
  }
  // الفرق ليس 500 ثابتاً: غيّري الوزن
  await p.fill('#cwt', '55');
  const light50 = await p.evaluate(() => calcPlan(calOf()).diff);
  ok(light50 > -400 && light50 < -250, 'العجز يتناسب مع الوزن (55 كجم: ' + light50 + ')');
  await p.fill('#cwt', '65');
  // الثبات والزيادة
  await p.click('[data-act="cgoal"][data-v="keep"]');
  ok(await p.locator('[data-act="cpace"]').count() === 0, 'الثبات بلا وتيرة');
  ok((await p.locator('#cout').innerText()).includes('2,140') || (await p.locator('#cout').innerText()).includes('2,139'), 'سعرات الثبات ~ الاحتياج');
  await p.click('[data-act="cgoal"][data-v="gain"]');
  ok(await p.locator('[data-act="cpace"]').count() === 2, 'الزيادة لها وتيرتان');
  await p.click('[data-act="cgoal"][data-v="lose"]');
  ok(await p.locator('[data-act="cpace"]').count() === 3, 'الإنزال له 3 وتائر');
  await p.click('[data-act="cpace"][data-v="mid"]');
  // ذكر
  await p.click('[data-act="csex"][data-v="m"]');
  ok(await p.evaluate(() => calcPlan(calOf()).sex === 'm'), 'تبديل إلى ذكر');
  await p.click('[data-act="csex"][data-v="f"]');

  // نسخ ومشاركة
  await p.evaluate(() => { window.__cp = null; Object.defineProperty(navigator, 'clipboard', { value: { writeText: t => { window.__cp = t; return Promise.resolve(); } }, configurable: true }); });
  await p.click('[data-act="ccopy"]'); await p.waitForTimeout(100);
  const cp = await p.evaluate(() => window.__cp);
  ok(cp && cp.includes('خطة السعرات') && cp.includes('1,780') && cp.includes('البروتين: 117') && cp.includes('التوزيع على 4 وجبات'), 'النسخ يضع الخطة في الحافظة');
  ok(cp && cp.split('\n').length > 10 && !/<|&nbsp;/.test(cp), 'نص نظيف متعدد الأسطر');
  ok((await p.locator('#toast').innerText()).includes('الملاحظات'), 'تنبيه النسخ يذكر الملاحظات');
  ok(await p.locator('[data-act="cshare"]').count() === 0, 'زر المشاركة يظهر فقط حيث تتوفر مشاركة النظام');
  await p.evaluate(() => { window.__sh = null; navigator.share = function(o){ window.__sh = o; return Promise.resolve(); }; calPaintOut(); });
  ok(await p.locator('[data-act="cshare"]').count() === 1, 'زر الحفظ في الملاحظات يظهر مع المشاركة');
  await p.click('[data-act="cshare"]'); await p.waitForTimeout(100);
  const sh = await p.evaluate(() => window.__sh);
  ok(sh && sh.text.includes('1,780') && sh.title, 'المشاركة ترسل النص');
  await p.evaluate(() => { delete navigator.share; });

  // نصوص المؤنث/المذكر في الشرح
  const how = await p.evaluate(() => { document.querySelectorAll('#t-cal details').forEach(d => d.open = true); return document.getElementById('t-cal').innerText; });
  ok(!/ب2/.test(how) && /التزمي 2 إلى 3 أسابيع/.test(how) && /زني نفسك/.test(how), 'شرح التعديل بصيغة المؤنث بلا أخطاء');
  await p.click('[data-act="csex"][data-v="m"]');
  const howM = await p.evaluate(() => { document.querySelectorAll('#t-cal details').forEach(d => d.open = true); return document.getElementById('t-cal').innerText; });
  ok(/التزم 2 إلى 3 أسابيع/.test(howM) && /زن نفسك/.test(howM) && !/التزمي/.test(howM), 'وصيغة المذكر عند اختيار ذكر');
  await p.click('[data-act="csex"][data-v="f"]');
  await p.click('[data-act="cgoal"][data-v="gain"]');
  ok(/لم يزد وزنك/.test(await p.evaluate(() => { document.querySelectorAll('#t-cal details').forEach(d => d.open = true); return document.getElementById('t-cal').innerText; })), 'نصائح التعديل تتبع الهدف');
  await p.click('[data-act="cgoal"][data-v="lose"]'); await p.click('[data-act="cpace"][data-v="mid"]');

  // حمل ورضاعة
  await p.click('[data-act="cpg"]');
  let pgt = await p.locator('#cout').innerText();
  ok(/حامل|الحمل/.test(pgt) && !/1,780/.test(pgt), 'الحمل يخفي الأرقام');
  await p.click('[data-act="cpg"]');
  ok((await p.locator('#cout').innerText()).includes('1,780'), 'إلغاء الحمل يعيد الأرقام');

  // حالات حد
  await p.fill('#cage', '17');
  ok(/العمر/.test(await p.locator('#cout').innerText()) && !/1,780/.test(await p.locator('#cout').innerText()), 'عمر 17 لا يُحسب');
  await p.fill('#cage', '28');
  await p.fill('#cbf', '30');
  ok(/كانينغهام/.test(await p.evaluate(() => calText())), 'النص المنسوخ يذكر كانينغهام مع نسبة الدهون');
  await p.fill('#cbf', '');
  ok(/ميفلين/.test(await p.evaluate(() => calText())), 'ميفلين بلا نسبة دهون');

  // الاستمرار بعد إعادة التحميل
  await p.reload(); await p.waitForTimeout(300);
  await p.click('.nb[data-v="tools"]');
  ok(await p.inputValue('#ch') === '165' && await p.inputValue('#cwt') === '65' && await p.inputValue('#cage') === '28', 'القيم تبقى بعد إعادة التحميل');
  ok((await p.locator('#cout').innerText()).includes('1,780'), 'النتيجة تبقى بعد إعادة التحميل');

  // ---------- 4) الأدوية
  ok(await p.locator('[data-act="mics"]').count() === 0, 'لا زر تقويم قبل إضافة دواء');
  await p.click('[data-act="madd"]');
  ok(await p.locator('#mname').count() === 1, 'يظهر نموذج الدواء');
  await p.click('[data-act="msave"]');
  ok((await p.locator('#toast').innerText()).includes('اسم'), 'الاسم مطلوب');
  await p.fill('#mname', 'ڤيتامين د'); await p.fill('#mnote', 'بعد الفطور');
  await p.locator('[data-act="mtime"]').first().fill('08:00');
  await p.click('[data-act="mtadd"]');
  await p.locator('[data-act="mtime"]').nth(1).fill('20:30');
  await p.fill('#mdays', '3');
  await p.click('[data-act="msave"]');
  ok(await p.locator('#mname').count() === 0, 'النموذج يُغلق بعد الحفظ');
  const md = await p.evaluate(() => JSON.parse(JSON.stringify(S.med)));
  ok(md.list.length === 1 && md.list[0].n === 'ڤيتامين د' && md.list[0].t.join() === '08:00,20:30' && md.list[0].days === 3 && md.list[0].s === dkeyNow(), 'الدواء محفوظ بوقتين ومدة 3 أيام');
  function dkeyNow(){ const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  ok(md.list[0].s === dkeyNow(), 'يبدأ اليوم');
  ok(await p.locator('[data-act="mtake"]').count() === 2, 'جرعتان اليوم');
  const first = p.locator('[data-act="mtake"]').first();
  ok(await first.getAttribute('aria-pressed') === 'false', 'غير مؤخوذة افتراضياً');
  await first.click(); await p.waitForTimeout(80);
  ok(await p.locator('[data-act="mtake"]').first().getAttribute('aria-pressed') === 'true', 'تعليم كمأخوذة');
  ok(await p.evaluate(() => { var t = S.med.taken[dkey()]; return t && Object.values(t).some(e => e.v === 1); }), 'تُحفظ في الحالة');
  ok(/آخر 7 أيام: 1 من 2/.test(await p.locator('#t-med').innerText()), 'ملخص الالتزام 1 من 2');
  await p.locator('[data-act="mtake"]').first().click(); await p.waitForTimeout(80);
  ok(await p.locator('[data-act="mtake"]').first().getAttribute('aria-pressed') === 'false', 'إلغاء التعليم');
  // تعديل
  await p.click('[data-act="medit"]');
  ok(await p.inputValue('#mname') === 'ڤيتامين د' && await p.locator('[data-act="mtime"]').count() === 2, 'التعديل يملأ النموذج');
  await p.fill('#mname', 'فيتامين د'); await p.click('[data-act="mtdel"] >> nth=1');
  ok(await p.locator('[data-act="mtime"]').count() === 1, 'حذف وقت');
  await p.click('[data-act="msave"]');
  ok(await p.evaluate(() => S.med.list.length === 1 && S.med.list[0].n === 'فيتامين د' && S.med.list[0].t.length === 1), 'التعديل يحدّث نفس الدواء');
  await p.click('[data-act="madd"]'); await p.click('[data-act="mcancel"]');
  ok(await p.locator('#mname').count() === 0 && await p.evaluate(() => S.med.list.length) === 1, 'الإلغاء لا يضيف');

  // ملف التقويم
  await p.click('[data-act="madd"]'); await p.fill('#mname', 'دواء باسم طويل جداً يتجاوز خمسة وسبعين بايتاً في السطر الواحد لاختبار الطي الصحيح للأحرف العربية'); await p.fill('#mnote', 'note, with comma; and semicolon');
  await p.locator('[data-act="mtime"]').first().fill('13:15'); await p.click('[data-act="msave"]');
  const ics = await p.evaluate(() => medICS());
  ok(/^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\n/.test(ics) && /END:VCALENDAR\r\n$/.test(ics), 'ICS ترويسة وخاتمة');
  ok((ics.match(/BEGIN:VEVENT/g) || []).length === 2 && (ics.match(/END:VEVENT/g) || []).length === 2, 'حدثان');
  ok((ics.match(/BEGIN:VALARM/g) || []).length === 2 && /TRIGGER:PT0M/.test(ics), 'تنبيه عند الموعد لكل حدث');
  ok(/RRULE:FREQ=DAILY;COUNT=3\r\n/.test(ics) && /RRULE:FREQ=DAILY\r\n/.test(ics), 'تكرار يومي مع COUNT للمحدد المدة');
  ok(!/\n(?!\s)[^A-Z\r\n]/.test(ics.replace(/\r\n /g, '')), 'لا أسطر مكسورة');
  const bytesOk = Buffer.from(ics, 'utf8').toString('utf8') === ics && ics.split('\r\n').every(l => Buffer.byteLength(l, 'utf8') <= 75);
  ok(bytesOk, 'كل سطر ≤ 75 بايت ولا يُقطع حرف');
  const unf = ics.replace(/\r\n /g, '');
  ok(/SUMMARY:دواء: فيتامين د\r\n/.test(unf) && /SUMMARY:دواء: دواء باسم طويل/.test(unf), 'الملخص بعد فك الطي');
  ok(/DESCRIPTION:note\\, with comma\\; and semicolon\./.test(unf), 'هروب الفاصلة والفاصلة المنقوطة');
  ok(/DTSTART:\d{8}T081500|DTSTART:\d{8}T0800\d\d/.test(unf) || /DTSTART:\d{8}T080000/.test(unf), 'وقت البدء عائم بلا Z');
  ok(!/DTSTART:[^\r\n]*Z/.test(ics), 'DTSTART بلا Z لاتباع ساعة الجوال');
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }), p.click('[data-act="mics"]')]);
  ok(dl.suggestedFilename() === 'medicine-reminders.ics', 'اسم الملف المنزَّل ' + dl.suggestedFilename());
  const fp = await dl.path(); const fs = require('fs');
  ok(fs.readFileSync(fp, 'utf8').startsWith('BEGIN:VCALENDAR'), 'محتوى الملف المنزَّل صحيح');

  // حذف بخطوتين
  await p.click('[data-act="mdel"] >> nth=1');
  ok((await p.locator('[data-act="mdel"]').nth(1).innerText()).includes('تأكيد'), 'الحذف يطلب تأكيداً');
  ok(await p.evaluate(() => S.med.list.length) === 2, 'لم يُحذف بعد');
  await p.click('[data-act="mdel"] >> nth=1');
  ok(await p.evaluate(() => S.med.list.filter(m => !m.x).length) === 1, 'حُذف الدواء (حذف ناعم)');
  ok(await p.locator('[data-act="mdel"]').count() === 1, 'تختفي بطاقته');

  // التنبيه داخل الصفحة
  await p.evaluate(() => { var now = new Date(); if(now.getHours() === 0 && now.getMinutes() < 3) return; var m = new Date(now.getTime() - 60000); S.med.list.push({id:'mtest', n:'اختبار التنبيه', d:'', t:[String(m.getHours()).padStart(2, '0') + ':' + String(m.getMinutes()).padStart(2, '0')], days:0, s:dkey(), u:Date.now()}); MEDAL = {}; medTick(); });
  await p.waitForTimeout(100);
  const tn = await p.locator('#toast').innerText();
  const midnight = await p.evaluate(() => { var n = new Date(); return n.getHours() === 0 && n.getMinutes() < 3; });
  ok(midnight || (tn.includes('حان موعد دوائك') && tn.includes('اختبار التنبيه')), 'تنبيه الموعد داخل الصفحة: ' + tn);
  await p.evaluate(() => { var again = 0; var t0 = document.getElementById('toast'); t0.hidden = true; medTick(); return again; });
  ok(await p.locator('#toast').isHidden(), 'لا يتكرر التنبيه لنفس الجرعة');
  // مأخوذة فلا تنبيه
  await p.evaluate(() => { MEDAL = {}; var t = S.med.taken[dkey()] = S.med.taken[dkey()] || {}; t['mtest@' + S.med.list.find(m => m.id === 'mtest').t[0]] = {v:1, u:Date.now()}; document.getElementById('toast').hidden = true; medTick(); });
  ok(await p.locator('#toast').isHidden(), 'لا تنبيه لجرعة مأخوذة');

  // ---------- 5) الدمج
  const mg = await p.evaluate(() => {
    var L = {ts:5, done:{}, log:{}, chk:{}, body:{}, cal:{h:160, sex:'f'}, med:{list:[{id:'a', n:'قديم', t:['08:00'], days:0, s:'2026-11-01', u:10}, {id:'b', n:'ب', t:['09:00'], days:0, s:'2026-11-01', u:10}], taken:{'2026-11-02':{'a@08:00':{v:1, u:20}}}}};
    var C = {ts:9, done:{}, log:{}, chk:{}, body:{}, cal:{w:1}, med:{list:[{id:'a', n:'جديد', t:['08:00'], days:0, s:'2026-11-01', u:30}, {id:'c', n:'ج', t:['10:00'], days:0, s:'2026-11-01', u:5}, {id:'b', n:'ب', t:['09:00'], days:0, s:'2026-11-01', u:40, x:1}], taken:{'2026-11-02':{'a@08:00':{v:0, u:50}, 'c@10:00':{v:1, u:6}}}}};
    return mergeStates(L, C);
  });
  const byId = {}; mg.med.list.forEach(m => byId[m.id] = m);
  ok(mg.med.list.length === 3 && byId.a.n === 'جديد' && byId.b.x === 1 && byId.c, 'دمج الأدوية: الأحدث يفوز والحذف الناعم يسري');
  ok(mg.med.taken['2026-11-02']['a@08:00'].v === 0 && mg.med.taken['2026-11-02']['c@10:00'].v === 1, 'دمج المأخوذ حسب الأحدث');
  ok(mg.cal.h === 160 && mg.cal.w === 1 && mg.cal.sex === 'f', 'دمج بيانات الحاسبة (اتحاد)');
  ok(await p.evaluate(() => hasProgress({med:{list:[{id:'z'}]}}) === true && hasProgress({med:{list:[]}}) === false), 'الأدوية تُعدّ تقدماً للمزامنة');

  // ---------- 6) مسح التقدم يبقي الأدوية
  await p.evaluate(() => { openSheet(settingsHTML()); });
  await p.click('[data-act="wipe"]'); await p.click('[data-act="wipe"]'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => S.med.list.length >= 1 && Object.keys(S.done).length === 0), 'المسح يحذف التقدم ويُبقي الأدوية');

  // ---------- 7) نبض الصباح بلا نوم، ومرجع الدليل
  await p.click('.nb[data-v="log"]'); await p.click('[data-act="lseg"][data-v="pu"]');
  ok(await p.locator('#psleep').count() === 0 && !/نومك|ساعات نومك/.test(await p.locator('#main').innerText()), 'لا حقل نوم في نبض الصباح');
  await p.click('.nb[data-v="ref"]'); await p.click('[data-act="rseg"][data-v="evid"]'); await p.waitForTimeout(80);
  ok(await p.locator('details.eva').count() === 23, '23 موضوع دليل');
  const evtxt = await p.evaluate(() => { document.querySelectorAll('#main details').forEach(d => d.open = true); return document.getElementById('main').innerText; });
  for (const w of ['ميفلين', 'Hall', '13.8', '1.62', 'السعرات: كيف أحسب هدفك', 'تذكير الأدوية: هل ينفع', 'الكارب والدهون وتوزيع الوجبات']) ok(evtxt.includes(w), 'الدليل يذكر ' + w);
  const links = await p.evaluate(() => ['energy', 'protein', 'macros', 'meds'].map(k => EVID[k].src.length + ':' + EVID[k].src.every(s => /^https:\/\//.test(s.u))));
  ok(links.every(x => /^[1-9]\d*:true$/.test(x)), 'مصادر الأدلة الجديدة روابط https: ' + links.join(','));
  await p.click('[data-act="rseg"][data-v="day"]');
  ok(/حاسبة «السعرات»/.test(await p.evaluate(() => { document.querySelectorAll('#main details').forEach(d => d.open = true); return document.getElementById('main').innerText; })), 'مرجع البروتين يشير إلى الحاسبة');

  // ---------- 8) لا تمرير أفقي، فاتح وداكن
  for (const W of [320, 360, 390, 430]) for (const dark of [false, true]) {
    const c2 = await b.newContext({ viewport: { width: W, height: 800 }, deviceScaleFactor: 2, locale: 'ar', colorScheme: dark ? 'dark' : 'light' });
    const q = await c2.newPage(); const e2 = []; q.on('pageerror', e => e2.push(e.message));
    await q.goto(URL); await q.waitForTimeout(200);
    await q.evaluate(() => {
      S.age = 31; S.wt = 112.5; S.cal = {sex:'f', h:158, bf:41, act:'high', goal:'lose', pace:'fast', tw:60, meals:5};
      S.med = {list:[{id:'m1', n:'دواء باسم طويل جداً لاختبار التفاف النص', d:'بعد الأكل مع كوب ماء كامل', t:['07:30', '13:00', '21:45'], days:14, s:dkey(), u:1}], taken:{}};
      UI.view = 'tools'; render();
    });
    let bad = [];
    const chk = async (tag) => { const r = await q.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })); if (r.sw > r.cw) bad.push(tag + ' ' + r.sw + '>' + r.cw); };
    await chk('results'); await q.evaluate(() => { UI.mf = {id:null, n:'', d:'', t:['08:00', '12:00', '16:00', '20:00'], days:''}; medRepaint(); }); await chk('form');
    await q.evaluate(() => { UI.mf = null; S.cal.pg = 1; calRepaint(); medRepaint(); }); await chk('pg');
    await q.evaluate(() => { S.cal.pg = 0; S.cal.goal = 'gain'; S.cal.pace = 'mid'; calRepaint(); }); await chk('gain');
    if (W === 320 || W === 390) { await q.evaluate(() => { S.cal.goal = 'lose'; S.cal.pace = 'fast'; UI.mf = null; calRepaint(); medRepaint(); window.scrollTo(0, 0); }); await q.screenshot({ path: 'v12-' + W + (dark ? 'd' : 'l') + '-tools.png', fullPage: true }); }
    ok(bad.length === 0 && e2.length === 0, 'W' + W + (dark ? ' dark' : '') + ' بلا تمرير أفقي ' + bad.join('|') + ' ' + e2.join(';'));
    await c2.close();
  }

  ok(errs.length === 0, 'لا أخطاء JS: ' + errs.slice(0, 3).join(' ; '));
  await b.close();
  console.log(fails ? ('FAILS ' + fails + ' / passes ' + passes) : ('ALL OK passes ' + passes));
  process.exit(fails ? 1 : 0);
})();
