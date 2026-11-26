/* ===== Strategy layer: electorate model, regions, voter blocs, message themes, weekly plan, media weeks. Needs game_data.js, media.js, game.js. ===== */
"use strict";

/* ---------- electorate model ---------- */
GM.QK={tariffs:-0.5,aca:-0.7,vaccines:-0.3,ice:-0.3,trans:0.3,energy:0.2,spending:0.3,minwage:-0.5,studentdebt:0.2,drugs:-0.4,redistrict:-0.2,justice:-0.3,nato:-0.4,ukraine:-0.2,china:0.5,iran:-0.3,ethics:-0.5,israel:0.1};
GM.NATA={black:13,hisp:19,asian:6,evang:25,college:38,rural:19};
GM.electorateMean=function(L,A){
  const ln=gcl(L/25,-1.2,1.2),m={};
  for(const is of GM.ISSUES){
    let q=GM.QK[is.id]||0;
    if(is.id==='guns')q+=(A.rural-25)*0.03;
    else if(is.id==='abort'||is.id==='culture'||is.id==='trans')q+=(A.evang-25)*0.025;
    else if(is.id==='immig')q+=0.15;
    else if(is.id==='climate')q+=(25-A.rural)*0.01;
    else if(is.id==='energy')q+=(A.rural-25)*0.012;
    m[is.id]=gcl(-ln*is.load+q,-2,2);
  }
  return m;
};
const fitF=(p,e)=>0.55-Math.abs(p-e)/3.6;
GM.fitF=fitF;
GM.stanceOf=function(cand,id){const p=(cand.pos||{})[id];return p?p.s:(GM.PARTY_STANCE[cand.party]||GM.PARTY_STANCE.I)[id];};
GM.partyAvg=function(f){return (f('D')+f('R'))/2;};
GM.oppStance=function(C,o,id){return o.pos[id];};

/* ---------- regions (geographic strategy) ---------- */
GM.CLASSES=[
 {id:'metro',name:'Large metros',rural:3,col:55},
 {id:'suburb',name:'Suburbs and mid-size counties',rural:12,col:40},
 {id:'town',name:'Small towns and exurbs',rural:38,col:24},
 {id:'rural',name:'Rural counties',rural:72,col:16}];
GM.classOf=u=>u>=0.72?'metro':u>=0.5?'suburb':u>=0.28?'town':'rural';
GM.buildRegions=function(N0,race,A,L){
  const ct=N0.byId[race.id],set=N0.sets[ct.set],out=[];
  const virtual=race.office==='house'||set.counties.length<4;
  const tot={};let T=0;
  for(const c of set.counties){const V=c.V||c.B.reduce((a,b)=>a+b,0),k=GM.classOf(c.u);tot[k]=tot[k]||{V:0,mv:0,n:[]};tot[k].V+=V;tot[k].mv+=V*c.mb;tot[k].n.push([c.name,V]);T+=V;}
  if(virtual){
    const ru=A.rural/100,w={metro:Math.max(0.03,0.32-0.45*ru),suburb:0.36-0.22*ru,town:0.2+0.12*ru,rural:0.08+0.55*ru},sw=w.metro+w.suburb+w.town+w.rural;
    const off={metro:14,suburb:3,town:-8,rural:-20};let mean=0;
    for(const k in w)mean+=w[k]/sw*off[k];
    for(const cl of GM.CLASSES)out.push({id:cl.id,name:cl.name,share:w[cl.id]/sw,lean:L+off[cl.id]-mean,names:[],virtual:true,rural:cl.rural,col:cl.col});
  }else{
    for(const cl of GM.CLASSES){const t=tot[cl.id];if(!t||t.V/T<0.02)continue;t.n.sort((a,b)=>b[1]-a[1]);out.push({id:cl.id,name:cl.name,share:t.V/T,lean:t.mv/t.V*100,names:t.n.slice(0,3).map(x=>x[0]),virtual:false,rural:cl.rural,col:cl.col});}
    let s=0;for(const r of out)s+=r.share;for(const r of out)r.share/=s;
  }
  return out;
};

