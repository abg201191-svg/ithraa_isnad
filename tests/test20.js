// اختبار النسخة المستقلة (بدون Claude): تُخدَّم من http كما ستُخدَّم على GitHub Pages
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const DIR = process.argv[2] || '.';
const PORT = 8765, BASE = 'http://127.0.0.1:' + PORT + '/';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
let fails = 0; function ok(c, m){ if(!c){ fails++; console.log('FAIL ' + m); } else console.log('PASS ' + m); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: DIR, stdio: 'ignore' });
  await sleep(700);
  const b = await chromium.launch();
  try {
    // 1) الأساسيات والملفات المساندة
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, userAgent: UA, locale: 'ar-SA' });
    const p = await ctx.newPage();
    const errs = [], bad = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('response', r => { const u = r.url(); if (u.startsWith(BASE) && r.status() >= 400) bad.push(r.status() + ' ' + u); });
    await p.goto(BASE); await p.waitForTimeout(500);
    const info = await p.evaluate(() => ({
      compat: document.compatMode, cs: document.characterSet, lang: document.documentElement.lang, title: document.title,
      iw: window.innerWidth, claude: typeof window.claude, na: CL.na, st: CL.st,
      vp: (document.querySelector('meta[name=viewport]') || {}).content,
      man: !!document.querySelector('link[rel=manifest]'), apple: !!document.querySelector('link[rel=apple-touch-icon]'),
      txt: document.body.innerText.slice(0, 80)
    }));
    ok(info.compat === 'CSS1Compat', 'وضع المعايير (doctype) ' + info.compat);
    ok(info.cs === 'UTF-8', 'الترميز ' + info.cs);
    ok(info.iw === 390, 'عرض الشاشة يطابق الجهاز ' + info.iw);
    ok(info.claude === 'undefined', 'لا يوجد window.claude');
    ok(info.na === true, 'علم الصفحة المستقلة CL.na');
    ok(info.title === 'لياقة أشواق', 'العنوان');
    ok(info.lang === 'ar', 'lang=ar');
    ok(info.man && info.apple, 'manifest و apple-touch-icon');
    ok(info.txt.length > 10, 'الصفحة الرئيسية تُرسم: ' + info.txt.replace(/\n/g, ' | '));
    for (const f of ['manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'icon.svg']) {
      const r = await ctx.request.get(BASE + f); ok(r.status() === 200, 'ملف ' + f + ' ' + r.status());
    }
    ok(errs.length === 0, 'لا أخطاء JS: ' + errs.join(';'));
    ok(bad.length === 0, 'لا طلبات فاشلة محليّة: ' + bad.join(';'));

    // 2) لا ذكر لـ Claude في أي شاشة
    const hits = [];
    const views = [['home', [null]], ['log', ['ov', 'pu', 'wk']], ['tools', [null]], ['ref', ['prog', 'evid', 'post', 'day', 'safe']]];
    for (const [v, segs] of views) for (const sg of segs) {
      const t = await p.evaluate(([v, sg]) => { UI.view = v; if (v === 'log') UI.ls = sg; if (v === 'ref') UI.rs = sg; render(); document.querySelectorAll('#main details').forEach(d => d.open = true); var m = document.getElementById('main'); return m.innerText + ' ' + m.innerHTML.replace(/<[^>]+>/g, ' '); }, [v, sg]);
      if (/claude|كلود|anthropic/i.test(t)) hits.push(v + '/' + sg);
    }
    // الإعدادات
    await p.evaluate(() => { UI.view = 'home'; render(); });
    await p.click('[data-act="settings"]'); await p.waitForTimeout(200);
    const sett = await p.evaluate(() => document.getElementById('shade').innerText);
    if (/claude|كلود|anthropic/i.test(sett)) hits.push('settings');
    ok(sett.indexOf('إضافة إلى الشاشة الرئيسية') >= 0, 'الإعدادات تشرح الحفظ المحلي والشاشة الرئيسية');
    ok(hits.length === 0, 'لا ذكر لـ Claude في أي شاشة: ' + hits.join(','));

    // 3) الحفظ والمظهر يبقيان بعد إعادة التحميل (localStorage)
    await p.click('[data-act="theme"][data-v="dark"]'); await p.waitForTimeout(100);
    await p.evaluate(() => { S.week = 4; S.chk['2026-10-27'] = { p: 70, s: 7, f: 0, u: 1 }; S.log.row = [{ w: 1, d: 1, kg: 3.5, feel: 'ok', ts: 1 }]; save(); });
    await p.reload(); await p.waitForTimeout(400);
    const after = await p.evaluate(() => ({ th: S.theme, wk: S.week, kg: S.log.row && S.log.row[0] && S.log.row[0].kg, pulse: S.chk['2026-10-27'] && S.chk['2026-10-27'].p, dt: document.documentElement.getAttribute('data-theme') }));
    ok(after.th === 'dark' && after.dt === 'dark', 'المظهر الداكن يبقى ' + JSON.stringify(after));
    ok(after.wk === 4 && after.kg === 3.5 && after.pulse === 70, 'التقدّم يبقى بعد إعادة التحميل');
    await ctx.close();

    // 4) لا تمرير أفقي على أحجام الجوال (فاتح وداكن)
    for (const W of [320, 375, 390, 430]) for (const dark of [false, true]) {
      const c2 = await b.newContext({ viewport: { width: W, height: 800 }, isMobile: true, hasTouch: true, userAgent: UA, locale: 'ar-SA', colorScheme: dark ? 'dark' : 'light' });
      const q = await c2.newPage(); const e2 = []; q.on('pageerror', e => e2.push(e.message));
      await q.goto(BASE); await q.waitForTimeout(250);
      await q.evaluate(() => { S.week = 3; save(); });
      const badv = [];
      for (const [v, segs] of views) for (const sg of segs) {
        await q.evaluate(([v, sg]) => { UI.view = v; if (v === 'log') UI.ls = sg; if (v === 'ref') UI.rs = sg; render(); document.querySelectorAll('#main details.acc').forEach(d => d.open = true); }, [v, sg]);
        await q.waitForTimeout(30);
        const r = await q.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
        if (r.sw > r.cw) badv.push(v + '/' + sg + ' ' + r.sw + '>' + r.cw);
      }
      ok(badv.length === 0 && e2.length === 0, 'W' + W + (dark ? ' dark' : '') + ' بلا تمرير أفقي ' + badv.join('|') + ' ' + e2.join(';'));
      await c2.close();
    }
  } finally { await b.close(); srv.kill(); }
  console.log(fails ? ('FAILS ' + fails) : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
