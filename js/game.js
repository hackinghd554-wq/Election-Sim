/* ===== Candidate effects + campaign engine. Needs game_data.js and engine.js. No DOM. ===== */
"use strict";
const gcl=(x,a,b)=>x<a?a:x>b?b:x;
const gR=(r,a,b)=>a+(b-a)*r();
const gpick=(r,a)=>a[Math.floor(r()*a.length)];

/* ---------- candidate effects (feeds the voter model) ---------- */
GM.effSkills=function(c){
  const o={};
  for(const s of GM.SKILLS)o[s.id]=GM.SKILL_BASE+((c.skills||{})[s.id]||0);
  const add=(m)=>{for(const k in m)o[k]=(o[k]||0)+m[k];};
  const bg=GM.BACKGROUNDS.find(b=>b.id===c.bg);if(bg)add(bg.sk);
  const dg=GM.DEGREES.find(d=>d.id===c.degree);if(dg)add(dg.sk);
  for(const id of c.strengths||[]){const s=GM.STRENGTHS.find(x=>x.id===id);if(s)add(s.sk);}
  for(const id of c.baggage||[]){const s=GM.BAGGAGE.find(x=>x.id===id);if(s)add(s.sk);}
  for(const k in o)o[k]=gcl(o[k],1,10);
  return o;
};
GM.issueSalience=function(polls,st){
  const L=(polls.stateIssues&&polls.stateIssues[st])||polls.issues;
  const m={};for(const i of L)m[i.id]=i.pct;
  const cnt={};for(const is of GM.ISSUES)cnt[is.sal]=(cnt[is.sal]||0)+1;
  let tot=0;const s={};
  for(const is of GM.ISSUES){s[is.id]=(m[is.sal]||3)/cnt[is.sal];tot+=s[is.id];}
  for(const k in s)s[k]/=tot;
  return s;
};
GM.electorateMean=function(L,A){
  const ln=gcl(L/25,-1.2,1.2),m={};
  for(const is of GM.ISSUES){
    let q=0;
    if(is.id==='guns')q=(A.rural-25)*0.03;
    else if(is.id==='abort'||is.id==='culture')q=(A.evang-25)*0.03;
    else if(is.id==='immig')q=0.15;
    else if(is.id==='climate')q=(25-A.rural)*0.01;
    m[is.id]=gcl(-ln*is.load+q,-2,2);
  }
  return m;
};
const IMPW={1:0.5,2:1,3:2};
GM.posFit=function(pos,sal,e,typ,useImp){
  let f=0;
  for(const is of GM.ISSUES){
    const p=pos[is.id]?pos[is.id].s:typ[is.id],w=useImp&&pos[is.id]?IMPW[pos[is.id].w||2]:1;
    f+=sal[is.id]*w*(0.55-Math.abs(p-e[is.id])/3.6);
  }
  return f;
};
GM.candEffect=function(c,race,N0){
  const ct=N0.byId[race.id],st=race.st,A=GM.STATE_ATTR[st];
  const L=ct.rateT*100,parts=[],add=(k,v,note)=>{parts.push({k,v:+v.toFixed(2),note});};
  const party=c.party;
  // identity ties
  let grp=null;
  if(c.race==='Black')grp='black';else if(c.race==='Hispanic or Latino')grp='hisp';else if(c.race==='Asian American')grp='asian';
  let id=0;
  if(grp){id=gcl(A[grp]/100*(party==='D'?3.0:party==='R'?1.8:1.5),0,1.6);add('Community ties',id,A[grp]+'% of the state shares your background and responds to seeing someone like them on the ballot.');}
  // home
  const home=c.home===st;
  if(race.office==='pres')add('Home state',home?2.0:0,home?'Native-son edge in '+st+'.':'No home-state edge anywhere but '+c.home+'.');
  else add('Home ties',home?1.5:-5,home?'A hometown candidate.':'You are running outside your home state. Voters see an outsider and opponents will call you a carpetbagger.');
  // religion
  let rel=0;const ev=A.evang;
  switch(c.religion){
    case 'Evangelical Protestant':rel=(ev-25)*0.05;break;
    case 'Mainline Protestant':rel=0.4;break;
    case 'Catholic':rel=0.5;break;
    case 'Latter-day Saint':rel=['UT','ID','AZ','NV','WY','MT'].includes(st)?1.5:0.2;break;
    case 'Jewish':rel=ev>35?-0.6:0.2;break;
    case 'Muslim':rel=ev>35?-1.8:-0.8;break;
    case 'Hindu or Buddhist':rel=ev>35?-1.0:-0.2;break;
    case 'Unaffiliated':rel=-(ev-20)*0.04;break;
    case 'Atheist':rel=-(ev-10)*0.07;break;
  }
  add('Faith and the electorate',gcl(rel,-2.5,1.6),'How your faith (or lack of it) sits with a state that is '+ev+'% evangelical.');
  // age
  let ag=gcl((c.age-45)/15,-1,1)*0.4;if(c.age>=75)ag-=0.8;if(c.age<35)ag-=0.2;
  add('Age and experience',ag,c.age<40?'Young: energizing, but seen as untested.':c.age>=70?'Experience, with stamina questions.':'In the sweet spot of a long career.');
  // background
  const bg=GM.BACKGROUNDS.find(b=>b.id===c.bg);
  if(bg)add('Background: '+bg.name,bg.base,'');
  let sb=0,bgg=0,nm=0,fav=0,enthB=0;
  if(bg){bgg+=bg.geo;nm+=bg.nm;fav+=bg.fav;enthB+=bg.enth||0;}
  for(const sid of c.strengths||[]){const s=GM.STRENGTHS.find(x=>x.id===sid);if(!s)continue;add('Strength: '+s.name,s.base,s.desc);bgg+=s.geo||0;nm+=s.nm;fav+=s.fav;}
  for(const bid of c.baggage||[]){const b=GM.BAGGAGE.find(x=>x.id===bid);if(!b)continue;add('Baggage: '+b.name,b.base,b.desc);fav+=b.fav;}
  // education
  const tier=c.tier==null?1:c.tier;
  const edu=(tier===2?-0.8*(A.rural/40)+0.5*(A.college/40):tier===0?0.3*(A.rural/40):0);
  add('Education: '+GM.TIERS[tier],edu,tier===2?'An elite pedigree helps with college-educated voters and hurts with rural ones.':'');
  bgg+=tier===2?0.8:tier===0?-0.5:0;
  // positions
  const sal=GM.issueSalience(N0.polls,st),e=GM.electorateMean(L,A),typ=GM.PARTY_STANCE[party]||GM.PARTY_STANCE.I;
  const fit=GM.posFit(c.pos||{},sal,e,typ,true),fit0=GM.posFit({},sal,e,typ,false);
  let pv=gcl(7*(fit-fit0),-5,4);
  // credibility
  let cred=0;if(bg)for(const i of bg.cred){const p=(c.pos||{})[i];if(p&&p.w>=2)cred+=0.15;}
  add('Positions vs this electorate',pv+cred,'How your stances, weighted by what voters here care about, compare with a typical '+(party==='D'?'Democrat':party==='R'?'Republican':'candidate')+'.');
  let dev=0,devW=0;
  for(const is of GM.ISSUES){const p=(c.pos||{})[is.id];if(!p)continue;const w=IMPW[p.w||2]*sal[is.id];dev+=w*Math.abs(p.s-typ[is.id]);devW+=w;}
  dev=devW?dev/devW:0;
  // geography
  let gp=0;
  const P=c.pos||{},gk={guns:0.25,climate:0.2,immig:0.15,culture:0.2};
  for(const k in gk)if(P[k])gp+=gk[k]*(-P[k].s)*(IMPW[P[k].w||2]);
  const geo=gcl(bgg+gp*0.8,-3,3);
  let total=gcl(parts.reduce((s,p)=>s+p.v,0),-8,8);
  const start={name:gcl(({house:18,gov:35,sen:35,pres:45})[race.office]+nm,5,92),fav:fav,enth:gcl(50+enthB-6*dev,25,75)};
  return {total,parts,geo,start,skills:GM.effSkills(c),dev,cashMult:(c.strengths||[]).includes('rainmaker')?1.15:1,bg};
};