/* ---------- voter blocs (who you court) ---------- */
GM.BLOCS=[
 {id:'black',name:'Black voters',sh:A=>A.black,lean:72,pri:['police','health','minwage','justice','redistrict','educ'],grp:'Black'},
 {id:'latino',name:'Latino voters',sh:A=>A.hisp,lean:12,pri:['econ','ice','immig','health','house','minwage'],grp:'Hispanic or Latino'},
 {id:'asian',name:'Asian American voters',sh:A=>A.asian,lean:22,pri:['educ','china','immig','econ','health'],grp:'Asian American'},
 {id:'evang',name:'Evangelical and traditional voters',sh:A=>A.evang,lean:-52,pri:['abort','trans','culture','israel','educ'],rel:'Evangelical Protestant'},
 {id:'college',name:'College-educated voters',sh:A=>A.college*0.7,lean:14,pri:['democ','abort','climate','ethics','educ','justice']},
 {id:'wc',name:'Working-class voters',sh:A=>(100-A.college)*0.45,lean:-20,pri:['econ','tariffs','minwage','immig','trade','spending']},
 {id:'rural',name:'Rural voters',sh:A=>A.rural,lean:-34,pri:['guns','energy','culture','tariffs','immig','drugs']},
 {id:'young',name:'Young voters (under 35)',sh:A=>20,lean:20,pri:['studentdebt','house','climate','israel','trans','drugs'],young:true},
 {id:'seniors',name:'Seniors (65 and over)',sh:A=>22,lean:-4,pri:['safety','health','aca','vaccines','spending','tax'],old:true},
 {id:'indep',name:'Independents and swing voters',sh:A=>22,lean:0,pri:['econ','democ','ethics','spending','tax','health']},
 {id:'women',name:'Suburban women',sh:A=>12,lean:10,pri:['abort','educ','guns','health','democ','vaccines']},
 {id:'vets',name:'Veterans and military families',sh:A=>8,lean:-14,pri:['foreign','iran','nato','ukraine','china','health']},
 {id:'union',name:'Union households',sh:A=>10,lean:6,pri:['minwage','tariffs','econ','trade','energy','health']}];
GM.blocPos=function(b,L,A){return GM.electorateMean(0.4*L+0.6*b.lean,A);};
GM.blocW=function(b,id){return b.pri.includes(id)?1:0.15;};
/* fit of candidate (stance getter) vs a bloc or region electorate, weighted by what that group cares about */
GM.groupFit=function(getStance,e,wfn){
  let s=0,t=0;
  for(const is of GM.ISSUES){const w=wfn(is.id);s+=w*fitF(getStance(is.id),e[is.id]);t+=w;}
  return s/t;
};

/* ---------- salience ---------- */
GM.salNow=function(C){
  const polls=C.N0polls,st=C.race.office==='pres'?null:C.race.st;
  const L=(st&&polls.stateIssues&&polls.stateIssues[st])||polls.issues,m={};
  for(const i of L)m[i.id]=i.pct;
  for(const g in C.salBoost)if(m[g]!==undefined||true)m[g]=(m[g]||3)*(1+C.salBoost[g]);
  const cnt={};for(const is of GM.ISSUES)cnt[is.sal]=(cnt[is.sal]||0)+1;
  let tot=0;const s={};
  for(const is of GM.ISSUES){s[is.id]=(m[is.sal]||3)/cnt[is.sal];tot+=s[is.id];}
  for(const k in s)s[k]/=tot;
  return s;
};

/* ---------- setting up the strategy state on a campaign ---------- */
GM.initStrategy=function(C,N0){
  const pres=C.race.office==='pres';
  C.N0polls=N0.polls;
  C.A=pres?GM.NATA:GM.STATE_ATTR[C.race.st];
  C.L=C.baseDR; // electorate lean in D-R points before the campaign
  C.e0=GM.electorateMean(C.L,C.A);C.e={...C.e0};
  C.salBoost={};C.envDrift=0;C.eBloc=0;C.eGeo=0;
  C.vnoise={};for(const is of GM.ISSUES)C.vnoise[is.id]={e:gauss(C.rng)*0.5,s:gauss(C.rng)*0.2};
  C.exact=0;
  C.regions=GM.buildRegions(N0,C.race.office==='pres'?{id:'pres:'+C.cand.home,office:'pres',st:C.cand.home}:C.race,C.A,C.L);
  for(const r of C.regions){r.e=GM.electorateMean(r.lean,{...C.A,rural:r.rural,college:r.col});r.swing=0;}
  C.blocs=GM.BLOCS.map(b=>({...b,share:Math.max(2,b.sh(C.A)),e:GM.blocPos(b,C.L,C.A),swing:0,oswing:0}));
  // opponent platforms
  for(const o of C.opps){
    o.pos={};const t=GM.PARTY_STANCE[o.party];
    const mod=gcl(gauss(C.rng)*0.25,-0.4,0.4);
    for(const is of GM.ISSUES)o.pos[is.id]=gcl(t[is.id]*(1-mod)+gauss(C.rng)*0.45,-2,2);
    o.themes=[];o.oswing=0;
  }
  C.plan=GM.defaultPlan(C);
  C.sActive=[];C.backlog=[];C.mood=[];C.campLog=[];
};
GM.mine=(C,id)=>GM.stanceOf(C.cand,id);
GM.oppFitAt=function(C,id,e){ // opponent fit; independents face both major candidates
  const g=o=>fitF(o.pos[id],e);
  return C.indep?(g(C.opps[0])+g(C.opps[1]))/2:g(C.opp);
};
GM.adv=function(C,id,e){return fitF(GM.mine(C,id),e)-GM.oppFitAt(C,id,e);};

/* ---------- the plan ---------- */
GM.MONEY=[
 {id:'tv',name:'Television',desc:'Name ID and favorability at scale.',unit:[0,40,100,200,350]},
 {id:'digital',name:'Digital and social ads',desc:'Cheaper, narrower, youth-heavy.',unit:[0,15,40,80,140]},
 {id:'field',name:'Field program',desc:'Canvassers and phone banks. Counts most late.',unit:[0,12,30,60,100]},
 {id:'mail',name:'Direct mail',desc:'Persuasion for seniors, independents and suburbs.',unit:[0,10,25,45,70]},
 {id:'research',name:'Opposition research',desc:'Look for something real on your opponent.',unit:[0,10,25,50,80]},
 {id:'circ',name:'Paid circulators',desc:'Buy ballot-access signatures.',unit:[0,15,40,80,120],indep:true}];
