/* ===== Campaign mode UI: setup, candidate creator, weekly campaign, hand-off to election night ===== */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const OFFN={pres:'President',sen:'U.S. Senate',house:'U.S. House',gov:'Governor'};
const G={step:'setup',tab:'id',cfg:{scen:'2028',env:0,seed:1},N0:null,cand:null,touched:{},race:null,C:null,ctab:'act',tgt:'suburban',evIdx:0,office:null,hst:null,note:''};

function fm(k){const a=Math.abs(k),s=k<0?'−':'';return a>=1000?s+'$'+(a/1000).toFixed(a>=10000?0:1)+'M':s+'$'+Math.round(a)+'K';}
function sg(x,d){d=d==null?1:d;return (x>=0?'+':'−')+Math.abs(x).toFixed(d);}
function rateLab(m){const a=Math.abs(m),s=m>=0?'D':'R';return a>=0.15?['Safe '+s,s]:a>=0.08?['Likely '+s,s]:a>=0.03?['Lean '+s,s]:['Toss-up','n'];}
function typ(){return GM.PARTY_STANCE[G.cand.party]||GM.PARTY_STANCE.I;}
function defaultCand(){
  const c={name:'Alex Morgan',party:'D',third:'Independent',gender:'Woman',race:'White',age:48,home:'GA',religion:'Mainline Protestant',health:'Average',bg:'legislator',strengths:[],baggage:[],tier:1,degree:'ba',skills:{},pos:{}};
  return c;
}
function initPos(){const t=typ();for(const is of GM.ISSUES){const p=G.cand.pos[is.id];if(!p)G.cand.pos[is.id]={s:t[is.id],w:2};else if(!G.touched[is.id])p.s=t[is.id];}}
function skillBudget(){return GM.SKILL_POINTS+2*G.cand.baggage.length;}
function skillSpent(){let n=0;for(const k in G.cand.skills)n+=G.cand.skills[k];return n;}
const states=()=>Object.keys(G.N0.states).sort((a,b)=>G.N0.states[a].name.localeCompare(G.N0.states[b].name));
function stName(ab){return G.N0.states[ab].name;}