/* ---------- campaign engine ---------- */
GM.ACTIONS=[
 {id:'rally',name:'Hold a rally',desc:'Fire up the base and make news.',cost:{time:1,cash:10,staff:1},tgt:true},
 {id:'visit',name:'Retail visit',desc:'Diners, fairs and town halls. Slow, but voters remember it.',cost:{time:2,cash:3,staff:0},tgt:true},
 {id:'tv',name:'TV ad buy',desc:'Name ID and favorability at scale. Pick the size.',cost:{time:0,cash:60,staff:1},sizes:[['Small',1,'60'],['Medium',3,'180'],['Large',7.5,'450']]},
 {id:'digital',name:'Digital ads',desc:'Cheaper, narrower reach.',cost:{time:0,cash:20,staff:1},sizes:[['Light',1,'20'],['Heavy',3,'60']]},
 {id:'attack',name:'Attack ad',desc:'Drags down your opponent. Can backfire.',cost:{time:0,cash:120,staff:1}},
 {id:'fund',name:'Call time (fundraising)',desc:'Dial for dollars. Repeat calls pay less.',cost:{time:1,cash:0,staff:1}},
 {id:'oppo',name:'Opposition research',desc:'Dig for something real. Findings unlock a contrast ad.',cost:{time:0,cash:30,staff:1}},
 {id:'contrast',name:'Release opposition findings',desc:'Needs findings. Big hit if true, bigger if you did your homework.',cost:{time:0,cash:50,staff:1},needsDirt:true},
 {id:'debate',name:'Debate prep',desc:'Mock debates. Up to three weeks of prep count.',cost:{time:2,cash:0,staff:1}},
 {id:'vol',name:'Volunteer program',desc:'Build the field operation.',cost:{time:0,cash:15,staff:2}},
 {id:'gotv',name:'Get-out-the-vote push',desc:'Turnout and field. Only in the last four weeks.',cost:{time:0,cash:50,staff:2},late:4},
 {id:'endorse',name:'Endorsement outreach',desc:'Work the phones for validators.',cost:{time:1,cash:0,staff:0}},
 {id:'press',name:'Press interviews',desc:'Earned media. Watch for gaffes.',cost:{time:1,cash:0,staff:0}},
 {id:'policy',name:'Policy rollout',desc:'A big plan. Plays best on issues voters care about.',cost:{time:1,cash:5,staff:1}},
 {id:'poll',name:'Commission an internal poll',desc:'Sharper than public polls.',cost:{time:0,cash:25,staff:0}},
 {id:'petition',name:'Petition drive',desc:'Gather signatures for ballot access.',cost:{time:1,cash:10,staff:2},indep:true,early:true},
 {id:'circ',name:'Hire paid circulators',desc:'Buy signatures for ballot access.',cost:{time:0,cash:40,staff:0},indep:true,early:true}];

GM.makePerson=function(r,role,q){
  const skill=gcl(Math.round(gR(r,3,9)+(q||0)),2,10);
  const qk=gpick(r,GM.QUIRKS);
  return {id:'p'+Math.floor(r()*1e9).toString(36),name:gpick(r,GM.FIRST)+' '+gpick(r,GM.LAST),role,skill,quirk:qk.id,loyalty:Math.round(gR(r,45,85)),salary:+(1.2+skill*0.55).toFixed(1),weeks:0};
};
GM.newCampaign=function(cand,race,N0,seed,opts){
  opts=opts||{};
  const r=mulberry32((seed^0x2f6e2b1)>>>0);
  const off=GM.OFFICES[race.office],ct=N0.byId[race.id];
  let S=GM.candEffect(cand,race,N0);
  let wBase=null;
  if(race.office==='pres'){
    const by={};let tw=0,sT=0,sB=0;
    for(const c of N0.contests){if(c.office!=='pres')continue;
      const e=GM.candEffect(cand,{id:c.id,st:c.st,office:'pres'},N0);by[c.st]=e.total;
      tw+=c.expTotal;sT+=e.total*c.expTotal;sB+=c.baseT*c.expTotal;}
    S={...S,total:sT/tw,byState:by};wBase=sB/tw*100;
  }
  const indep=cand.party==='I';
  const sc=off.scale*(indep?1:1);
  const envPts=N0.env*100;
  const baseDR=(wBase!=null?wBase:ct.baseT*100)+0.7*envPts;                 // what polls see before the campaign
  const sign=cand.party==='D'?1:-1;
  const C={rng:r,cand,race,off,ct,seed,S,scale:sc,indep,weeks:off.weeks,week:1,phase:'plan',
    cash:Math.round((({house:250,gov:900,sen:1600,pres:6000})[race.office])*(indep?0.3:1)*S.cashMult*(0.85+0.3*r())),
    time:6,timeNext:6,staff:[],pool:{},log:[],news:[],polls:[],pending:[],done:false,flags:{},debate:0,oppoRuns:0,dirt:0,endorse:0,
    baseDR,sign,envPts,fcalls:0,acts:[],geoCamp:{urban:0,suburban:0,rural:0},access:indep?0:100,accessDeadline:race.office==='pres'?5:4,failed:false,
    me:{nameId:S.start.name,fav:S.start.fav,enth:S.start.enth,field:indep?10:25,media:0},rawPts:0,spent:0,raised:0,seenEv:{},dirtUsed:0};
  C.me0={...C.me};
  C.skill=S.skills;
  {C.hid=GM.hidden('P|'+cand.name+'|'+seed,cand);const A=race.office==='pres'?GM.NATA:(GM.STATE_ATTR[race.st]||GM.NATA);
   if(race.office==='pres'){C.hidBy={};let tw=0,sT=0;for(const c of N0.contests){if(c.office!=='pres')continue;const A2=GM.STATE_ATTR[c.st];const v=GM.hidAppeal(C.hid,A2,c.baseT*100);C.hidBy[c.st]=v;tw+=c.expTotal;sT+=v*c.expTotal;}
     C.hidPts=sT/tw;C.S.total+=C.hidPts;for(const st in C.S.byState)C.S.byState[st]+=C.hidBy[st];}
   else{C.hidPts=GM.hidAppeal(C.hid,A,(ct.baseT||0)*100);C.S.total+=C.hidPts;}}
  C.indepFlag=indep;
  // opponents
  const mk=(party)=>{
    const arch=gpick(r,GM.OPP_ARCH),weak=gpick(r,GM.OPP_WEAK);
    const q=gR(r,-1,1);
    const sk={cha:gcl(Math.round(5+q*2+gR(r,-2,2)),2,9),fund:gcl(Math.round(5+q*2+gR(r,-2,2)),2,9),org:gcl(Math.round(5+q*2+gR(r,-2,2)),2,9),med:gcl(Math.round(5+q*2+gR(r,-2,2)),2,9)};
    if(weak.id==='bland')sk.cha=Math.min(sk.cha,3);if(weak.id==='cash')sk.fund=Math.min(sk.fund,3);
    const incumbent=ct.prev===party&&r()<0.55;
    const o={party,name:GM.realName(N0,race,party)||(gpick(r,GM.FIRST)+' '+gpick(r,GM.LAST)),arch,weak,sk,incumbent,static:q*1.6,
      cash:Math.round((({house:300,gov:1100,sen:1900,pres:7000})[race.office])*(weak.id==='cash'?0.6:1)*(0.85+0.3*r())),
      stat:{nameId:incumbent?gR(r,45,70):({house:20,gov:38,sen:38,pres:55})[race.office]*gR(r,0.8,1.3),fav:gR(r,-2,4),enth:gR(r,45,60),field:gR(r,25,45),media:0},oppo:0,lastActs:[],dirtOnMe:0,known:false,scandal:weak.id==='scandal'&&r()<0.8};
    o.stat0={...o.stat};
    o.real=!!GM.realName(N0,race,party);o.hid=GM.hidden(party+'|'+o.name+(GM.realName(N0,race,party)?'':'|'+seed));
    {const A=race.office==='pres'?GM.NATA:(GM.STATE_ATTR[race.st]||GM.NATA);const hp=GM.hidAppeal(o.hid,A,race.office==='pres'?0:(ct.baseT||0)*100);o.hidPts=hp;o.static+=hp;}
    return o;
  };
  if(indep){C.opps=[mk('D'),mk('R')];}
  else C.opps=[mk(cand.party==='D'?'R':'D')];
  C.opp=C.opps[0];
  // hiring pool
  for(const role of GM.ROLES){C.pool[role.id]=[GM.makePerson(r,role.id,0),GM.makePerson(r,role.id,0),GM.makePerson(r,role.id,0)];}
  GM.initStrategy(C,N0);GM.initMedia(C,N0.scen);
  C.news.push({w:1,t:'The campaign is underway. '+C.opps.map(o=>o.name+' ('+o.party+')').join(' and ')+(C.opps.length>1?' are your rivals.':' is your opponent.')});
  return C;
};
GM.staffPts=function(C){
  let p=2; // you and a few volunteers
  for(const s of C.staff){const role=GM.ROLES.find(x=>x.id===s.role);p+=role.cap-(s.role==='mgr'?0:0)+(s.quirk==='worker'?1:0);}
  return p;
};
GM.hasRole=function(C,role){return C.staff.find(s=>s.role===role);};
GM.sf=function(C,role){const s=GM.hasRole(C,role);return s?0.85+0.035*s.skill+(s.quirk==='hothead'?0.05:0):0.75;};
GM.mg=function(C){const m=GM.hasRole(C,'mgr');return m?1+0.015*m.skill:1;};
GM.ef=function(C,sk){return (0.6+0.07*C.skill[sk])*GM.mg(C);};
GM.sat=function(C){return Math.max(0.25,1-C.me.nameId/120);};
GM.cashK=function(C,k){return k*C.scale;};
GM.weeklyUpkeep=function(C){let s=0;for(const p of C.staff)s+=p.salary*C.scale*0.5;return s;};
GM.hire=function(C,personId){
  const role=Object.keys(C.pool).find(k=>C.pool[k].some(p=>p.id===personId));if(!role)return {ok:false,msg:'Not available.'};
  if(GM.hasRole(C,role))return {ok:false,msg:'You already have a '+GM.ROLES.find(r=>r.id===role).name.toLowerCase()+'. Fire them first.'};
  const p=C.pool[role].find(x=>x.id===personId);C.staff.push(p);C.pool[role]=C.pool[role].filter(x=>x!==p);
  C.log.push({w:C.week,t:'Hired '+p.name+' as '+GM.ROLES.find(r=>r.id===role).name.toLowerCase()+'.'});
  return {ok:true,msg:'Hired '+p.name+'.'};
};
GM.fire=function(C,personId){
  const p=C.staff.find(x=>x.id===personId);if(!p)return {ok:false};
  C.staff=C.staff.filter(x=>x!==p);C.cash-=p.salary*C.scale*0.5;
  for(const s of C.staff)s.loyalty=Math.max(0,s.loyalty-5);
  C.pool[p.role].push(GM.makePerson(C.rng,p.role,0));
  C.log.push({w:C.week,t:'Fired '+p.name+'. The rest of the staff took note.'});
  return {ok:true,msg:'Fired '+p.name+'.'};
};
GM.canAct=function(C,a,size){
  const cost=GM.actCost(C,a,size);
  if(C.phase!=='plan')return 'Finish the current events first.';
  if(a.indep&&!C.indep)return 'Only independents and third-party candidates need this.';
  if(a.indep&&C.week>C.accessDeadline)return 'The filing deadline has passed.';
  if(a.indep&&C.access>=100)return 'You are already on the ballot.';
  if(a.late&&C.week<C.weeks-a.late+1)return 'Too early. Opens in week '+(C.weeks-a.late+1)+'.';
  if(a.needsDirt&&C.dirt-C.dirtUsed<=0)return 'No findings yet. Run opposition research first.';
  if(C.time<cost.time)return 'Not enough candidate time.';
  if(GM.staffPts(C)-GM.staffUsedFn(C)<cost.staff)return 'Not enough staff capacity.';
  if(C.cash<cost.cash)return 'Not enough cash.';
  if(a.id==='debate'&&C.debate>=3)return 'You are as prepared as you can be.';
  return null;
};
GM.actCost=function(C,a,size){const mult=size!=null&&a.sizes?a.sizes[size][1]:1;const base=a.cost.cash*(a.sizes?(a.sizes[size||0][1]):1);return {time:a.cost.time,cash:GM.cashK(C,base),staff:a.cost.staff};};
GM.newsPush=function(C,t){C.news.push({w:C.week,t});};
GM.staffUsedFn=function(C){let n=0;for(const a of C.acts)n+=a.staff;return n;};

