const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, locale:'ar' });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto('file://' + process.cwd() + '/index.html'); await p.waitForTimeout(300);
  const r = await p.evaluate(()=>{
    const items=[]; const add=(n,o)=>{ if(o) items.push([n,o]); };
    Object.keys(EX).forEach(id=>{ add('EX.'+id,EX[id]); add('ALT.'+id,EX[id].alt); });
    Object.keys(FINMV).forEach(id=>add('FIN.'+id,FINMV[id]));
    ['up','low'].forEach(k=>{ WU[k].forEach((x,i)=>add('WU.'+k+i,x)); CD[k].forEach((x,i)=>add('CD.'+k+i,x)); });
    const bad=[]; let vids=0;
    items.forEach(([n,o])=>{
      const h=vbar(o); const hrefs=[...h.matchAll(/href="([^"]+)"/g)].map(m=>decodeURIComponent(m[1]));
      const yts=hrefs.filter(u=>u.includes('results?search_query='));
      if(yts.length!==2) bad.push(n+' links '+yts.length);
      const q=yts.map(u=>u.split('search_query=')[1]);
      if(!/للنساء/.test(q[0])) bad.push(n+' ar no women: '+q[0]);
      if(!/ for women$/.test(q[1])) bad.push(n+' en no women: '+q[1]);
      if(/undefined/.test(h)) bad.push(n+' undefined');
      if(o.vid){ vids++; if(!/^[A-Za-z0-9_-]{11}$/.test(o.vid)) bad.push(n+' bad vid'); }
    });
    return {n:items.length,vids,bad, sample:[vbar(EX.squat), vbar(EX.hammer.alt)]};
  });
  console.log(JSON.stringify(r,null,1));
  // visual: day 1, open card 1 (row) at 390 and 320, dark
  await p.click('.dcard[data-d="1"]'); await p.click('#stg-2 [data-act="stage"]'); await p.click('.excard .exh >> nth=0');
  console.log('vbtn in open card', await p.locator('.excard.open .vbtn').count(), 'hi', await p.locator('.excard.open .vbtn.hi').count());
  await p.locator('.excard.open').screenshot({path:'v6-card.png'});
  await p.setViewportSize({width:320,height:700}); await p.waitForTimeout(150);
  await p.locator('.excard.open').screenshot({path:'v6-card-320.png'});
  console.log('hscroll320', await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth));
  await p.emulateMedia({colorScheme:'dark'}); await p.waitForTimeout(150);
  await p.locator('.excard.open').screenshot({path:'v6-card-dark.png'});
  // ref FAQ
  await p.setViewportSize({width:390,height:844});
  console.log('ERRORS', JSON.stringify(errs)); await b.close();
})();
