const A=require('./audit_load.js');
const {EX,DAYS,WU,CD,FIN,FINMV,WEEKS,EVID,VQ,VA,MUS,AREAS}=A;
let bad=0; const P=(m)=>{console.log(m);}; const F=(m)=>{bad++;console.log('PROBLEM:',m);};
// 1 ids
const exIds=Object.keys(EX);
DAYS.forEach(D=>{D.ex.forEach(id=>{if(!EX[id])F('day '+D.n+' unknown ex '+id);});
  if(new Set(D.ex).size!==D.ex.length)F('dup ex in day '+D.n);
  Object.keys(D.post).forEach(a=>{if(!AREAS[a])F('post area '+a);D.post[a].forEach(k=>{const [p,id]=k.split(':');
    if(p==='x'){if(D.ex.indexOf(id)<0)F('post '+k+' not in day '+D.n);}
    else if(p==='c'){if(!CD[D.kind].some(c=>c.id===id))F('post '+k+' not in CD '+D.kind);}
    else F('post prefix '+k);});});});
exIds.forEach(id=>{ if(!DAYS.some(D=>D.ex.indexOf(id)>=0))F('ex unused '+id); });
// 2 per-ex completeness
exIds.forEach(id=>{const x=EX[id];
  ['ar','en','cue','steps','bad','m','t'].forEach(f=>{if(x[f]==null)F(id+' missing '+f);});
  if(x.steps&&x.steps.length<3)F(id+' few steps');
  if(!x.bad||x.bad.length<2)F(id+' few bad');
  if(x.evk&&!EVID[x.evk])F(id+' evk missing '+x.evk);
  if(!['reps','hold','alt','fixed'].includes(x.t))F(id+' t '+x.t);
  if(x.t==='fixed'&&(!x.fix||!x.fixN))F(id+' fixed no fix/fixN');
  if(x.area&&!AREAS[x.area])F(id+' area '+x.area);
  Object.keys(x.m).forEach(mm=>{if(!MUS.some(q=>q.id===mm))F(id+' muscle '+mm);});
  if(!x.alt)F(id+' no alt'); else {['ar','en','why'].forEach(f=>{if(!x.alt[f])F(id+' alt missing '+f);}); if(!x.alt.cue&&!x.alt.steps)F(id+' alt no cue/steps'); if(!x.alt.qa&&!VA[id])P('note: '+id+' alt no qa');}
  if(!VQ[id])F(id+' no VQ');
  if(x.like&&!EX[x.like])F(id+' like unknown');
  if(x.band&&!x.nokg)F(id+' band but kg shown');
  if(x.nokg&&x.kg)F(id+' nokg but kg text');
  if(!x.nokg&&!x.kg)F(id+' no kg text');
});
// 3 times
WEEKS.forEach(W=>{DAYS.forEach(D=>{
  let sec=0;D.ex.forEach(id=>{const x=EX[id];const u=x.t==='hold'?W.hold:(x.t==='fixed'?x.fixN*3:W.rmax*3);sec+=u+15;});
  sec=sec*W.rounds+40*(W.rounds-1);
  const tot=Math.round((300+sec+W.fin*2*60+300)/60);
  P(`W${W.n} D${D.n} circuit ${(sec/60).toFixed(1)}m  total ${tot}m  fin ${W.fin*2}m`);
  if(tot>40)F(`W${W.n}D${D.n} total ${tot} >40`);
});});
['up','low'].forEach(k=>{const w=WU[k].reduce((a,x)=>a+x.sec,0),c=CD[k].reduce((a,x)=>a+x.sec,0);P(k+' WU '+w+' CD '+c);if(w!==300)F(k+' WU sum '+w);if(c!==300)F(k+' CD sum '+c);
  CD[k].forEach(c=>{if(c.evk&&!EVID[c.evk])F('CD '+c.id+' evk '+c.evk);if(!c.steps||!c.bad)F('CD '+c.id+' steps/bad');});
  WU[k].forEach(c=>{if(!c.cue||!c.ar||!c.en)F('WU '+c.id+' fields');});
  if(new Set(WU[k].map(x=>x.id)).size!==WU[k].length)F('dup WU id '+k);
  if(new Set(CD[k].map(x=>x.id)).size!==CD[k].length)F('dup CD id '+k);
});
['up','low'].forEach(k=>{FIN[k].forEach(id=>{if(!FINMV[id])F('FIN '+id);});});
// 4 muscles per day
MUS.forEach(mu=>{const ds=[];DAYS.forEach(D=>{let s=0;D.ex.forEach(id=>s+=(EX[id].m[mu.id]||0));if(s>=0.5)ds.push(D.n);});P('muscle '+mu.id+' days '+ds.join(','));if(ds.length<2)F('muscle '+mu.id+' <2 days');});
// 5 evid
Object.keys(EVID).forEach(k=>{const e=EVID[k];if(!e.t||!e.tx||!e.lv||!e.src||(e.lv!=='logic'&&!e.src.length))F('EVID '+k);e.src.forEach(s=>{if(!/^https:\/\//.test(s.u))F('EVID url '+k+' '+s.u);});});
// 6 VQ vid duplicates
const vids={};Object.keys(VQ).forEach(k=>{if(VQ[k].vid){(vids[VQ[k].vid]=vids[VQ[k].vid]||[]).push(k);}});Object.keys(VA).forEach(k=>{if(VA[k].vid)(vids[VA[k].vid]=vids[VA[k].vid]||[]).push('alt:'+k);});
P('vids '+JSON.stringify(vids));
P('TOTAL PROBLEMS '+bad);