/* Apply an action. size = index for sized actions, tgt = 'urban'|'suburban'|'rural' */
GM.act=function(C,id,size,tgt){
  const a=GM.ACTIONS.find(x=>x.id===id);const why=GM.canAct(C,a,size||0);if(why)return {ok:false,msg:why};
  const cost=GM.actCost(C,a,size||0),sk=C.skill,m=C.me,sat=GM.sat(C),r=C.rng;
  C.time-=cost.time;C.cash-=cost.cash;C.spent+=cost.cash;C.acts.push({id,staff:cost.staff,size});
  let msg='';const T=tgt||'suburban';
  const notes=[];
  switch(id){
    case 'rally':{const e=GM.ef(C,'cha');m.enth+=5*e;m.nameId+=2.5*sat*e;m.media+=3;C.geoCamp[T]++;msg='The rally drew a loud crowd in '+T+' territory.';break;}
    case 'visit':{const e=GM.ef(C,'cha');m.fav+=2.2*e;m.nameId+=1.4*sat;C.geoCamp[T]+=1.2;msg='Voters in '+T+' areas liked meeting you.';break;}
    case 'tv':{const sz=a.sizes[size||0][1],e=GM.ef(C,'med')*GM.sf(C,'comm');m.nameId+=3.2*Math.sqrt(sz)*sat*e;m.fav+=0.8*Math.sqrt(sz)*sat*e;msg='Your '+a.sizes[size||0][0].toLowerCase()+' TV buy hit the air.';break;}
    case 'digital':{const sz=a.sizes[size||0][1],e=GM.ef(C,'med')*GM.sf(C,'comm');m.nameId+=1.8*Math.sqrt(sz)*sat*e;m.enth+=0.8*sz;msg='Digital ads are running.';break;}
    case 'attack':{
      const e=GM.ef(C,'med')*GM.sf(C,'comm');const o=C.opp;
      const hit=3.6*e;o.stat.fav-=hit*(1+0.3*(o.known?1:0));
      const bl=0.28-0.025*sk.med+(C.oppoRuns?0:0.1)-0.1*(C.flags.contrastReady?1:0);
      if(r()<bl){m.fav-=2.4;msg='The attack ad landed poorly and the press called it a cheap shot.';}else msg='The attack ad dented '+o.name+'.';
      for(const x of C.opps)if(x!==o)x.stat.fav-=hit*0.3;
      break;}
    case 'fund':{
      const e=GM.ef(C,'fund')*GM.sf(C,'fin');const dec=Math.pow(0.7,C.fcalls);C.fcalls++;
      const amt=Math.round(GM.cashK(C,42)*e*dec*(1+m.fav/120)*S0(C));C.cash+=amt;C.raised+=amt;msg='Call time brought in $'+amt+'K.';break;}
    case 'oppo':{
      C.oppoRuns++;const ch=0.32+(C.opp.scandal?0.3:0)+0.03*GM.sf(C,'policy')*0;
      if(r()<ch){C.dirt++;C.opp.known=true;msg='Your researchers found something on '+C.opp.name+'.';}else msg='The research turned up nothing usable this time.';break;}
    case 'contrast':{
      C.dirtUsed++;const e=GM.ef(C,'med')*GM.sf(C,'comm');const big=C.opp.scandal?1.5:1;
      C.opp.stat.fav-=5.5*e*big;m.media+=3;msg='The contrast ad framed the race around '+C.opp.name+'.';
      if(C.opp.scandal)C.opp.scandal=false;break;}
    case 'debate':{C.debate++;msg='Debate prep session '+C.debate+' of 3 done.';break;}
    case 'vol':{const e=GM.ef(C,'org')*GM.sf(C,'field');m.field+=4.5*e;msg='More volunteers are knocking doors.';break;}
    case 'gotv':{const e=GM.ef(C,'org')*GM.sf(C,'field');m.field+=6*e;m.enth+=3;msg='The turnout push is on.';break;}
    case 'endorse':{
      const p=gcl(0.3+0.03*sk.cha+(C.cand.party==='I'?-0.15:0.05)+m.fav/200,0.1,0.8);
      if(r()<p){C.endorse++;m.fav+=3;m.media+=3;msg='You landed an endorsement from a respected local figure.';}else msg='The outreach went nowhere this week.';break;}
    case 'press':{
      const e=GM.ef(C,'med')*GM.sf(C,'comm');m.media+=4*e;const g=gcl(0.22-0.02*sk.med-0.01*sk.pol,0.04,0.3);
      if(r()<g){m.fav-=2.6;m.media-=4;msg='A stumble in an interview became the story of the day.';}else{m.nameId+=1*sat;msg='The interviews went smoothly.';}break;}
    case 'policy':{
      const e=GM.ef(C,'pol')*GM.sf(C,'policy');m.fav+=1.6*e*(1+0.2*(C.S.dev<1?1:0));m.nameId+=0.8*sat;C.flags.policyShield=2;msg='Your policy plan got serious coverage.';break;}
    case 'poll':{
      const pl=GM.hasRole(C,'poll'),sdv=Math.max(1.6,3.2-(pl?0.1*pl.skill:0)-(pl&&pl.quirk==='data'?0.5:0));
      const pp=GM.makePoll(C,1200,sdv);C.internal=pp;msg='Internal poll: '+GM.pollTxt(C,pp);break;}
    case 'petition':{const e=GM.ef(C,'org');const g=gcl(Math.round(12*e+gR(r,0,6)),6,28);C.access=Math.min(100,C.access+g);msg='Signatures are coming in: ballot access '+C.access+'%.';break;}
    case 'circ':{C.access=Math.min(100,C.access+22);msg='Paid circulators added signatures: ballot access '+C.access+'%.';break;}
  }
  GM.clampMe(C);
  C.log.push({w:C.week,t:msg});
  return {ok:true,msg};
};
GM.clampMe=function(C){const m=C.me;m.fav=gcl(m.fav,-40,40);m.nameId=gcl(m.nameId,0,100);m.enth=gcl(m.enth,0,100);m.field=gcl(m.field,0,100);m.media=gcl(m.media,-60,60);for(const o of C.opps){const s=o.stat;s.fav=gcl(s.fav,-40,40);s.media=gcl(s.media,-60,60);}};
function S0(C){return C.S.cashMult||1;}
GM.staffUsed=GM.staffUsedFn;
// bind helper used above
Object.defineProperty(GM,'_',{value:0});