/* ---------- screens ---------- */
function setupHTML(){
  const c=G.cfg;
  return '<div class="gwrap"><div class="brand"><b>Election Night Desk</b><span>Campaign mode</span></div>'+
  '<h1 class="gh">Run for office.</h1>'+
  '<p class="gp">Build a candidate, pick a race from the real 2026 or 2028 map, and run a multi-week campaign. What you do changes your numbers on election night. Your candidate and everyone you face are fictional.</p>'+
  '<div class="fld"><span class="lb">Cycle</span><div class="seg" id="gscen">'+
  [['2028','2028 presidential','President, Senate, House, governor'],['2026','2026 midterms','Senate, House, governor']].map(x=>'<button type="button" data-a="scen" data-v="'+x[0]+'" aria-pressed="'+(c.scen===x[0])+'"><b>'+x[1]+'</b><span>'+x[2]+'</span></button>').join('')+'</div></div>'+
  '<p class="gp small">'+(c.scen==='2026'?'The 2026 map starts from the real results as they stand, so the national environment is the real one.':'The 2028 national environment is not known in advance. It is drawn at random from the range of past presidential-year swings, and you will have to read it from the polls.')+'</p>'+
  '<div class="gorow"><button class="start" data-a="create" type="button">Create your candidate</button><button class="start alt" data-a="exit" type="button">Back</button></div></div>';
}
const STEPS=[['id','Identity'],['bg','Background'],['sk','Skills'],['pos','Political test'],['race','Race']];
function sel(f,opts,val,lbl){return '<div class="fld"><label>'+lbl+'</label><select data-f="'+f+'">'+opts.map(o=>'<option'+(o===val?' selected':'')+'>'+esc(o)+'</option>').join('')+'</select></div>';}
function idHTML(){
  const c=G.cand;
  const parties=[['D','Democratic'],['R','Republican'],['I','Independent or third party']];
  let h='<div class="fld"><label for="gname">Name</label><input id="gname" data-i="name" type="text" value="'+esc(c.name)+'" maxlength="40"></div>';
  h+='<div class="fld"><span class="lb">Party</span><div class="seg3">'+parties.map(p=>'<button type="button" data-a="party" data-v="'+p[0]+'" aria-pressed="'+(c.party===p[0])+'">'+p[1]+'</button>').join('')+'</div></div>';
  if(c.party==='I')h+=sel('third',GM.THIRD,c.third,'Label on the ballot')+'<p class="gp small">Independents start with fewer resources, must collect signatures to make the ballot, and need polling above 15% to reach the debate stage. You will split the vote, so you can swing the race even if you cannot win it on election night.</p>';
  h+='<div class="row2">'+sel('gender',GM.GENDERS,c.gender,'Gender')+sel('race',GM.RACES,c.race,'Race or ethnicity')+'</div>';
  h+='<div class="row2"><div class="fld"><label for="gage">Age</label><input id="gage" data-i="age" type="number" min="18" max="95" value="'+c.age+'"></div>'+sel('health',GM.HEALTH,c.health,'Health')+'</div>';
  h+='<div class="row2"><div class="fld"><label>Home state</label><select data-f="home">'+states().map(s=>'<option value="'+s+'"'+(s===c.home?' selected':'')+'>'+esc(stName(s))+'</option>').join('')+'</select></div>'+sel('religion',GM.RELIGIONS,c.religion,'Religion')+'</div>';
  return h;
}
function bgHTML(){
  const c=G.cand;
  let h='<h4 class="gs">Career before politics</h4><div class="opts">'+GM.BACKGROUNDS.map(b=>'<button type="button" class="opt" data-a="bg" data-v="'+b.id+'" aria-pressed="'+(c.bg===b.id)+'"><b>'+esc(b.name)+'</b><span>'+skTxt(b.sk)+'</span></button>').join('')+'</div>';
  h+='<h4 class="gs">Strengths <small>choose up to 2</small></h4><div class="opts">'+GM.STRENGTHS.map(b=>'<button type="button" class="opt" data-a="str" data-v="'+b.id+'" aria-pressed="'+c.strengths.includes(b.id)+'"><b>'+esc(b.name)+'</b><span>'+esc(b.desc)+'</span></button>').join('')+'</div>';
  h+='<h4 class="gs">Baggage <small>up to 2, each gives you 2 extra skill points</small></h4><div class="opts">'+GM.BAGGAGE.map(b=>'<button type="button" class="opt neg" data-a="bag" data-v="'+b.id+'" aria-pressed="'+c.baggage.includes(b.id)+'"><b>'+esc(b.name)+'</b><span>'+esc(b.desc)+'</span></button>').join('')+'</div>';
  h+='<h4 class="gs">Education</h4><div class="row2"><div class="fld"><label>School</label><select data-f="tier">'+GM.TIERS.map((t,i)=>'<option value="'+i+'"'+(i===c.tier?' selected':'')+'>'+esc(t)+'</option>').join('')+'</select></div>'+
   '<div class="fld"><label>Highest degree</label><select data-f="degree">'+GM.DEGREES.map(d=>'<option value="'+d.id+'"'+(d.id===c.degree?' selected':'')+'>'+esc(d.name)+'</option>').join('')+'</select></div></div>';
  return h;
}
function skTxt(sk){const o=[];for(const k in sk){const s=GM.SKILLS.find(x=>x.id===k);if(s)o.push((sk[k]>0?'+':'')+sk[k]+' '+s.name.toLowerCase());}return o.length?o.join(', '):'No skill bonus';}
function skHTML(){
  const c=G.cand,eff=GM.effSkills(c),left=skillBudget()-skillSpent();
  let h='<p class="gp">Spend your points. Everyone starts at '+GM.SKILL_BASE+'. Your background, strengths and degree add free bonuses on top (shown in brackets).</p><div class="ptsleft '+(left<0?'bad':'')+'">'+left+' point'+(left===1?'':'s')+' left</div>';
  h+=GM.SKILLS.map(s=>{const a=c.skills[s.id]||0;const bonus=eff[s.id]-(GM.SKILL_BASE+a);
    return '<div class="skrow"><div><b>'+s.name+'</b><div class="small muted">'+esc(s.desc)+'</div></div><div class="stp"><button type="button" data-a="sk" data-v="'+s.id+'" data-d="-1" '+(a<=0?'disabled':'')+' aria-label="Lower '+s.name+'">−</button><span class="skv">'+eff[s.id]+'</span><button type="button" data-a="sk" data-v="'+s.id+'" data-d="1" '+(left<=0||GM.SKILL_BASE+a>=GM.SKILL_MAX?'disabled':'')+' aria-label="Raise '+s.name+'">+</button></div><span class="small muted skb">'+(bonus?'('+sg(bonus,0)+' bonus)':'')+'</span></div>';}).join('');
  return h;
}
const QP={econ:'How much should government steer the economy?',tax:'What should happen to taxes?',health:'How should the country handle health care?',immig:'What is your approach to immigration?',abort:'Where do you stand on abortion?',guns:'How should guns be regulated?',climate:'How should the country handle climate and energy?'};
const ECON=['econ','tax','health','house','trade','educ'],SOC=['abort','guns','immig','culture','police','democ','safety'];
function quizState(){if(!G.quiz)G.quiz={i:0,done:false,ans:{}};return G.quiz;}
function leaning(){
  const p=G.cand.pos,avg=a=>{let s=0,n=0;for(const k of a)if(p[k]){s+=p[k].s;n++;}return n?s/n:0;};
  const e=avg(ECON),s=avg(SOC),m=(e+s)/2;
  let lab;
  if(e>=0.7&&s<=-0.7)lab='Libertarian-leaning';else if(e<=-0.7&&s>=0.7)lab='Populist';
  else lab=m<=-1.3?'Strongly progressive':m<=-0.5?'Liberal':m<0.5?'Moderate':m<1.3?'Conservative':'Strongly conservative';
  const dist=P=>{let t=0,n=0;for(const is of GM.ISSUES){t+=Math.abs(p[is.id].s-GM.PARTY_STANCE[P][is.id]);n++;}return t/n;};
  return {e,s,lab,dD:dist('D'),dR:dist('R')};
}
function axisTxt(v,l,r){return Math.abs(v)<0.5?'centrist':v<0?l:r;}
function posHTML(){
  initPos();const q=quizState(),c=G.cand,iss=GM.visIssues();
  if(q.done){
    const L=leaning();
    let h='<div class="note" style="margin-top:0">Your answers define your platform. This is the leaning your test produced.</div><div class="lean"><b>'+L.lab+'</b><span>'+axisTxt(L.e,'economically left','economically right')+' · '+axisTxt(L.s,'socially liberal','socially conservative')+'</span></div>';
    const near=L.dD<L.dR?'Democratic':'Republican';
    h+='<p class="gp small">Your platform sits closer to the '+near+' Party (average gap '+Math.min(L.dD,L.dR).toFixed(1)+' steps, against '+Math.max(L.dD,L.dR).toFixed(1)+'). '+(c.party==='I'?'As an independent you can run wherever you like.':(c.party==='D'?L.dD>L.dR:L.dR>L.dD)?'You are running as '+(c.party==='D'?'a Democrat':'a Republican')+' despite that. Expect some enthusiasm trouble with your own base and some crossover appeal.':'That fits the party you picked.')+'</p>';
    h+='<h4 class="gs">Your platform</h4>'+iss.map(is=>{const p=c.pos[is.id];return '<div class="er"><span><b>'+esc(is.name)+'</b>: '+esc(is.lab[Math.round(p.s)+2])+'</span><span class="small muted">'+['','Low','Medium','High'][p.w]+' priority</span></div>';}).join('');
    h+='<div class="gnav" style="justify-content:flex-start"><button class="btn" data-a="qretake">Retake the test</button></div>';
    return h;
  }
  const is=iss[q.i],a=q.ans[is.id];
  let h='<div class="qprog"><span>Question '+(q.i+1)+' of '+iss.length+'</span><div class="gbar"><i style="width:'+((q.i)/iss.length*100)+'%"></i></div></div>';
  h+='<p class="gp small">Answer honestly. There are no right answers, and your answers become your platform. Pick the statement closest to what you believe.</p>';
  h+='<h3 class="qq">'+esc(QP[is.id]||'Where do you stand on '+is.name.toLowerCase()+'?')+'</h3><p class="qd">'+esc(GM.issueDesc(is.id))+'</p><div class="qopts">'+is.lab.map((l,k)=>'<button type="button" class="chc" data-a="qans" data-s="'+(k-2)+'" aria-pressed="'+(a&&a.s===k-2)+'"><b>'+esc(l)+'</b><span class="od">'+esc(GM.optDesc(is.id,k))+'</span></button>').join('')+'</div>';
  h+='<div class="fld" style="margin-top:12px"><span class="lb">How much does this issue matter to you?</span><div class="seg3">'+[[1,'Not much'],[2,'Some'],[3,'A great deal']].map(x=>'<button type="button" data-a="qimp" data-w="'+x[0]+'" aria-pressed="'+((a?a.w:2)===x[0])+'">'+x[1]+'</button>').join('')+'</div></div>';
  h+='<div class="gnav"><button class="btn" data-a="qprev" '+(q.i?'':'disabled')+'>Previous question</button><button class="btn gold" data-a="qnext" '+(a?'':'disabled')+'>'+(q.i===iss.length-1?'See my results':'Next question')+'</button></div>';
  return h;
}
function applyQuiz(){const q=quizState();for(const is of GM.ISSUES){const a=q.ans[is.id];if(a){G.cand.pos[is.id]={s:a.s,w:a.w};G.touched[is.id]=1;}}}
function raceList(){
  const out=[];
  const offs=G.cfg.scen==='2028'?['pres','sen','gov','house']:['sen','gov','house'];
  return offs;
}
function raceHTML(){
  const c=G.cand,N=G.N0,offs=raceList();
  if(!G.office||!offs.includes(G.office))G.office=offs[0];
  let h='<p class="gp">Pick the race you will run in. Ratings come from the last election and the polling average, as they would on the ratings pages.</p><div class="seg3 offs">'+offs.map(o=>{const ok=c.age>=GM.OFFICES[o].minAge;return '<button type="button" data-a="office" data-v="'+o+'" aria-pressed="'+(G.office===o)+'" '+(ok?'':'disabled title="Minimum age '+GM.OFFICES[o].minAge+'"')+'>'+OFFN[o]+(ok?'':' ('+GM.OFFICES[o].minAge+'+)')+'</button>';}).join('')+'</div>';
  if(G.office==='pres'){
    const hs=N.byId['pres:'+c.home];
    h+='<div class="note">You run nationally. The campaign is fought over the national popular vote and every state\'s electoral votes; your background plays differently in each state. Length: '+GM.OFFICES.pres.weeks+' weeks.</div>';
    h+='<button type="button" class="opt big" data-a="pickpres" aria-pressed="'+(G.race&&G.race.office==='pres')+'"><b>Run for President</b><span>Home state '+esc(stName(c.home))+' · '+GM.OFFICES.pres.weeks+' weeks</span></button>';
  }else if(G.office==='house'){
    const hs=states().filter(s=>N.states[s].houseIds&&N.states[s].houseIds.length);
    if(!G.hst||!hs.includes(G.hst))G.hst=hs.includes(c.home)?c.home:hs[0];
    h+='<div class="fld"><label>State</label><select data-f="hst">'+hs.map(s=>'<option value="'+s+'"'+(s===G.hst?' selected':'')+'>'+esc(stName(s))+'</option>').join('')+'</select></div><div class="opts">';
    for(const id of N.states[G.hst].houseIds){const ct=N.byId[id],r=rateLab(ct.rateT);h+='<button type="button" class="opt" data-a="pick" data-v="'+id+'" aria-pressed="'+(G.race&&G.race.id===id)+'"><b>'+esc(ct.label)+'</b><span class="rt '+r[1]+'">'+r[0]+'</span></button>';}
    h+='</div>';
  }else{
    h+='<div class="opts">'+states().filter(s=>N.states[s].contests&&N.states[s].contests[G.office]).map(s=>{const ct=N.states[s].contests[G.office],r=rateLab(ct.rateT);return '<button type="button" class="opt" data-a="pick" data-v="'+ct.id+'" aria-pressed="'+(G.race&&G.race.id===ct.id)+'"><b>'+esc(stName(s))+'</b><span class="rt '+r[1]+'">'+r[0]+'</span></button>';}).join('')+'</div>';
  }
  return h;
}
function previewHTML(){
  const c=G.cand;let h='<h3>Your candidate</h3><div class="pv-name"><b>'+esc(c.name||'Unnamed')+'</b><span class="pbadge '+(c.party==='I'?'n':c.party.toLowerCase())+'">'+(c.party==='I'?esc(c.third):c.party==='D'?'Democrat':'Republican')+'</span></div>';
  const bg=GM.BACKGROUNDS.find(b=>b.id===c.bg);
  h+='<div class="small muted">'+c.age+' · '+esc(c.gender)+' · '+esc(c.race)+' · from '+esc(stName(c.home))+'<br>'+(bg?esc(bg.name):'')+'</div>';
  const eff=GM.effSkills(c);h+='<div class="skmini">'+GM.SKILLS.map(s=>'<span title="'+s.name+'"><b>'+eff[s.id]+'</b>'+s.name.slice(0,4)+'</span>').join('')+'</div>';
  if(G.race){
    const rc=G.race.office==='pres'?{id:'pres:'+c.home,st:c.home,office:'pres'}:G.race;
    const E=GM.candEffect(c,rc,G.N0);
    const ct=G.N0.byId[rc.id];
    h+='<h3>Effect in '+(G.race.office==='pres'?stName(c.home)+' (your home state)':esc(ct.label+(ct.office==='house'?'':' · '+stName(ct.st))))+'</h3><div class="eff">'+E.parts.filter(p=>Math.abs(p.v)>=0.05).map(p=>'<div class="er"><span>'+esc(p.k)+'</span><b class="'+(p.v>=0?'pos':'neg')+'">'+sg(p.v)+'</b></div>').join('')+'<div class="er tot"><span>Net starting edge</span><b class="'+(E.total>=0?'pos':'neg')+'">'+sg(E.total)+' pts</b></div></div><div class="small muted">Points of margin in your favor at the start of the campaign, before voters have heard much about you.</div>';
  }else h+='<div class="small muted">Choose a race to see how your profile plays there.</div>';
  return h;
}
function creatorHTML(){
  const body={id:idHTML,bg:bgHTML,sk:skHTML,pos:posHTML,race:raceHTML}[G.tab]();
  const i=STEPS.findIndex(s=>s[0]===G.tab);
  const can=!!G.race&&skillSpent()<=skillBudget()&&G.cand.name.trim()&&G.cand.age>=GM.OFFICES[G.race.office].minAge;
  return '<div class="gwrap wide"><div class="brand"><b>Election Night Desk</b><span>Candidate creator</span></div>'+
  '<div class="gtabs" role="tablist">'+STEPS.map(s=>'<button type="button" role="tab" data-a="tab" data-v="'+s[0]+'" aria-selected="'+(G.tab===s[0])+'">'+s[1]+'</button>').join('')+'</div>'+
  '<div class="ggrid"><section class="gmain card">'+body+'<div class="gnav">'+(i>0?'<button class="btn" data-a="tab" data-v="'+STEPS[i-1][0]+'">Back</button>':'<button class="btn" data-a="setup">Back</button>')+(i<STEPS.length-1?'<button class="btn gold" data-a="tab" data-v="'+STEPS[i+1][0]+'">Next: '+STEPS[i+1][1]+'</button>':'<button class="btn gold" data-a="begin" '+(can?'':'disabled')+'>Begin campaign</button>')+'</div>'+(i===STEPS.length-1&&!can?'<div class="small muted" style="margin-top:6px">'+(!G.race?'Pick a race to begin.':skillSpent()>skillBudget()?'You spent too many skill points.':G.cand.age<GM.OFFICES[G.race.office].minAge?'You are too young for that office.':'Enter a name.')+'</div>':'')+'</section>'+
  '<aside class="gside card">'+previewHTML()+'</aside></div></div>';
}

