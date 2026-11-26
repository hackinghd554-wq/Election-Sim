// Engine and campaign checks. Run: node tests/sim.js
const {buildNight,GM}=require('./load');
let fail=0;const ok=(c,msg)=>{if(!c){fail++;console.log('FAIL',msg);}else console.log('ok  ',msg);};
const cand=(party,baggage)=>({name:'Test Person',party,third:'Independent',gender:'Woman',race:'White',age:48,home:'GA',religion:'Catholic',bg:'legislator',strengths:[],baggage:baggage||[],tier:1,degree:'ba',skills:{cha:4,deb:4,fund:4,pol:4,med:3,org:3,cri:0},pos:{}});
for(const scen of ['2026','2028']){
  const N0=buildNight({scenario:scen,env:0,seed:7});
  ok(Object.keys(N0.states).length===51,scen+': 51 states');
  ok(Object.values(N0.states).every(s=>s.county.length>0),scen+': every state has counties');
  const race=scen==='2026'?{id:'sen:GA',office:'sen',st:'GA'}:{id:'pres:GA',office:'pres',st:'GA'};
  const effs=[];
  for(let s=1;s<=20;s++){
    const C=GM.newCampaign(cand('D',s%2?['dui']:[]),race,N0,s);
    for(const role of ['mgr','comm','field','fin'])GM.hire(C,C.pool[role][0].id);
    let guard=0;
    while(!C.done&&guard++<40){GM.runWeek(C);while(C.pending&&C.pending.length){GM.choose(C,C.pending[0],0);C.pending.shift();}GM.closeWeek(C);}
    const pkg=GM.finalize(C);effs.push(pkg.eff||0);
    if(s<=5){const o=GM.octSurprise(C);ok(o&&o.t&&o.ch.length>=2,scen+': october surprise #'+s+' is specific ('+o.tag+')');}
  }
  const mean=effs.reduce((a,b)=>a+b,0)/effs.length;
  ok(Math.abs(mean)<8,scen+': campaign effect mean sane ('+mean.toFixed(2)+')');
}
console.log(fail?fail+' failed':'all passed');process.exit(fail?1:0);