/* ---------- polls and effects ---------- */
GM.coef={nameId:0.02,fav:0.06,field:0.03,enth:0.02,media:0.015};
GM.statEff=function(cur,base){let s=0;for(const k in GM.coef)s+=GM.coef[k]*(cur[k]-base[k]);return 2.8*Math.tanh(s/2.8);};
GM.dyn=function(C){
  // player-signed points of margin from the campaign so far (major party), or the D-R shift for independents
  const mine=GM.statEff(C.me,C.me0)+(C.eBloc||0)+(C.eGeo||0);
  if(!C.indep){const o=C.opp;return mine-GM.statEff(o.stat,o.stat0)-o.static*0;}
  return mine*0.8;
};
GM.indShare=function(C,x){return 2+16/(1+Math.exp(-(x-5)/2.5));};
GM.vis=function(C){return gcl(0.35+0.65*C.me.nameId/80,0.35,1);};
GM.trueMargins=function(C){
  // returns {mePts (player-signed margin vs main opponent, major party), ind:{I,D,R}}
  const S=C.S,dyn=GM.dyn(C);
  if(!C.indep){
    const o=C.opp;
    const m=C.sign*C.baseDR+S.total*GM.vis(C)+dyn-o.static*GM.vis({me:{nameId:o.stat.nameId}})+C.sign*(C.envDrift||0);
    return {m,dr:C.sign*m};
  }
  const dD=GM.statEff(C.opps[0].stat,C.opps[0].stat0)+C.opps[0].static*0.3;
  const dR=GM.statEff(C.opps[1].stat,C.opps[1].stat0)+C.opps[1].static*0.3;
  const x=S.total*GM.vis(C)+dyn-(dD+dR)/2;
  const I=GM.indShare(C,x*(GM.vis(C)));
  const pD=gcl(0.5-0.25*GM.ideo(C),0.2,0.8);
  const drShift=(dD-dR)+(I*(1-2*pD));
  return {x,I,pD,dr:C.baseDR+drShift+(C.envDrift||0)};
};
GM.ideo=function(C){let s=0,n=0;for(const is of GM.ISSUES){const p=(C.cand.pos||{})[is.id];if(p){s+=p.s*IMPW[p.w||2];n+=IMPW[p.w||2];}}return n?s/n:0;};
GM.makePoll=function(C,n,sdOverride){
  const r=C.rng,tm=GM.trueMargins(C);
  const sd=sdOverride||100/Math.sqrt(n)*1.05;
  const und=Math.max(3,13-C.week*0.7),oth=1.5;
  if(!C.indep){
    const noisy=tm.m+gauss(r)*sd;
    const me=(100-und-oth+noisy)/2,op=(100-und-oth-noisy)/2;
    return {me,opp:op,und,n,moe:+(1.96*0.5/Math.sqrt(n)*100*1.05).toFixed(1),margin:noisy};
  }
  const nI=gcl(tm.I+gauss(r)*sd*0.4,0.5,40),dr=tm.dr+gauss(r)*sd;
  const rest=100-und-oth-nI;
  return {me:nI,D:(rest+dr)/2,R:(rest-dr)/2,und,n,moe:+(1.96*0.5/Math.sqrt(n)*100*1.05).toFixed(1),margin:nI-Math.max((rest+dr)/2,(rest-dr)/2)};
};
GM.pollTxt=function(C,p){
  if(!C.indep)return 'You '+p.me.toFixed(0)+' – '+C.opp.name.split(' ')[1]+' '+p.opp.toFixed(0)+' (±'+p.moe+')';
  return 'You '+p.me.toFixed(0)+' · D '+p.D.toFixed(0)+' · R '+p.R.toFixed(0)+' (±'+p.moe+')';
};

/* ---------- events ---------- */
const FX_KEYS=['nameId','fav','enth','field','media'];
GM.applyFx=function(C,fx,k){
  k=k==null?1:k;
  const m=C.me;
  for(const key of FX_KEYS)if(fx[key])m[key]+=fx[key]*k;
  if(fx.cash)C.cash+=GM.cashK(C,fx.cash)*(fx.cash>0?1:1);
  if(fx.oppFav)for(const o of C.opps)o.stat.fav+=fx.oppFav*(o===C.opp?1:0.3);
  if(fx.oppMedia)C.opp.stat.media+=fx.oppMedia;
  if(fx.loyalty)for(const s of C.staff)s.loyalty=gcl(s.loyalty+fx.loyalty,0,100);
  if(fx.time)C.timeNext=gcl(C.timeNext+fx.time,2,8);
  if(fx.access)C.access=gcl(C.access+fx.access,0,100);
  if(fx.dirt)C.dirt+=fx.dirt;
  m.fav=gcl(m.fav,-40,40);m.nameId=gcl(m.nameId,0,100);m.enth=gcl(m.enth,0,100);m.field=gcl(m.field,0,100);m.media=gcl(m.media,-60,60);
};
function pos(C,id){const p=(C.cand.pos||{})[id];return p?p.s:0;}
function topIssue(C){
  const sal=GM.issueSalience(C.N0polls||{issues:[]},C.race.st);
  let best=null,bw=-1;
  for(const is of GM.ISSUES){const p=(C.cand.pos||{})[is.id];if(!p)continue;const w=IMPW[p.w||2]*sal[is.id]*(1+0.2*Math.abs(p.s));if(w>bw){bw=w;best=is;}}
  return best||GM.ISSUES[0];
}
const EV=[];
function E(id,title,w,week,cond,text,choices,opts){EV.push(Object.assign({id,title,w,week,cond,text,choices},opts||{}));}
const ch=(label,hint,fx,res,more)=>Object.assign({label,hint,fx,res},more||{});
const roll=(sk,base,per)=>({sk,base,per});
const nm=C=>C.opp.name, st=C=>C.race.st;
const wk=(C,a,b)=>C.week>=a&&C.week<=b;
E('hotmic','Hot mic',1.2,[2,99],C=>true,C=>'A hot mic caught you griping about a local reporter between interviews. The clip is spreading.',[
 ch('Apologize publicly','Costs a little pride. Limits the damage.',{fav:-1,media:-2},'You apologized quickly and the story faded in two days.'),
 ch('Laugh it off','Works if you are charming.',{},'',{roll:{sk:'cha',base:0.35,per:0.05,win:{fav:1,media:2},lose:{fav:-3,media:-5}},winRes:'Your self-deprecating joke turned the clip into a plus.',loseRes:'The joke only fed the story.'}),
 ch('Double down','Your base loves it. Everyone else does not.',{enth:4,fav:-2,media:-3},'The base cheered. The press did not.')],{sk:'cri'});
E('crisis','Disaster at home',1.0,[1,99],C=>true,C=>'A severe storm hit parts of '+C.race.st+'. Homes are flooded and people want to see leadership.',[
 ch('Drop everything and go','Costs next week\'s time.',{fav:4,media:3,time:-2},'Voters noticed you showed up first.'),
 ch('Issue a statement and donate','Cheap and safe.',{cash:-8,fav:1},'A modest gesture, modestly received.'),
 ch('Stay on message','Looks cold.',{fav:-2},'Critics called you out of touch.')],{sk:'cri'});
E('union','Union endorsement',0.9,[2,10],C=>pos(C,'econ')<=0.5&&C.cand.party!=='R',C=>'A major labor union wants to endorse you. Business groups may not love it.',[
 ch('Accept','Field help, some cooler donors.',{field:6,fav:1,cash:-5},'Union volunteers filled your phone banks.'),
 ch('Politely decline','Keeps donors comfortable.',{cash:6},'Donors appreciated the distance.')]);
E('cele','Celebrity wants to help',0.6,[2,99],C=>true,C=>'A well-known actor offers to headline an event for you.',[
 ch('Take the help','Big crowds. Some backlash risk.',{nameId:7,media:3},'',{roll:{sk:'med',base:0.55,per:0.04,win:{fav:1},lose:{fav:-3,media:-3}},winRes:'The crowd was huge and the coverage was great.',loseRes:'The actor said something off-script and it overshadowed you.'}),
 ch('Pass','No surprises.',{},'You kept the focus on your message.')]);
E('viral','A moment goes viral',0.8,[2,99],C=>true,C=>'A clip of you at a town hall is going viral online, in a good way.',[
 ch('Pay to boost it','Spend while it is hot.',{cash:-15,nameId:5,fav:1.5},'Your ad money followed a free story.'),
 ch('Let it run','Free exposure.',{nameId:2,fav:0.5},'It helped a little on its own.')]);
E('oppo_drop','Opponent attack',1.4,[3,99],C=>true,C=>nm(C)+' is hitting you with a new attack ad about '+(C.cand.baggage&&C.cand.baggage.length?'your past':'your record')+'.',[
 ch('Respond with an ad','Costs money, kills the story.',{cash:-30,fav:1},'Your response ad blunted the hit.'),
 ch('Ignore it','Risky if it sticks.',{fav:-2.5},'The attack landed more than you expected.',{roll:{sk:'cri',base:0.3,per:0.06,win:{fav:2.5},lose:{}},winRes:'It fizzled on its own.',loseRes:''}),
 ch('Counterpunch','Needs opposition findings.',{oppFav:-4,fav:-0.5},'You hit back hard and the exchange ended roughly even.',{needsDirt:true})],{sk:'med'});
E('pollshock','Bad poll rattles donors',0.9,[3,99],C=>(C.polls.length&&C.polls[C.polls.length-1].margin<-3),C=>'A public poll shows you trailing. Donors are asking whether you can win.',[
 ch('Host a donor call','Costs time, steadies donors.',{time:-1,cash:10},'You steadied the room.'),
 ch('Shift ad spending to rebuild','Spend to turn it around.',{cash:-20,nameId:3,fav:1.5},'Your new ads gave you some momentum.'),
 ch('Say polls do not matter','Looks defensive.',{enth:2,cash:-4},'Your base nodded. Donors did not.')]);
E('donor','Donor dinner invitation',0.9,[2,99],C=>true,C=>'A well-connected donor will host a dinner for you.',[
 ch('Attend','Costs time, pays well.',{time:-1,cash:38},'The dinner raised serious money.'),
 ch('Send a surrogate','Less money.',{cash:14},'The surrogate did fine.')]);
