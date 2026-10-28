const fs=require('fs'),vm=require('vm');
const ctx={console,window:{},document:{},localStorage:{}};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..','data.js'),'utf8')+'\n;this.__all={EX,DAYS,WU,CD,FIN,FINMV,WEEKS,AREAS,GEAR,VQ,VA,EVID,MUS,QUOTES};',ctx);
module.exports=ctx.__all;