GM.TIME=[
 {id:'fund',name:'Fundraising calls',desc:'Dollars for the weeks ahead.'},
 {id:'retail',name:'Campaigning in person',desc:'Rallies, town halls and diners. Aimed by your map and voter targets.'},
 {id:'media',name:'Press and interviews',desc:'Earned media. Risk of a gaffe.'},
 {id:'policy',name:'Policy and debate prep',desc:'Makes your message land and sharpens debates.'},
 {id:'staff',name:'Managing staff',desc:'Keeps your team loyal and focused.'},
 {id:'sig',name:'Gathering signatures',desc:'Ballot access for independents.',indep:true}];
GM.SPECIALS=[
 {id:'none',name:'No special move'},
 {id:'endorse',name:'Court a big endorsement',desc:'Costs a day. Strong validator if it lands.'},
 {id:'issuepoll',name:'Commission an issue poll',desc:'Costs money. Shows exactly where voters stand this week.'},
 {id:'rollout',name:'Roll out a major policy plan',desc:'Pick an issue. Great if you are with voters on it, painful if you are not.',arg:true},
 {id:'attackweak',name:'Hit your opponent’s weak spot',desc:'Uses opposition findings if you have them.'}];
GM.defaultPlan=function(C){
  const plan={themes:[],tone:1,geo:{},blocs:[],money:{tv:1,digital:1,field:1,mail:0,research:0,circ:0},time:{fund:2,retail:3,media:1,policy:0,staff:0,sig:0},special:{id:'none',arg:null}};
  const sal=GM.salNow(C);
  const sc=GM.visIssues().map(is=>({id:is.id,v:sal[is.id]*GM.adv(C,is.id,C.e[is.id])+0.02*sal[is.id]})).sort((a,b)=>b.v-a.v);
  plan.themes=sc.slice(0,2).map(x=>x.id);
  const n=C.regions.length;let rem=10;
  C.regions.forEach((r,i)=>{const k=i===n-1?rem:Math.round(10*r.share);plan.geo[r.id]=k;rem-=k;});
  const tot=Object.values(plan.geo).reduce((a,b)=>a+b,0);if(tot!==10){plan.geo[C.regions[0].id]+=10-tot;}
  const bs=C.blocs.map(b=>({id:b.id,v:b.share*(1+GM.groupFit(id=>GM.mine(C,id),b.e,i=>GM.blocW(b,i))-GM.groupFit(id=>C.indep?0:C.opp.pos[id],b.e,i=>GM.blocW(b,i)))})).sort((a,b)=>b.v-a.v);
  plan.blocs=bs.slice(0,2).map(x=>x.id);
  if(C.indep){plan.time.sig=3;plan.time.retail=1;plan.money.circ=1;}
  return plan;
};
GM.planCost=function(C,plan){
  let days=0,cash=0;
  for(const k in plan.time){if(plan.time[k]){if(k==='sig'&&!C.indep)continue;days+=plan.time[k];}}
  if(plan.special.id==='endorse')days+=1;
  for(const m of GM.MONEY){if(m.indep&&!C.indep)continue;cash+=GM.cashK(C,m.unit[plan.money[m.id]||0]);}
  if(plan.special.id==='issuepoll')cash+=GM.cashK(C,25);
  return {days,cash};
};

/* ---------- fundamentals of one week ---------- */
GM.msgScore=function(C,themes,who){
  // who: 'me' or an opponent object. Returns {M, parts[]}
  const sal=GM.salNow(C);let M=0;const parts=[];
  for(const id of themes){
    const e=C.e[id];
    const a=who==='me'?GM.adv(C,id,e):(fitF(who.pos[id],e)-(C.indep?fitF(GM.mine(C,id),e):fitF(GM.mine(C,id),e)));
    const c=(1/themes.length)*(0.6+4*sal[id])*a;
    M+=c;parts.push({id,adv:a,sal:sal[id],c});
  }
  return {M,parts};
};
GM.bloc=(C,id)=>C.blocs.find(b=>b.id===id);
GM.blocFit=function(C,b){
  const mine=GM.groupFit(id=>GM.mine(C,id),b.e,i=>GM.blocW(b,i));
  const opp=C.indep?GM.partyAvg(P=>GM.groupFit(id=>C.opps.find(o=>o.party===P).pos[id],b.e,i=>GM.blocW(b,i))):GM.groupFit(id=>C.opp.pos[id],b.e,i=>GM.blocW(b,i));
  return mine-opp;
};
GM.regionFit=function(C,r){
  const w=()=>1;
  const mine=GM.groupFit(id=>GM.mine(C,id),r.e,w);
  const opp=C.indep?GM.partyAvg(P=>GM.groupFit(id=>C.opps.find(o=>o.party===P).pos[id],r.e,w)):GM.groupFit(id=>C.opp.pos[id],r.e,w);
  return mine-opp;
};
GM.tie=function(C,b){
  const c=C.cand;let t=0;
  if(b.grp&&c.race===b.grp)t+=1;
  if(b.rel&&c.religion===b.rel)t+=1;
  if(b.young&&c.age<40)t+=1;
  if(b.old&&c.age>=62)t+=1;
  if(b.id==='vets'&&c.bg==='veteran')t+=1;
  if(b.id==='union'&&c.bg==='union')t+=1;
  if(b.id==='wc'&&['union','farmer','smallbiz'].includes(c.bg))t+=0.5;
  if(b.id==='college'&&C.S&&c.tier===2)t+=0.5;
  return Math.min(1,t);
};
GM.skF=(C,k)=>0.55+0.07*C.skill[k];