E('infight','Your party asks for help',0.8,[3,99],C=>C.cand.party!=='I',C=>'Party leaders want you to campaign for ticket-mates in nearby races.',[
 ch('Do it','Spend time, build goodwill.',{time:-1,fav:1,field:3,cash:6},'The party owes you one.'),
 ch('Decline','Stay focused.',{loyalty:-3,field:-2},'Party staff grumbled.')]);
E('breach','Data breach',0.4,[2,99],C=>true,C=>'Hackers got into a vendor holding your volunteer list.',[
 ch('Pay for security and disclose','Honest and costly.',{cash:-25,media:1},'Reporters praised your transparency.'),
 ch('Downplay','Cheaper. Risky.',{cash:-4},'',{roll:{sk:'cri',base:0.45,per:0.06,win:{},lose:{fav:-4,media:-5}},winRes:'It never became a story.',loseRes:'The cover-up became the story.'})],{sk:'cri'});
E('heckler','Town hall confrontation',1.0,[2,99],C=>true,C=>'A heckler at your town hall is shouting and cameras are rolling.',[
 ch('Engage calmly','Charisma pays off.',{},'',{roll:{sk:'cha',base:0.4,per:0.06,win:{fav:3,media:3},lose:{fav:-2,media:-2}},winRes:'You turned it into a strong moment.',loseRes:'The exchange got heated and you came off worse.'}),
 ch('Have security remove them','Safe, a little ugly.',{fav:-0.5},'Security took care of it quietly.')]);
E('trade','Factory closing',0.7,[2,99],C=>true,C=>'A major employer in '+C.race.st+' announced layoffs.',[
 ch('Hold an event with workers','Time well spent if your economic message fits.',{time:-1,fav:2.5,media:2},'Workers appreciated being heard.'),
 ch('Blame '+'the other side','Cheap and partisan.',{oppFav:-1.5,fav:-0.5},'The blame game got modest coverage.')]);
E('issue','Pressed on your top issue',1.6,[2,99],C=>true,C=>{const i=topIssue(C);return 'Reporters pin you down on '+i.name.toLowerCase()+', where you stand '+GM.ISSUES.find(x=>x.id===i.id).lab[Math.round(pos(C,i.id))+2].toLowerCase()+'.';},[
 ch('Stay on message','Repeat your position.',{},'',{issueRoll:true}),
 ch('Soften','Flip-flop risk.',{fav:-1.5,enth:-2},'You softened your answer and the press noticed.'),
 ch('Go bigger','Make it your signature.',{enth:3,fav:0},'',{issueRoll2:true})]);
E('pastsay','Old statements resurface',1.0,[3,99],C=>(C.cand.baggage||[]).includes('statements'),C=>'Old posts and clips of yours are circulating again.',[
 ch('Own it and explain','Honest, takes a few days.',{fav:-1.5,media:-1,time:-1},'Voters respected your candor, mostly.'),
 ch('Say it was taken out of context','Works about half the time.',{},'',{roll:{sk:'deb',base:0.35,per:0.05,win:{fav:0},lose:{fav:-4,media:-4}},winRes:'The explanation held.',loseRes:'The explanation made it worse.'})],{sk:'cri'});
E('baggage_bankrupt','Bankruptcy story',1.0,[3,99],C=>(C.cand.baggage||[]).includes('bankrupt'),C=>'A reporter is writing about your past bankruptcy.',[
 ch('Tell your own story','Get out front.',{fav:-0.5,media:1},'Your account humanized it.'),
 ch('Refuse comment','The story runs anyway.',{fav:-3,media:-3},'The story ran with a negative tone.')]);
E('baggage_dui','DUI story',1.0,[3,99],C=>(C.cand.baggage||[]).includes('dui'),C=>'Your old DUI arrest is back in the news.',[
 ch('Apologize and own it','Take the hit once.',{fav:-1.5,media:-1},'The story faded in a few days.'),
 ch('Attack the leak','Feeds the story.',{fav:-3,media:-4,oppFav:-1},'You made the story bigger.')]);
E('baggage_divorce','Divorce records',0.9,[3,99],C=>(C.cand.baggage||[]).includes('divorce'),C=>'Records from your divorce are being passed around.',[
 ch('Say it is private','Reasonable and effective.',{fav:-1},'Most voters respected the boundary.'),
 ch('Respond in detail','Draws it out.',{fav:-3,media:-2},'The detail made it worse.')]);
E('baggage_ethics','Ethics complaint revived',0.9,[3,99],C=>(C.cand.baggage||[]).includes('ethics'),C=>'An old ethics complaint was reopened by a watchdog group.',[
 ch('Release the full file','Transparent. Expensive.',{cash:-10,fav:-1,media:1},'The full file gave the story less oxygen.'),
 ch('Hire a lawyer','Cold and slow.',{cash:-15,fav:-2.5},'The legal fight looked defensive.')]);
E('baggage_lobby','Lobbying questions',0.9,[3,99],C=>(C.cand.baggage||[]).includes('lobbying'),C=>'A newspaper is asking about your undisclosed lobbying.',[
 ch('Disclose everything','Painful but done.',{fav:-2,media:-1},'The disclosure was ugly but over.'),
 ch('Stonewall','Risky.',{},'',{roll:{sk:'cri',base:0.3,per:0.06,win:{fav:-0.5},lose:{fav:-5,media:-6}},winRes:'The story lost steam.',loseRes:'The stonewalling became the headline.'})]);
E('baggage_health','Stamina rumors',0.9,[3,99],C=>(C.cand.baggage||[]).includes('health')||C.cand.age>=72,C=>'Rumors about your health are circulating.',[
 ch('Release a doctor\'s letter','Ends it.',{fav:0.5,cash:-3},'The doctor\'s letter put it to rest.'),
 ch('Show up everywhere','Costs time.',{time:-2,enth:3},'Your schedule disproved the rumors.')]);
E('baggage_relative','Relative embarrasses you',0.8,[3,99],C=>(C.cand.baggage||[]).includes('relative'),C=>'A family member gave an interview that went badly.',[
 ch('Distance yourself','Awkward at family dinners.',{fav:-1},'The distance helped.'),
 ch('Stand by family','Honorable, costly.',{fav:-2.5,enth:2},'Voters were divided.')]);

const NB=[['affair','Affair rumors','A tabloid is preparing a story about a past affair.','Address it directly','Say it is a private matter'],
 ['taxes','Tax lien story','A reporter found the old tax lien against you.','Pay it off and explain','Say it was settled long ago'],
 ['flipflop','Flip-flop attack','Your opponent has stitched your old and new positions into one ad.','Explain what changed','Attack their record instead'],
 ['temper','Temper flare-up','A recording of you snapping at a staffer has leaked.','Apologize to the staffer in public','Dismiss it as a long day'],
 ['plag','Plagiarism claim','A blogger says part of an old speech was copied.','Admit the mistake','Challenge the claim'],
 ['novote','Voting record questions','A local paper notes the elections you skipped.','Admit it and urge turnout','Ignore it'],
 ['trades','Stock trade scrutiny','A watchdog flagged the timing of your stock trades.','Put assets in a blind trust','Say everything was legal'],
 ['resume','Résumé fact-check','Fact-checkers say your bio overstates your experience.','Correct the record','Stand by your bio'],
 ['donor','Toxic donor','A major donor is in the news for the wrong reasons.','Return the money','Keep the money and stay quiet']];
for(const n of NB){
  E('baggage_'+n[0],n[1],1.0,[3,99],C=>(C.cand.baggage||[]).includes(n[0]),C=>n[2],[
   ch(n[3],'Costs a little now, saves more later.',{fav:-1,media:-1,cash:-5},'Voters gave you partial credit for facing it.'),
   ch(n[4],'Risky.',{},'',{roll:{sk:'cri',base:0.3,per:0.06,win:{fav:-0.5},lose:{fav:-4,media:-4}},winRes:'The story lost steam on its own.',loseRes:'Dodging it made the story bigger.'})],{sk:'cri'});
}
E('vet','Veterans\' event',0.9,[2,99],C=>C.cand.bg==='veteran',C=>'A veterans\' group invites you to speak.',[
 ch('Speak','Natural fit.',{fav:3,media:2,time:-1},'You got a standing ovation.'),
 ch('Send a message','Safe.',{fav:1},'The message was well received.')]);
E('record','Your record under fire',1.1,[3,99],C=>['prosecutor','legislator','mayor'].includes(C.cand.bg),C=>nm(C)+' is attacking your record in office.',[
 ch('Defend it with facts','Policy depth helps.',{},'',{roll:{sk:'pol',base:0.4,per:0.05,win:{fav:2,oppFav:-1},lose:{fav:-3}},winRes:'You won the exchange on specifics.',loseRes:'The specifics did not help.'}),
 ch('Pivot to the future','Safe.',{fav:-0.5},'You changed the subject smoothly.')]);
E('biz','Business scrutiny',0.9,[3,99],C=>['bizowner','smallbiz'].includes(C.cand.bg),C=>'Reporters are questioning layoffs and taxes at your old company.',[
 ch('Release tax returns','Transparent.',{fav:-1,media:2},'Voters appreciated the openness.'),
 ch('Defend the company','Costs a little.',{fav:-2},'The defense was met with skepticism.')]);
