const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, locale:'ar' });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto('file://' + process.cwd() + '/index.html'); await p.waitForTimeout(250);
  const seen=[]; let repeats=0, prev=null;
  for(let i=0;i<30;i++){ await p.reload(); await p.waitForTimeout(60); const t=await p.locator('.qt').textContent(); seen.push(t); if(t===prev) repeats++; prev=t; }
  console.log('distinct quotes in 30 opens', new Set(seen).size, 'consecutive repeats', repeats, 'quote shown above weeks', await p.evaluate(()=>{const q=document.querySelector('.qt').getBoundingClientRect().top, w=document.querySelector('.wk').getBoundingClientRect().top; return q<w;}));
  console.log('sections after days:', await p.evaluate(()=>[...document.querySelectorAll('#main .cap')].map(e=>e.textContent)));
  console.log('details/acc on home', await p.locator('#main details.acc').count(), 'walk pills', await p.locator('[data-act="walk"]').count());
  await p.screenshot({path:'v9-home.png'}); await p.screenshot({path:'v9-home-full.png',fullPage:true});
  await p.click('.nb[data-v="log"]'); console.log('log stats', await p.evaluate(()=>[...document.querySelectorAll('.stats .l')].map(e=>e.textContent)));
  // week complete state still shows next-week card
  await p.evaluate(()=>{ for(let d=1;d<=4;d++){ const W=wkd(1); DAYS[d-1].ex.forEach((id,i)=>{for(let r=0;r<W.rounds;r++) S.done[K(1,d,"s",i,r)]=1;}); S.done[K(1,d,"f",0)]=1;} save(); goView("home"); });
  console.log('next week btn', await p.locator('[data-act="nextwk"]').count());
  await p.setViewportSize({width:320,height:700}); console.log('hscroll320', await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth));
  console.log('ERRORS', JSON.stringify(errs)); await b.close();
})();
