const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs=[];
  const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, locale:'ar' });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  p.on('console', m => { if (m.type()==='error' && !/ERR_TUNNEL|fonts\.g/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + process.cwd() + '/index.html'); await p.waitForTimeout(300);
  console.log('max', await p.evaluate(()=>{let m=0;for(let w=1;w<=8;w++)for(let d=1;d<=4;d++)m=Math.max(m,totalMin(w,d));return m;}));
  // no weekday words in UI
  await p.click('.dcard[data-d="1"]');
  const SG = async n => { await p.evaluate(n=>{ UI.stg[posKey(UI.w,UI.d)]=n; render(); }, n); };
  console.log('open stages on enter', await p.locator('.stg.open').count()); await p.click('#stg-1 [data-act="stage"]');
  await p.click('.stg.open [data-act="stagego"][data-n="2"]'); console.log('after next', await p.evaluate(()=>document.querySelector('.stg.open').id));
  const txt = await p.evaluate(()=>document.body.innerText);
  console.log('weekday words on day page:', /السبت|الاثنين|الأحد|الثلاثاء|الأربعاء|الخميس|الجمعة/.test(txt));
  // open card 1, set weight 1kg, tick both rounds
  await p.click('.excard .exh >> nth=0');
  await p.click('.excard.open [data-act="kg"][data-s="0.5"]'); await p.click('.excard.open [data-act="kg"][data-s="0.5"]');
  await p.click('.excard >> nth=0 >> .sb >> nth=0'); await p.evaluate(()=>tmStop());
  await p.click('.excard >> nth=0 >> .sb >> nth=1'); await p.evaluate(()=>tmStop());
  console.log('row kg', await p.evaluate(()=>entryOf("row",1,1).kg), 'done', await p.evaluate(()=>on(K(1,1,"s",0,0))+","+on(K(1,1,"s",0,1))));
  // feel
  await p.click('.excard.open [data-act="feel"][data-v="easy"]'); console.log('feel', await p.evaluate(()=>entryOf("row",1,1).feel));
  // complete the rest of sets by evaluating
  await p.evaluate(()=>{ for(let i=1;i<6;i++) for(let r=0;r<2;r++) S.done[K(1,1,"s",i,r)]=1; save(); render(); });
  // finisher manual
  await SG(3);
  await p.click('[data-act="finmark"]'); console.log('fin', await p.evaluate(()=>on(K(1,1,"f",0))), 'dayDone', await p.evaluate(()=>dayDone(1,1)));
  // finisher timer big
  await p.click('[data-act="finmark"]'); await p.click('[data-act="finstart"]'); await p.waitForTimeout(150);
  console.log('big', await p.evaluate(()=>document.querySelector('#tm').className));
  await p.evaluate(()=>{ TM.segs = TM.segs.slice(0,1); TM.end = Date.now()+50; }); await p.waitForTimeout(600);
  console.log('fin done via timer', await p.evaluate(()=>on(K(1,1,"f",0))), 'view', await p.evaluate(()=>UI.view));
  // day 3: weight carry from day 1 for row, hint suggests +0.5
  await p.evaluate(()=>goDay(1,3)); await SG(2);
  await p.click('.excard .exh >> nth=0');
  console.log('d3 row kg', await p.inputValue('.excard.open .kgb input'), '|', (await p.locator('.excard.open .hint').textContent()).slice(0,90));
  // pull band alt
  await p.evaluate(()=>{ UI.open["1.3.2"]=true; render(); });
  await p.click('.excard >> nth=2 >> [data-act="alt"]'); console.log('alt active', await p.evaluate(()=>!!S.alt.pull), await p.locator('.excard .exm .ar >> nth=2').textContent());
  await p.screenshot({path:'v5-d3.png'});
  // play from day 3
  await p.evaluate(()=>goPlay(1,3)); console.log('play type', await p.evaluate(()=>stepsOf(1,3)[curPos(1,3)].t));
  await p.screenshot({path:'v5-play.png'});
  // posture pips
  console.log('ERRORS', JSON.stringify(errs)); await b.close();
})();