E('activist','Protesters at your event',0.8,[2,99],C=>C.cand.bg==='activist'||C.cand.bg==='union',C=>'Your own supporters and a rival faction clash at an event.',[
 ch('Calm both sides','Skill check.',{},'',{roll:{sk:'cha',base:0.4,per:0.05,win:{fav:2,enth:3},lose:{fav:-2,media:-3}},winRes:'You defused it and looked like a leader.',loseRes:'It spiraled and looked messy.'}),
 ch('Leave early','Safe.',{enth:-2},'You avoided a scene.')]);
E('famous','Fame cuts both ways',0.8,[2,99],C=>['celebrity','creator'].includes(C.cand.bg),C=>'Critics say you are a celebrity, not a serious candidate.',[
 ch('Roll out a serious policy week','Costs time.',{time:-1,fav:2},'The policy week changed the tone.'),
 ch('Lean into the fame','Big draw, thin on substance.',{nameId:4,fav:-1},'Crowds came, skeptics stayed.')]);
E('insider','The swamp attack',0.8,[3,99],C=>C.cand.bg==='operative',C=>'Opponents call you a creature of the establishment.',[
 ch('Embrace the experience','Plays well in the right place.',{fav:-0.5,field:2},'You leaned into the know-how.'),
 ch('Run as an outsider','A little disingenuous.',{fav:0.5,media:-2},'Reporters pointed out the contradiction.')]);
E('carpet','Carpetbagger attack',1.4,[2,99],C=>C.cand.home!==C.race.st&&C.race.office!=='pres',C=>nm(C)+' says you only moved to '+C.race.st+' to run.',[
 ch('Highlight your ties','Costs time.',{time:-1,fav:1.5},'Voters heard your personal story.'),
 ch('Hit back on values','Safe.',{oppFav:-1,fav:-1},'The exchange went both ways.')]);
E('stafflick','Staff leak',1.2,[3,99],C=>C.staff.some(s=>s.quirk==='leaker'),C=>'A story quoting an anonymous staffer shows up in the paper.',[
 ch('Hunt for the leaker','Hurts morale.',{loyalty:-8,fav:0},'The hunt hurt morale.'),
 ch('Shrug it off','Embarrassing but fine.',{fav:-1.5,media:-1},'The story was minor.')]);
E('poach','Staffer poached',0.8,[3,99],C=>C.staff.length>=1,C=>'A rival campaign is offering more money to one of your best staffers.',[
 ch('Match the offer','Costs a little.',{cash:-10,loyalty:2},'Your staffer stayed and felt valued.'),
 ch('Let them go','They leave.',{},'',{quit:true})]);
E('feud','Staff feud',0.9,[3,99],C=>C.staff.length>=3,C=>'Two senior staffers are feuding and the rest are picking sides.',[
 ch('Mediate','Costs time.',{time:-1,loyalty:3},'You calmed the room.'),
 ch('Fire the troublemaker','Decisive. Disruptive.',{loyalty:-3},'',{fireRandom:true})]);
E('oppgaffe','Opponent stumbles',1.0,[2,99],C=>true,C=>nm(C)+' made a serious gaffe at a public event.',[
 ch('Exploit it with an ad','Costs cash.',{cash:-25,oppFav:-4,media:2},'You ran with the gaffe and it stuck.'),
 ch('Stay above it','Looks classy.',{oppFav:-1.2,fav:1},'The press noticed your restraint.')]);
E('oppscandal','Opponent in trouble',0.9,[4,99],C=>C.opp.scandal||C.opp.weak.id==='scandal',C=>'Reporters are asking questions about '+nm(C)+'\'s finances.',[
 ch('Amplify it','Aggressive.',{oppFav:-4,fav:-0.5,cash:-10},'The story had legs.'),
 ch('Let the press do its work','Slower and cleaner.',{oppFav:-2},'The story grew on its own.')],{after:()=>{}});
E('grassroots','Volunteer surge',0.8,[3,99],C=>true,C=>'Volunteers are signing up in unexpected numbers.',[
 ch('Organize them fast','Needs staff attention.',{field:6,cash:-5},'You put the volunteers to work.'),
 ch('Let it happen naturally','Fine.',{field:2},'Many volunteers drifted away.')]);
E('endorse_news','Newspaper endorsement',0.8,[5,99],C=>true,C=>'The state\'s largest newspaper is weighing an endorsement.',[
 ch('Meet the editorial board','Costs time.',{time:-1},'',{roll:{sk:'pol',base:0.3,per:0.06,win:{fav:3,media:4},lose:{fav:0}},winRes:'The board endorsed you.',loseRes:'They endorsed no one.'}),
 ch('Skip it','No change.',{},'You skipped the meeting.')]);
E('faith','Questions about your faith',0.9,[3,99],C=>{const ev=GM.STATE_ATTR[C.race.st].evang;return (['Muslim','Atheist','Hindu or Buddhist'].includes(C.cand.religion)&&ev>25)||(C.cand.religion==='Evangelical Protestant'&&ev<15);},C=>'A talk-radio host is questioning whether you share the state\'s values.',[
 ch('Speak openly about your faith or beliefs','Honest, steady.',{fav:-0.5,enth:2},'Voters respected your openness.'),
 ch('Talk about shared values','Common ground.',{fav:0.5},'You found common ground with listeners.')]);
E('coverage','Biased coverage',0.7,[3,99],C=>C.cand.gender!=='Man'||C.cand.race!=='White',C=>'Coverage of you keeps focusing on things unrelated to your platform.',[
 ch('Call it out','Fires up supporters.',{enth:3,media:-1},'Supporters rallied around you.'),
 ch('Ignore it and focus','Quiet.',{fav:0.5},'You moved the conversation to policy.')]);
E('stamina','Long campaign trail',0.6,[6,99],C=>C.cand.age>=65,C=>'The campaign schedule is wearing on you.',[
 ch('Take a rest day','Lose some time, avoid trouble.',{time:-1},'The rest day helped.'),
 ch('Push through','Risk.',{},'',{roll:{sk:'cri',base:0.5,per:0.04,win:{enth:2},lose:{fav:-2,media:-3,time:-1}},winRes:'You pushed through and looked tireless.',loseRes:'You looked exhausted on camera.'})]);
E('pressure','Major parties lean on you',1.2,[3,99],C=>C.indep,C=>'Both major parties are pressuring you to drop out. Aides say you are splitting the vote.',[
 ch('Hold firm','Voters like independence.',{enth:4,fav:1},'Your supporters cheered your resolve.'),
 ch('Hear them out','Costs time, may split your base.',{time:-1,enth:-2},'Rumors of a deal spooked some supporters.')]);
E('rules','Debate access rules',1.0,[6,99],C=>C.indep&&C.week===Math.min(C.weeks-4,8),C=>C.polls.length&&C.polls[C.polls.length-1].me>=15?'Your polling meets the threshold for the debates.':'Your polling falls short of the debate threshold.',[
 ch('Understood','',{},'')],{forced:true,after:(C)=>{C.flags.debateAccess=C.polls.length&&C.polls[C.polls.length-1].me>=15;}});
E('octsurp','October surprise',2.0,[0,0],C=>false,C=>'',[],{});
// October surprises are generated in code below
const OCT=[
 {t:'Economic jolt',x:C=>'A sudden jobs report rocks the race.',ch:[
  ch('Blame the opponent\'s party','Zero-sum.',{enth:3,oppFav:-2},'The finger-pointing split the room.'),
  ch('Offer a calm plan','Policy depth helps.',{},'',{roll:{sk:'pol',base:0.35,per:0.06,win:{fav:4,media:3},lose:{fav:-1}},winRes:'Voters liked the calm plan.',loseRes:'The plan did not cut through.'})]},
 {t:'Foreign crisis',x:C=>'A foreign crisis dominates the news.',ch:[
  ch('Talk about leadership','Crisis handling matters.',{},'',{roll:{sk:'cri',base:0.35,per:0.06,win:{fav:4,media:4},lose:{fav:-2,media:-2}},winRes:'You looked steady.',loseRes:'You looked out of your depth.'}),
  ch('Stay local','Look unaffected.',{enth:-1},'You kept to local issues.')]},
 {t:'Late scandal',x:C=>'A late-breaking story hits the race. Voters are watching how you handle it.',ch:[
  ch('Go on offense','Pay for ads.',{cash:-40,oppFav:-4,fav:-1},'The counterattack kept the story roughly even.'),
  ch('Absorb it','Quiet.',{fav:-2},'The story faded.')]}];