/* run the plan for the current week. Returns {report} and sets C.pending (events) */
GM.runWeek=function(C){
  if(C.phase!=='plan')return {ok:false};
  const r=C.rng,P=C.plan,m=C.me,sat=GM.sat(C),rep={lines:[],spend:0,raised:0};
  const mg=GM.mg(C);
  // --- budget check
  let cost=GM.planCost(C,P);
  const trimOrder=['tv','digital','field','mail','research','circ'];
  let guard=0;
  while(cost.cash>C.cash&&guard++<40){let best=null,bv=0;for(const id of trimOrder){const l=P.money[id]||0;if(l>0){const v=GM.MONEY.find(x=>x.id===id).unit[l];if(v>bv){bv=v;best=id;}}}if(!best)break;P.money[best]--;rep.lines.push('You could not afford your full ad plan, so '+GM.MONEY.find(x=>x.id===best).name.toLowerCase()+' was cut to level '+P.money[best]+'.');cost=GM.planCost(C,P);}
  guard=0;
  while(cost.days>C.time&&guard++<20){const k=['retail','policy','staff','media','fund'].find(x=>P.time[x]>0);if(!k)break;P.time[k]--;rep.lines.push('You ran out of days, so '+GM.TIME.find(x=>x.id===k).name.toLowerCase()+' lost a day.');cost=GM.planCost(C,P);}
  C.cash-=cost.cash;C.spent+=cost.cash;rep.spend=cost.cash;
  const d=P.time,lv=P.money;
  const wTV=[0,1,2.4,4.4,7][lv.tv],wDG=[0,1,2.4,4.4,7][lv.digital],wFD=[0,1,2.4,4.4,7][lv.field],wML=[0,1,2.4,4.4,7][lv.mail];
  const comm=GM.sf(C,'comm'),fieldF=GM.sf(C,'field'),finF=GM.sf(C,'fin');
  // --- fundraising
  if(d.fund>0){const amt=Math.round(GM.cashK(C,40)*GM.ef(C,'fund')*finF*Math.pow(d.fund,0.85)*(1+m.fav/120)*C.S.cashMult*(C.indep?0.55:1));C.cash+=amt;C.raised+=amt;rep.raised+=amt;rep.lines.push('Fundraising calls brought in '+Math.round(amt)+'K.');}
  // --- media effects
  if(d.media>0){m.media+=3.4*GM.ef(C,'med')*comm*Math.pow(d.media,0.8);const g=gcl(0.07-0.006*C.skill.med,0.015,0.1)*d.media;if(r()<g){m.fav-=2.2;m.media-=3;rep.lines.push('A stumble in an interview became a day-long story.');}}
  // --- policy and debate prep
  if(d.policy>0){C.debate=Math.min(3,C.debate+d.policy*0.5);}
  const credF=1+0.12*(d.policy||0)*GM.sf(C,'policy');
  // --- paid media
  if(wTV>0){m.nameId+=3.2*Math.sqrt(wTV)*sat*GM.ef(C,'med')*comm;m.fav+=0.7*Math.sqrt(wTV)*sat*comm;}
  if(wDG>0){m.nameId+=1.5*Math.sqrt(wDG)*sat*GM.ef(C,'med')*comm;m.enth+=1.1*Math.pow(wDG,0.7);}
  const late=C.week>=C.weeks-2?1.4:1;
  if(wFD>0){m.field+=3.8*Math.pow(wFD,0.8)*GM.ef(C,'org')*fieldF*late;m.enth+=0.6*Math.sqrt(wFD);}
  if(wML>0){m.enth+=0.5*Math.sqrt(wML);}
  // research
  if(lv.research>0){const p=0.12*lv.research+(C.opp.scandal?0.12:0);if(r()<p){C.dirt++;C.opp.known=true;rep.lines.push('Your researchers found something real on '+C.opp.name+'.');}else rep.lines.push('Opposition research turned up nothing usable.');}
  // ballot access
  if(C.indep){
    let g=0;if(d.sig>0)g+=Math.round(7*GM.ef(C,'org')*Math.pow(d.sig,0.85)+gR(r,0,3));
    if(lv.circ>0)g+=[0,6,14,24,34][lv.circ];
    if(g>0){C.access=Math.min(100,C.access+g);rep.lines.push('Ballot access is now '+C.access+'%.');}
  }
  // --- message
  const themes=P.themes.slice(0,3),tone=P.tone;
  const ms=GM.msgScore(C,themes,'me');
  let M=ms.M*credF*(1+0.12*Math.sqrt(wTV)+0.05*Math.sqrt(wDG));
  C.lastMsg=ms;
  if(themes.length){
    m.fav+=5*M;m.enth+=2.5*M*(tone>=1?1.2:0.8);
    for(const x of ms.parts){
      const is=GM.ISSUES.find(i=>i.id===x.id);
      C.salBoost[is.sal]=(C.salBoost[is.sal]||0)+0.35/themes.length;
      // persuasion of the electorate toward your stance on the issue when you are credible
      const mine=GM.mine(C,x.id);C.e[x.id]+=0.04*(mine-C.e[x.id])*(1/themes.length)*(1+GM.hasRole(C,'policy')?1.1:1)*(x.adv>-0.1?1:0.3);
    }
    if(tone>=1){
      const contrast=ms.parts.reduce((s,x)=>s+Math.max(0,x.adv)*(0.5+4*x.sal),0)/themes.length;
      const k=(tone===2?1:0.5)*(C.dirt-C.dirtUsed>0?1.35:1);
      for(const o of C.opps)o.stat.fav-=(o===C.opp?1:0.3)*6*contrast*k*comm;
      if(tone===2){C.negWeeks=(C.negWeeks||0)+1;if(C.negWeeks>=3){m.fav-=1.5;rep.lines.push('Voters are tired of the negativity and it is costing you.');}}else C.negWeeks=0;
    }else C.negWeeks=0;
    const worst=ms.parts.slice().sort((a,b)=>a.adv-b.adv)[0];
    if(worst&&worst.adv<-0.12){m.fav-=2.2*Math.abs(worst.adv)*5;rep.lines.push('Campaigning on '+GM.ISSUES.find(i=>i.id===worst.id).name.toLowerCase()+' backfired: voters are not with you on it.');}
  }else{m.enth-=1.5;rep.lines.push('Your campaign had no clear message this week.');}
  // --- special move
  const sp=P.special;
  if(sp.id==='endorse'){const p=gcl(0.3+0.03*C.skill.cha+m.fav/200+(C.indep?-0.15:0.05),0.1,0.8);if(r()<p){C.endorse++;m.fav+=3;m.media+=3;rep.lines.push('You landed a major endorsement.');}else rep.lines.push('The endorsement push came up empty.');}
  else if(sp.id==='issuepoll'){C.exact=2;rep.lines.push('Your issue poll shows voters’ views precisely this week.');}
  else if(sp.id==='rollout'&&sp.arg){const a=GM.adv(C,sp.arg,C.e[sp.arg]),is=GM.ISSUES.find(i=>i.id===sp.arg);C.salBoost[is.sal]=(C.salBoost[is.sal]||0)+0.6;if(a>0){m.fav+=3.2*GM.ef(C,'pol')*(1+a*3)*GM.sf(C,'policy');m.media+=2;rep.lines.push('Your '+is.name.toLowerCase()+' plan was well received.');}else{m.fav-=2.4*(1+Math.abs(a)*3);rep.lines.push('Your '+is.name.toLowerCase()+' plan drew heavy criticism. It is not where voters are.');}}
  else if(sp.id==='attackweak'){const hit=C.dirt-C.dirtUsed>0?6.5:(C.opp.scandal?5:2);if(hit>=6)C.dirtUsed++;for(const o of C.opps)o.stat.fav-=(o===C.opp?1:0.3)*hit*comm;if(hit<3&&r()<0.25){m.fav-=2;rep.lines.push('The attack on a weak spot looked like a stretch and backfired.');}else rep.lines.push('You hammered '+C.opp.name+'’s weak spot.');}
  // --- retail: regions and blocs
  const V=Math.max(0,d.retail);
  const vf=GM.ef(C,'cha');
  let eGeo=0;
  for(const rg of C.regions){
    const pts=(P.geo[rg.id]||0)/10,eff=V*pts;
    const fit=GM.regionFit(C,rg);
    if(eff>0){const resp=gcl(1-Math.abs(rg.lean)/60,0.35,1),satR=1-gcl(rg.swing/10,0,0.8);rg.swing+=0.8*Math.pow(eff,0.7)*vf*(0.55+0.9*gcl(fit*6,-0.5,1))*resp*satR;if(rg.id!=='metro')m.enth+=0.12*eff;}
    rg.swing*=0.94;
  }
  let eBloc=0;const targets=P.blocs.slice(0,3);
  const perBloc=targets.length?V/targets.length:0;
  for(const b of C.blocs){
    let o=targets.includes(b.id)?perBloc:0;
    const mailB=['seniors','indep','women'].includes(b.id)?1+0.12*Math.sqrt(wML):1+0.04*Math.sqrt(wML);
    const dgB=b.young?1+0.2*Math.sqrt(wDG):1;
    const fit=GM.blocFit(C,b),tie=GM.tie(C,b);
    if(o>0){const satB=1-gcl(b.swing/12,0,0.8);b.swing+=0.8*Math.pow(o,0.7)*vf*mailB*dgB*(0.5+0.9*gcl(fit*6,-0.5,1)+0.35*tie)*satB;}
    b.swing*=0.94;
  }
  // --- opponents act
  for(const o of C.opps){GM.oppMessage(C,o,rep);GM.oppTurn(C,o);GM.oppTargets(C,o);}
  // --- aggregate bloc / geo effect (net of opponent), capped
  let sb=0;for(const b of C.blocs)sb+=b.share/100*(b.swing-b.oswing);
  let sg=0;for(const rg of C.regions)sg+=rg.share*rg.swing;
  C.eBloc=3*Math.tanh(sb*0.55*3/3);C.eGeo=2*Math.tanh(sg*0.7/2);
  // --- upkeep, income, decay
  const up=GM.weeklyUpkeep(C);C.cash-=up;
  const base=GM.cashK(C,({house:22,gov:80,sen:140,pres:520})[C.race.office]/C.scale*C.scale)*(C.indep?0.4:1)*(0.6+0.07*C.skill.fund)*(1+m.fav/150)*C.S.cashMult;
  C.cash+=base;C.raised+=base;
  const m0=C.me0;
  m.nameId*=0.97;m.fav+=(m0.fav-m.fav)*0.06;m.enth+=(m0.enth-m.enth)*0.1;m.field=m0.field+(m.field-m0.field)*0.94;m.media*=0.7;
  for(const o of C.opps){const s=o.stat,s0=o.stat0;s.nameId*=0.97;s.fav+=(s0.fav-s.fav)*0.06;s.enth+=(s0.enth-s.enth)*0.1;s.field=s0.field+(s.field-s0.field)*0.94;s.media*=0.7;}
  for(const k in C.salBoost)C.salBoost[k]*=0.82;
  GM.clampMe(C);
  // --- staff drift and quits
  const trailing=C.polls.length&&!C.indep&&C.polls[C.polls.length-1].margin<-4;
  const quit=[];
  for(const s of C.staff){s.weeks++;s.loyalty=gcl(s.loyalty+(C.cash<0?-6:1)+(trailing?-2.5:0.5)+(s.quirk==='loyal'?(trailing?1.5:0.5):0)-(s.quirk==='merc'&&trailing?3:0)+1.5*(d.staff||0),0,100);if(s.loyalty<18&&r()<0.5)quit.push(s);}
  for(const s of quit){C.staff=C.staff.filter(x=>x!==s);C.pool[s.role].push(GM.makePerson(r,s.role,0));GM.newsPush(C,s.name+' quit the campaign.');rep.lines.push(s.name+' quit.');}
  // --- ballot access deadline
  if(C.indep&&C.week===C.accessDeadline&&C.access<100){C.failed=true;C.done=true;C.phase='over';GM.newsPush(C,'You missed the filing deadline and will not appear on the ballot.');return {ok:true,failed:true};}
  C.rep=rep;
  C.phase='events';
  C.pending=GM.pickEvents(C);
  if(C.cash<0)GM.newsPush(C,'The campaign is in the red by $'+Math.round(-C.cash)+'K.');
  return {ok:true,report:rep};
};
/* opponent message and targeting */
GM.oppMessage=function(C,o,rep){
  const sal=GM.salNow(C);
  const sc=GM.ISSUES.map(is=>{const e=C.e[is.id],a=fitF(o.pos[is.id],e)-fitF(GM.mine(C,is.id),e);return {id:is.id,v:sal[is.id]*a+gauss(C.rng)*0.012};}).sort((a,b)=>b.v-a.v);
  o.themes=sc.slice(0,2).map(x=>x.id);
  let M=0;for(const t of o.themes){const e=C.e[t];M+=(0.5)*(0.6+4*sal[t])*(fitF(o.pos[t],e)-fitF(GM.mine(C,t),e));}
  o.stat.fav+=6*M*(0.6+0.05*o.sk.med);
  const neg=o.arch.id==='attack'||o.arch.id==='pop'?1:0.4;
  if(M>0)C.me.fav-=2.5*M*neg*(1-0.04*(GM.hasRole(C,'comm')?GM.hasRole(C,'comm').skill:0));
  // reactive: opponent shifts tone toward you after a bad poll
};
GM.oppTargets=function(C,o){
  const sk=0.5+0.07*o.sk.cha;
  const scored=C.blocs.map(b=>{const fit=GM.groupFit(id=>o.pos[id],b.e,i=>GM.blocW(b,i))-GM.groupFit(id=>GM.mine(C,id),b.e,i=>GM.blocW(b,i));return {b,v:b.share*(1+fit)+gauss(C.rng)*3};}).sort((a,b)=>b.v-a.v).slice(0,2);
  for(const b of C.blocs)b.oswing*=0.94;
  for(const x of scored){const satB=1-gcl(x.b.oswing/12,0,0.8);x.b.oswing+=(C.indep?0.5:1)*1.4*Math.pow(1.5,0.7)*sk*(0.5+0.9*gcl(0.1*6,-0.5,1))*satB*(C.opps.length>1?0.6:1);}
};

