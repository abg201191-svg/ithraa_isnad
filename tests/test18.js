const { chromium } = require('playwright');
const URL = 'file://' + process.cwd() + '/index.html';
let fails = 0; function ok(c, m){ console.log((c?'PASS ':'FAIL ')+m); if(!c){ fails++; process.exitCode=1; } }
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ locale:'ar' }); const p = await ctx.newPage();
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  await p.goto(URL);
  const old = {week:2, done:{
    "2.1.s.1.0":1, "2.1.s.1.1":1,          // D1 old idx1 = fpress
    "2.1.s.0.0":1,                          // row stays 0
    "2.4.s.3.0":1,                          // D4 old idx3 = hipthrust
    "2.4.s.4.0":1,                          // D4 old idx4 = abd
    "2.1.w.1":1, "2.3.w.2":1, "2.1.w.5":1,  // up WU: catcow(1)->3, chin(2)->1, mar(5)->5
    "2.2.c.0":1, "2.4.c.2":1, "2.2.c.4":1,  // low CD: hipflex(0)->1, ham(2)->0, pelv(4)->3
    "2.2.s.2.0":1,                          // D2 unchanged
    "2.1.f.0":1, "2.1.c.1":1                // finisher unchanged; up CD unchanged
  }, log:{}, walks:{}, body:{}, alt:{}, gear:{}, pos:{"2.1":5,"2.2":3,"2.4":7}, chk:{}, pal:"rose", theme:"light", sound:true, tv:2};
  await p.evaluate(o=>localStorage.setItem('ashwaq-fit-v1', JSON.stringify(o)), old);
  await p.goto(URL); await p.waitForTimeout(200);
  const st = await p.evaluate(()=>({done:Object.keys(S.done).sort(), ord:S.ord, pos:S.pos}));
  const want = ["2.1.s.4.0","2.1.s.4.1","2.1.s.0.0","2.4.s.4.0","2.4.s.3.0","2.1.w.3","2.3.w.1","2.1.w.5","2.2.c.1","2.4.c.0","2.2.c.3","2.2.s.2.0","2.1.f.0","2.1.c.1"].sort();
  ok(JSON.stringify(st.done)===JSON.stringify(want), 'ticks moved to new positions\n   got  '+st.done.join(',')+'\n   want '+want.join(','));
  ok(st.ord===2, 'ord flag set');
  ok(!('2.1' in st.pos) && !('2.4' in st.pos) && st.pos['2.2']===3, 'resume positions cleared only for reordered days');
  // idempotent across reload (state saved after a change)
  await p.evaluate(()=>{ S.week=2; save(); }); await p.goto(URL); await p.waitForTimeout(150);
  const again = await p.evaluate(()=>Object.keys(S.done).sort());
  ok(JSON.stringify(again)===JSON.stringify(want), 'reload does not remap again');
  // exercises display ticks on the right cards
  await p.evaluate(()=>{ S.week=2; goDay(2,1); }); await p.click('#stg-2 [data-act="stage"]'); await p.waitForTimeout(60);
  const tick = await p.locator('#stg-2 .excard').evaluateAll(a=>a.map(e=>[e.querySelector('.exm .ar').textContent, e.querySelectorAll('.sb.on').length]));
  ok(JSON.stringify(tick.find(t=>t[0].includes('ضغط الصدر'))) === JSON.stringify(['ضغط الصدر على الأرض',2]), 'floor press shows its 2 ticks '+JSON.stringify(tick.map(t=>t[1])));
  // cloud copy without ord gets migrated before merge
  const r = await p.evaluate(()=>{ const c = migrateOrd({done:{"3.4.s.3.0":1}, pos:{}, ts:5}); return Object.keys(c.done).join(',')+'|'+c.ord; });
  ok(r==='3.4.s.4.0|2', 'migrateOrd on a cloud-shaped object -> '+r);
  const r2 = await p.evaluate(()=>{ const c = migrateOrd({done:{"3.4.s.3.0":1}, ord:2}); return Object.keys(c.done).join(','); });
  ok(r2==='3.4.s.3.0', 'already-migrated object untouched');
  // fresh user
  await p.evaluate(()=>localStorage.clear()); await p.goto(URL); await p.waitForTimeout(100);
  ok(await p.evaluate(()=>S.ord===2 && Object.keys(S.done).length===0), 'fresh state fine');
  ok(errs.length===0, 'no page errors '+errs.join(';'));
  await b.close(); console.log(fails?'FAILS '+fails:'ALL OK');
})();