GM.pickEvents=function(C){
  const r=C.rng,out=[];
  const forced=EV.filter(e=>e.forced&&e.cond(C)&&C.week>=e.week[0]&&C.week<=e.week[1]&&!C.seenEv[e.id+C.week]);
  for(const e of forced){out.push(GM.instEvent(C,e));C.seenEv[e.id+C.week]=1;}
  // debate weeks
  if(C.week===C.weeks-5||C.week===C.weeks-2)out.push(GM.instEvent(C,{id:'debate',title:C.week===C.weeks-5?'First debate':'Final debate',w:0,week:[0,99],cond:()=>true,text:C=>'Debate night. '+(C.indep&&!C.flags.debateAccess&&C.week<=C.weeks-2?'You were not invited to the stage, so you are limited to a counter-programming event.':'Millions are watching.'),choices:[
    ch('Play it safe','Lower variance.',{},'',{debateStyle:0}),
    ch('Go on offense','Higher variance.',{},'',{debateStyle:1})],sk:'deb'}));
  // random events
  const nEv=C.week===1?0:(r()<0.55?1:(r()<0.25?2:0));
  for(let i=0;i<nEv;i++){
    const pool=EV.filter(e=>e.w>0&&!e.forced&&C.week>=e.week[0]&&C.week<=e.week[1]&&e.cond(C)&&(!C.seenEv[e.id]||(e.id==='issue'||e.id==='oppo_drop')));
    if(!pool.length)break;
    let tot=0;for(const e of pool)tot+=e.w;let x=r()*tot,pick=pool[0];for(const e of pool){x-=e.w;if(x<=0){pick=e;break;}}
    C.seenEv[pick.id]=1;out.push(GM.instEvent(C,pick));
  }
  if(C.week>=C.weeks-3&&C.week<C.weeks&&!C.flags.oct&&r()<0.5){C.flags.oct=1;const o=GM.octSurprise(C);out.push(GM.instEvent(C,{id:'oct',title:'October surprise: '+o.t,w:0,week:[0,99],cond:()=>true,text:o.x,choices:o.ch,sk:'cri'}));}
  return out;
};
GM.instEvent=function(C,e){return {id:e.id,title:e.title,text:typeof e.text==='function'?e.text(C):e.text,choices:e.choices.map(c=>({...c})),sk:e.sk||'cri',after:e.after,resolved:false};};
GM.choose=function(C,ev,idx){
  const c=ev.choices[idx],r=C.rng;
  if(c.needsDirt&&C.dirt-C.dirtUsed<=0)return {ok:false,msg:'You need opposition findings for that.'};
  if(c.needsDirt)C.dirtUsed++;
  const skK=0.8+0.05*C.skill[ev.sk||'cri']+(GM.hasRole(C,'mgr')?0.03:0)+(C.staff.some(s=>s.quirk==='fixer')?0.08:0);
  let fx={...c.fx},res=c.res||'';
  const scaleBad=f=>{const o={};for(const k in f){o[k]=(f[k]<0&&k!=='cash'&&k!=='loyalty'&&k!=='time'?f[k]*(1.3-0.06*C.skill[ev.sk||'cri']):f[k]);}return o;};
  fx=scaleBad(fx);
  if(ev.id==='debate'){
    const mine=C.skill.deb+C.skill.cha*0.5+C.debate*1.5+(c.debateStyle?gauss(r)*2.4:gauss(r)*1.1);
    const o=C.opp,theirs=5+(o.weak.id==='bland'?-1.5:0)+(o.sk.cha-5)*0.5+gauss(r)*1.4;
    const accessMiss=C.indep&&!C.flags.debateAccess;
    const diff=(mine-5.5)-(theirs-5);
    if(accessMiss){fx={fav:-0.5,media:-2};res='You were shut out of the debate and the coverage went elsewhere.';}
    else if(diff>1.2){fx={fav:4+(c.debateStyle?1:0),media:4,enth:2,oppFav:-1};res='You won the debate on points and the coverage was glowing.';}
    else if(diff>-1.2){fx={fav:1,media:1};res='The debate was a draw, and both sides claimed victory.';}
    else{fx={fav:-3-(c.debateStyle?1.5:0),media:-4,oppFav:1};res='You had a rough night on stage and the post-debate spin was ugly.';}
    C.flags.debateDone=(C.flags.debateDone||0)+1;
  }else if(c.roll){
    const p=gcl(c.roll.base+c.roll.per*C.skill[c.roll.sk]+(skK-1)*0.1,0.05,0.95);
    if(r()<p){fx={...fx,...(c.roll.win||{})};res=c.winRes||res;}else{fx={...fx,...scaleBad(c.roll.lose||{})};res=c.loseRes||res;}
  }else if(c.issueRoll||c.issueRoll2){
    const is=topIssue(C),L=C.ct.rateT*100,A=GM.STATE_ATTR[C.race.st],e=GM.electorateMean(L,A)[is.id],p=pos(C,is.id),dist=Math.abs(p-e);
    const imp=((C.cand.pos||{})[is.id]||{w:2}).w;
    if(c.issueRoll){if(dist<1.1){fx={fav:2.5,enth:1};res='Your position on '+is.name.toLowerCase()+' sits well with voters here.';}else if(dist<2){fx={fav:0};res='Your answer on '+is.name.toLowerCase()+' drew a mixed reaction.';}else{fx={fav:-3,media:-2};res='Your position on '+is.name.toLowerCase()+' is far from most voters here, and your answer drew criticism.';}}
    else{if(dist<1.1){fx={fav:3.5,enth:3,media:2};res='You made '+is.name.toLowerCase()+' your signature and voters rewarded it.';}else{fx={fav:-4+imp*0,enth:3,media:-2};res='You doubled down on '+is.name.toLowerCase()+' in a state that disagrees. Your base loved it. Others did not.';}}
  }
  GM.applyFx(C,fx);
  if(c.quit&&C.staff.length){const s=gpick(r,C.staff);C.staff=C.staff.filter(x=>x!==s);C.pool[s.role].push(GM.makePerson(r,s.role,0));res+=' '+s.name+' left.';}
  if(c.fireRandom&&C.staff.length){const s=C.staff.slice().sort((a,b)=>a.loyalty-b.loyalty)[0];C.staff=C.staff.filter(x=>x!==s);C.pool[s.role].push(GM.makePerson(r,s.role,0));res+=' '+s.name+' is gone.';}
  ev.resolved=true;ev.result=res;ev.fx=fx;
  if(ev.after)ev.after(C);
  C.log.push({w:C.week,t:ev.title+': '+res});
  GM.newsPush(C,ev.title+': '+res);
  return {ok:true,msg:res,fx};
};