/* ---------- campaign ---------- */
function polBar(me,opp,und,cl,lab){return '<div class="pbar"><span class="bl '+cl[0]+'" style="width:'+me+'%"></span><span class="bl u" style="width:'+und+'%"></span><span class="bl '+cl[1]+'" style="width:'+opp+'%"></span></div>';}
function myCl(){const C=G.C;return C.indep?'n':(C.cand.party==='D'?'d':'r');}
function oppCl(){const C=G.C;return C.cand.party==='D'?'r':'d';}
function pollCard(){
  const C=G.C,p=C.polls[C.polls.length-1];
  let h='<h3>Latest public poll</h3>';
  if(!p)h+='<div class="muted small">No public polls yet. The first one comes out at the end of this week.</div>';
  else if(!C.indep){
    h+='<div class="pl"><b class="'+myCl()+'">You '+p.me.toFixed(0)+'%</b><b class="'+oppCl()+'">'+esc(C.opp.name.split(' ')[1])+' '+p.opp.toFixed(0)+'%</b></div>'+polBar(p.me,p.opp,Math.max(0,100-p.me-p.opp),[myCl(),oppCl()])+'<div class="small muted">Undecided '+p.und.toFixed(0)+'% · margin of error ±'+p.moe+' · '+(Math.abs(p.margin)<=p.moe?'within the margin of error':p.margin>0?'you lead by '+p.margin.toFixed(0):'you trail by '+(-p.margin).toFixed(0))+'</div>';
  }else h+='<div class="pl"><b class="n">You '+p.me.toFixed(0)+'%</b><b class="d">D '+p.D.toFixed(0)+'%</b><b class="r">R '+p.R.toFixed(0)+'%</b></div><div class="small muted">Margin of error ±'+p.moe+'. Debate threshold: 15% in a recent poll.</div>';
  if(C.polls.length>1){const v=C.polls.map(x=>x.margin),mn=Math.min(...v,-5),mx=Math.max(...v,5),W=260,H=54;const pts=v.map((y,i)=>(4+(W-8)*i/Math.max(1,v.length-1)).toFixed(1)+','+(H-4-(H-8)*(y-mn)/(mx-mn)).toFixed(1)).join(' ');
    const zero=(H-4-(H-8)*(0-mn)/(mx-mn)).toFixed(1);
    h+='<svg viewBox="0 0 '+W+' '+H+'" class="spark" role="img" aria-label="Poll margin over time"><line x1="0" x2="'+W+'" y1="'+zero+'" y2="'+zero+'" class="z"/><polyline points="'+pts+'" fill="none"/></svg>';}
  if(C.internal)h+='<div class="small" style="margin-top:6px"><b>Internal poll:</b> '+esc(GM.pollTxt(C,C.internal))+'</div>';
  return h;
}
function gauge(l,v,lo,hi){const p=Math.max(0,Math.min(100,(v-lo)/(hi-lo)*100));return '<div class="gg"><span>'+l+'</span><div class="gbar"><i style="width:'+p+'%"></i></div><b>'+(lo<0?sg(v,0):Math.round(v))+'</b></div>';}
function statCard(){
  const C=G.C,m=C.me;
  return '<h3>Your standing</h3>'+gauge('Name ID',m.nameId,0,100)+gauge('Favorability',m.fav,-40,40)+gauge('Enthusiasm',m.enth,0,100)+gauge('Field operation',m.field,0,100)+gauge('Media tone',m.media,-40,40);
}
function actHTML(){
  const C=G.C;
  let h='<div class="tgt"><span class="lb">Rallies and visits aim at</span><div class="seg3">'+['urban','suburban','rural'].map(t=>'<button type="button" data-a="tgt" data-v="'+t+'" aria-pressed="'+(G.tgt===t)+'">'+t[0].toUpperCase()+t.slice(1)+'</button>').join('')+'</div></div><div class="acts">';
  for(const a of GM.ACTIONS){
    if(a.indep&&!C.indep)continue;
    const sizes=a.sizes||[[null]];
    h+='<div class="act"><div class="atop"><b>'+esc(a.name)+'</b><span class="small muted">'+actCostTxt(a)+'</span></div><div class="small muted">'+esc(a.desc)+'</div><div class="abtns">';
    sizes.forEach((sz,i)=>{
      const why=GM.canAct(C,a,a.sizes?i:0);const cost=GM.actCost(C,a,a.sizes?i:0);
      h+='<button type="button" class="btn" data-a="act" data-v="'+a.id+'" data-i="'+i+'" '+(why?'disabled':'')+' title="'+esc(why||'')+'">'+(a.sizes?sz[0]+' ('+fm(cost.cash)+')':'Do it')+'</button>';
    });
    const why0=GM.canAct(C,a,0);if(why0)h+='<span class="small muted why">'+esc(why0)+'</span>';
    h+='</div></div>';
  }
  return h+'</div>';
}
function actCostTxt(a){const c=a.cost,o=[];if(c.time)o.push(c.time+' day'+(c.time>1?'s':''));if(c.cash&&!a.sizes)o.push(fm(GM.cashK(G.C,c.cash)));if(c.staff)o.push(c.staff+' staff');return o.join(' · ')||'Free';}
function staffHTML(){
  const C=G.C;let h='<p class="small muted">Capacity '+GM.staffUsedFn(C)+' of '+GM.staffPts(C)+' used this week. Salaries cost '+fm(GM.weeklyUpkeep(C))+' a week.</p>';
  for(const role of GM.ROLES){
    const cur=C.staff.find(s=>s.role===role.id);
    h+='<div class="srole"><div class="atop"><b>'+role.name+'</b><span class="small muted">+'+role.cap+' capacity</span></div><div class="small muted">'+esc(role.desc)+'</div>';
    if(cur){const q=GM.QUIRKS.find(x=>x.id===cur.quirk);h+='<div class="pers cur"><div><b>'+esc(cur.name)+'</b> · skill '+cur.skill+' · '+esc(q?q.name:'')+'<div class="small muted">Loyalty '+Math.round(cur.loyalty)+' · '+fm(cur.salary*C.scale*0.5)+'/wk</div></div><button class="btn" data-a="fire" data-v="'+cur.id+'">Fire</button></div>';}
    else h+=C.pool[role.id].map(p=>{const q=GM.QUIRKS.find(x=>x.id===p.quirk);return '<div class="pers"><div><b>'+esc(p.name)+'</b> · skill '+p.skill+' · '+esc(q?q.name:'')+'<div class="small muted">'+esc(q?q.desc:'')+' · '+fm(p.salary*C.scale*0.5)+'/wk</div></div><button class="btn gold" data-a="hire" data-v="'+p.id+'">Hire</button></div>';}).join('');
    h+='</div>';
  }
  return h;
}
function newsHTML(){
  const C=G.C;const a=C.news.slice().reverse().slice(0,40);
  return '<div class="news">'+a.map(n=>'<div class="nr"><span class="nw">Wk '+n.w+'</span><span>'+esc(n.t)+'</span></div>').join('')+'</div>';
}
function oppHTML(){
  const C=G.C;
  return C.opps.map(o=>'<div class="srole"><div class="atop"><b>'+esc(o.name)+' <span class="pbadge '+o.party.toLowerCase()+'">'+(o.party==='D'?'Democrat':'Republican')+'</span></b>'+(o.incumbent?'<span class="small muted">Incumbent</span>':'')+'</div><div class="small">'+esc(o.arch.name)+': '+esc(o.arch.desc)+'</div>'+
    gauge('Name ID',o.stat.nameId,0,100)+gauge('Favorability',o.stat.fav,-40,40)+gauge('Field operation',o.stat.field,0,100)+
    '<div class="small muted" style="margin-top:6px">Reported cash on hand: about '+fm(o.cash)+'. '+(o.lastActs.length?'Last week: '+o.lastActs.join(', ')+'.':'')+(o.known?' Your researchers know something about them.':'')+'</div></div>').join('');
}
function candTabHTML(){
  const C=G.C;
  return '<p class="small muted">What your profile is worth in this race right now (points of margin, in your favor).</p><div class="eff">'+C.S.parts.filter(p=>Math.abs(p.v)>=0.05).map(p=>'<div class="er"><span>'+esc(p.k)+'</span><b class="'+(p.v>=0?'pos':'neg')+'">'+sg(p.v)+'</b></div>').join('')+'<div class="er tot"><span>Starting edge</span><b class="'+(C.S.total>=0?'pos':'neg')+'">'+sg(C.S.total)+'</b></div></div>'+
   '<p class="small muted">Voters only react to this once they know who you are. At '+Math.round(C.me.nameId)+'% name ID, about '+Math.round(GM.vis(C)*100)+'% of it is showing up in the polls.</p>';
}
/* ---- strategy screens ---- */
const TONES=[['Positive','Talk about yourself and your plans.'],['Mixed','Mostly positive, with contrast where you are stronger.'],['Contrast','Go after your opponent where voters side with you.']];
function fitTxt(f){return f>0.08?['Strong match','pos']:f>0.03?['Good','pos']:f>-0.03?['Even','']:f>-0.08?['Weak','neg']:['Opposed','neg'];}
function leanTxt(l){const a=Math.abs(l);return a<2?'Even':(l>0?'D+':'R+')+a.toFixed(0);}
function stTxt(s){return GM.ISSUES.find(i=>i.id===s.id);}
function track(vals){ // vals: [[pos,cls,label]]
  return '<span class="trk">'+vals.filter(v=>v[0]!=null).map(v=>'<i class="mk '+v[1]+'" style="left:'+((v[0]+2)/4*100).toFixed(1)+'%" title="'+v[2]+'"></i>').join('')+'</span>';
}
function stanceLab(is,s){return is.lab[Math.round(gcl2(s))+2];}
function gcl2(x){return Math.max(-2,Math.min(2,x));}
function issueRows(C){
  const rows=GM.viewRows(C);return rows.map(x=>({...x,net:GM.adv(C,x.is.id,x.e)*x.sal})).sort((a,b)=>b.sal-a.sal);
}
function themeChips(C){
  const P=C.plan,rows=GM.viewRows(C);
  if(!P.themes.length)return '<div class="note">No message chosen. Pick up to three issues to campaign on this week.</div>';
  return '<div class="chips2">'+P.themes.map(id=>{const x=rows.find(r=>r.is.id===id),a=GM.adv(C,id,x.e),f=fitTxt(a/6);
    return '<div class="tchip"><b>'+esc(x.is.name)+'</b><span class="small muted">You: '+esc(stanceLab(x.is,x.you))+'</span><span class="small">Voters lean: '+esc(stanceLab(x.is,x.e))+'</span><span class="small '+f[1]+'">'+(a>0.05?'You are closer to voters than your opponent':a<-0.05?'Your opponent is closer to voters':'No clear edge')+'</span><button class="btn" data-a="theme" data-v="'+id+'">Remove</button></div>';}).join('')+'</div>';
}
function issueTable(C){
  const rows=issueRows(C);
  let h='<div class="itab"><div class="ih"><span>Issue</span><span>Matters</span><span>Voters · You · Opp.</span><span></span></div>';
  for(const x of rows){
    const on=C.plan.themes.includes(x.is.id),netTxt=x.net>0.004?'<b class="pos">+</b>':x.net<-0.004?'<b class="neg">−</b>':'';
    h+='<div class="ir"><span>'+esc(x.is.name)+'</span><span class="bar"><i style="width:'+Math.min(100,x.sal*100*5).toFixed(0)+'%"></i></span>'+track([[x.e,'v','Voters'],[x.you,'y','You'],[x.opp,'o','Opponent']])+'<button class="btn sm" data-a="theme" data-v="'+x.is.id+'" '+(on||C.plan.themes.length<3?'':'disabled')+'>'+(on?'Remove':'Use')+' '+netTxt+'</button></div>';
  }
  return h+'</div>';
}
function planHTML(C){
  const P=C.plan,cost=GM.planCost(C,P),daysLeft=C.time-cost.days;
  let h='<div class="plan">';
  // 1 message
  h+='<section class="pcard"><h4>1. Your message</h4><p class="small muted">What you campaign on this week. Voters reward you on issues where you are closer to them than your opponent, and punish you where you are not. Campaigning on an issue also puts it higher on voters’ minds.</p>'+themeChips(C);
  h+='<div class="seg3 tones">'+TONES.map((t,i)=>'<button type="button" data-a="tone" data-v="'+i+'" aria-pressed="'+(P.tone===i)+'" title="'+esc(t[1])+'">'+t[0]+'</button>').join('')+'</div><div class="small muted">'+TONES[P.tone][1]+(P.tone===2?' Overdoing it for three weeks in a row turns voters off.':'')+'</div>';
  h+='<button class="btn" data-a="issuelist" style="margin-top:8px">'+(G.issueList?'Hide issue list':'Choose issues')+'</button>'+(G.issueList?issueTable(C):'')+'</section>';
  // 2 geography
  const used=C.regions.reduce((s,r)=>s+(P.geo[r.id]||0),0);
  h+='<section class="pcard"><h4>2. Where you campaign</h4><p class="small muted">Your in-person days are split by these points. Places where your platform fits swing more, and where you already pull strongly you get less out of extra visits. <b>'+(10-used)+'</b> points unassigned.</p>';
  for(const rg of C.regions){
    const f=fitTxt(GM.regionFit(C,rg)),pts=P.geo[rg.id]||0;
    h+='<div class="grow"><div><b>'+esc(rg.name)+'</b><div class="small muted">'+Math.round(rg.share*100)+'% of the vote · '+leanTxt(rg.lean)+(rg.names.length?' · '+esc(rg.names.join(', ')):'')+'</div><div class="small">Your platform here: <span class="'+f[1]+'">'+f[0]+'</span> · Local swing: '+sgn(rg.swing)+'</div></div><div class="stp"><button type="button" data-a="geo" data-v="'+rg.id+'" data-d="-1" '+(pts<=0?'disabled':'')+'>−</button><span class="skv">'+pts+'</span><button type="button" data-a="geo" data-v="'+rg.id+'" data-d="1" '+(used>=10?'disabled':'')+'>+</button></div></div>';
  }
  h+='</section>';
  // 3 blocs
  h+='<section class="pcard"><h4>3. Who you court</h4><p class="small muted">Choose up to three groups to work this week. Your in-person days are shared between them. Groups swing toward you when your platform fits what they care about, and faster when you share their background.</p><div class="blocs">';
  for(const b of C.blocs){
    const f=fitTxt(GM.blocFit(C,b)),on=P.blocs.includes(b.id),tie=GM.tie(C,b);
    h+='<button type="button" class="bloc" data-a="bloc" data-v="'+b.id+'" aria-pressed="'+on+'" '+(on||P.blocs.length<3?'':'disabled')+'><b>'+esc(b.name)+'</b><span class="small muted">~'+Math.round(b.share)+'% · '+leanTxt(b.lean*0.5)+'</span><span class="small '+f[1]+'">'+f[0]+(tie>0?' · shared background':'')+'</span><span class="small muted">Swing '+sgn(b.swing-b.oswing)+'</span></button>';
  }
  h+='</div></section>';
  // 4 week
  h+='<section class="pcard"><h4>4. Your week</h4><div class="small muted">Days: <b>'+daysLeft+'</b> of '+C.time+' unspent · Cash plan: <b>'+fm(cost.cash)+'</b> of '+fm(C.cash)+'</div><div class="tgrid">';
  for(const t of GM.TIME){if(t.indep&&!C.indep)continue;const v=P.time[t.id]||0;
    h+='<div class="trow"><div><b>'+t.name+'</b><div class="small muted">'+esc(t.desc)+'</div></div><div class="stp"><button type="button" data-a="time" data-v="'+t.id+'" data-d="-1" '+(v<=0?'disabled':'')+'>−</button><span class="skv">'+v+'</span><button type="button" data-a="time" data-v="'+t.id+'" data-d="1" '+(daysLeft<=0?'disabled':'')+'>+</button></div></div>';}
  h+='</div><div class="tgrid">';
  for(const m of GM.MONEY){if(m.indep&&!C.indep)continue;const lv=P.money[m.id]||0;
    h+='<div class="trow"><div><b>'+m.name+'</b><div class="small muted">'+esc(m.desc)+' '+fm(GM.cashK(C,m.unit[lv]))+' this week.</div></div><div class="dial">'+[0,1,2,3,4].map(i=>'<button type="button" data-a="money" data-v="'+m.id+'" data-l="'+i+'" aria-pressed="'+(lv===i)+'">'+i+'</button>').join('')+'</div></div>';}
  h+='</div><div class="fld" style="margin-top:8px"><label>Special move (optional)</label><select data-f="special">'+GM.SPECIALS.map(s=>'<option value="'+s.id+'"'+(P.special.id===s.id?' selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select></div>';
  const sp=GM.SPECIALS.find(s=>s.id===P.special.id);
  if(sp&&sp.desc)h+='<div class="small muted">'+esc(sp.desc)+'</div>';
  if(P.special.id==='rollout')h+='<div class="fld"><label>Policy to roll out</label><select data-f="spArg">'+GM.visIssues().map(i=>'<option value="'+i.id+'"'+(P.special.arg===i.id?' selected':'')+'>'+esc(i.name)+'</option>').join('')+'</select></div>';
  h+='</section></div>';
  return h;
}
function sgn(x){return (x>=0?'+':'−')+Math.abs(x).toFixed(1);}
function electorateHTML(C){
  const scope=G.escope||'all';
  let opts='<option value="all">Whole electorate</option><optgroup label="Where">'+C.regions.map(r=>'<option value="r:'+r.id+'"'+(scope==='r:'+r.id?' selected':'')+'>'+esc(r.name)+'</option>').join('')+'</optgroup><optgroup label="Who">'+C.blocs.map(b=>'<option value="b:'+b.id+'"'+(scope==='b:'+b.id?' selected':'')+'>'+esc(b.name)+'</option>').join('')+'</optgroup>';
  let rows=GM.viewRows(C);
  if(scope!=='all'){
    const g=scope[0]==='r'?C.regions.find(r=>r.id===scope.slice(2)):C.blocs.find(b=>b.id===scope.slice(2));
    const k=C.exact>0?0.1:0.7;
    rows=rows.map(x=>{const base=g.e[x.is.id]+(C.e[x.is.id]-C.e0[x.is.id]);const w=scope[0]==='b'?GM.blocW(g,x.is.id):1;return {...x,e:gcl2(base+C.vnoise[x.is.id].e*k),sal:x.sal*w};});
    const t=rows.reduce((s,x)=>s+x.sal,0);for(const x of rows)x.sal/=t;
  }
  rows=rows.sort((a,b)=>b.sal-a.sal);
  const L=rows.filter(x=>Math.abs(x.shift)>=0.08).sort((a,b)=>Math.abs(b.shift)-Math.abs(a.shift)).slice(0,3);
  let h='<div class="note" style="margin-top:0">'+(C.exact>0?'Your issue poll is fresh: these readings are precise this week.':'These are your team’s estimates, with roughly ±'+(0.5*Math.max(0.25,1-(GM.hasRole(C,'poll')?0.025*GM.hasRole(C,'poll').skill*2.2:0))).toFixed(1)+' of a step in error on where voters stand. A pollster on staff or an issue poll sharpens them.')+'</div>';
  h+='<div class="fld" style="max-width:360px"><label>View</label><select data-f="escope">'+opts+'</select></div>';
  if(L.length)h+='<div class="small" style="margin:6px 0">Moved since the campaign began: '+L.map(x=>esc(x.is.short||x.is.name)+' '+(x.shift<0?'toward the left':'toward the right')).join(', ')+'.</div>';
  h+='<div class="legend small"><i class="mk v"></i> Voters <i class="mk y"></i> You'+(C.indep?'':' <i class="mk o"></i> Opponent')+'</div><div class="itab wide"><div class="ih"><span>Issue</span><span>Matters</span><span>Left ← position → Right</span><span>Edge</span></div>';
  for(const x of rows){const a=GM.adv(C,x.is.id,x.e);
    h+='<div class="ir"><span><b>'+esc(x.is.name)+'</b></span><span class="bar"><i style="width:'+Math.min(100,x.sal*100*5).toFixed(0)+'%"></i></span>'+track([[x.e,'v','Voters: '+stanceLab(x.is,x.e)],[x.you,'y','You: '+stanceLab(x.is,x.you)],[x.opp,'o','Opponent: '+(x.opp!=null?stanceLab(x.is,x.opp):'')]])+'<span class="'+(a>0.05?'pos':a<-0.05?'neg':'')+'">'+(a>0.05?'You':a<-0.05?'Them':'Even')+'</span></div>';}
  return h+'</div>';
}
function storyTag(s){return s.real?'<span class="rbadge">Real storyline</span>':'';}
function helps(s){return s.dir>0?'<span class="d">Helps Democrats</span>':s.dir<0?'<span class="r">Helps Republicans</span>':'<span class="muted">Neutral</span>';}
function mediaHTML(C){
  const t=G.mtab||'over',M=C.media,tabs=[['over','Overview'],['news','Newspapers and TV'],['social','Social media'],['story','Storylines']];
  let h='<div class="gtabs sub">'+tabs.map(x=>'<button type="button" data-a="mtab" data-v="'+x[0]+'" aria-selected="'+(t===x[0])+'">'+x[1]+'</button>').join('')+'</div>';
  h+='<div class="small muted" style="margin-bottom:8px">Outlets and platforms are fictional. Storylines marked “Real” follow reported events from the 2026 cycle.</div>';
  if(t==='over'){
    const mo=C.N0polls.mood||{a:42,b:55,la:'Approve',lb:'Disapprove'},gen=C.mood.length?C.mood[C.mood.length-1].generic:0;
    h+='<div class="mrow"><div class="card2"><div class="small muted">'+esc(mo.label||'Approval')+'</div><b class="big">'+mo.a+'% / '+mo.b+'%</b><div class="small muted">'+esc(mo.la||'')+' / '+esc(mo.lb||'')+' at the start of the campaign</div></div><div class="card2"><div class="small muted">Generic ballot (your team’s read)</div><b class="big '+(gen>=0?'d':'r')+'">'+(Math.abs(gen)<0.5?'Even':(gen>0?'D+':'R+')+Math.abs(gen).toFixed(1))+'</b><div class="small muted">Moves with the news cycle</div></div><div class="card2"><div class="small muted">News-driven shift this campaign</div><b class="big '+(C.envDrift>=0?'d':'r')+'">'+(Math.abs(C.envDrift)<0.1?'None':(C.envDrift>0?'D+':'R+')+Math.abs(C.envDrift).toFixed(1))+'</b><div class="small muted">Added to every race on election night</div></div></div>';
    if(C.mood.length>1){const v=C.mood.map(x=>x.generic),mn=Math.min(...v)-1,mx=Math.max(...v)+1,W=300,H=60;const pts=v.map((y,i)=>(4+(W-8)*i/(v.length-1)).toFixed(1)+','+(H-4-(H-8)*(y-mn)/(mx-mn)).toFixed(1)).join(' ');h+='<svg viewBox="0 0 '+W+' '+H+'" class="spark" role="img" aria-label="Generic ballot over the campaign"><polyline points="'+pts+'" fill="none"/></svg>';}
    const sal=GM.salNow(C),top=Object.entries(sal).sort((a,b)=>b[1]-a[1]).slice(0,6);
    h+='<h4 class="gs">What voters are talking about</h4><div class="small">'+top.map(([id,v])=>esc(GM.ISSUES.find(i=>i.id===id).short||GM.ISSUES.find(i=>i.id===id).name)+' ('+Math.round(v*100)+'%)').join(' · ')+'</div>';
    h+='<h4 class="gs">Running stories this week</h4>'+M.stories.slice(0,5).map(x=>'<div class="srow"><div>'+esc(x.s.h.n)+' '+storyTag(x.s)+'</div><div class="small muted">'+helps(x.s)+'</div></div>').join('');
    if(C.backlog.length)h+='<h4 class="gs">Earlier in the cycle</h4>'+C.backlog.map(s=>'<div class="srow"><div>'+esc(s.h.n)+'</div><div class="small muted">'+s.date.slice(0,7)+'</div></div>').join('');
  }else if(t==='news'){
    h+='<div class="outs">'+M.outlets.map(x=>'<div class="out"><div class="atop"><b>'+esc(x.o.name)+'</b><span class="small muted">'+esc(x.o.kind)+'</span></div><div class="small muted">'+esc(x.o.desc)+'</div>'+
      (x.lead?'<div class="lead">'+esc(x.lead.head)+' '+storyTag(x.lead.s)+'</div>':'')+x.items.map(i=>'<div class="small">• '+esc(i.head)+'</div>').join('')+'<div class="small" style="margin-top:6px">Coverage of you: <b class="'+(x.tone>0.1?'pos':x.tone<-0.1?'neg':'')+'">'+x.lab+'</b></div></div>').join('')+'</div>';
  }else if(t==='social'){
    h+='<div class="outs">'+M.social.map(x=>'<div class="out"><div class="atop"><b>'+esc(x.p.name)+'</b><span class="small muted">'+esc(x.p.kind)+'</span></div><div class="small muted">'+esc(x.p.aud)+'</div><div class="small" style="margin-top:6px"><b>Trending</b></div>'+x.trends.map(tr=>'<div class="small">'+esc(tr.tag)+' <span class="muted">'+tr.vol.toLocaleString()+' posts</span></div>').join('')+'<div class="small" style="margin-top:6px"><b>Top posts</b></div>'+x.posts.map(p=>'<div class="post">'+esc(p.text)+'<div class="small muted">♥ '+p.likes.toLocaleString()+' · ↻ '+p.shares.toLocaleString()+'</div></div>').join('')+'<div class="small" style="margin-top:6px">Mood toward you: <b class="'+(x.mood>0.1?'pos':x.mood<-0.1?'neg':'')+'">'+(x.mood>0.25?'Warm':x.mood>0.1?'Leaning positive':x.mood>-0.1?'Mixed':x.mood>-0.25?'Leaning negative':'Hostile')+'</b></div></div>').join('')+'</div>';
  }else{
    h+=M.stories.map(x=>{const is=x.s.pi?GM.ISSUES.find(i=>i.id===x.s.pi):null;return '<div class="srow big2"><div><b>'+esc(x.s.h.n)+'</b> '+storyTag(x.s)+'<div class="small muted">'+(x.s.date&&x.s.real?'Reported '+x.s.date.slice(0,7)+' · ':'')+helps(x.s)+(is?' · Bears on: '+esc(is.name):'')+(x.s.st?' · '+x.s.st+' race':'')+'</div></div><div class="traction"><div class="small muted">Traction</div><div class="gbar"><i style="width:'+Math.round(Math.min(1,x.tr)*100)+'%"></i></div></div></div>';}).join('')||'<div class="muted">Quiet week.</div>';
  }
  return h;
}
function campHTML(){
  const C=G.C,ct=C.ct;
  const tabs=[['plan','Plan'],['elect','Electorate'],['media','Media'],['staff','Staff'],['opp','Opponent'+(C.opps.length>1?'s':'')],['cand','Candidate'],['news','Log']];
  if(!tabs.some(t=>t[0]===G.ctab))G.ctab='plan';
  const body={plan:planHTML,elect:electorateHTML,media:mediaHTML,staff:staffHTML,opp:oppHTML2,cand:candTabHTML,news:newsHTML}[G.ctab](C);
  const race=C.race.office==='pres'?'President':(ct.office==='house'?ct.label:stName(ct.st)+' '+OFFN[ct.office]);
  const ev=C.phase==='events'?evModal():(G.report?reportModal():'');
  const cost=GM.planCost(C,C.plan);
  return '<div class="gwrap wide"><div class="gbar2"><div><b class="gtitle">'+esc(race)+'</b><div class="small muted">'+esc(C.cand.name)+' · '+(C.cand.party==='I'?esc(C.cand.third):C.cand.party==='D'?'Democrat':'Republican')+' · '+GM.fmtDate(GM.dateOfWeek(C))+'</div></div>'+
  '<div class="gstats"><div><span>Week</span><b>'+Math.min(C.week,C.weeks)+' / '+C.weeks+'</b></div><div><span>Cash</span><b class="'+(C.cash<0?'neg':'')+'">'+fm(C.cash)+'</b></div><div><span>Days</span><b>'+C.time+'</b></div>'+(C.indep?'<div><span>Ballot access</span><b class="'+(C.access>=100?'pos':'')+'">'+C.access+'%</b></div>':'')+'</div>'+
  '<button class="btn gold endw" data-a="runweek">'+(C.week>=C.weeks?'Run the final week':'Run the week')+'</button></div>'+(cost.days>C.time?'<div class="note">Your plan uses '+cost.days+' days but you have '+C.time+'. Extra days will be dropped.</div>':'')+
  (C.indep&&C.access<100?'<div class="note">You must reach 100% ballot access by the end of week '+C.accessDeadline+' or you will not appear on the ballot.</div>':'')+
  '<div class="ggrid camp"><aside class="gside"><div class="card">'+pollCard()+'</div><div class="card">'+statCard()+'</div></aside>'+
  '<section class="gmain card"><div class="gtabs" role="tablist">'+tabs.map(t=>'<button type="button" role="tab" data-a="ctab" data-v="'+t[0]+'" aria-selected="'+(G.ctab===t[0])+'">'+t[1]+'</button>').join('')+'</div>'+body+'</section></div>'+ev+'</div>';
}
function oppHTML2(C){
  return oppHTML().replace(/<\/div><\/div>$/,'</div></div>')+C.opps.map(o=>'<div class="small" style="margin:4px 0">'+esc(o.name)+' is campaigning on: <b>'+(o.themes.length?o.themes.map(id=>esc(GM.ISSUES.find(i=>i.id===id).name)).join(', '):'(nothing yet)')+'</b>.</div>').join('');
}
function reportModal(){
  const R=G.report;if(!R)return '';
  return '<div class="evback"><div class="evbox" role="dialog" aria-modal="true" aria-label="Week in review"><div class="evk">Week '+R.week+' in review</div><h2>'+esc(R.head)+'</h2>'+R.lines.map(l=>'<p class="small">'+esc(l)+'</p>').join('')+'<button class="btn gold" data-a="reportok">On to week '+(R.week+1)+'</button></div></div>';
}

function fxTxt(fx){
  const L={nameId:'Name ID',fav:'Favorability',enth:'Enthusiasm',field:'Field',media:'Media tone',cash:'Cash',oppFav:'Opponent favorability',time:'Days next week'};
  return Object.keys(fx).filter(k=>L[k]&&fx[k]).map(k=>{const v=fx[k];return '<span class="fxc '+((k==='oppFav'?-v:v)>=0?'pos':'neg')+'">'+L[k]+' '+(k==='cash'?(v>=0?'+':'−')+fm(Math.abs(GM.cashK(G.C,v))).replace('−',''):sg(v,1))+'</span>';}).join('');
}
function evModal(){
  const C=G.C,ev=C.pending[G.evIdx];if(!ev)return '';
  let h='<div class="evback"><div class="evbox" role="dialog" aria-modal="true" aria-label="'+esc(ev.title)+'"><div class="evk">Week '+C.week+' · '+(G.evIdx+1)+' of '+C.pending.length+'</div><h2>'+esc(ev.title)+'</h2><p>'+esc(ev.text)+'</p>';
  if(!ev.resolved){
    h+=ev.choices.map((c,i)=>{const dis=c.needsDirt&&C.dirt-C.dirtUsed<=0;return '<button type="button" class="chc" data-a="choose" data-v="'+i+'" '+(dis?'disabled':'')+'><b>'+esc(c.label)+'</b><span>'+esc(c.hint||'')+(dis?' (needs opposition findings)':'')+'</span></button>';}).join('');
  }else{
    h+='<div class="evres">'+esc(ev.result)+'</div><div class="fxs">'+fxTxt(ev.fx||{})+'</div><button class="btn gold" data-a="evnext">'+(G.evIdx<C.pending.length-1?'Next':'Continue')+'</button>';
  }
  return h+'</div></div>';
}
function doneHTML(){
  const C=G.C;
  if(C.failed)return '<div class="gwrap"><h1 class="gh">Off the ballot.</h1><p class="gp">You did not collect enough signatures before the filing deadline, so your name will not appear on the ballot. You can watch election night as a spectator, or start over.</p><div class="gorow"><button class="start" data-a="launch">Watch election night</button><button class="start alt" data-a="create">New candidate</button></div></div>';
  const p=C.polls[C.polls.length-1],dyn=GM.dyn(C);
  return '<div class="gwrap"><div class="brand"><b>Election Night Desk</b><span>Campaign complete</span></div><h1 class="gh">The campaign is over.</h1><p class="gp">Voters now decide. The result will not be what the last poll said. Polls miss by a few points, and the election night engine counts votes county by county.</p>'+
  '<div class="card"><div class="eff"><div class="er"><span>Starting edge from your profile</span><b class="'+(C.S.total>=0?'pos':'neg')+'">'+sg(C.S.total)+'</b></div><div class="er"><span>Campaign effect, net of your opponent</span><b class="'+(dyn>=0?'pos':'neg')+'">'+sg(dyn)+'</b></div><div class="er"><span>Raised / spent</span><b>'+fm(C.raised)+' / '+fm(C.spent)+'</b></div>'+(p?'<div class="er"><span>Final public poll</span><b>'+esc(GM.pollTxt(C,p))+'</b></div>':'')+'</div></div>'+
  (()=>{const L=GM.hidReveal(C);return '<div class="card" style="margin-top:12px"><h4 class="gs" style="margin-top:0">What nobody told you</h4><p class="small muted">Every candidate carries traits the polls and your staff cannot see: how well they are liked, how far they sit from the middle of their party, and which voters feel connected to them. Here is what played into this race.</p>'+(L.length?L.map(x=>'<p class="small">'+esc(x)+'</p>').join(''):'<p class="small">Neither you nor your opponent had a hidden trait that moved this race.</p>')+'</div>';})()+
  '<div class="gorow"><button class="start" data-a="launch">Go to election night</button></div></div>';
}

/* ---------- control ---------- */
function render(){
  const gm=$('gm');if(!gm)return;
  const sc=gm.scrollTop;
  gm.innerHTML={setup:setupHTML,creator:creatorHTML,camp:campHTML,done:doneHTML}[G.step]();
  const env=$('genv');if(env)env.value=String(G.cfg.env);
  gm.scrollTop=sc;
}
function show(){$('intro').hidden=true;$('gm').hidden=false;render();}
function toast(){}
function doBegin(){
  const c=G.cand;
  if(c.party==='I')c.partyLabel=c.third;
  const rc=G.race.office==='pres'?{id:'pres:'+c.home,st:c.home,office:'pres'}:G.race;
  if(G.race.office==='pres')rc.office='pres';
  const C=GM.newCampaign(JSON.parse(JSON.stringify(c)),rc,G.N0,G.cfg.seed);
  C.N0polls=G.N0.polls;
  G.C=C;G.step='camp';G.ctab='plan';G.report=null;G.issueList=false;G.escope='all';G.mtab='over';G.evIdx=0;render();
}
function afterEvents(){
  const C=G.C,wk=C.week,rep=C.rep||{lines:[]};
  const r=GM.closeWeek(C);G.evIdx=0;
  if(C.done){G.step='done';render();return;}
  const p=r.poll;
  const lines=rep.lines.slice();
  lines.push(C.indep?'New public poll: '+GM.pollTxt(C,p):'New public poll: '+GM.pollTxt(C,p)+(p.margin>p.moe?' You lead.':p.margin<-p.moe?' You trail.':' Within the margin of error.'));
  lines.push('You spent '+fm(rep.spend||0)+' and raised '+fm(rep.raised||0)+' from calls.');
  const o=C.opp;if(o.lastActs.length)lines.push(o.name+' spent the week on '+o.lastActs.slice(0,3).join(', ')+'.');
  const top=C.media&&C.media.stories[0];
  G.report={week:wk,head:top?top.s.h.n:'A quiet week',lines};
  render();
}
$('gm').addEventListener('click',e=>{
  const b=e.target.closest('[data-a]');if(!b||b.disabled)return;
  const a=b.dataset.a,v=b.dataset.v,c=G.cand;
  switch(a){
    case 'scen':G.cfg.scen=v;render();return;
    case 'exit':$('gm').hidden=true;window.__menu();return;
    case 'setup':G.step='setup';render();return;
    case 'create':{
      GM.curScen=G.cfg.scen;
      G.cfg.seed=Math.floor(Math.random()*900000)+1000;G.cfg.env=GM.realEnv(G.cfg.scen,G.cfg.seed);
      G.N0=buildNight({scenario:G.cfg.scen,env:G.cfg.env,seed:G.cfg.seed});
      G.cand=defaultCand();G.quiz=null;G.touched={};G.race=null;G.office=null;G.tab='id';G.cand.home='GA';
      initPos();G.step='creator';render();return;}
    case 'tab':G.tab=v;render();return;
    case 'party':c.party=v;initPos();G.race=null;render();return;
    case 'bg':c.bg=v;render();return;
    case 'str':{const i=c.strengths.indexOf(v);if(i>=0)c.strengths.splice(i,1);else if(c.strengths.length<2)c.strengths.push(v);render();return;}
    case 'bag':{const i=c.baggage.indexOf(v);if(i>=0)c.baggage.splice(i,1);else if(c.baggage.length<2)c.baggage.push(v);render();return;}
    case 'sk':{const d=+b.dataset.d,cur=c.skills[v]||0;if(d>0&&(skillBudget()-skillSpent()<=0||GM.SKILL_BASE+cur>=GM.SKILL_MAX))return;if(d<0&&cur<=0)return;c.skills[v]=cur+d;render();return;}
    case 'qans':{const q=quizState(),is=GM.visIssues()[q.i],o=q.ans[is.id];q.ans[is.id]={s:+b.dataset.s,w:o?o.w:2};render();return;}
    case 'qimp':{const q=quizState(),is=GM.visIssues()[q.i],o=q.ans[is.id]||{s:null,w:2};if(!q.ans[is.id])return;o.w=+b.dataset.w;render();return;}
    case 'qprev':{const q=quizState();if(q.i>0)q.i--;render();return;}
    case 'qnext':{const q=quizState();if(q.i<GM.visIssues().length-1)q.i++;else{q.done=true;applyQuiz();}render();return;}
    case 'qretake':{G.quiz={i:0,done:false,ans:{}};render();return;}
    case 'office':G.office=v;G.race=null;render();return;
    case 'pick':{const ct=G.N0.byId[v];G.race={id:ct.id,office:ct.office,st:ct.st};render();return;}
    case 'pickpres':G.race={id:'pres:'+c.home,office:'pres',st:c.home};render();return;
    case 'begin':doBegin();return;
    case 'ctab':G.ctab=v;render();return;
    case 'tgt':G.tgt=v;render();return;
    case 'act':{const r=GM.act(G.C,v,+b.dataset.i,G.tgt);render();return;}
    case 'hire':{GM.hire(G.C,v);render();return;}
    case 'fire':{GM.fire(G.C,v);render();return;}
    case 'runweek':{
      const C=G.C;const r=GM.runWeek(C);
      if(r.failed){G.step='done';render();return;}
      G.evIdx=0;if(!C.pending.length)afterEvents();else render();return;}
    case 'reportok':G.report=null;render();return;
    case 'theme':{const P=G.C.plan,i=P.themes.indexOf(v);if(i>=0)P.themes.splice(i,1);else if(P.themes.length<3)P.themes.push(v);render();return;}
    case 'tone':G.C.plan.tone=+v;render();return;
    case 'issuelist':G.issueList=!G.issueList;render();return;
    case 'geo':{const P=G.C.plan,d=+b.dataset.d,cur=P.geo[v]||0,used=G.C.regions.reduce((s,r)=>s+(P.geo[r.id]||0),0);if(d>0&&used>=10)return;if(d<0&&cur<=0)return;P.geo[v]=cur+d;render();return;}
    case 'bloc':{const P=G.C.plan,i=P.blocs.indexOf(v);if(i>=0)P.blocs.splice(i,1);else if(P.blocs.length<3)P.blocs.push(v);render();return;}
    case 'time':{const C=G.C,P=C.plan,d=+b.dataset.d,cur=P.time[v]||0,cost=GM.planCost(C,P);if(d>0&&cost.days>=C.time)return;if(d<0&&cur<=0)return;P.time[v]=cur+d;render();return;}
    case 'money':G.C.plan.money[v]=+b.dataset.l;render();return;
    case 'mtab':G.mtab=v;render();return;
    case 'endweek':{
      const C=G.C;const r=GM.endWeek(C);
      if(r.failed){G.step='done';render();return;}
      G.evIdx=0;if(!C.pending.length)afterEvents();else render();return;}
    case 'choose':{const ev=G.C.pending[G.evIdx];GM.choose(G.C,ev,+v);render();return;}
    case 'evnext':{if(G.evIdx<G.C.pending.length-1){G.evIdx++;render();}else afterEvents();return;}
    case 'launch':{
      const C=G.C,pkg=GM.finalize(C);
      pkg.name=C.cand.name;
      window.__launch({scen:G.cfg.scen,env:G.cfg.env,seed:G.cfg.seed,player:pkg});return;}
  }
});
$('gm').addEventListener('change',e=>{
  const f=e.target.dataset.f;if(!f)return;const c=G.cand,v=e.target.value;
  if(f==='env'){G.cfg.env=+v;return;}
  if(f==='special'){G.C.plan.special={id:v,arg:v==='rollout'?GM.ISSUES[0].id:null};render();return;}
  if(f==='spArg'){G.C.plan.special.arg=v;render();return;}
  if(f==='escope'){G.escope=v;render();return;}
  if(f==='hst'){G.hst=v;G.race=null;render();return;}
  if(f==='tier')c.tier=+v;else c[f]=v;
  if(f==='home'&&G.race&&G.race.office==='pres')G.race={id:'pres:'+v,office:'pres',st:v};
  render();
});
$('gm').addEventListener('input',e=>{
  const f=e.target.dataset.i;if(!f)return;
  if(f==='seed'){G.cfg.seed=e.target.value;return;}
  if(f==='name'){G.cand.name=e.target.value;const pv=document.querySelector('.pv-name b');if(pv)pv.textContent=e.target.value||'Unnamed';return;}
  if(f==='age'){const n=parseInt(e.target.value,10);if(!isNaN(n)&&n>=18&&n<=95)G.cand.age=n;}
});
$('gm').addEventListener('focusout',e=>{if(e.target.dataset&&e.target.dataset.i==='age'){render();}});
$('goCamp').addEventListener('click',()=>{G.step='setup';G.cfg.scen=document.querySelector('#scenSeg [aria-pressed="true"]').dataset.v;show();});
if(location.hash==='#debug')window.__game={G,render};
})();
