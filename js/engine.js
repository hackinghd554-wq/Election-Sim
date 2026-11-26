/* ===== Election night engine (no DOM) =====
   Time unit: minutes after 7:00 PM ET. Night runs from t=-30 (6:30 PM) to t=420 (2:00 AM).
   Lean/turnout and 2026 priors come from the real-data BASE; closing times and counting profiles are still modeled. */
"use strict";

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function gauss(r){let u=0,v=0;while(u===0)u=r();while(v===0)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
const clamp=(x,a,b)=>x<a?a:x>b?b:x;

// ab|name|EV|House seats|2024-ish pres lean (D-R pts)|votes (M)|counties|close (min after 7pm ET)|speed|early|mail|late|order
const STATE_TXT=`AL|Alabama|9|7|-30|2.27|67|60|fast|.00|.03|.01|early
AK|Alaska|3|1|-13|0.34|40|360|vslow|.15|.20|.15|early
AZ|Arizona|11|9|-5.5|3.42|15|120|slow|.12|.55|.10|early
AR|Arkansas|6|4|-30|1.18|75|90|fast|.55|.04|.01|early
CA|California|54|52|20|15.86|58|240|vslow|.03|.58|.22|early
CO|Colorado|10|8|11|3.2|64|120|med|.05|.82|.03|early
CT|Connecticut|7|5|14|1.76|8|60|med|.15|.06|.02|early
DE|Delaware|3|1|14.5|0.54|3|60|fast|.18|.12|.01|early
DC|District of Columbia|3|0|85|0.35|8|60|fast|.15|.40|.03|early
FL|Florida|30|28|-13|10.98|67|60|fast|.30|.27|.02|early
GA|Georgia|16|14|-2|5.25|159|0|fast|.50|.06|.01|early
HI|Hawaii|4|2|25|0.52|5|300|fast|.05|.80|.04|early
ID|Idaho|4|2|-35|0.9|44|240|fast|.22|.22|.01|early
IL|Illinois|19|17|11|5.77|102|60|med|.35|.18|.08|early
IN|Indiana|11|9|-19|3.0|92|0|fast|.42|.06|.01|early
IA|Iowa|6|4|-13|1.64|99|180|fast|.30|.20|.02|early
KS|Kansas|6|4|-16|1.3|105|120|med|.30|.14|.03|early
KY|Kentucky|8|6|-30|2.07|120|0|fast|.45|.05|.01|early
LA|Louisiana|8|6|-22|2.0|64|120|fast|.30|.05|.01|early
ME|Maine|4|2|7|0.83|16|60|med|.35|.15|.02|early
MD|Maryland|10|8|29|3.0|24|60|slow|.35|.22|.06|mixed
MA|Massachusetts|11|9|25|3.47|14|60|med|.45|.22|.03|early
MI|Michigan|15|13|-1.4|5.67|83|120|med|.20|.32|.03|early
MN|Minnesota|10|8|4|3.28|87|120|med|.20|.22|.02|early
MS|Mississippi|6|4|-18|1.23|82|60|med|.05|.04|.01|early
MO|Missouri|10|8|-18|3.0|115|60|fast|.25|.08|.01|early
MT|Montana|4|2|-20|0.6|56|180|med|.15|.40|.02|early
NE|Nebraska|5|3|-20|0.97|93|120|fast|.35|.20|.02|early
NV|Nevada|6|4|-3|1.48|17|180|slow|.25|.40|.15|early
NH|New Hampshire|4|2|3|0.83|10|60|fast|.10|.12|.01|early
NJ|New Jersey|14|12|6|4.28|21|60|med|.30|.30|.07|mixed
NM|New Mexico|5|3|6|0.92|33|120|med|.35|.18|.03|early
NY|New York|28|26|13|8.26|62|120|med|.35|.10|.05|mixed
NC|North Carolina|16|14|-3|5.7|100|30|fast|.55|.05|.02|early
ND|North Dakota|3|1|-36|0.37|53|120|fast|.30|.10|.01|early
OH|Ohio|17|15|-11|5.77|88|30|fast|.30|.13|.02|early
OK|Oklahoma|7|5|-34|1.57|77|60|fast|.22|.04|.01|early
OR|Oregon|8|6|14|2.2|36|240|slow|.00|.62|.35|early
PA|Pennsylvania|19|17|-1.7|7.06|67|60|med|.00|.28|.03|ed
RI|Rhode Island|4|2|14|0.5|5|60|med|.25|.12|.02|early
SC|South Carolina|9|7|-18|2.55|46|0|fast|.45|.05|.01|early
SD|South Dakota|3|1|-29|0.43|66|120|fast|.25|.12|.01|early
TN|Tennessee|11|9|-30|3.06|95|60|fast|.55|.03|.01|early
TX|Texas|40|38|-14|11.39|254|120|med|.55|.07|.02|early
UT|Utah|6|4|-21|1.5|29|180|slow|.08|.65|.14|early
VT|Vermont|3|1|31|0.34|14|0|fast|.10|.55|.02|early
VA|Virginia|13|11|6|4.5|133|0|fast|.40|.12|.03|early
WA|Washington|12|10|18|3.9|39|240|slow|.00|.62|.40|early
WV|West Virginia|4|2|-42|0.76|55|30|fast|.45|.05|.01|early
WI|Wisconsin|10|8|-0.9|3.42|72|120|med|.30|.18|.03|ed
WY|Wyoming|3|1|-47|0.27|23|120|fast|.30|.12|.01|early`;

/* CREAL = real county sizes and Senate/Governor/statewide-office margins from state feeds, ~Nov 4-7 2026 (pushbuild/us-2026-election-results, CC0). Other states use modeled counties. */
const SEN26='AL AK AR CO DE GA ID IL IA KS KY LA ME MA MI MN MS MT NE NH NJ NM NC OK OR RI SC SD TN TX VA WV WY OH FL'.split(' ');
const GOV26='AL AK AZ AR CA CO CT FL GA HI ID IL IA KS ME MD MA MI MN NE NV NH NM NY OH OK OR PA RI SC SD TN TX VT WI WY'.split(' ');
const SEN28='AL AK AZ AR CA CO CT FL GA HI ID IL IN IA KS KY LA MD MO NV NH NY NC ND OH OK OR PA SC SD UT VT WA WI'.split(' ');
const GOV28='DE IN MO MT NH NC ND UT VT WA WV'.split(' ');
// seats NOT up in the Senate (2026: 22 D + 13 R seats up; final 56-44 D implies 34 D / 31 R holdovers)
const SEN_HOLD={'2026':{D:34,R:31},'2028':{D:33,R:33}};

const SPD={fast:{ed:95,lag:12,late:420},med:{ed:200,lag:20,late:1800},slow:{ed:420,lag:35,late:4800},vslow:{ed:800,lag:50,late:9500}};
const OFF=[-0.02,0.09,-0.08,0.05];          // margin offset by vote type: early, mail, election day, late
const TYNAME=['Early in-person','Mail (received early)','Election Day','Late mail & provisional'];
const WORDS=['Ashford','Bayard','Calloway','Dunmore','Easton','Fairmont','Garrison','Hollis','Ivers','Jasper','Keene','Lowell','Marlow','Norwood','Oakridge','Pemberton','Quarry','Ridgley','Stanton','Thorne','Upland','Vernon','Wexford','Yarrow','Alder','Birch','Cedar','Dover','Elmwood','Fenwick','Grafton','Harlow','Irving','Juniper','Kestrel','Linden','Maddox','Newhall','Orchard','Prescott','Redfield','Sutton','Tamarack','Ulster','Vale','Whitley','Aldridge','Brookfield','Cardiff','Dalton'];
const PRE=['','North ','South ','East ','West ','Lake ','Fort ','Mount ','Port '];

const OPP=p=>p==='D'?'R':'D';
function parseStates(){
  return STATE_TXT.split('\n').map(l=>{const p=l.split('|');const B=BASE.lean[p[0]];return{ab:p[0],name:p[1],ev:+p[2],hd:+p[3],lean:B!==undefined?B:+p[4],votesM:BASE.votes[p[0]]!==undefined?BASE.votes[p[0]]:+p[5],nC:+p[6],close:+p[7],spd:p[8],E:+p[9],M:+p[10],L:+p[11],ord:p[12]};});
}

/* ---------- pre-night polling ----------
   Simulated polls. Separate RNG, so adding polls never changes the night itself.
   Anchors: final polling averages have historically landed within a few points of the result
   (generic ballot misses: 2018 about 1 pt, 2022 about 0.5 pt, 2014 and 2010 about 3 pts; state Senate and governor
   polls miss by about 4 to 5 pts on average), the out-party tends to gain into the final weeks, undecideds run
   about 4 to 8 percent in the last month, and partisan-sponsored polls lean toward their sponsor. */
const ISSUES=[
 // id, name, base share %, lean among those naming it (D-R pts), environment tilt (+ rises in a D environment)
 ['cost','Cost of living and inflation',20,-10,-0.6],['econ','Economy and jobs',9,-8,-0.4],['health','Health care',11,30,0.6],
 ['immig','Immigration',10,-45,-0.7],['democ','Democracy and the political system',11,40,0.6],['abort','Abortion',6,52,0.8],
 ['crime','Crime and public safety',6,-40,-0.6],['climate','Climate and energy',4,65,0.3],['tax','Taxes, spending and the deficit',5,-30,-0.3],
 ['guns','Guns',3,30,0.4],['educ','Education',3,15,0.1],['house','Housing costs',4,5,0],['foreign','Foreign policy and security',4,-15,-0.2],['other','Something else',4,0,0]];
const STATE_QUIRK={immig:['AZ','TX','NM','CA','FL','NV'],climate:['TX','ND','WY','WV','LA','AK','OK','NM','CO'],house:['CA','CO','WA','OR','HI','MA','NY','NV','FL','MT'],health:['WV','KY','MS','AL','AR','LA','TN']};
const POLLSTERS=[['Meridian Research','',0],['Capitol Insight','',0],['Granite Analytics','',0],['Lakeshore Polling','',0],['Pioneer Public Opinion','',0],['Keystone Civic Survey','',0],['Tri-County Panel','',0],['Sunbelt Strategies','R',0.03],['Harbor Point Group','D',-0.03],['Cardinal Partners','R',0.03],['Northfield Strategies','D',-0.03]];
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function buildPolls(night,scen,env,seed){
  const r=mulberry32((seed^0x5bd1e995)>>>0),g=()=>gauss(r);
  const ps=POLLSTERS.map(p=>({name:p[0],spon:p[1],he:(p[1]==='R'?-1:p[1]==='D'?1:0)*0.03*(p[1]?1:0)+(p[1]?0:g()*0.012)}));
  // sponsor effect: R-sponsored polls lean R (margin down), D-sponsored lean D
  const base=new Date(Date.UTC(scen==='2028'?2028:2026,10,scen==='2028'?7:3));
  const dstr=d=>{const x=new Date(base.getTime()-d*864e5);return MON[x.getUTCMonth()]+' '+x.getUTCDate();};
  const pick=a=>a[Math.floor(r()*a.length)];
  function mkPoll(m0,und0,oth,dmax,nset,design,deck){
    const p=deck&&deck.length?deck.pop():pick(ps),n=pick(nset),d=1+Math.floor(r()*dmax);
    const pm=m0+p.he+g()*design/Math.sqrt(n);
    const un=Math.max(0.02,und0+(d>14?0.02:0)+g()*0.01);
    const D=(1-un-oth+pm)/2,R=(1-un-oth-pm)/2;
    const Di=Math.round(D*100),Ri=Math.round(R*100);
    return {pollster:p.name,spon:p.spon,d,date:dstr(d),n,pop:d>16?'RV':'LV',D:Di,R:Ri,und:100-Di-Ri,margin:Di-Ri,moe:+(1.96*Math.sqrt(0.25/n)*100).toFixed(1),w:Math.sqrt(n)*Math.exp(-d/10)*(p.spon?0.5:1),mU:pm};
  }
  function avg(list,oth){
    let sw=0,sm=0,su=0;for(const p of list){sw+=p.w;sm+=p.w*p.margin;su+=p.w*p.und;}
    const m=sm/sw,u=su/sw,o=oth*100;return {D:(100-u-o+m)/2,R:(100-u-o-m)/2,und:u,margin:m};
  }
  const P={asof:dstr(1),scen,races:{},nat:{},issues:null,stateIssues:{},byParty:null};
  // race polls
  const polled=[];
  for(const ct of night.contests){
    let m0=ct.baseT+0.7*env+g()*0.015+(scen==='2026'?g()*0.022:0);
    const a=Math.abs(0.5*ct.lastT+0.5*m0);   // pollsters pick races that look close from last time and early signs
    let np=a<0.03?6+Math.floor(r()*4):a<0.08?4+Math.floor(r()*3):a<0.15?2+Math.floor(r()*2):(r()<0.35?1:0);
    if(ct.office==='house')np=a<0.04?3+Math.floor(r()*2):a<0.09?1+Math.floor(r()*2):(r()<0.08?1:0);
    if(np===0){P.races[ct.id]={id:ct.id,office:ct.office,st:ct.st,label:ct.label,polls:[],none:true,m0};continue;}
    const und0=0.025+0.04*r(),oth=0.01+0.012*r();
    const list=[];const deck=ps.slice().sort(()=>r()-0.5);
    for(let i=0;i<np;i++)list.push(mkPoll(m0,und0,oth,21,ct.office==='house'?[350,400,450,500]:[400,500,600,800,1000,1200],1.25,deck));
    list.sort((x,y)=>x.d-y.d);
    const av=avg(list,oth);
    P.races[ct.id]={id:ct.id,office:ct.office,st:ct.st,label:ct.label,polls:list,D:av.D,R:av.R,und:av.und,margin:av.margin,moe:list.length?+(Math.min(...list.map(p=>p.moe))*0.9).toFixed(1):null,m0};
    polled.push(P.races[ct.id]);
  }
  // national numbers
  function natFrom(office,kind,drift){
    const cs=night.contests.filter(c=>c.office===office);
    let sw=0,sm=0;for(const c of cs){sw+=c.expTotal;sm+=c.expTotal*Math.max(-0.3,Math.min(0.3,P.races[c.id].m0));}
    const m0=sm/sw+g()*0.008,und0=0.03+0.025*r(),oth=0.015+0.01*r();
    const list=[];for(let i=0;i<14;i++)list.push(mkPoll(m0,und0,oth,28,[900,1000,1200,1500,1800],1.1));
    list.sort((x,y)=>x.d-y.d);
    const av=avg(list,oth);
    // 60-day trend; out-party gains into the final weeks
    const tr=[];let nz=0;const fin=av.margin/100;
    for(let d=60;d>=1;d--){
      nz=0.85*nz+g()*0.0035;
      const mm=fin+drift*(d/60)+nz*(d/60+0.4)+(d===1?0:0);
      const un=Math.max(0.02,(av.und/100)+0.05*(d/60));
      const D=(1-un-oth+mm)/2*100,R=(1-un-oth-mm)/2*100;
      tr.push({d,D,R});
    }
    tr[tr.length-1]={d:1,D:av.D,R:av.R};
    return {kind,label:kind==='generic'?'Generic congressional ballot':'National presidential vote',D:av.D,R:av.R,und:av.und,margin:av.margin,polls:list,trend:tr};
  }
  P.nat.house=natFrom('house','generic',scen==='2026'?-0.015:0);
  if(scen==='2028')P.nat.pres=natFrom('pres','pres',0);
  // mood: approval in a midterm, right-track otherwise
  const envp=env*100;
  if(scen==='2026'){const ap=Math.max(25,Math.min(60,Math.round(41-0.5*envp+g()*1.2)));P.mood={label:'Presidential approval',a:ap,b:Math.min(100-ap-1,Math.round(100-ap-3+g()*1))};P.mood.la='Approve';P.mood.lb='Disapprove';}
  else{const rt=Math.max(15,Math.min(55,Math.round(33-0.4*envp+g()*1.2)));P.mood={label:'Direction of the country',a:rt,b:100-rt-6,la:'Right direction',lb:'Wrong track'};}
  // issues
  const envN=env*10;
  function issueWeights(extra){
    const w=ISSUES.map(i=>i[2]*Math.exp(0.35*i[4]*envN)*Math.exp(g()*0.06)*(extra?extra(i):1));
    const s=w.reduce((a,b)=>a+b,0);return w.map(x=>x/s*100);
  }
  const wN=issueWeights();
  const natMargin=P.nat.house.margin;
  // shift lean so the issue-weighted margin equals the national ballot margin
  let wl=0;for(let i=0;i<ISSUES.length;i++)wl+=wN[i]/100*ISSUES[i][3];
  const lam=natMargin-wl;
  P.issues=ISSUES.map((i,k)=>({id:i[0],name:i[1],pct:wN[k],lean:i[3]+lam})).sort((a,b)=>b.pct-a.pct);
  function party(s){
    const w=ISSUES.map((i,k)=>wN[k]*Math.exp(s*i[3]/50));const t=w.reduce((a,b)=>a+b,0);
    return ISSUES.map((i,k)=>({id:i[0],name:i[1],pct:w[k]/t*100})).sort((a,b)=>b.pct-a.pct);
  }
  P.byParty={D:party(0.9),R:party(-0.9),I:party(0)};
  for(const ab in night.states){
    const st=night.states[ab];if(!(st.hasSen||st.hasGov||st.hasPres||st.hd>0))continue;
    const ln=Math.max(-1.5,Math.min(1.5,st.lean/20));
    const w=ISSUES.map((i,k)=>{let x=wN[k]*Math.exp(0.7*i[3]/50*ln)*Math.exp(g()*0.1);for(const q in STATE_QUIRK)if(i[0]===q&&STATE_QUIRK[q].includes(ab))x*=1.45;return x;});
    const t=w.reduce((a,b)=>a+b,0);
    P.stateIssues[ab]=ISSUES.map((i,k)=>({id:i[0],name:i[1],pct:w[k]/t*100})).sort((a,b)=>b.pct-a.pct).slice(0,5);
  }
  // ratings: last election result blended with the polling average (more weight when more polls exist)
  for(const ct of night.contests){
    const rr=P.races[ct.id],np=rr.polls.length;
    if(np>0){const w=Math.min(0.7,0.2+0.1*np);ct.rateT=(1-w)*ct.lastT+w*(rr.margin/100);}
    else ct.rateT=ct.lastT;
  }
  P.polled=polled.length;
  return P;
}

function buildNight(opts){
  const scen=opts.scenario, env=(opts.env||0)/100, seed=(opts.seed>>>0)||1;
  const rng=mulberry32(seed);
  const scale=scen==='2026'?0.76:1;
  const eN=gauss(rng)*0.02;                       // shared national polling miss
  const night={seed,scen,env,eN,rng,states:{},sets:[],contests:[],byId:{},events:[],ptr:0,log:[],t:-1e9,touched:new Set(),
    offices:scen==='2028'?['pres','sen','house','gov']:['sen','house','gov'],
    cand:{D:{name:'Marisol Okonkwo',party:'Democratic'},R:{name:'Gideon Hartwell',party:'Republican'}},
    hold:SEN_HOLD[scen]};
  const senL=scen==='2028'?SEN28:SEN26, govL=scen==='2028'?GOV28:GOV26;
  const stl=parseStates();
  let evTotal=0,hdTotal=0;
  for(const st of stl){
    evTotal+=st.ev; hdTotal+=st.hd;
    st.eS=gauss(rng)*0.022;
    st.hasSen=senL.includes(st.ab); st.hasGov=govL.includes(st.ab); st.hasPres=scen==='2028';
    st.contests={}; st.houseIds=[];
    night.states[st.ab]=st;
  }
  night.stateList=stl; night.evTotal=evTotal; night.hdTotal=hdTotal;

  function newSet(st,counties,estErr){
    const set={idx:night.sets.length,ab:st.ab,counties,contests:[],estErr};
    night.sets.push(set);return set;
  }
  function makeContest(set,st,office,o){
    const n=set.counties.length;
    const noise=new Float64Array(n);
    if(o.noiseSd)for(let i=0;i<n;i++)noise[i]=gauss(rng)*o.noiseSd;
    // ---- player campaign hook: only changes the actual outcome, never the pre-night polls/ratings ----
    const PL=opts.player&&!opts.player.failed?opts.player:null;
    let padj=0,pl=null;
    if(PL){
      const isP=PL.office==='pres'&&office==='pres';
      if(PL.id===o.id||isP){pl=PL;padj+=(isP&&PL.by&&PL.by[st.ab]!=null)?PL.by[st.ab]:(PL.effD||0);
        if(PL.geo)for(let i=0;i<n;i++)noise[i]+=PL.geo*(((set.counties[i].u==null?0.45:set.counties[i].u))-0.45);
        if(PL.regionOff&&office!=='house')for(let i=0;i<n;i++){const u=set.counties[i].u,k=u>=0.72?'metro':u>=0.5?'suburb':u>=0.28?'town':'rural';noise[i]+=PL.regionOff[k]||0;}
        if(PL.ind){o={...o,oth:o.oth+PL.ind.share};}
      }else if(PL.coat&&office!=='pres'&&PL.office==='pres')padj+=PL.coat;
      if(PL.env)padj+=PL.env;
    }
    if(!pl&&typeof GM!=='undefined'&&GM.hidEffect)padj+=GM.hidEffect(office,st.ab,o.label,o.id,scen,seed,(o.priorT||0));
    const ct={baseT:o.priorT-env,lastT:o.last,rateT:o.last,prev:o.prev,id:o.id,office,st:st.ab,label:o.label,set:set.idx,ratio:o.ratio,oth:o.oth,sd0:o.sd0,priorT:o.priorT,e:o.e,noise,close:st.close,player:pl,
      ev:office==='pres'?st.ev:0,
      D:0,R:0,O:0,cv:0,priorCounted:0,devSum:0,priorTotal:0,expTotal:0,estTotal:0,
      uD:new Float64Array(n),uR:new Float64Array(n),uO:new Float64Array(n),uV:new Float64Array(n),
      cvT:[0,0,0,0],DT:[0,0,0,0],RT:[0,0,0,0],totT:[0,0,0,0],
      uns:0.02+0.25*st.L+(st.ord==='ed'?0.01:0),
      called:null,status:'pre',hist:[],lastHistT:-1e9,lastHistPct:-1,okSince:null,delay:0.3+rng()*6};
    let shift=0;const target=o.priorT+o.e+padj;
    for(let it=0;it<8;it++){
      let num=0,den=0;
      for(let c=0;c<n;c++){const cc=set.counties[c];for(let ty=0;ty<4;ty++){const b=cc.B[ty];if(!b)continue;num+=b*clamp(cc.m[ty]+shift+noise[c],-.97,.97);den+=b;}}
      shift+=target-num/den;
    }
    ct.shift=shift;
    let tm=0;
    for(let c=0;c<n;c++){const cc=set.counties[c];for(let ty=0;ty<4;ty++){
      const b=cc.B[ty]*ct.ratio;if(!b)continue;
      const m=clamp(cc.m[ty]+shift+noise[c],-.97,.97),pm=clamp(cc.m[ty]+shift-ct.e,-.97,.97);
      ct.expTotal+=b;ct.priorTotal+=b*pm;ct.totT[ty]+=b;tm+=b*m;}}
    ct.trueMargin=tm/ct.expTotal;
    ct.estTotal=ct.expTotal*(1+set.estErr);
    night.contests.push(ct);night.byId[ct.id]=ct;set.contests.push(ct);
    return ct;
  }

  function chunkTime(st,ty,j,k,u,P){
    const sizeF=0.4+0.9*Math.pow(u,0.7),close=st.close;
    let t;
    if(ty===0||ty===1){
      if(ty===1&&st.ord==='ed')t=close+P.ed*(0.9+0.9*rng())*sizeF;
      else if(ty===1&&st.ord==='mixed')t=close+P.lag+P.ed*0.8*rng()*sizeF;
      else if(j===0)t=close+5+rng()*(10+P.lag*0.8*sizeF);
      else t=close+P.lag+P.ed*Math.pow(rng(),1.2)*sizeF;
    }else if(ty===2){
      t=close+P.lag+P.ed*((j+rng())/k)*sizeF;
    }else{
      t=close+P.lag+P.ed*sizeF*0.9+P.late*Math.pow(rng(),1.4)*(0.3+0.7*sizeF);
    }
    return Math.max(t,close+3);
  }
  function splits(k,heavyFirst){
    const w=[];let s=0;
    for(let i=0;i<k;i++){const x=0.5+rng();w.push(x);s+=x;}
    let f=w.map(x=>x/s);
    if(heavyFirst&&k>1){const f0=0.75+0.15*rng();const rest=1-f0;const s2=w.slice(1).reduce((a,b)=>a+b,0);f=[f0].concat(w.slice(1).map(x=>x/s2*rest));}
    return f;
  }
  function addEvents(st,set){
    const P=SPD[st.spd];
    set.counties.forEach((cc,ci)=>{
      const u=cc.u;
      const small=u<0.3&&set.counties.length>6;
      let tc=0;
      if(small)tc=Math.max(st.close+P.lag+P.ed*Math.pow(rng(),1.4)*(0.4+0.9*Math.pow(u,0.7)),st.close+3);
      for(let ty=0;ty<4;ty++){
        if(!cc.B[ty])continue;
        if(small&&ty<3){const t=tc+rng()*3+(ty===1&&st.ord==='ed'?P.ed*0.3:0);night.events.push({t,s:set.idx,c:ci,ty,f:1});continue;}
        let k;
        if(ty===2)k=1+Math.floor(Math.pow(u,1.3)*4*(0.6+0.6*rng()));
        else if(ty===3)k=1+Math.floor(Math.pow(u,1.5)*2*(0.6+0.6*rng()));
        else k=1+Math.floor(Math.pow(u,1.5)*2.5*(0.6+0.6*rng()));
        k=Math.min(k,5);
        const f=splits(k,(ty<2)&&st.ord==='early');
        for(let j=0;j<k;j++)night.events.push({t:chunkTime(st,ty,j,k,u,P),s:set.idx,c:ci,ty,f:f[j]});
      }
    });
  }
  function countyNames(st,n,noun){
    const used=new Set(),out=[];
    let i=0;
    while(out.length<n){
      const base=WORDS[Math.floor(rng()*WORDS.length)],pre=PRE[Math.floor(rng()*(rng()<0.35?PRE.length:1))];
      let nm=pre+base;
      if(used.has(nm)){i++;if(i>40){nm=nm+' '+(out.length+1);}else continue;}
      used.add(nm);out.push(nm+' '+noun);
    }
    return out;
  }

  const OFFN={};
  for(const st of stl){
    const RC=CREAL[st.ab]||C24[st.ab];
    const n=RC?RC.length:st.nC,total=st.votesM*1e6*scale;
    st.realCounties=!!RC;
    const ex=n>20?0.9:0.35;
    const raw=[];let sum=0;
    if(RC){for(let i=0;i<n;i++)raw.push(RC[i][1]);}else{for(let i=0;i<n;i++){const w=Math.pow(i+1,-ex)*Math.exp(0.3*gauss(rng));raw.push(w);}
    raw.sort((a,b)=>b-a);}for(const w of raw)sum+=w;
    const noun=st.ab==='LA'?'Parish':st.ab==='AK'?'Borough':st.ab==='DC'?'Ward':'County';
    const names=RC?RC.map(r=>r[0]):countyNames(st,n,noun);
    const Vs=raw.map(w=>Math.max(120,Math.round(w/sum*total)));
    const lnMax=Math.log(Vs[0]),lnMin=Math.log(Vs[n-1]);
    const polar=0.30;
    const counties=[];
    const D0=Math.max(0.01,1-st.E-st.M-st.L);
    const sh0=[st.E,st.M,D0,st.L];
    let tot=[0,0,0,0];
    for(let i=0;i<n;i++){
      const V=Vs[i],u=lnMax===lnMin?0.5:(Math.log(V)-lnMin)/(lnMax-lnMin);
      let s=[sh0[0]*Math.exp(0.25*gauss(rng)),sh0[1]*Math.exp(0.25*gauss(rng)),sh0[2],sh0[3]*Math.exp(0.2*gauss(rng))];
      const ss=s[0]+s[1]+s[2]+s[3];s=s.map(x=>x/ss);
      const B=s.map(x=>x*V);
      for(let t=0;t<4;t++)tot[t]+=B[t];
      counties.push({name:names[i],f:RC&&RC[i][3]?RC[i][3]:undefined,V,u,B,mb:RC?RC[i][2]:polar*(u-0.35)+0.10*gauss(rng),m:[0,0,0,0]});
    }
    const gt=tot[0]+tot[1]+tot[2]+tot[3];
    let mo=0;for(let t=0;t<4;t++)mo+=tot[t]/gt*OFF[t];
    const offAdj=OFF.map(x=>x-mo);
    OFFN[st.ab]={offAdj,sh:tot.map(x=>x/gt)};
    for(const cc of counties)for(let t=0;t<4;t++)cc.m[t]=cc.mb+offAdj[t];
    st.county=counties;
    st.totalVotes=total;
    const set=newSet(st,counties,gauss(rng)*0.025);
    st.set=set;
    const L=st.lean/100;
    if(st.hasPres){
      const pe=night.eN+st.eS;
      st.contests.pres=makeContest(set,st,'pres',{last:L,prev:st.lean<0?'R':'D',id:'pres:'+st.ab,label:'President',priorT:L+env,e:pe,oth:0.02+0.012*rng(),ratio:1,sd0:0.045,noiseSd:0.015});
    }
    if(st.hasSen){
      const cand=gauss(rng)*0.03,pe=night.eN+st.eS+gauss(rng)*0.03;
      st.contests.sen=makeContest(set,st,'sen',{last:L,prev:(()=>{const b=BASE.sen[st.ab];if(scen==='2026'&&b!==undefined){const w=b>0?'D':'R';return BASE.senF.includes(st.ab)?OPP(w):w;}return L<0?'R':'D';})(),id:'sen:'+st.ab,label:'U.S. Senate',priorT:(scen==='2026'&&BASE.sen[st.ab]!==undefined?BASE.sen[st.ab]/100:0.85*L)+env+(scen==='2026'?cand*0.25:cand),e:(scen==='2026'?pe*0.35:pe),oth:0.012+0.01*rng(),ratio:0.97,sd0:0.055,noiseSd:0.015});
    }
    if(st.hasGov){
      const cand=gauss(rng)*0.04,pe=night.eN*0.8+st.eS*0.7+gauss(rng)*0.035;
      st.contests.gov=makeContest(set,st,'gov',{last:L,prev:(()=>{const b=BASE.gov[st.ab];if(b!==undefined){const w=b>0?'D':'R';return scen==='2026'&&BASE.govF.includes(st.ab)?OPP(w):w;}return L<0?'R':'D';})(),id:'gov:'+st.ab,label:'Governor',priorT:(scen==='2026'&&BASE.gov[st.ab]!==undefined?BASE.gov[st.ab]/100:0.7*L)+env+(scen==='2026'?cand*0.25:cand),e:(scen==='2026'?pe*0.35:pe),oth:0.012+0.01*rng(),ratio:0.97,sd0:0.055,noiseSd:0.015});
    }
    addEvents(st,set);
    // House districts
    for(let d=1;d<=st.hd;d++){
      const V=Math.round(total*0.93/st.hd*(0.88+0.24*rng()));
      const jit=[Math.exp(0.2*gauss(rng)),Math.exp(0.2*gauss(rng)),1,Math.exp(0.2*gauss(rng))];
      let s=[sh0[0]*jit[0],sh0[1]*jit[1],sh0[2],sh0[3]*jit[3]];const ss=s[0]+s[1]+s[2]+s[3];s=s.map(x=>x/ss);
      const mb=clamp(L+0.10*gauss(rng)*(st.hd>1?1:0),-.9,.9);
      const cc={name:st.ab+'-'+d,V,u:0.5,B:s.map(x=>x*V),mb,m:offAdj.map(x=>mb*0+x)};
      for(let t=0;t<4;t++)cc.m[t]=offAdj[t];
      const set2=newSet(st,[cc],gauss(rng)*0.03);
      const id='house:'+st.ab+'-'+d;
      const hb=(BASE.house[st.ab]||[])[d-1];
      let prior,e;
      if(scen==='2026'&&hb){const m=hb[0]!==null?hb[0]:(hb[2]==='DD'?45:hb[1]);prior=clamp(m/100+env,-.9,.9);e=(night.eN+st.eS*0.8)*0.35+gauss(rng)*0.012;}
      else if(hb){prior=clamp(hb[1]/100+env+gauss(rng)*0.03,-.9,.9);e=night.eN+st.eS*0.8+gauss(rng)*0.04;}
      else{prior=clamp(L*(0.9)+gauss(rng)*0.09+env,-.8,.8);e=night.eN+st.eS*0.8+gauss(rng)*0.04;}
      makeContest(set2,st,'house',{last:(hb?(scen==='2028'?(hb[0]!==null?hb[0]:hb[1]):hb[1])/100:L),prev:(()=>{if(!hb)return L<0?'R':'D';const w=hb[2]==='DD'?'D':(hb[0]!==null?(hb[0]>0?'D':'R'):(hb[1]>0?'D':'R'));return scen==='2026'&&hb[2]==='F'?OPP(w):w;})(),id,label:st.ab+'-'+d,priorT:prior,e,oth:0.012+0.008*rng(),ratio:0.93,sd0:0.06,noiseSd:0});
      st.houseIds.push(id);
      // district events: one-unit set with simple bundled timing
      addEvents(st,set2);
    }
  }
  night.events.sort((a,b)=>a.t-b.t);

  // closing-time announcements
  const closeMap={};
  for(const st of stl){
    if(!(st.hasPres||st.hasSen||st.hasGov||st.hd>0))continue;
    (closeMap[st.close]=closeMap[st.close]||[]).push(st.ab);
  }
  night.closeQueue=Object.keys(closeMap).map(Number).sort((a,b)=>a-b).map(t=>({t,sts:closeMap[t],done:false}));

  night.mile={};
  function tally(){
    const T={pres:{D:0,R:0},sen:{D:night.hold.D,R:night.hold.R},house:{D:0,R:0},gov:{D:0,R:0}};
    for(const c of night.contests)if(c.status==='called')T[c.office][c.called.party]+=(c.office==='pres'?c.ev:1);
    return T;
  }
  night.tally=tally;
  night.flips=function(){const F={pres:{D:0,R:0},sen:{D:0,R:0},house:{D:0,R:0},gov:{D:0,R:0}};for(const c of night.contests)if(c.status==='called'&&c.prev&&c.called.party!==c.prev)F[c.office][c.called.party]++;return F;};
  function why(ct){
    const est=ct.estTotal,cur=ct.D-ct.R,remRaw=Math.max(est-ct.cv,0),rem=Math.max(remRaw,0.004*est),k=0.08*est;
    const estErr=ct.devSum/(ct.cv+k);
    const proj=cur+(ct.priorTotal-ct.priorCounted)+estErr*rem;
    const sd=rem*Math.sqrt(ct.sd0*ct.sd0*k/(ct.cv+k)+ct.uns*ct.uns);
    const finished=ct.cv>=ct.expTotal*0.99999;
    let bt=-1,bv=0;const set=night.sets[ct.set];
    for(let t=0;t<4;t++){const r=ct.totT[t]-ct.cvT[t];if(r>bv){bv=r;bt=t;}}
    return {lead:cur,leader:cur>=0?'D':'R',leadPct:ct.cv>0?cur/ct.cv*100:0,out:remRaw,outPct:est>0?remRaw/est*100:0,pctIn:Math.min(1,ct.cv/est)*100,
      need:rem>0?-cur/rem*100:0,expRem:rem>0?(proj-cur)/rem*100:0,projLead:proj,z:sd>0?Math.abs(proj)/sd:0,thr:ct.office==='house'?3.0:2.8,finished,bigType:bt>=0?TYNAME[bt]:null,bigOut:bv};
  }
  night.why=why;
  function callIt(ct,t,party,corrected){
    const wy=why(ct);
    ct.called={party,t,corrected:!!corrected,why:wy};ct.status='called';
    night.log.push({t,kind:'call',office:ct.office,st:ct.st,id:ct.id,party,corrected:!!corrected,flip:!!ct.prev&&party!==ct.prev,prev:ct.prev,lead:Math.abs(wy.lead),out:wy.out,outPct:wy.outPct,pctIn:wy.pctIn,finished:wy.finished});
    const T=tally(),th={pres:270,sen:51,house:218};
    for(const o in th)for(const p of ['D','R']){
      const k=o+p;
      if(!night.mile[k]&&T[o][p]>=th[o]){night.mile[k]=true;night.log.push({t,kind:'mile',office:o,party:p});}
    }
  }
  function desk(ct,t){
    if(t<ct.close)return;
    const finished=ct.cv>=ct.expTotal*0.99999;
    const cur=ct.D-ct.R;
    if(ct.status==='called'){
      if(finished&&!ct.called.corrected&&(cur>0?'D':'R')!==ct.called.party){
        night.log.push({t,kind:'retract',office:ct.office,st:ct.st,id:ct.id,party:ct.called.party});
        callIt(ct,t,cur>0?'D':'R',true);
      }
      return;
    }
    if(finished){
      if(Math.abs(cur)/Math.max(ct.cv,1)<0.005){
        if(ct.status!=='recount'){ct.status='recount';night.log.push({t,kind:'recount',office:ct.office,st:ct.st,id:ct.id});}
        return;
      }
      callIt(ct,t,cur>0?'D':'R');return;
    }
    const est=ct.estTotal,rem=Math.max(est-ct.cv,0.004*est),k=0.08*est;
    const estErr=ct.devSum/(ct.cv+k);
    const proj=cur+(ct.priorTotal-ct.priorCounted)+estErr*rem;
    const s0=ct.sd0;
    const sd=rem*Math.sqrt(s0*s0*k/(ct.cv+k)+ct.uns*ct.uns);
    let ok=Math.abs(proj)/sd>=(ct.office==='house'?3.0:2.8);
    if(ct.cv<0.02*est&&Math.abs(proj)/est<0.15)ok=false;
    if(ok&&ct.cv>0.1*est&&Math.sign(cur)!==Math.sign(proj))ok=false;
    if(ct.cv===0&&Math.abs(proj)/est<0.15)ok=false;
    if(ok){
      if(ct.okSince===null)ct.okSince=t;
      if(t-ct.okSince>=ct.delay)callIt(ct,t,proj>0?'D':'R');
    }else ct.okSince=null;
    if(ct.status==='pre'&&ct.cv>0)ct.status='counting';
  }
  night.desk=function(ct){return {};};

  function apply(ev){
    const set=night.sets[ev.s],c=set.counties[ev.c],ty=ev.ty,base=c.B[ty]*ev.f;
    for(const ct of set.contests){
      const b=base*ct.ratio;if(b<=0)continue;
      const mm=c.m[ty];
      const m=clamp(mm+ct.shift+ct.noise[ev.c],-.97,.97),pm=clamp(mm+ct.shift-ct.e,-.97,.97);
      const o=b*ct.oth,dv=b*(1-ct.oth+m)/2,rv=b*(1-ct.oth-m)/2;
      ct.D+=dv;ct.R+=rv;ct.O+=o;ct.cv+=b;ct.priorCounted+=b*pm;ct.devSum+=b*(m-pm);
      ct.uD[ev.c]+=dv;ct.uR[ev.c]+=rv;ct.uO[ev.c]+=o;ct.uV[ev.c]+=b;
      ct.cvT[ty]+=b;ct.DT[ty]+=dv;ct.RT[ty]+=rv;
      if(ct.status==='pre')ct.status='counting';
      night.touched.add(ct);
      if(ct.office!=='house'&&b>=0.07*ct.expTotal&&night.lastBatch[ct.id]!==undefined&&ev.t-night.lastBatch[ct.id]<8){/*skip*/}
      else if(ct.office!=='house'&&b>=0.07*ct.expTotal&&((scen==='2028'&&ct.office==='pres')||(scen==='2026'&&ct.office==='sen'))){
        night.lastBatch[ct.id]=ev.t;
        night.log.push({t:ev.t,kind:'batch',office:ct.office,st:ct.st,id:ct.id,county:c.name,votes:Math.round(b),margin:m,out:Math.max(0,Math.round(c.V*ct.ratio-ct.uV[ev.c])),pct:Math.min(1,ct.uV[ev.c]/(c.V*ct.ratio))});
      }
    }
  }
  night.lastBatch={};

  night.advance=function(t){
    if(t<=night.t)return;
    night.t=t;night.touched.clear();
    while(night.ptr<night.events.length&&night.events[night.ptr].t<=t){apply(night.events[night.ptr]);night.ptr++;}
    for(const q of night.closeQueue){if(!q.done&&t>=q.t){q.done=true;night.log.push({t:q.t,kind:'close',sts:q.sts});}}
    for(const ct of night.touched){
      if(ct.office==='house')continue;
      const pct=ct.cv/ct.estTotal;
      if(pct-ct.lastHistPct>=0.01||t-ct.lastHistT>=6){
        ct.hist.push([t,Math.min(pct,0.99),ct.cv>0?(ct.D-ct.R)/ct.cv:0]);ct.lastHistPct=pct;ct.lastHistT=t;
      }
    }
    for(const ct of night.contests)desk(ct,t);
  };
  night.advanceSteps=function(t,step){
    let x=night.t<-1e8?-30:night.t;
    while(x<t){x=Math.min(x+step,t);night.advance(x);}
  };
  night.pctIn=function(ct){
    if(ct.cv>=ct.expTotal*0.99999)return 1;
    return Math.min(ct.cv/ct.estTotal,0.99);
  };
  night.winnerTruth=function(ct){return ct.trueMargin>0?'D':'R';};
  night.polls=buildPolls(night,scen,env,seed);
  return night;
}

if(typeof module!=='undefined')module.exports={buildNight,TYNAME,SEN26,SEN28,GOV26,GOV28,parseStates};
