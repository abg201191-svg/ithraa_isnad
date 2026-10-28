const { chromium } = require('playwright');
const URL = 'file://' + process.cwd() + '/index.html';
const errs = [];
function ok(c, m){ console.log((c ? 'PASS ' : 'FAIL ') + m); if(!c) process.exitCode = 1; }
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, locale:'ar' });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  p.on('console', m => { if(m.type()==='error') errs.push('CONSOLE ' + m.text()); });
  await p.goto(URL); await p.waitForTimeout(300);

  // ---- nav + tabs
  ok(await p.locator('.nb').count() === 4, '4 nav buttons');
  for(const v of ['home','log','tools','ref']){ await p.click('.nb[data-v="'+v+'"]'); await p.waitForTimeout(80); ok(await p.locator('#main').innerText().then(t=>t.length>30), 'tab renders '+v); }

  // ---- quotes: 50 distinct, no repeats in 50 opens
  await p.evaluate(()=>localStorage.clear());
  const seen = []; let rep = 0, prev = null, gap = 99, lastAt = {};
  for(let i=0;i<100;i++){ await p.goto(URL); await p.waitForTimeout(30); const t = await p.locator('.qt').textContent(); seen.push(t); if(t===prev) rep++; prev=t; if(lastAt[t]!=null) gap=Math.min(gap,i-lastAt[t]); lastAt[t]=i; }
  ok(new Set(seen.slice(0,50)).size === 50 && rep === 0, 'quotes: '+new Set(seen.slice(0,50)).size+' distinct in first 50 opens, repeats '+rep+', min gap over 100 opens '+gap); ok(gap>=12, 'no quote returns within 12 opens');
  const nq = await p.evaluate(()=>QUOTES.length); ok(nq === 50 && new Set(await p.evaluate(()=>QUOTES)).size===50, 'QUOTES = 50 unique');
  // after 50 the 51st must differ from the 50th
  await p.goto(URL); const q101 = await p.locator('.qt').textContent(); ok(q101 !== seen[99], 'next != last');

  // ---- interpreter bands
  const bands = await p.evaluate(()=>[20,35,55,65,75,90,105,130,250].map(b=>b+':'+pulseBand(b).lv+':'+pulseBand(b).t));
  console.log(bands.join('\n'));
  ok(bands[0].includes('warn') && bands[1].includes('warn') && bands[2].includes('info') && bands[3].includes('ok') && bands[5].includes('ok') && bands[6].includes('info') && bands[7].includes('warn') && bands[8].includes('warn'), 'band levels as designed');

  // ---- pulse tab: live preview + save
  await p.click('.nb[data-v="log"]'); await p.click('[data-act="lseg"][data-v="pu"]');
  await p.fill('#pbpm','72'); await p.waitForTimeout(50);
  ok((await p.locator('#plive').innerText()).includes('وسط النطاق'), 'live preview for 72');
  await p.fill('#psleep','6'); ok((await p.locator('#pslnote').innerText()).includes('أقل قليلاً'), 'sleep note 6h');
  await p.click('[data-act="psave"]'); await p.waitForTimeout(100);
  const today = await p.evaluate(()=>dkey());
  ok(await p.evaluate(k=>S.chk[k] && S.chk[k].p===72 && S.chk[k].s===6, today), 'saved today reading');
  ok(await p.locator('.hrow').count() === 1, 'history row');
  // invalid value rejected
  await p.fill('#pbpm','12'); await p.click('[data-act="psave"]'); ok(await p.evaluate(k=>S.chk[k].p, today)===72, 'invalid not saved');
  // persist after reload
  await p.reload(); await p.waitForTimeout(100); ok(await p.evaluate(k=>!!(S.chk[k] && S.chk[k].p===72), today), 'persists after reload');

  // ---- trend with 16 readings
  await p.evaluate(()=>{ const t=new Date(); for(let i=1;i<=16;i++){ const d=new Date(t.getFullYear(),t.getMonth(),t.getDate()-i); S.chk[dkey(d)]={p:(i>8?76:70)+(i%3),u:Date.now()}; } S.chk[dkey(new Date(t.getFullYear(),t.getMonth(),t.getDate()-3))].f=1; save(); UI.view="log"; UI.ls="pu"; render(); });
  ok(await p.locator('.pchart').count()===1, 'chart renders');
  const tr = await p.evaluate(()=>JSON.stringify(pulseTrend())); console.log(tr);
  ok(await p.evaluate(()=>pulseTrend().diff!=null), 'trend diff computed with >=14');
  ok((await p.locator('#main').innerText()).includes('انخفض متوسطك'), 'trend text: decreased');
  await p.screenshot({path:'w1-pulse.png', fullPage:true});
  // delete + edit
  const n0 = await p.locator('.hrow').count();
  await p.click('.hrow [data-act="pedit"] >> nth=0'); ok(await p.inputValue('#pbpm') === '72', 'edit fills form');
  await p.click('.hrow [data-act="pdel"] >> nth=0'); await p.waitForTimeout(60); ok(await p.evaluate(k=>!S.chk[k], today), 'deleted');

  // ---- counter
  await p.evaluate(()=>{ UI.view="tools"; render(); });
  await p.click('[data-act="pcount"] >> nth=0'); await p.waitForTimeout(60);
  await p.click('#pcbtn'); await p.click('#pcbtn'); await p.click('#pcbtn');
  ok(await p.locator('#pcn').textContent()==='3', 'counter taps');
  await p.evaluate(()=>{ PC.taps=38; PC.t0=Date.now()-31000; pcPaint(); });
  await p.waitForTimeout(60); ok((await p.locator('#pcres').innerText()).includes('76'), 'counter result 76');
  await p.screenshot({path:'w1-counter.png'});
  await p.click('[data-act="puse"]'); await p.waitForTimeout(100);
  ok(await p.inputValue('#pbpm')==='76' && await p.evaluate(()=>UI.ls==='pu'&&UI.view==='log'), 'use result fills log input');
  await p.evaluate(()=>{ UI.view="tools"; render(); }); await p.click('[data-act="pcount"] >> nth=0'); await p.click('#pcbtn'); await p.evaluate(()=>{PC.taps=5;PC.t0=Date.now()-31000;pcPaint();}); ok((await p.locator('#pcres').innerText()).includes('قليل'), 'too few taps flagged'); await p.click('[data-act="closesheet"]');

  // ---- tools
  await p.fill('#age','28'); ok((await p.locator('#zout').innerText()).includes('188') && (await p.locator('#zout').innerText()).includes('تاناكا'), 'age 28 -> Tanaka 188');
  await p.fill('#age','45'); ok((await p.locator('#zout').innerText()).includes('166') && (await p.locator('#zout').innerText()).includes('غولاتي'), 'age 45 -> Gulati 166');
  await p.fill('#wt','60'); ok((await p.locator('#pout').innerText()).includes('48') && (await p.locator('#pout').innerText()).includes('96'), 'protein 60kg -> 48-96');
  await p.fill('#age','5'); ok((await p.locator('#zout').innerText()).includes('اكتبي عمرك'), 'invalid age message');
  await p.fill('#age','45'); ok(await p.evaluate(()=>S.age===45 && S.wt===60), 'age/weight stored');
  await p.screenshot({path:'w1-tools.png', fullPage:true});

  // ---- ref
  await p.click('.nb[data-v="ref"]');
  const segs = [];
  for(const s of ['prog','evid','post','day','safe']){ await p.click('[data-act="rseg"][data-v="'+s+'"]'); await p.waitForTimeout(40); segs.push(s+':'+await p.locator('#main details.acc').count()); await p.screenshot({path:'w1-ref-'+s+'.png', fullPage:true}); }
  console.log(segs.join(' '));
  await p.click('[data-act="rseg"][data-v="evid"]');
  ok(await p.locator('details.eva').count()===20, '20 evidence topics'); 
  const links = await p.evaluate(()=>[...document.querySelectorAll('details.eva a')].map(a=>a.href)); ok(links.length>=20 && links.every(h=>h.startsWith('https://')), links.length+' source links https');
  // all 12 original evidence ids still present
  ok(await p.evaluate(()=>["who","talk","acsm","lowload","circuit","neck","sh","kyph","hip","glute","lowimp","wall","core"].every(k=>EVGROUPS.some(g=>g[2].indexOf(k)>=0))), 'all original evidence kept (+core)');
  // nothing lost: original accordion titles exist across segments
  const titles = []; for(const s of ['prog','evid','post','day','safe']){ await p.click('[data-act="rseg"][data-v="'+s+'"]'); titles.push(...await p.evaluate(()=>[...document.querySelectorAll('#main details.acc:not(.eva) > summary')].map(e=>e.textContent.trim()))); }
  console.log(titles.join(' | '));
  for(const t of ['كيف تُبنى الجلسة','الجهد: ماذا تعني الأرقام؟','حركات الاستقامة للرقبة والكتفين','حركات الورك والتمدد','المعدات','السلامة ومتى تتوقفين','أسئلة شائعة']) ok(titles.some(x=>x.includes(t)), 'kept: '+t);

  // ---- weekly tab keeps wall/note
  await p.click('.nb[data-v="log"]'); await p.click('[data-act="lseg"][data-v="wk"]'); ok(await p.locator('[data-act="wall"]').count()===3 && await p.locator('#bnote').count()===1, 'weekly wall+note kept');
  await p.click('[data-act="wall"][data-i="1"]'); ok(await p.evaluate(()=>S.body[S.week].wall[1]===1), 'wall toggles');
  await p.click('[data-act="lseg"][data-v="ov"]'); await p.screenshot({path:'w1-log-ov.png', fullPage:true});
  ok(await p.locator('.ring').count()===1 && await p.locator('.stats .l').count()===3, 'overview ring+stats');

  // ---- no horizontal scroll at 390 & 320 on all views
  for(const w of [390,320]){ await p.setViewportSize({width:w,height:760});
    for(const [v,ls,rs] of [['home'],['log','ov'],['log','pu'],['log','wk'],['tools'],['ref',null,'prog'],['ref',null,'evid'],['ref',null,'day'],['ref',null,'safe'],['ref',null,'post']]){
      await p.evaluate(([v,ls,rs])=>{UI.view=v; if(ls)UI.ls=ls; if(rs)UI.rs=rs; render();},[v,ls,rs]);
      const o = await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
      if(o){ ok(false,'hscroll '+w+' '+v+' '+ls+' '+rs); const bad = await p.evaluate(()=>[...document.querySelectorAll('#main *')].filter(e=>e.getBoundingClientRect().right>window.innerWidth+1||e.getBoundingClientRect().left<-1).slice(0,5).map(e=>e.tagName+'.'+e.className)); console.log(bad); }
    } }
  ok(true, 'hscroll sweep done');
  console.log('ERRORS', JSON.stringify(errs)); await b.close();
})();