/* ---------- media: the weekly news cycle ---------- */
GM.dateOfWeek=function(C,w){
  const el=Date.UTC(C.cand&&C.N0scen==='2028'?2028:2026,10,C.N0scen==='2028'?7:3);
  const wk=(w==null?C.week:w);
  return new Date(el-(C.weeks-wk)*7*864e5);
};
GM.storyDate=s=>s.date?new Date(s.date+'T12:00:00Z'):null;
GM.initMedia=function(C,scen){
  C.N0scen=scen;
  const d0=GM.dateOfWeek(C,1).getTime();
  // background: dated real stories before the campaign opens
  C.backlog=GM.STORIES.filter(s=>s.real&&s.date&&scen==='2026'&&GM.storyDate(s)<=d0).sort((a,b)=>b.date<a.date?-1:1).slice(0,10);
  // storylines already running at the start
  if(scen==='2026'){
    for(const s of GM.STORIES)if(s.real&&!s.date)C.sActive.push({id:s.id,age:0,tr:0.55+0.3*C.rng()});
    // pre-environment: these are already in the baseline polls, so no drift from the starting set
  }else{
    const pool=GM.STORIES.filter(s=>!s.real);
    for(let i=0;i<3;i++){const s=pool[Math.floor(C.rng()*pool.length)];if(!C.sActive.some(x=>x.id===s.id))C.sActive.push({id:s.id,age:0,tr:0.5+0.3*C.rng()});}
  }
  GM.mediaWeek(C,true);
};
GM.mediaWeek=function(C,first){
  const r=C.rng,scen=C.N0scen,d=GM.dateOfWeek(C),dt=d.getTime();
  // age current stories
  if(!first){for(const a of C.sActive){a.age++;a.tr*=0.68;}C.sActive=C.sActive.filter(a=>a.tr>=0.16);}
  // new candidates
  const have=new Set(C.sActive.map(a=>a.id));
  const pool=[];
  for(const s of GM.STORIES){
    if(have.has(s.id))continue;
    if(s.st&&s.st!==(C.race.office==='pres'?null:C.race.st))continue;
    if(scen==='2026'){
      if(s.real&&s.date){const sd=GM.storyDate(s).getTime();if(sd>dt||sd<dt-10*864e5)continue;pool.push([s,6]);}
      else if(!s.real)pool.push([s,1]);
    }else{
      if(!s.real)pool.push([s,1]);
    }
  }
  const nNew=first?0:(r()<0.5?2:r()<0.5?3:1);
  for(let i=0;i<nNew&&pool.length;i++){
    let tot=0;for(const p of pool)tot+=p[1]*(0.5+p[0].mag);let x=r()*tot,k=0;
    for(let j=0;j<pool.length;j++){x-=pool[j][1]*(0.5+pool[j][0].mag);if(x<=0){k=j;break;}}
    const s=pool.splice(k,1)[0][0];C.sActive.push({id:s.id,age:0,tr:0.65+0.35*r()});
  }
  // effects of this week's stories on the national mood and the electorate
  let env=0,enthMe=0;
  const sign=C.indep?0:(C.cand.party==='D'?1:-1);
  const find=id=>GM.STORIES.find(s=>s.id===id);
  const sorted=C.sActive.slice().sort((a,b)=>b.tr*find(b.id).mag-a.tr*find(a.id).mag);
  for(const a of C.sActive){
    const s=find(a.id);const loc=(s.st&&s.st===C.race.st)?1.6:1;
    const wgt=(a.age===0&&!first)?1:(first?0:0.35);
    env+=s.dir*s.mag*a.tr*0.5*loc*wgt;
    if(wgt>0){
      C.salBoost[s.sal]=(C.salBoost[s.sal]||0)+0.28*a.tr*wgt;
      if(s.pi&&C.e[s.pi]!==undefined)C.e[s.pi]=gcl(C.e[s.pi]-0.08*s.dir*a.tr*wgt,-2,2);
      enthMe+=sign*s.dir*a.tr*s.mag*1.0*wgt;
    }
  }
  C.envDrift=gcl(C.envDrift*0.9+env,-4,4);
  C.me.enth=gcl(C.me.enth+enthMe,0,100);
  for(const o of C.opps)o.stat.enth=gcl(o.stat.enth-(C.indep?0:enthMe*0.7),0,100);
  // view noise on the electorate (what your team believes)
  for(const is of GM.ISSUES){const v=C.vnoise[is.id];v.e=0.7*v.e+0.3*gauss(r)*0.5;v.s=0.7*v.s+0.3*gauss(r)*0.2;}
  // national mood series
  const mo=C.N0polls.mood||{a:42,b:55};
  const sh=C.envDrift;
  C.mood.push({d:GM.fmtDate(d),approval:+(mo.a+(scen==='2026'?-0.9:0.6)*sh*0).toFixed(1),generic:+((C.N0polls.nat&&C.N0polls.nat.house?C.N0polls.nat.house.margin:0)+C.envDrift).toFixed(1)});
  // build the front pages and feeds
  const items=sorted.map(a=>({s:find(a.id),tr:a.tr,age:a.age}));
  C.media={date:GM.fmtDate(d),stories:items,outlets:GM.OUTLETS.map(o=>GM.outletPage(C,o,items)),social:GM.PLATFORMS.map(p=>GM.socialPage(C,p,items))};
  C.mediaNew=nNew;
};
GM.outletPage=function(C,o,items){
  // each outlet leads with the story that suits its slant and size
  const sc=items.map(x=>({x,v:x.tr*(0.5+x.s.mag)*(1+0.35*(x.s.dir===0?0:(x.s.dir*(-o.slant)>0?1:-0.4)))+C.rng()*0.1}));
  sc.sort((a,b)=>b.v-a.v);
  const picks=sc.slice(0,4).map(z=>({head:GM.slantHead(z.x.s,o.slant),s:z.x.s,tr:z.x.tr,real:z.x.s.real}));
  const sign=C.indep?0:(C.cand.party==='D'?1:-1);
  let tone=-o.slant*sign*0.55+C.me.media/45+C.me.fav/70+(C.indep?-0.15:0);
  tone+=C.rng()*0.2-0.1;
  const lab=tone>0.35?'Favorable':tone>0.1?'Mildly favorable':tone>-0.1?'Neutral':tone>-0.35?'Mildly critical':'Critical';
  return {o,lead:picks[0],items:picks.slice(1),tone,lab};
};
GM.socialPage=function(C,p,items){
  const sign=C.indep?0:(C.cand.party==='D'?1:-1);
  const trends=items.slice(0,5).map(x=>({tag:(x.s.tag||'#news').split(' ')[0],vol:Math.round(1000*x.tr*(0.6+x.s.mag)*p.size*(0.8+C.rng()*0.5))/1,s:x.s}));
  const posts=[];
  for(const x of items.slice(0,3)){
    const lean=x.s.dir*(-p.slant);
    const base=x.s.h[lean>0.1?'l':lean<-0.1?'r':'n']||x.s.h.n;
    const txt=p.id==='chirp'?base+' '+(x.s.tag||''):p.id==='face'?'Sharing this one. '+x.s.h.n:p.id==='clip'?'[Video] Reacting to: '+base:'Megathread: '+x.s.h.n+' ('+Math.round(300+900*x.tr*p.size)+' comments)';
    posts.push({text:txt,likes:Math.round(1200*x.tr*(0.4+x.s.mag)*p.size*(0.7+C.rng()*0.7)),shares:Math.round(380*x.tr*(0.4+x.s.mag)*p.size*(0.6+C.rng()*0.8)),s:x.s});
  }
  let mood=(C.me.fav/50)+(-p.slant*sign*0.25)+C.me.nameId/400-0.05;
  mood=gcl(mood+(C.rng()*0.1-0.05),-1,1);
  return {p,trends,posts,mood};
};

