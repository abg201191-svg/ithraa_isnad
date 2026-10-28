const { chromium } = require('playwright');
const URL = 'file://' + process.cwd() + '/index.html';
let fails=0; function ok(c,m){ if(!c){ fails++; console.log('FAIL '+m);} else console.log('PASS '+m); }
(async()=>{
  const b = await chromium.launch();
  for(const W of [320,360,390,430]){
    for(const dark of [false,true]){
      const ctx = await b.newContext({ viewport:{width:W,height:800}, locale:'ar', colorScheme: dark?'dark':'light' }); const p = await ctx.newPage();
      const errs=[]; p.on('pageerror',e=>errs.push(e.message));
      await p.goto(URL); await p.waitForTimeout(150);
      await p.evaluate(()=>{ S.week=3; const vals=[74,73,75,72,71,72,70,71,69,70,68,69,68,67]; vals.forEach((v,i)=>{ const dt=new Date(Date.now()-(vals.length-1-i)*86400000); const k=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0'); S.chk[k]={p:v,s:7,f:0,u:i}; }); S.log.row=[{w:1,d:1,kg:3,feel:'ok',ts:1},{w:2,d:1,kg:4,feel:'ok',ts:2}]; S.log.hipthrust=[{w:1,d:4,kg:10.5,feel:'ok',ts:3}]; save(); });
      const views=[['log',['ov','pu','wk']],['tools',[null]],['ref',['prog','evid','post','day','safe']]];
      let bad=[];
      for(const [v,segs] of views){
        for(const sg of segs){
          await p.evaluate(([v,sg])=>{ UI.view=v; if(v==='log') UI.ls=sg; if(v==='ref') UI.rs=sg; render(); document.querySelectorAll('#main details.acc').forEach(d=>d.open=true); }, [v,sg]);
          await p.waitForTimeout(40);
          const r = await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth, over:[...document.querySelectorAll('#main *')].filter(e=>{const r=e.getBoundingClientRect(); return r.width>0 && (r.right>document.documentElement.clientWidth+1 || r.left<-1) && !e.closest('.tbw') && !e.closest('svg');}).slice(0,3).map(e=>e.tagName+'.'+e.className)}));
          if(r.sw>r.cw || r.over.length) bad.push(`${v}/${sg} sw=${r.sw} cw=${r.cw} ${r.over.join(',')}`);
        }
      }
      ok(bad.length===0 && errs.length===0, `W${W}${dark?' dark':''} no overflow ${bad.join(' | ')} ${errs.join(';')}`);
      await ctx.close();
    }
  }
  await b.close(); console.log(fails?('FAILS '+fails):'ALL OK');
})();
