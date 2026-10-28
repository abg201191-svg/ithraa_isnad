const { chromium } = require('playwright');
const URL = 'file://' + process.cwd() + '/index.html';
function ok(c, m){ console.log((c ? 'PASS ' : 'FAIL ') + m); if(!c) process.exitCode = 1; }
const store = {}; let failSet = null; let sets = 0;
async function mk(b, mode){
  const ctx = await b.newContext({ viewport:{width:390,height:844}, locale:'ar' });
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message)); p.errs = errs;
  await p.exposeFunction('__get', path => store[path] ? JSON.parse(JSON.stringify(store[path])) : null);
  await p.exposeFunction('__set', path => { if(failSet) { const e = failSet; return {err:e}; } return null; });
  await p.exposeFunction('__put', (path, data) => { if(failSet) return {err:failSet}; store[path] = JSON.parse(JSON.stringify(data)); sets++; return null; });
  await p.addInitScript((mode) => {
    if(mode === 'none') return;
    window.claude = { use: async (n) => {
      if(mode === 'nodb' && n === 'db') return null;
      if(n === 'user') return { id: async () => 'u_test', isOwner: async()=>false };
      if(n === 'db') return { doc: (path) => ({ path,
        get: async () => { const d = await window.__get(path); return { exists: !!d, data: () => d || undefined }; },
        set: async (data) => { const r = await window.__put(path, data); if(r && r.err) throw r.err; } }) };
      return null; } };
  }, mode);
  return p;
}
(async () => {
  const b = await chromium.launch();
  const PATH = 'data/users/u_test/progress';
  // A: fresh, cloud works
  const A = await mk(b, 'ok'); await A.goto(URL); await A.waitForTimeout(500);
  ok(await A.evaluate(()=>CL.st)==='ok', 'A: status ok on empty cloud');
  ok(!store[PATH], 'A: nothing written for empty progress');
  await A.evaluate(()=>{ S.done[K(1,1,"w",0)]=1; S.chk["2026-10-20"]={p:70,u:Date.now()}; save(); });
  ok(await A.evaluate(()=>CL.st)==='wait', 'A: status wait right after change');
  await A.waitForTimeout(2600);
  ok(await A.evaluate(()=>CL.st)==='ok' && !!store[PATH], 'A: pushed after debounce');
  const doc = store[PATH]; ok(doc.v===1 && typeof doc.ts==='number' && JSON.parse(doc.json).chk["2026-10-20"].p===70 && !('qbag' in JSON.parse(doc.json)), 'doc shape ok, no volatile fields');
  ok(await A.evaluate(()=>S.synced===S.ts), 'A: synced==ts');
  const n1 = sets;
  // no rewrite for no-op / quote-only saves
  await A.evaluate(()=>{ save(); save(); pickQuote(); }); await A.waitForTimeout(2300);
  ok(sets===n1, 'no cloud write for unchanged state / quote change');
  // rapid edits coalesce
  await A.evaluate(()=>{ for(let i=0;i<10;i++){ S.chk["2026-10-"+(10+i)]={p:60+i,u:Date.now()}; save(); } }); await A.waitForTimeout(2600);
  ok(sets===n1+1, '10 rapid edits -> 1 write ('+(sets-n1)+')');
  await A.evaluate(()=>{UI.view='log';UI.ls='ov';render();}); ok((await A.locator('[data-sync]').first().innerText()).includes('محفوظ في حسابك'), 'A: label says cloud saved');

  // B: new device, adopts
  const B = await mk(b, 'ok'); await B.goto(URL); await B.waitForTimeout(600);
  ok(await B.evaluate(()=>Object.keys(S.chk).length)===11 && await B.evaluate(()=>!!S.done[K(1,1,"w",0)]), 'B: adopted cloud data on fresh device');
  ok(await B.evaluate(()=>CL.st)==='ok', 'B: status ok');
  // B edits -> pushes
  await B.evaluate(()=>{ S.chk["2026-10-25"]={p:66,u:Date.now()}; save(); }); await B.waitForTimeout(2600);

  // C: conflict. Offline local change then cloud also changed.
  const C0 = await mk(b, 'none'); await C0.goto(URL); await C0.waitForTimeout(200);
  // seed C's local with A's older synced state: emulate by copying cloud json at earlier point -> simpler: fresh local progress without ever syncing (legacy v8 data)
  await C0.evaluate(()=>{ S.done[K(2,1,"w",0)]=1; S.chk["2026-10-01"]={p:80,u:Date.now()}; save(); });
  const ls = await C0.evaluate(()=>localStorage.getItem(STORE_KEY)); await C0.context().close();
  const C = await mk(b, 'ok'); await C.addInitScript((ls)=>{ if(!localStorage.getItem('ashwaq-fit-v1')) localStorage.setItem('ashwaq-fit-v1', ls); }, ls);
  await C.goto(URL); await C.waitForTimeout(900);
  const merged = await C.evaluate(()=>({d2:!!S.done[K(2,1,"w",0)], d1:!!S.done[K(1,1,"w",0)], c1:!!S.chk["2026-10-01"], c25:!!S.chk["2026-10-25"], st:CL.st}));
  console.log(JSON.stringify(merged));
  ok(merged.d2 && merged.d1 && merged.c1 && merged.c25, 'C: legacy local + cloud merged without loss');
  await C.waitForTimeout(2600);
  const cd = JSON.parse(store[PATH].json); ok(!!cd.chk["2026-10-01"] && !!cd.chk["2026-10-25"], 'C: merged state pushed back');
  ok(await C.evaluate(()=>localStorage.getItem(STORE_KEY+"-prev")!==null), 'C: previous local copy kept as safety net');

  // D: local unchanged since last sync, cloud newer -> adopt (no merge)
  const D = await mk(b, 'ok'); await D.goto(URL); await D.waitForTimeout(700);
  const ts1 = await D.evaluate(()=>S.ts); 
  await C.evaluate(()=>{ S.chk["2026-10-26"]={p:64,u:Date.now()}; save(); }); await C.waitForTimeout(2600);
  await D.evaluate(()=>{ CL.lastPull=0; }); await D.evaluate(()=>cloudPull()); await D.waitForTimeout(500);
  ok(await D.evaluate(()=>!!S.chk["2026-10-26"] && S.ts>"x".length), 'D: pull picks up newer cloud');

  // E: view-only -> ro
  failSet = {code:'invalid_argument', message:'x'};
  const E = await mk(b, 'ok'); await E.goto(URL); await E.waitForTimeout(500);
  await E.evaluate(()=>{ S.done[K(1,1,"w",1)]=1; save(); }); await E.waitForTimeout(2600);
  // E adopted cloud? (get works) then write rejects
  ok(await E.evaluate(()=>CL.st)==='ro', 'E: read-only -> ro');
  await E.evaluate(()=>{UI.view='log';UI.ls='ov';render();}); ok((await E.locator('[data-sync]').first().innerText()).includes('مشارِك'), 'E: label mentions Contributor');
  ok(await E.evaluate(()=>!!S.done[K(1,1,"w",1)]), 'E: local save still works');
  failSet = null;

  // F: db unavailable -> local only
  const F = await mk(b, 'nodb'); await F.goto(URL); await F.waitForTimeout(400);
  ok(await F.evaluate(()=>CL.st)==='local', 'F: db null -> local'); 
  await F.evaluate(()=>{UI.view='log';UI.ls='ov';render();}); ok((await F.locator('[data-sync]').first().innerText()).includes('هذا الجهاز'), 'F: label local');
  // G: no window.claude at all
  const G = await mk(b, 'none'); await G.goto(URL); await G.waitForTimeout(300);
  ok(await G.evaluate(()=>CL.st)==='local' && G.errs.length===0, 'G: no claude -> local, no errors');
  // wipe pushes empty state
  await A.evaluate(()=>{ UI.wipe=true; }); await A.evaluate(()=>{ document.querySelector('body').insertAdjacentHTML('beforeend','<button id="zz" data-act="wipe"></button>'); }); await A.click('#zz'); await A.waitForTimeout(2600);
  ok(Object.keys(JSON.parse(store[PATH].json).chk).length===0, 'A: wipe pushed empty state');
  for (const p of [A,B,C,D,E,F,G]) if(p.errs.length) console.log('ERR', p.errs);
  await b.close();
})();
