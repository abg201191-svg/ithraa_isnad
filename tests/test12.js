const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:1, locale:'ar', colorScheme:'dark' });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  // old-state migration: stored theme auto, no tv
  await p.addInitScript(() => { try{ if(!localStorage.getItem('__seeded')){ localStorage.setItem('ashwaq-fit-v1', JSON.stringify({week:2,done:{},log:{},walks:{},body:{},alt:{},gear:{},pos:{},pal:"rose",theme:"auto",sound:false})); localStorage.setItem('__seeded','1'); } }catch(e){} });
  await p.goto('file://' + process.cwd() + '/index.html'); await p.waitForTimeout(300);
  console.log('migrated theme', await p.evaluate(()=>S.theme+' tv'+S.tv+' week'+S.week), 'attr', await p.evaluate(()=>document.documentElement.getAttribute('data-theme')));
  
  // start play from day page
  await p.click('.dcard[data-d="1"]'); await p.evaluate(()=>goPlay(1,1)); console.log('view after hero start', await p.evaluate(()=>UI.view+' step '+stepsOf(UI.w,UI.d)[curPos(UI.w,UI.d)].t));
  // jump to last step via overview functions
  await p.evaluate(()=>{ for(let i=0;i<stepsOf(UI.w,UI.d).length;i++){ const s=stepsOf(UI.w,UI.d)[i]; if(s.t==='set') S.done[K(UI.w,UI.d,'s',s.i,s.r)]=1; } S.done[K(UI.w,UI.d,'f',0)]=1; setPos(UI.w,UI.d,stepsOf(UI.w,UI.d).length-1); save(); render(); });
  console.log('end step', await p.evaluate(()=>stepsOf(UI.w,UI.d)[curPos(UI.w,UI.d)].t));
  await p.click('[data-act="closeses"]'); await p.waitForTimeout(100);
  console.log('day view after close: open stages', await p.evaluate(()=>UI.view+' '+document.querySelectorAll('.stg.open').length));
  // toggle collapse/expand + tap stage 1
  await p.click('#stg-1 [data-act="stage"]'); console.log('open after tapping 1', await p.evaluate(()=>document.querySelector('.stg.open').id));
  await p.click('#stg-1 [data-act="stage"]'); console.log('open count after tapping same', await p.locator('.stg.open').count());
  await p.click('#stg-1 [data-act="stage"]');
  // tick warm-up chk
  await p.click('#stg-1 .it >> nth=0 >> [data-act="chk"]'); console.log('warm 1 done', await p.evaluate(()=>on(K(UI.w,UI.d,'w',0))), 'meta', (await p.locator('#stg-1 .stgm').textContent()));
  // content preserved: counts
  const counts = {};
  for (const n of [1,2,3,4]) { await p.evaluate(n=>{UI.stg[posKey(UI.w,UI.d)]=n; render();}, n); counts[n] = await p.evaluate(()=>document.querySelector('.stg.open .stgb').querySelectorAll('.it,.excard,.moves>div').length); }
  console.log('items per stage', JSON.stringify(counts));
  // next day button at stage 4
  await p.click('#stg-4 .btn.full:last-child'); console.log('moved to day', await p.evaluate(()=>UI.d));
  // all 4 days render all stages without error
  for (let d=1; d<=4; d++) for (let w of [1,4,8]) { await p.evaluate(([w,d])=>{ goDay(w,d); for(const n of [1,2,3,4]){UI.stg[posKey(w,d)]=n; render();} }, [w,d]); }
  console.log('hscroll', await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth));
  console.log('ERRORS', JSON.stringify(errs)); await b.close();
})();
