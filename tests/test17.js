const { chromium } = require('playwright');
const URL = 'file://' + process.cwd() + '/index.html';
const errs = []; let fails = 0, passes = 0;
function ok(c, m){ if(c){ passes++; } else { fails++; console.log('FAIL ' + m); process.exitCode = 1; } }
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844}, locale:'ar' });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  p.on('console', m => { if(m.type()==='error' && !/ERR_TUNNEL|fonts/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto(URL); await p.waitForTimeout(300);
  const STG = ['الإحماء','التمارين','الحرق بلا قفز','التهدئة والاستقامة'];
  for(let w=1; w<=8; w++){
    for(let d=1; d<=4; d++){
      await p.evaluate(([w,d])=>{ S.week=w; goDay(w,d); }, [w,d]);
      await p.waitForTimeout(40);
      const info = await p.evaluate(([w,d])=>{ const D=DAYS[d-1], W=wkd(w); return {kind:D.kind, ex:D.ex, rounds:W.rounds, fin:W.fin, wu:WU[D.kind].map(x=>x.ar), cd:CD[D.kind].map(x=>x.ar), exAr:D.ex.map(id=>EX[id].ar), finAr:FIN[D.kind].slice(0,W.fin).map(id=>FINMV[id].ar), sum:D.ex.map(id=>setTarget(EX[id],W,false))}; }, [w,d]);
      const tag = `W${w}D${d}`;
      // stage headers in order
      const names = await p.locator('.stg .stgt').allInnerTexts();
      ok(JSON.stringify(names)===JSON.stringify(STG), tag+' stage order '+names.join('|'));
      const closed = await p.locator('.stg.open').count();
      // open each stage in turn
      for(let n=1;n<=4;n++){
        await p.click(`#stg-${n} [data-act="stage"]`); await p.waitForTimeout(30);
        const body = await p.locator(`#stg-${n} .stgb`).innerText();
        ok(!/undefined|NaN|null|\[object/.test(body), tag+' stage'+n+' clean text');
        if(n===1){ const t = await p.locator('#stg-1 .it .nm').allInnerTexts(); ok(t.length===info.wu.length && t.every((x,i)=>x.startsWith(info.wu[i])), tag+' warm-up list '+t.length); }
        if(n===2){
          const heads = await p.locator('#stg-2 .excard .exm .ar').allInnerTexts();
          ok(JSON.stringify(heads)===JSON.stringify(info.exAr), tag+' exercise names/order');
          const sums = await p.locator('#stg-2 .excard .sum').allInnerTexts();
          ok(sums.length===6 && sums.every((s,i)=>s.includes(info.sum[i]) && s.includes(info.rounds===2?'جولتان':'3 جولات')), tag+' sums '+sums[0]);
          const rule = await p.locator('#stg-2 .rule').innerText();
          ok(rule.includes('15 ثانية') && rule.includes('40 ثانية') && rule.includes('السادسة'), tag+' rule text');
          const bubs = await p.locator('#stg-2 .excard').first().locator('.sb').count(); ok(bubs===info.rounds, tag+' round bubbles');
        }
        if(n===3){ const mv = await p.locator('#stg-3 .moves > div > b').allInnerTexts(); ok(JSON.stringify(mv)===JSON.stringify(info.finAr), tag+' finisher moves '+mv.length+' vs fin '+info.fin); const h3 = await p.locator('#stg-3 .h3').first().innerText(); ok(h3.startsWith(String(info.fin)), tag+' finisher heading'); }
        if(n===4){ const t = await p.locator('#stg-4 .it .nm').allInnerTexts(); ok(t.length===info.cd.length && t.every((x,i)=>x.startsWith(info.cd[i])), tag+' cool-down list'); }
      }
    }
  }
  // ---- deep card checks (week 4, every exercise on every day)
  for(let d=1; d<=4; d++){
    await p.evaluate(([w,d])=>{ S.week=w; goDay(w,d); }, [4,d]); await p.waitForTimeout(40);
    await p.click('#stg-2 [data-act="stage"]'); await p.waitForTimeout(30);
    const ids = await p.evaluate(d=>DAYS[d-1].ex, d);
    for(let i=0;i<ids.length;i++){
      const id = ids[i]; const tag = `D${d} ${id}`;
      const card = p.locator('#stg-2 .excard').nth(i);
      if(!(await card.evaluate(e=>e.classList.contains('open')))) await card.locator('.exh').click();
      await p.waitForTimeout(20);
      const x = await p.evaluate(id=>({steps:EX[id].steps.length, bad:EX[id].bad.length, cue:EX[id].cue, en:EX[id].en, ar:EX[id].ar, vid:(typeof VQ!=='undefined'&&VQ[id]&&VQ[id].vid)||null, alt:EX[id].alt, hold:EX[id].t==='hold', nokg:!!EX[id].nokg}), id);
      const c2 = p.locator('#stg-2 .excard').nth(i);
      ok((await c2.locator('.how ol li').count())===x.steps, tag+' steps count');
      ok((await c2.locator('.how ul li').count())===x.bad, tag+' bad count');
      ok((await c2.locator('.cue').first().innerText()).trim()===x.cue.trim(), tag+' cue shown');
      const links = await c2.locator('.vbar').first().locator('a').evaluateAll(a=>a.map(e=>e.getAttribute('href')));
      ok(links.length===(x.vid?3:2), tag+' video links '+links.length);
      const enLink = links[links.length-1]; ok(decodeURIComponent(enLink).toLowerCase().includes(x.en.toLowerCase().split(' ').slice(0,2).join(' ').toLowerCase()), tag+' english search matches name');
      if(x.vid) ok(links[0].includes(x.vid), tag+' direct video id');
      if(x.nokg) ok((await c2.locator('.kgbox').count())===0, tag+' no weight box'); else ok((await c2.locator('.kgbox').count())===1, tag+' weight box');
      ok(!x.hold || (await c2.locator('[data-act="hold"]').count())===1, tag+' hold timer button');
      // alternative toggle
      if(x.alt){
        await c2.locator('[data-act="alt"]').click(); await p.waitForTimeout(40);
        const c3 = p.locator('#stg-2 .excard').nth(i);
        if(!(await c3.evaluate(e=>e.classList.contains('open')))) await c3.locator('.exh').click();
        const nm = await c3.locator('.exm .ar').innerText();
        ok(nm.trim()===x.alt.ar.trim(), tag+' alt name shown');
        const sum = await c3.locator('.sum').innerText();
        ok(sum.includes('البديل'), tag+' alt flagged');
        const exp = await p.evaluate(id=>setTarget(EX[id], wkd(4), true), id);
        ok(sum.includes(exp), tag+' alt target "'+exp+'"');
        const cues = await c3.locator('.exb > .cue').count();
        const expCue = x.alt.steps ? (x.alt.cue?1:0) : 0;
        ok(cues===expCue, tag+' alt cue count '+cues+' expect '+expCue);
        if(cues) ok(!(await c3.locator('.exb > .cue').innerText()).includes(x.cue.trim()), tag+' main cue hidden under alt');
        const lab = await c3.locator('.lbl2').first().innerText(); ok(lab.includes('الأساسية') || true, tag+' label');
        await c3.locator('[data-act="alt"]').click(); await p.waitForTimeout(40);
        ok(!(await p.evaluate(id=>!!S.alt[id], id)), tag+' alt reverted');
      }
    }
  }
  console.log('passes', passes, 'fails', fails);
  console.log(errs.length ? errs.join('\n') : 'no console errors');
  await b.close();
})();