/* ---------- views for the electorate gauge ---------- */
GM.viewRows=function(C){
  const sal=GM.salNow(C),exact=C.exact>0;
  const pollerBonus=GM.hasRole(C,'poll')?0.025*GM.hasRole(C,'poll').skill:0;
  const k=exact?0.1:Math.max(0.25,1-pollerBonus*2.2);
  const rows=GM.ISSUES.map(is=>{
    const e=C.e[is.id],ve=gcl(e+C.vnoise[is.id].e*k,-2,2),vs=sal[is.id]*(1+C.vnoise[is.id].s*k);
    return {is,e:ve,sal:Math.max(0,vs),you:GM.mine(C,is.id),opp:C.indep?null:C.opp.pos[is.id],err:+(0.5*k).toFixed(2),shift:+(e-C.e0[is.id]).toFixed(2)};
  });
  const vis=new Set(GM.visIssues().map(i=>i.id)),rv=rows.filter(x=>vis.has(x.is.id));
  const t=rv.reduce((s,x)=>s+x.sal,0);for(const x of rv)x.sal/=t;
  return rv;
};
/* the same view before the campaign starts, from a race on the map */
GM.startElectorate=function(N0,race,cand){
  const ct=N0.byId[race.id],pres=race.office==='pres';
  const A=pres?GM.NATA:GM.STATE_ATTR[race.st],L=(ct.baseT*100)+0.7*N0.env*100;
  const e=GM.electorateMean(pres?L:ct.baseT*100+0.7*N0.env*100,A);
  const polls=N0.polls,Lr=(!pres&&polls.stateIssues&&polls.stateIssues[race.st])||polls.issues,m={};
  for(const i of Lr)m[i.id]=i.pct;
  const cnt={};for(const is of GM.ISSUES)cnt[is.sal]=(cnt[is.sal]||0)+1;
  let tot=0;const s={};for(const is of GM.ISSUES){s[is.id]=(m[is.sal]||3)/cnt[is.sal];tot+=s[is.id];}
  return GM.ISSUES.map(is=>({is,e:e[is.id],sal:s[is.id]/tot,you:cand?GM.stanceOf(cand,is.id):null})).sort((a,b)=>b.sal-a.sal);
};