/* ---------- opponent AI + week turnover ---------- */
GM.oppTurn=function(C,o){
  const r=C.rng,arch=o.arch,S=C.scale;
  const inc=GM.cashK(C,({house:22,gov:80,sen:140,pres:520})[C.race.office]/C.scale*C.scale)*(o.weak.id==='cash'?0.6:1)*(0.6+0.08*o.sk.fund)*(1+o.stat.fav/150);
  o.cash+=inc;
  const sat=Math.max(0.25,1-o.stat.nameId/120);
  const trailing=(C.polls.length&&((C.indep?false:C.polls[C.polls.length-1].margin>2)));
  const leading=(C.polls.length&&(!C.indep&&C.polls[C.polls.length-1].margin<-5));
  const w={...arch.w};
  if(trailing){w.attack=(w.attack||0)+2;w.oppo=(w.oppo||0)+1;}
  if(leading){w.attack=0.2;w.fund=(w.fund||0)+1;}
  if(C.week>=C.weeks-4){w.gotv=(w.gotv||0)+3;w.tv=(w.tv||0)+1;}
  o.lastActs=[];let picks=0,guard=0;
  while(picks<3&&guard++<12){
    const keys=Object.keys(w).filter(k=>w[k]>0);let tot=0;for(const k of keys)tot+=w[k];let x=r()*tot,k=keys[0];for(const q of keys){x-=w[q];if(x<=0){k=q;break;}}
    const costs={tv:150,digital:40,attack:120,oppo:30,vol:15,field:15,gotv:50,rally:10,visit:3,press:0,fund:0,endorse:0};
    const cost=GM.cashK(C,costs[k]||0);
    if(o.cash<cost)continue;o.cash-=cost;picks++;
    const st=o.stat,sk=o.sk;
    switch(k){
      case 'tv':st.nameId+=4.8*sat*(0.55+0.08*sk.med);st.fav+=0.9*sat;o.lastActs.push('TV ads');break;
      case 'digital':st.nameId+=1.8*sat;o.lastActs.push('digital ads');break;
      case 'attack':{const hit=3.4*(0.55+0.08*sk.med)*(C.flags.rapid?0.7:1);C.me.fav-=hit*(r()<0.2?0:1)*(1-0.03*(GM.hasRole(C,'comm')?GM.hasRole(C,'comm').skill:0));o.lastActs.push('an attack ad on you');break;}
      case 'oppo':o.oppo++;if(r()<0.28&&(C.cand.baggage||[]).length){o.dirtOnMe=Math.min(2,o.dirtOnMe+1);}o.lastActs.push('opposition research');break;
      case 'field':case 'vol':st.field+=4.4*(0.55+0.08*sk.org);o.lastActs.push('volunteer drives');break;
      case 'gotv':st.field+=5.5*(0.55+0.08*sk.org);st.enth+=2;o.lastActs.push('a turnout push');break;
      case 'rally':st.enth+=4.5*(0.55+0.08*sk.cha);st.nameId+=2.2*sat;st.media+=2;o.lastActs.push('a rally');break;
      case 'visit':st.fav+=2*(0.55+0.08*sk.cha);o.lastActs.push('local visits');break;
      case 'press':{st.media+=3.5*(0.55+0.08*sk.med);if(o.weak.id==='gaffe'&&r()<0.35){st.fav-=2.5;st.media-=3;o.lastActs.push('an interview that went badly');}else o.lastActs.push('press interviews');break;}
      case 'fund':{const amt=GM.cashK(C,38)*(0.55+0.08*sk.fund)*(o.weak.id==='cash'?0.6:1);o.cash+=amt;o.lastActs.push('fundraising calls');break;}
      case 'endorse':if(r()<0.4){st.fav+=2.5;st.media+=3;o.lastActs.push('a new endorsement');}break;
    }
    w[k]*=0.5;
  }
  if(o.dirtOnMe>0&&r()<0.5){const hit=2.5*o.dirtOnMe;C.me.fav-=hit;GM.newsPush(C,o.name+' released opposition research about you.');o.dirtOnMe=0;}
  const st=o.stat;
  st.nameId=gcl(st.nameId,0,100);st.fav=gcl(st.fav,-40,40);st.enth=gcl(st.enth,0,100);st.field=gcl(st.field,0,100);st.media=gcl(st.media,-60,60);
};
GM.endWeek=function(C){
  if(C.phase!=='plan')return {ok:false};
  const r=C.rng;
  // upkeep
  const up=GM.weeklyUpkeep(C);C.cash-=up;
  // passive income
  const base=GM.cashK(C,({house:22,gov:80,sen:140,pres:520})[C.race.office]/C.scale*C.scale)*(C.indep?0.4:1)*(0.6+0.07*C.skill.fund)*(1+C.me.fav/150)*C.S.cashMult;
  C.cash+=base;C.raised+=base;
  // opponents act
  for(const o of C.opps)GM.oppTurn(C,o);
  // decay
  const m=C.me,m0=C.me0;
  m.nameId*=0.97;m.fav+=(m0.fav-m.fav)*0.06;m.enth+=(m0.enth-m.enth)*0.1;m.field=m0.field+(m.field-m0.field)*0.94;m.media*=0.7;
  for(const o of C.opps){const s=o.stat,s0=o.stat0;s.nameId*=0.97;s.fav+=(s0.fav-s.fav)*0.06;s.enth+=(s0.enth-s.enth)*0.1;s.field=s0.field+(s.field-s0.field)*0.94;s.media*=0.7;}
  // staff drift
  const trailing=C.polls.length&&!C.indep&&C.polls[C.polls.length-1].margin<-4;
  const quit=[];
  for(const s of C.staff){
    s.weeks++;
    s.loyalty=gcl(s.loyalty+(C.cash<0?-6:1)+(trailing?-2.5:0.5)+(s.quirk==='loyal'?(trailing?1.5:0.5):0)-(s.quirk==='merc'&&trailing?3:0),0,100);
    if(s.loyalty<18&&r()<0.5)quit.push(s);
  }
  for(const s of quit){C.staff=C.staff.filter(x=>x!==s);C.pool[s.role].push(GM.makePerson(r,s.role,0));GM.newsPush(C,s.name+' quit the campaign.');C.log.push({w:C.week,t:s.name+' ('+GM.ROLES.find(x=>x.id===s.role).name.toLowerCase()+') quit.'});}
  // ballot access deadline
  if(C.indep&&C.week===C.accessDeadline&&C.access<100){C.failed=true;C.done=true;C.phase='over';GM.newsPush(C,'You missed the filing deadline and will not appear on the ballot.');return {ok:true,failed:true};}
  C.phase='events';
  C.pending=GM.pickEvents(C);
  if(C.cash<0)GM.newsPush(C,'The campaign is in the red by $'+Math.round(-C.cash)+'K.');
  return {ok:true,upkeep:up,income:base,events:C.pending};
};
GM.closeWeek=function(C){
  const r=C.rng;
  // poll
  const pp=GM.makePoll(C,600);C.polls.push(pp);
  const lead=pp.margin;
  GM.newsPush(C,C.indep?('New poll: '+GM.pollTxt(C,pp)):('New poll: '+GM.pollTxt(C,pp)+(Math.abs(lead)<=pp.moe?' — within the margin of error.':lead>0?' — you lead.':' — you trail.')));
  const o=C.opp;
  if(o.lastActs.length)GM.newsPush(C,o.name+' spent the week on '+o.lastActs.slice(0,3).join(', ')+'.');
  const mediaTone=C.me.media>8?'friendly':C.me.media<-8?'hostile':'mixed';
  GM.newsPush(C,'Local coverage of your campaign is '+mediaTone+'.');
  if([4,8,12].includes(C.week)||C.week===C.weeks-1)GM.newsPush(C,'Fundraising report: you hold $'+Math.round(C.cash)+'K, '+o.name+' reports about $'+Math.round(o.cash)+'K.');
  if(C.week>=C.weeks-1){
    const ret=C.week===C.weeks?72:38;GM.newsPush(C,'Early voting: about '+ret+'% of the expected vote has been cast. Your field strength is '+Math.round(C.me.field)+' on a 100 scale.');
  }
  C.pending=[];C.phase='plan';C.week++;C.time=C.timeNext;C.timeNext=6;C.fcalls=0;C.acts=[];
  if(C.flags.policyShield>0)C.flags.policyShield--;
  if(C.week>C.weeks){C.done=true;C.phase='over';}else GM.mediaWeek(C);
  return {poll:pp};
};
/* Final package for the election night engine. */
GM.finalize=function(C){
  const tm=GM.trueMargins(C),cand=C.cand;
  const noise=gauss(C.rng)*0.8;
  const out={id:C.race.id,office:C.race.office,st:C.race.st,party:cand.party,name:cand.name,
    oppD:C.opps.find(o=>o.party==='D')?C.opps.find(o=>o.party==='D').name:null,oppR:C.opps.find(o=>o.party==='R')?C.opps.find(o=>o.party==='R').name:null,
    summary:{hid:GM.hidReveal(C),static:C.S.total,dyn:GM.dyn(C),weeks:C.weeks,raised:C.raised,spent:C.spent,endorse:C.endorse,finalPoll:C.polls.length?C.polls[C.polls.length-1]:null,access:C.access,failed:C.failed,parts:C.S.parts}};
  const slope=0;
  if(C.failed){out.failed=true;return out;}
  if(!C.indep){
    const eff=tm.m-C.sign*C.baseDR;               // player-signed points relative to what polls saw
    const full=C.S.total+GM.dyn(C)-C.opp.static;      // full campaign effect, player-signed pts
    out.eff=full;out.effD=C.sign*full/100;out.geo=0;
  }else{
    const I=gcl(tm.I+noise*0.3,0.5,30);
    out.ind={share:I/100,spoil:(I*(1-2*tm.pD))/100,x:tm.x};
    out.eff=tm.x;out.effD=(tm.dr-C.baseDR)/100*0+0;out.geo=0;
    out.effD=(tm.dr-C.baseDR-(C.envDrift||0)-(I*(1-2*tm.pD)))/100;   // D-R shift from the major candidates' campaigns
  }
  if(C.race.office==='pres'&&C.S.byState){
    out.by={};
    for(const st in C.S.byState){
      if(!C.indep)out.by[st]=C.sign*(C.S.byState[st]+GM.dyn(C)-C.opp.static)/100;
      else out.by[st]=(tm.dr-C.baseDR-(out.ind.share*100*(1-2*tm.pD)))/100+0*(C.S.byState[st]);
    }
  }
  out.env=(C.envDrift||0)/100;
  if(C.regions&&C.regions.length){
    const mf=C.regions.reduce((s,r)=>s+r.share*GM.regionFit(C,r),0),sgn=C.indep?0:C.sign;
    const raw={};let mean=0;
    for(const r of C.regions){raw[r.id]=sgn*(4*(GM.regionFit(C,r)-mf)+r.swing)/100;mean+=r.share*raw[r.id];}
    out.regionOff={};for(const r of C.regions)out.regionOff[r.id]=raw[r.id]-mean;
  }
  out.coat=C.race.office==='pres'?(C.sign||0)*0.12*(out.eff||0)/100:0;
  return out;
};
GM.listRaces=function(N0,scen,office){
  const out=[];
  for(const c of N0.contests){
    if(c.office!==office)continue;
    out.push({id:c.id,office:c.office,st:c.st,label:c.label,rate:c.rateT,prev:c.prev});
  }
  return out;
};

/* Realistic national environment for campaign mode, in points of D-R shift. 2026 uses the real baseline (0). 2028 is drawn from past swings (sd about 3, capped at 7). */
GM.realEnv=function(scen,seed){
  if(scen==='2026')return 0;
  const r=mulberry32((seed^0x51ed270b)>>>0);
  return Math.round(gcl(gauss(r)*3,-7,7)*2)/2;
};

/* Real 2026 nominee names, when the cycle is 2026 and the data has them. */
GM.realName=function(N0,race,party){
  if(N0.scen!=='2026'||!GM.CANDS||race.office==='pres')return null;
  let row=null;
  if(race.office==='sen')row=GM.CANDS.sen[race.st];else if(race.office==='gov')row=GM.CANDS.gov[race.st];
  else{const lab=(N0.byId[race.id]||{}).label||'',d=String(lab).split('-')[1],H=GM.CANDS.house[race.st];if(H)row=H[d]||(Object.keys(H).length===1?H[Object.keys(H)[0]]:null);}
  if(!row)return null;
  const v=party==='D'?row[0]:row[1];
  return v?v.replace(/\s*\(.\)$/,''):null;
};

GM.hidReveal=function(C){
  const A=C.race.office==='pres'?GM.NATA:(GM.STATE_ATTR[C.race.st]||GM.NATA),Lm=C.race.office==='pres'?0:(C.ct.baseT||0)*100,out=[];
  out.push(...GM.hidText(C.hid,A,Lm,C.cand.name.split(' ')[0]==='Alex'?C.cand.name:C.cand.name));
  if(!C.indep)out.push(...GM.hidText(C.opp.hid,A,Lm,C.opp.name));
  return out;
};
