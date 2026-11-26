(function(){
"use strict";
const $=id=>document.getElementById(id);
const PN={D:'Democratic',R:'Republican'};
const PL={D:'Democrats',R:'Republicans'};
const OFFN={pres:'President',sen:'U.S. Senate',house:'U.S. House',gov:'Governor'};
const TABN={pres:'President',sen:'Senate',house:'House',gov:'Governors',polls:'Polls'};
const KEYN={polls:'Closest polled races',pres:'Battleground states',sen:'Senate races to watch',house:'Closest districts',gov:'Governor races to watch'};
const TG={AK:[0,0],ME:[10,0],WI:[5,1],MI:[7,1],VT:[9,1],NH:[10,1],
WA:[0,2],ID:[1,2],MT:[2,2],ND:[3,2],MN:[4,2],IL:[5,2],IN:[6,2],OH:[7,2],PA:[8,2],NY:[9,2],MA:[10,2],
OR:[0,3],NV:[1,3],WY:[2,3],SD:[3,3],IA:[4,3],MO:[5,3],KY:[6,3],WV:[7,3],VA:[8,3],NJ:[9,3],CT:[10,3],
CA:[0,4],UT:[1,4],CO:[2,4],NE:[3,4],KS:[4,4],AR:[5,4],TN:[6,4],NC:[7,4],MD:[8,4],DE:[9,4],RI:[10,4],
AZ:[1,5],NM:[2,5],OK:[4,5],LA:[5,5],MS:[6,5],AL:[7,5],GA:[8,5],SC:[9,5],DC:[10,5],
HI:[0,6],TX:[4,6],FL:[8,6]};
const END=420,FINAL=12000,T0=-30,SPAN=450,BASE_RATE=0.75,FAST_RATE=90;
const DAYS=['Tue','Wed','Thu','Fri','Sat','Sun','Mon'];

const S={pollOff:'house',pollView:'votes',pollAuto:true,night:null,tab:'pres',speed:1,playing:false,t:T0,fast:false,scen:'2028',env:0,seed:1,mapMode:'geo',cmode:'geo',drawer:null,county:null,lastRender:0,hl:{key:'',at:0},prevFocus:null};
const cache={};
let M={},WAF={},KEY={},TM={};

function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function fmtN(n){return Math.round(n).toLocaleString('en-US');}
function fmtV(n){return n>=1e6?(n/1e6).toFixed(1)+'M':fmtN(n);}
function fmtClock(t){
  const tot=Math.round(19*60+t),day=Math.floor(tot/1440),m=((tot%1440)+1440)%1440;
  let h=Math.floor(m/60);const mi=m%60,ap=h>=12?'PM':'AM';h=h%12||12;
  return (day>0?DAYS[day%7]+' ':'')+h+':'+String(mi).padStart(2,'0')+' '+ap;
}
function fmtShort(t){
  const tot=Math.round(19*60+t),m=((tot%1440)+1440)%1440;
  let h=Math.floor(m/60);const mi=m%60,ap=h>=12?'p':'a';h=h%12||12;
  return h+(mi?':'+String(mi).padStart(2,'0'):'')+ap;
}
function setHTML(el,key,html){if(cache[key]===html)return;cache[key]=html;el.innerHTML=html;}
function svgEl(tag,attrs,parent){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
function rating(ct){const m=ct.rateT,a=Math.abs(m),p=m>0?'D':'R';return a<0.03?'Toss-up':a<0.08?'Lean '+p:a<0.15?'Likely '+p:'Safe '+p;}
function leadM(ct){return ct.cv>0?(ct.D-ct.R)/ct.cv*100:0;}
function fmtK(n){n=Math.abs(n);return n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e4?(n/1e3).toFixed(0)+'K':n>=1e3?(n/1e3).toFixed(1)+'K':String(Math.round(n));}
function tkv(n){n=Math.abs(n);return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?Math.round(n/1e3)+'K':String(Math.round(n));}
function leadV(ct){return Math.abs(ct.D-ct.R);}
function leadTxt(ct){const m=leadM(ct);return (m>0?'D':'R')+'+'+Math.abs(m).toFixed(1);}
function isFlip(ct){return !!(ct.called&&ct.prev&&ct.called.party!==ct.prev);}
function pillHTML(ct){
  if(ct.called){const p=ct.called.party;return isFlip(ct)?'<span class="pp"><span class="pill fliptag">FLIP</span><span class="pill '+p.toLowerCase()+'">'+p+' wins</span></span>':'<span class="pill '+p.toLowerCase()+'">'+p+' wins</span>';}
  if(ct.status==='recount')return '<span class="pill rc">Recount</span>';
  if(ct.cv>0){const m=leadM(ct);return '<span class="pill l'+(m>0?'d':'r')+'">'+leadTxt(ct)+' &middot; '+fmtK(leadV(ct))+'</span>';}
  return '<span class="pill n">&ndash;</span>';
}
function stateName(ab){return S.night.states[ab].name;}
function contestLabel(ct){
  const st=S.night.states[ct.st];
  if(ct.office==='house')return ct.label;
  return st.name;
}

/* ---------- build ---------- */
function rebuild(){
  S.night=buildNight({scenario:S.scen,env:S.env,seed:S.seed,player:S.player||undefined});
  S.t=T0;S.fast=false;
  for(const k in cache)delete cache[k];
  S.hl={key:'',at:0};
  const offs=S.night.offices;
  if(S.tab!=='polls'&&offs.indexOf(S.tab)<0)S.tab=offs[0];
  if(offs.indexOf(S.pollOff)<0)S.pollOff=offs[0];
  const N=S.night;
  KEY={};
  for(const o of offs){
    const list=N.contests.filter(c=>c.office===o).sort((a,b)=>Math.abs(a.rateT)-Math.abs(b.rateT));
    KEY[o]=list.slice(0,o==='house'?16:12).map(c=>c.id);
  }
  buildTabs();buildMap();buildWaffle();
  $('brandSub').textContent='Playtest build v'+(window.APP_VERSION||'');
}
function buildTabs(){
  const box=$('tabs');box.innerHTML='';
  const offs=['polls'].concat(S.night.offices);
  for(const o of offs){
    const b=document.createElement('button');
    b.className='tab';b.type='button';b.setAttribute('role','tab');b.dataset.tab=o;b.id='tab-'+o;
    b.innerHTML=esc(TABN[o])+'<small></small>';
    box.appendChild(b);
  }
  const lg=document.createElement('button');
  lg.className='tab';lg.type='button';lg.disabled=true;lg.title='Arrives in the full game';
  lg.innerHTML='Legislatures<small>coming</small>';
  box.appendChild(lg);
}
function buildGeoMap(){
  const svg=$('map');svg.innerHTML='';svg.setAttribute('viewBox','0 0 1010 610');
  const defs=svgEl('defs',{},svg);
  for(const p of ['d','r']){
    const pat=svgEl('pattern',{id:'h'+p,width:8,height:8,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'},defs);
    svgEl('rect',{width:8,height:8,style:'fill:var(--leadbg'+p.toUpperCase()+')'},pat);
    svgEl('rect',{width:4,height:8,style:'fill:var(--leadfg'+p.toUpperCase()+')'},pat);
  }
  M={};const dm=()=>document.createElementNS('http://www.w3.org/2000/svg','text');
  const ext=Object.keys(TG).filter(ab=>GM_GEO.st[ab]&&(GM_GEO.st[ab].r<9||ab==='DC')).sort((a,b)=>GM_GEO.st[a].c[1]-GM_GEO.st[b].c[1]);
  const extY={};let py=-1e9;for(const ab of ext){py=Math.max(GM_GEO.st[ab].c[1]-4,py+17);extY[ab]=py;}
  const mkPill=(parent,y)=>{const r=svgEl('rect',{class:'fb',x:-14,y:y-6,width:28,height:11,rx:5.5,visibility:'hidden'},parent),t=svgEl('text',{class:'fbt',x:0,y:y+2.5,'text-anchor':'middle'},parent);return {r,t};};
  for(const ab in TG){
    const gs=GM_GEO.st[ab];if(!gs)continue;
    const g=svgEl('g',{class:'tile geo',tabindex:0,role:'button','data-ab':ab},svg);
    const ti=svgEl('title',{},g);
    svgEl('path',{class:'r',d:gs.d},g);
    const isExt=extY[ab]!==undefined;let lx=gs.c[0],ly=gs.c[1]+4;
    if(isExt){
      lx=934;ly=extY[ab]+4;
      svgEl('line',{class:'lead',x1:gs.c[0],y1:gs.c[1],x2:928,y2:extY[ab]},g);
      if(ab==='DC')svgEl('circle',{class:'r dc',cx:gs.c[0],cy:gs.c[1],r:5},g);
    }
    const a=svgEl('text',{class:'gab',x:lx,y:ly,'text-anchor':isExt?'start':'middle'},g);a.textContent=ab;
    const bg=svgEl('g',{class:'bdg',transform:isExt?'translate(990,'+(extY[ab]-1)+')':'translate('+gs.c[0]+','+(gs.c[1]+14)+')'},g);
    const p1=mkPill(bg,0),p2=null;
    const rcg=svgEl('g',{class:'rcm',visibility:'hidden'},g);svgEl('circle',{r:5.5,cx:0,cy:0},rcg);const rct=svgEl('text',{x:0,y:2.6},rcg);
    M[ab]={g,ti,ev:dm(),l2:dm(),l3:dm(),fl:dm(),fr:svgEl('rect',{},document.createElementNS('http://www.w3.org/2000/svg','g')),pb:svgEl('rect',{},document.createElementNS('http://www.w3.org/2000/svg','g')),cls:'',bg,p1,p2,rcg,rct,ext:isExt,gx:gs.c[0],gy:gs.c[1],ey:extY[ab]};
  }
  const ovl=svgEl('g',{class:'ovl','pointer-events':'none'},svg);for(const ab in M){ovl.appendChild(M[ab].bg);ovl.appendChild(M[ab].rcg);}
}
function buildMap(){
  if(S.mapMode!=='tiles'&&window.GM_GEO)return buildGeoMap();
  const svg=$('map');svg.innerHTML='';svg.setAttribute('viewBox','0 0 704 448');
  svg.setAttribute('viewBox','0 0 704 448');
  const defs=svgEl('defs',{},svg);
  for(const p of ['d','r']){
    const pat=svgEl('pattern',{id:'h'+p,width:8,height:8,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'},defs);
    svgEl('rect',{width:8,height:8,style:'fill:var(--leadbg'+p.toUpperCase()+')'},pat);
    svgEl('rect',{width:4,height:8,style:'fill:var(--leadfg'+p.toUpperCase()+')'},pat);
  }
  M={};
  for(const ab in TG){
    const [c,r]=TG[ab];
    const g=svgEl('g',{class:'tile',tabindex:0,role:'button','data-ab':ab,transform:'translate('+(c*64)+','+(r*64)+')'},svg);
    const ti=svgEl('title',{},g);
    svgEl('rect',{class:'r',width:62,height:62,rx:7},g);
    const a=svgEl('text',{class:'ab',x:6,y:23},g);a.textContent=ab;
    const ev=svgEl('text',{class:'ev',x:57,y:13},g);
    const l2=svgEl('text',{class:'s2',x:6,y:38},g);
    const fr=svgEl('rect',{class:'fchip',x:4,y:41,width:26,height:12,rx:3},g);
    const fl=svgEl('text',{class:'fl',x:7,y:50},g);
    const l3=svgEl('text',{class:'s1',x:6,y:50},g);
    svgEl('rect',{class:'pbt',x:6,y:54,width:50,height:3,rx:1.5},g);
    const pb=svgEl('rect',{class:'pb',x:6,y:54,width:0,height:3,rx:1.5},g);
    M[ab]={g,ti,ev,l2,l3,fl,fr,pb,cls:''};
  }
}
function buildWaffle(){
  const box=$('waffle');box.innerHTML='';WAF={};
  const order=Object.keys(TG).sort((a,b)=>TG[a][1]-TG[b][1]||TG[a][0]-TG[b][0]);
  for(const ab of order){
    const st=S.night.states[ab];if(!st.houseIds.length)continue;
    const grp=document.createElement('div');grp.className='wgrp';
    const lb=document.createElement('b');lb.textContent=ab;grp.appendChild(lb);
    for(const id of st.houseIds){
      const c=document.createElement('button');c.type='button';c.className='wc';c.dataset.id=id;
      c.setAttribute('aria-label',id.replace('house:',''));c.title=id.replace('house:','');
      grp.appendChild(c);WAF[id]=c;
    }
    box.appendChild(grp);
  }
}

/* ---------- updates ---------- */
function houseInfo(st){
  const N=S.night;let cd=0,cr=0,ld=0,lr=0,rc=0,fl=0;const n=st.houseIds.length;
  for(const id of st.houseIds){
    const c=N.byId[id];
    if(c.called){if(c.called.party==='D'){cd++;ld++;}else{cr++;lr++;}if(isFlip(c))fl++;}
    else{if(c.status==='recount')rc++;if(c.cv>0){if(c.D>c.R)ld++;else lr++;}}
  }
  return {n,cd,cr,ld,lr,rc,fl};
}
function updateClock(){
  $('clk').textContent=fmtClock(S.t);
  const over=S.t>=END&&!S.fast;
  $('clkSub').textContent=S.t>=FINAL?'Final count':over?'End of broadcast · Eastern time':S.fast?'Counting continues · Eastern time':'Eastern time · 10-minute night';
  const f=Math.max(0,Math.min(1,(S.t-T0)/SPAN));
  $('tlFill').style.width=(f*100)+'%';$('tlKnob').style.left=(f*100)+'%';
  const bp=$('bPlay');
  bp.textContent=S.playing?'Pause':'Play';bp.classList.toggle('on',S.playing);bp.disabled=over||S.t>=FINAL;
  for(const sp of [1,2,4])$('b'+sp).classList.toggle('on',S.speed===sp);
}
function updateTabs(){
  const N=S.night;
  for(const b of $('tabs').querySelectorAll('.tab[data-tab]')){
    const o=b.dataset.tab;
    let n=0,c=0;for(const ct of N.contests)if(ct.office===o){n++;if(ct.status==='called')c++;}
    b.setAttribute('aria-selected',o===S.tab?'true':'false');
    b.tabIndex=o===S.tab?0:-1;
    const sm=b.querySelector('small');const txt=o==='polls'?(S.t<0?'T-'+Math.ceil(-S.t)+'m':'final'):c+'/'+n;if(sm.textContent!==txt)sm.textContent=txt;
  }
}
function updateMap(){
  const N=S.night,tab=S.tab;
  if(tab==='polls')return;
  for(const ab in M){
    const m=M[ab],st=N.states[ab];
    let cls=(S.mapMode!=='tiles'?'tile geo':'tile'),l2='',l3='',pct=0,ev='',tip=st.name,off=false,flt='';
    if(tab==='house'){
      const hi=houseInfo(st);
      if(hi.n===0){off=true;}
      else if(hi.n===1){
        const ct=N.byId[st.houseIds[0]];
        if(ct.called)cls+=' t-'+(ct.called.party==='D'?'d1':'r1');
        else if(ct.cv>0)cls+=' t-l'+(ct.D>ct.R?'d':'r');
        if(ct.status==='recount')cls+=' t-rc';
        l2=ct.cv>0?leadTxt(ct):'';pct=N.pctIn(ct);
        l3=S.t<ct.close?'Closes '+fmtShort(ct.close):Math.round(pct*100)+'% in';
        tip+=' · 1 seat'+(ct.cv>0?' · '+leadTxt(ct)+' ('+fmtN(leadV(ct))+' votes)':'');
        if(isFlip(ct)){flt='FLIP';tip+=' · FLIP from '+PN[ct.prev];}
      }else{
        const done=hi.cd+hi.cr===hi.n;
        if(done){if(hi.cd>hi.cr)cls+=' t-d1';else if(hi.cr>hi.cd)cls+=' t-r1';}
        else if(hi.ld+hi.lr>0){if(hi.ld>hi.lr)cls+=' t-ld';else if(hi.lr>hi.ld)cls+=' t-lr';}
        if(hi.rc>0)cls+=' t-rc';
        l2=(hi.ld+hi.lr>0)?hi.ld+'D · '+hi.lr+'R':'';
        l3=(hi.cd+hi.cr)+'/'+hi.n+' in';pct=(hi.cd+hi.cr)/hi.n;
        tip+=' · '+hi.n+' seats · '+hi.cd+' D and '+hi.cr+' R called';
        if(hi.fl>0){flt=hi.fl>1?hi.fl+' FLIPS':'FLIP';tip+=' · '+hi.fl+' flip'+(hi.fl>1?'s':'');}
      }
    }else{
      const ct=st.contests[tab];
      if(!ct){off=true;}
      else{
        if(ct.called)cls+=' t-'+(ct.called.party==='D'?'d1':'r1');
        else if(ct.cv>0)cls+=' t-l'+(ct.D>ct.R?'d':'r');
        if(ct.status==='recount')cls+=' t-rc';
        pct=N.pctIn(ct);
        l2=ct.cv>0?leadTxt(ct):'';
        l3=S.t<ct.close?'Closes '+fmtShort(ct.close):Math.round(pct*100)+'% in';
        if(tab==='pres')ev=String(ct.ev);
        if(isFlip(ct)){flt='FLIP';}
        tip+=' · '+(ct.called?(ct.called.party==='D'?'Democrat':'Republican')+' '+(isFlip(ct)?'flips from '+PN[ct.prev]:'wins'):ct.cv>0?leadTxt(ct)+' ('+fmtN(leadV(ct))+' votes) · '+Math.round(pct*100)+'% in':'polls close '+fmtClock(ct.close)+' ET');
      }
    }
    if(off){cls+=' t-off';l2='';l3='';ev='';flt='';tip=st.name+' (no race)';}
    if(S.drawer&&S.drawer.ab===ab)cls+=' sel';
    if(m.cls!==cls){m.g.setAttribute('class',cls);m.cls=cls;}
    if(m.l2t!==l2){m.l2.textContent=l2;m.l2t=l2;}
    let l3x=6;
    {const ct0=off?null:(tab==='house'?(st.hd===1?N.byId[st.houseIds[0]]:null):st.contests[tab]);
     const lv=(ct0&&ct0.cv>0&&S.t>=ct0.close)?'+'+tkv(leadV(ct0)):'';
     if(flt){cls+=' t-flip';const w=flt.length*5.2+6;l3x=w+6;l3=lv.slice(1);}
     else if(lv)l3=lv;}
    if(m.l3x!==l3x){m.l3.setAttribute('x',l3x);m.l3x=l3x;}
    if(m.flt!==flt){m.fl.textContent=flt;m.flt=flt;m.fr.setAttribute('width',flt?(flt.length*5.2+6).toFixed(0):0);}
    if(m.l3t!==l3){m.l3.textContent=l3;m.l3t=l3;}
    if(m.evt!==ev){m.ev.textContent=ev;m.evt=ev;}
    m.pb.setAttribute('width',(off?0:50*Math.min(1,pct)).toFixed(1));
    if(m.tip!==tip){m.ti.textContent=tip;m.tip=tip;m.g.setAttribute('aria-label',tip);}
    m.g.setAttribute('tabindex',off?-1:0);
  }
  if(S.mapMode!=='tiles')for(const ab in M){
    const m=M[ab];if(!m.p1)continue;
    const fl=m.flt||'';let rn=0;
    if(m.cls.indexOf('t-rc')>=0){rn=1;if(tab==='house')rn=Math.max(1,houseInfo(N.states[ab]).rc);}
    const key=fl+'|'+rn;
    if(m.bk!==key){m.bk=key;
      const p=m.p1;p.t.textContent=fl;p.r.setAttribute('visibility',fl?'visible':'hidden');
      const w=fl?fl.length*5.3+9:0;p.r.setAttribute('x',(-w/2).toFixed(1));p.r.setAttribute('width',w.toFixed(1));p.r.setAttribute('class','fb ffl');
      m.rcg.setAttribute('visibility',rn?'visible':'hidden');m.rct.textContent=rn>1?String(rn):'R';
      const x=m.ext?962:(fl?m.gx+w/2+8:m.gx),y=m.ext?m.ey-1:m.gy+14;
      m.rcg.setAttribute('transform','translate('+x.toFixed(1)+','+y.toFixed(1)+')');}
  }
  const wf=$('waffle');wf.hidden=tab!=='house';
  if(tab==='house'){
    for(const id in WAF){
      const c=N.byId[id],el=WAF[id];
      let cls='wc';
      if(c.called)cls+=c.called.party==='D'?' d':' r';
      else if(c.cv>0)cls+=c.D>c.R?' ld':' lr';
      if(c.status==='recount')cls+=' rc';
      if(isFlip(c))cls+=' fl';
      if(el.className!==cls)el.className=cls;
    }
  }
}
function updateLegend(){
  if(S.tab==='polls')return;
  const sw=(bg,t)=>'<span><i style="background:'+bg+'"></i>'+t+'</span>';
  const hd='repeating-linear-gradient(45deg,var(--leadbgD) 0 3px,var(--leadfgD) 3px 6px)';
  const hr='repeating-linear-gradient(45deg,var(--leadbgR) 0 3px,var(--leadfgR) 3px 6px)';
  const h=S.tab==='house';
  const html=sw('var(--dem)',h?'Democrats win state’s seats':'Democratic win called')+sw('var(--rep)',h?'Republicans win state’s seats':'Republican win called')+sw(hd,'Democrat leading')+sw(hr,'Republican leading')+sw('var(--tilepre)','Waiting')+'<span><i class="lgb ffl">FLIP</i>Seat changed party</span><span><i class="lgb lrc">R</i>Within recount range</span>'+(h?'<span class="muted">Squares below: one per House seat. Click one for the district.</span>':'');
  setHTML($('legend'),'legend',html);
}
function barHTML(d,r,total,note){
  return '<div class="bar" role="img" aria-label="Democrats '+d+', Republicans '+r+'"><i class="bd" style="width:'+(d/total*100).toFixed(2)+'%"></i><i class="br" style="width:'+(r/total*100).toFixed(2)+'%"></i>'+(note?'<span class="mk" style="left:50%"></span>':'')+'</div>';
}
function flipLine(o){
  const N=S.night,F=N.flips()[o],net=F.D-F.R,tot=F.D+F.R;
  const nt=net===0?'Even':(net>0?'D':'R')+' +'+Math.abs(net);
  let h='<div class="flipbox"><div class="fbh"><b>Flips</b><span>'+tot+' seat'+(tot===1?'':'s')+' changed party &middot; net '+nt+'</span></div>';
  if(tot===0)return h+'<div class="fbe">No seats have changed party yet.</div></div>';
  h+='<div class="fbs"><span class="fd">'+F.D+' to Democrats</span><span class="fr">'+F.R+' to Republicans</span></div><div class="fbl">';
  const list=[];for(const c of N.contests)if(c.office===o&&isFlip(c))list.push(c);
  list.sort((a,b)=>b.called.t-a.called.t);
  for(const c of list.slice(0,14))h+='<button type="button" class="fchipb '+c.called.party.toLowerCase()+'" data-act="rchip" data-id="'+c.id+'">'+esc(o==='house'?c.label:c.st)+' <i>'+c.prev+'&rarr;'+c.called.party+'</i></button>';
  if(list.length>14)h+='<span class="muted small">+'+(list.length-14)+' more</span>';
  return h+'</div></div>';
}
function updateScore(){
  const N=S.night,T=N.tally(),tab=S.tab;let h='';
  if(tab==='polls'){
    const P=N.polls,g=P.nat.house;
    const cd=S.t<0?'Polls close in <b>'+Math.ceil(-S.t)+' minutes</b>. The first states close at 7:00 PM Eastern.':'Polls are closed. These are the final pre-election polls.';
    h='<h3>Pre-night polling</h3><div class="callbox">'+cd+'<small>Open any race below for its polls and its state’s top issues.</small></div>'+
    '<div class="cands" style="margin-top:8px"><div class="cand d"><div class="nm">'+(P.nat.pres?'National vote':'Generic ballot')+' D</div><div class="big">'+(P.nat.pres||g).D.toFixed(0)+'</div><div class="sm">'+pollMargTxt((P.nat.pres||g).margin)+'</div></div>'+
    '<div class="cand r"><div class="nm">'+(P.nat.pres?'National vote':'Generic ballot')+' R</div><div class="big">'+(P.nat.pres||g).R.toFixed(0)+'</div><div class="sm">'+(P.mood.la)+' '+P.mood.a+'% &middot; '+(P.mood.lb)+' '+P.mood.b+'%</div></div></div>'+
    '<div class="barlab"><span>Top issue: '+esc(P.issues[0].name)+' ('+P.issues[0].pct.toFixed(0)+'%)</span><span>'+P.polled+' races polled</span></div>';
  }else if(tab==='pres'){
    let dv=0,rv=0;for(const c of N.contests)if(c.office==='pres'){dv+=c.D;rv+=c.R;}
    const tv=dv+rv||1,ev=N.evTotal;
    const unc=ev-T.pres.D-T.pres.R;
    h='<h3>Electoral votes &middot; 270 to win</h3><div class="cands">'+
    '<div class="cand d"><div class="nm">'+esc(N.cand.D.name)+' (D)</div><div class="big">'+T.pres.D+'</div><div class="sm">'+(dv>0?(dv/tv*100).toFixed(1)+'% · '+fmtV(dv):'No votes counted')+'</div></div>'+
    '<div class="cand r"><div class="nm">'+esc(N.cand.R.name)+' (R)</div><div class="big">'+T.pres.R+'</div><div class="sm">'+(rv>0?(rv/tv*100).toFixed(1)+'% · '+fmtV(rv):'No votes counted')+'</div></div></div>'+
    barHTML(T.pres.D,T.pres.R,ev,true)+'<div class="barlab"><span>'+unc+' electoral votes not yet called</span><span>'+fmtV(dv+rv)+' votes counted</span></div>'+flipLine('pres');
  }else if(tab==='sen'){
    h='<h3>Senate control &middot; 51 for a majority</h3><div class="cands">'+
    '<div class="cand d"><div class="nm">Democrats</div><div class="big">'+T.sen.D+'</div><div class="sm">'+N.hold.D+' not up + '+(T.sen.D-N.hold.D)+' won tonight</div></div>'+
    '<div class="cand r"><div class="nm">Republicans</div><div class="big">'+T.sen.R+'</div><div class="sm">'+N.hold.R+' not up + '+(T.sen.R-N.hold.R)+' won tonight</div></div></div>'+
    barHTML(T.sen.D,T.sen.R,100,true)+'<div class="barlab"><span>'+(100-T.sen.D-T.sen.R)+' seat'+((100-T.sen.D-T.sen.R)===1?'':'s')+' undecided</span><span>'+N.contests.filter(c=>c.office==='sen').length+' races tonight</span></div>'+flipLine('sen');
  }else if(tab==='house'){
    h='<h3>House control &middot; 218 for a majority</h3><div class="cands">'+
    '<div class="cand d"><div class="nm">Democrats</div><div class="big">'+T.house.D+'</div><div class="sm">seats called</div></div>'+
    '<div class="cand r"><div class="nm">Republicans</div><div class="big">'+T.house.R+'</div><div class="sm">seats called</div></div></div>'+
    barHTML(T.house.D,T.house.R,435,true)+'<div class="barlab"><span>'+(435-T.house.D-T.house.R)+' seats undecided</span><span>435 districts</span></div>'+flipLine('house');
  }else{
    const n=N.contests.filter(c=>c.office==='gov').length;
    h='<h3>Governors &middot; '+n+' races tonight</h3><div class="cands">'+
    '<div class="cand d"><div class="nm">Democrats</div><div class="big">'+T.gov.D+'</div><div class="sm">governorships won</div></div>'+
    '<div class="cand r"><div class="nm">Republicans</div><div class="big">'+T.gov.R+'</div><div class="sm">governorships won</div></div></div>'+
    barHTML(T.gov.D,T.gov.R,n,false)+'<div class="barlab"><span>'+(n-T.gov.D-T.gov.R)+' races undecided</span><span>Held-over governors not shown</span></div>'+flipLine('gov');
  }
  if(tab!=='polls')h+='<button type="button" class="btn rbtn" data-act="ratings">Seats by rating &rarr;</button>';
  setHTML($('score'),'score',h);
}
function updateKey(){
  const N=S.night,tab=S.tab;
  $('keyTitle').textContent=KEYN[tab];
  let h='';
  if(tab==='polls'){
    const P=N.polls;
    const L=Object.values(P.races).filter(r=>!r.none&&r.office!=='house').sort((a,b)=>Math.abs(a.margin)-Math.abs(b.margin)).slice(0,12);
    for(const r of L)h+='<button type="button" class="krow" data-pollid="'+r.id+'"><span class="ab">'+esc(r.st)+'</span><span class="nm">'+esc(OFFN[r.office])+' &middot; '+esc(stateName(r.st))+'</span><span class="pill '+(r.margin>=0?'ld':'lr')+'">'+pollMargTxt(r.margin)+'</span><span class="muted small">'+r.polls.length+' polls</span></button>';
    setHTML($('key'),'key',h);return;
  }
  for(const id of KEY[tab]){
    const ct=N.byId[id];
    const ab=tab==='house'?ct.label:ct.st;
    const nm=tab==='house'?stateName(ct.st)+' · '+rating(ct):rating(ct)+(tab==='pres'?' · '+ct.ev+' EV':'')+' · '+stateName(ct.st);
    h+='<button type="button" class="krow" data-id="'+id+'"><span class="ab">'+esc(ab)+'</span><span class="nm">'+esc(nm)+'</span>'+pillHTML(ct)+'<span class="muted small">'+(S.t<ct.close?fmtShort(ct.close):Math.round(N.pctIn(ct)*100)+'%')+'</span></button>';
  }
  setHTML($('key'),'key',h);
}
function callWhy(e){
  if(e.finished)return ' (all votes counted, '+fmtN(e.lead)+' vote margin)';
  if(e.pctIn<10)return ' &mdash; projected on partisan lean'+(e.pctIn<1?' before any votes were counted':' with '+e.pctIn.toFixed(0)+'% counted');
  return ' &mdash; leads by '+fmtN(e.lead)+' votes with about '+fmtN(e.out)+' ('+e.outPct.toFixed(0)+'%) outstanding';
}
function logText(e){
  const N=S.night;
  if(e.kind==='close'){
    const nm=e.sts.map(ab=>N.states[ab].name);
    const txt=nm.length<=4?nm.join(', '):nm.slice(0,3).join(', ')+' and '+(nm.length-3)+' more';
    return {tag:'POLLS',cls:'',text:'Polls close in '+esc(txt)+'.'};
  }
  const ct=e.id?N.byId[e.id]:null;
  if(e.kind==='call'){
    const p=e.party,st=N.states[e.st];let t;
    if(e.office==='pres')t=esc(N.cand[p].name)+' wins '+esc(st.name)+' ('+ct.ev+' electoral votes)';
    else if(e.office==='sen')t=PL[p]+' win the Senate race in '+esc(st.name);
    else if(e.office==='gov')t=PL[p]+' win the governor’s race in '+esc(st.name);
    else t=PL[p]+' win '+esc(ct.label);
    if(e.flip&&!e.corrected){
      const fr=' from '+PL[e.prev];
      if(e.office==='pres')t=esc(N.cand[p].name)+' flips '+esc(st.name)+' ('+ct.ev+' electoral votes)'+fr;
      else if(e.office==='sen')t=PL[p]+' flip the Senate seat in '+esc(st.name)+fr;
      else if(e.office==='gov')t=PL[p]+' flip the governor’s office in '+esc(st.name)+fr;
      else t=PL[p]+' flip '+esc(ct.label)+fr;
      t+=callWhy(e);
      return {tag:'FLIP',cls:p.toLowerCase()+' flip',text:t};
    }
    t+=callWhy(e);
    return {tag:e.corrected?'CORRECTED':'CALL',cls:p.toLowerCase(),text:t};
  }
  if(e.kind==='retract')return {tag:'RETRACT',cls:'',text:'The decision desk pulls its call in '+esc(contestLabel(ct))+' ('+OFFN[e.office]+'). The count has tightened.'};
  if(e.kind==='recount')return {tag:'RECOUNT',cls:'',text:esc(contestLabel(ct))+' ('+OFFN[e.office]+') is within 0.5 points with all votes counted.'};
  if(e.kind==='mile'){
    const p=e.party;let t;
    if(e.office==='pres')t=esc(N.cand[p].name)+' has won the presidency with 270 or more electoral votes.';
    else if(e.office==='sen')t=PL[p]+' have won control of the Senate.';
    else t=PL[p]+' have won control of the House.';
    return {tag:'PROJECTION',cls:p.toLowerCase(),big:true,text:t};
  }
  if(e.kind==='batch'){
    const m=e.margin*100;
    const bct=e.id?N.byId[e.id]:null;
    const sl=bct?' Statewide, about '+fmtV(Math.max(0,bct.expTotal-bct.cv))+' still out.':'';
    return {tag:'VOTES',cls:'',text:esc(e.county)+', '+e.st+' reports '+fmtN(e.votes)+' votes, '+(m>0?'D':'R')+' +'+Math.abs(m).toFixed(0)+' in that batch. About '+fmtN(e.out)+' still out there ('+Math.round(e.pct*100)+'% in).'+sl};
  }
  return {tag:'',cls:'',text:''};
}
function updateFeed(){
  const L=S.night.log;let h='';
  const n=Math.min(L.length,70);
  for(let i=L.length-1;i>=L.length-n;i--){
    const e=L[i],x=logText(e);
    h+='<div class="fi '+x.cls+(x.big?' big':'')+'"><span class="tm">'+fmtClock(e.t)+'</span><span><span class="tg">'+x.tag+'</span>'+x.text+'</span></div>';
  }
  if(!h)h='<div class="empty">Nothing yet. The first polls close at 7:00 PM Eastern.</div>';
  setHTML($('feed'),'feed',h);
}
function updateHeadline(){
  const L=S.night.log;let e=null,idx=-1;
  for(let i=L.length-1;i>=0;i--){const k=L[i];if(k.kind==='batch')continue;if(k.kind==='call'&&k.office==='house'&&S.tab!=='house')continue;e=k;idx=i;break;}
  const hl=$('headline');
  if(!e){$('hlTxt').textContent='Polls are open. The first close is 7:00 PM Eastern.';$('hlTm').textContent='';hl.classList.remove('hot');return;}
  const key=idx+':'+e.kind+':'+(e.id||'');
  if(S.hl.key!==key){S.hl.key=key;S.hl.at=performance.now();}
  const x=logText(e);
  $('hlTxt').innerHTML='<b>'+x.tag+'</b> '+x.text;
  $('hlTm').textContent=fmtClock(e.t);
  hl.classList.toggle('hot',(e.kind==='call'||e.kind==='mile'||e.kind==='retract'||e.kind==='recount')&&performance.now()-S.hl.at<5000);
}
function updateWrap(){
  const N=S.night;let unc=0,rc=0;
  for(const c of N.contests){if(c.status!=='called')unc++;if(c.status==='recount')rc++;}
  let h='';
  if(S.t>=FINAL)h='<div class="wrapbar"><b>Final count</b><span>All votes are counted. '+unc+' races stay uncalled'+(rc?', '+rc+' of them inside recount range':'')+'.</span><button class="btn" data-act="new" type="button">New night</button></div>';
  else if(S.t>=END&&!S.fast)h='<div class="wrapbar"><b>That is the 10 minutes</b><span>It is 2:00 AM Eastern with '+unc+' races uncalled'+(rc?' ('+rc+' within recount range)':'')+'. Slow counting states keep reporting for days.</span><button class="btn gold" data-act="cont" type="button">Keep counting</button><button class="btn" data-act="final" type="button">Skip to final count</button></div>';
  else if(S.fast)h='<div class="wrapbar"><b>Counting continues</b><span>'+fmtClock(S.t)+' &middot; '+unc+' races uncalled'+(rc?', '+rc+' within recount range':'')+'.</span><button class="btn" data-act="final" type="button">Skip to final count</button></div>';
  setHTML($('wrapSlot'),'wrap',h);
}

/* ---------- polls screen (pre-night) ---------- */
function pollMargTxt(m){return (m>=0?'D':'R')+'+'+Math.abs(m).toFixed(1);}
function pollRows(off){
  const P=S.night.polls,N=S.night;
  const rows=Object.values(P.races).filter(r=>r.office===off&&!r.none);
  rows.sort((a,b)=>Math.abs(a.margin)-Math.abs(b.margin));
  return rows;
}
function pollBar(D,R,u){
  return '<div class="pbar" role="img" aria-label="Democrats '+D.toFixed(0)+', undecided '+u.toFixed(0)+', Republicans '+R.toFixed(0)+'"><i class="bd" style="width:'+D.toFixed(1)+'%"></i><i class="bu" style="width:'+u.toFixed(1)+'%"></i><i class="br" style="width:'+R.toFixed(1)+'%"></i></div>';
}
function trendSVG(tr){
  const W=560,H=150,pl=30,pr=8,pt=8,pb=18;
  const all=tr.flatMap(p=>[p.D,p.R]);let lo=Math.floor(Math.min(...all)-1),hi=Math.ceil(Math.max(...all)+1);
  const x=d=>pl+(60-d)/59*(W-pl-pr),y=v=>pt+(hi-v)/(hi-lo)*(H-pt-pb);
  let s='<svg class="trend" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Polling average over the last 60 days">';
  const step=(hi-lo)>14?5:2;
  for(let v=Math.ceil(lo/step)*step;v<=hi;v+=step)s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y(v).toFixed(1)+'" y2="'+y(v).toFixed(1)+'" class="gl"/><text x="'+(pl-4)+'" y="'+(y(v)+3).toFixed(1)+'" class="gt" text-anchor="end">'+v+'</text>';
  for(const [d,lab] of [[60,'60 days out'],[30,'30'],[1,'Final']])s+='<text x="'+x(d).toFixed(1)+'" y="'+(H-4)+'" class="gt" text-anchor="'+(d===60?'start':d===1?'end':'middle')+'">'+lab+'</text>';
  const line=k=>tr.map((p,i)=>(i?'L':'M')+x(p.d).toFixed(1)+' '+y(p[k]).toFixed(1)).join(' ');
  s+='<path d="'+line('D')+'" class="ld"/><path d="'+line('R')+'" class="lr"/></svg>';
  return s;
}
function issueBars(list,max,withLean){
  let h='<div class="ibars">';
  for(const i of list){
    h+='<div class="ib"><span class="in">'+esc(i.name)+'</span><span class="ibw"><i style="width:'+(i.pct/max*100).toFixed(1)+'%"></i></span><span class="ip">'+i.pct.toFixed(0)+'%</span>'+(withLean?'<span class="il '+(i.lean>=0?'d':'r')+'">'+pollMargTxt(i.lean)+'</span>':'')+'</div>';
  }
  return h+'</div>';
}
function pollsHTML(){
  const N=S.night,P=N.polls;
  const off=S.pollOff;
  let h='<div class="pv"><div class="pvh"><div><h2>Pre-night polls</h2><small>'+(S.scen==='2028'?'Presidential':'Midterm')+' polling averages as of '+esc(P.asof)+' &middot; simulated polls built from historical polling patterns</small></div>';
  if(S.t<0&&!S.playing)h+='<button type="button" class="btn gold" data-act="pstart">Start the clock</button>';
  h+='</div>';
  h+='<div class="chips"><button type="button" class="btn'+(S.pollView==='votes'?' on':'')+'" data-act="pseg" data-v="votes">Voting intentions</button><button type="button" class="btn'+(S.pollView==='issues'?' on':'')+'" data-act="pseg" data-v="issues">Top issues</button></div>';
  if(S.pollView==='votes'){
    h+='<div class="chips">';
    for(const o of N.offices)h+='<button type="button" class="btn'+(o===off?' on':'')+'" data-act="poff" data-off="'+o+'">'+TABN[o]+'</button>';
    h+='</div>';
    const nat=off==='house'?P.nat.house:off==='pres'?P.nat.pres:null;
    const rows=pollRows(off);
    if(nat){
      h+='<div class="pnat"><div class="pn-t"><b>'+nat.label+'</b><span>'+nat.polls.length+' national polls</span></div><div class="pn-n"><span class="d">D '+nat.D.toFixed(1)+'%</span><span class="u">Undecided / other '+(100-nat.D-nat.R).toFixed(1)+'%</span><span class="r">R '+nat.R.toFixed(1)+'%</span></div>'+pollBar(nat.D,nat.R,100-nat.D-nat.R)+'<div class="pn-m"><b class="'+(nat.margin>=0?'d':'r')+'">'+pollMargTxt(nat.margin)+'</b> <span class="muted">Average of national polls. The out-party has historically gained into the last weeks; the trend below follows that pattern.</span></div>'+trendSVG(nat.trend)+'<div class="tleg"><span class="d">&#9644; Democrats</span><span class="r">&#9644; Republicans</span></div></div>';
    }
    if(off==='house')h+='<p class="muted small">District polls are sparse, as in real life: only close seats get surveyed. Showing '+Math.min(rows.length,40)+' of '+rows.length+' polled districts, closest first.</p>';
    else{
      let ld=0,lr=0,tc=0;for(const r of rows){if(Math.abs(r.margin)<3)tc++;else if(r.margin>0)ld++;else lr++;}
      h+='<p class="muted small">'+rows.length+' polled races: '+ld+' lean D by 3+ points, '+lr+' lean R by 3+ points, '+tc+' within 3 points. Races with no polls are not shown.</p>';
    }
    h+='<div class="tw"><table class="res ptab"><tr><th>Race</th><th class="n">D</th><th class="n">R</th><th class="n">Und.</th><th class="n">Lead</th><th class="n">Polls</th></tr>';
    for(const r of rows.slice(0,off==='house'?40:99)){
      const nm=off==='house'?r.label+' <span class="muted">'+esc(stateName(r.st))+'</span>':esc(stateName(r.st));
      h+='<tr data-act="pollrace" data-id="'+r.id+'"><td>'+nm+'</td><td class="n">'+r.D.toFixed(0)+'</td><td class="n">'+r.R.toFixed(0)+'</td><td class="n muted">'+r.und.toFixed(0)+'</td><td class="n"><span class="pill '+(r.margin>=0?'ld':'lr')+'">'+pollMargTxt(r.margin)+'</span></td><td class="n">'+r.polls.length+'</td></tr>';
    }
    h+='</table></div>';
  }else{
    const mx=P.issues[0].pct;
    h+='<div class="pnat"><div class="pn-t"><b>Most important issue in deciding your vote</b><span>national, likely voters</span></div>'+issueBars(P.issues,mx,true)+'<p class="muted small">The right-hand tag is the vote margin among people who name that issue. Issue mixes are shaped by the 2018 (health care, immigration), 2022 (inflation, abortion) and 2024 (democracy, the economy) exit polls, then shifted by this night’s environment: a Democratic-leaning year lifts health care, abortion and democracy, a Republican-leaning one lifts inflation, immigration and crime.</p></div>';
    h+='<div class="pnat"><div class="pn-t"><b>Top issues by voter group</b></div><div class="pcols">';
    for(const [k,lab] of [['D','Democrats'],['I','Independents'],['R','Republicans']]){
      h+='<div><h5 class="'+k.toLowerCase()+'">'+lab+'</h5>'+P.byParty[k].slice(0,5).map((i,n)=>'<div class="pi"><span>'+(n+1)+'</span>'+esc(i.name)+'<b>'+i.pct.toFixed(0)+'%</b></div>').join('')+'</div>';
    }
    h+='</div></div>';
    h+='<div class="pnat"><div class="pn-t"><b>Top issue by state</b><span>click a polled race for its state’s top five</span></div><div class="pstates">';
    const ss=Object.keys(P.stateIssues).sort();
    for(const ab of ss)h+='<span class="ps" title="'+esc(P.stateIssues[ab].slice(0,3).map(i=>i.name).join(', '))+'"><b>'+ab+'</b> '+esc(P.stateIssues[ab][0].name.split(' ')[0].replace('Cost','Cost of living').replace('Democracy','Democracy'))+'</span>';
    h+='</div></div>';
  }
  return h+'</div>';
}
function pollDrawer(D){
  const N=S.night,P=N.polls,r=P.races[D.id],ct=N.byId[D.id];
  if(!r){closeDrawer();return '';}
  const st=N.states[r.st];
  let h=drawerHead(r.office==='house'?r.label+' &middot; '+esc(st.name):esc(st.name),esc(OFFN[r.office])+' polls &middot; as of '+esc(P.asof));
  if(r.none)return h+'<div class="sec"><div class="callbox">No public polls<small>Few pollsters survey races that look this safe. The rating still reads '+rating(ct)+'.</small></div></div>'+issuesBlock(r.st);
  h+='<div class="sec"><div class="pn-n"><span class="d">D '+r.D.toFixed(1)+'%</span><span class="u">Undecided / other '+(100-r.D-r.R).toFixed(1)+'%</span><span class="r">R '+r.R.toFixed(1)+'%</span></div>'+pollBar(r.D,r.R,100-r.D-r.R)+'<div class="pn-m"><b class="'+(r.margin>=0?'d':'r')+'">'+pollMargTxt(r.margin)+'</b> <span class="muted">weighted average of '+r.polls.length+' poll'+(r.polls.length>1?'s':'')+' &middot; margin of error about &plusmn;'+r.moe+' per poll. Pre-night rating: '+rating(ct)+'.</span></div></div>';
  h+='<div class="sec"><h4>Polls</h4><div class="tw"><table class="res ptab"><tr><th>Pollster</th><th>Date</th><th class="n">Sample</th><th class="n">D</th><th class="n">R</th><th class="n">Lead</th></tr>';
  for(const p of r.polls)h+='<tr><td>'+esc(p.pollster)+(p.spon?' <span class="spon">'+p.spon+' sponsor</span>':'')+'</td><td>'+p.date+'</td><td class="n">'+p.n+' '+p.pop+'</td><td class="n">'+p.D+'</td><td class="n">'+p.R+'</td><td class="n">'+pollMargTxt(p.margin)+'</td></tr>';
  h+='</table></div><p class="muted small">Polls sponsored by a party lean toward it. Averages give them half weight and favor recent, larger samples.</p></div>';
  return h+issuesBlock(r.st);
}
function issuesBlock(ab){
  const L=S.night.polls.stateIssues[ab];if(!L)return '';
  return '<div class="sec"><h4>Top issues in '+esc(stateName(ab))+'</h4>'+issueBars(L,L[0].pct,false)+'</div>';
}
function updatePolls(){
  const on=S.tab==='polls';
  $('map').style.display=on?'none':'';{const mb=document.querySelector('.mapbar');if(mb)mb.style.display=on?'none':'';}$('legend').style.display=on?'none':'';
  if(on)$('waffle').hidden=true;
  $('pollView').hidden=!on;
  if(on)setHTML($('pollView'),'pollview',pollsHTML());
}

/* ---------- drawer ---------- */
function cname(ct,p){
  const P=ct.player;
  if(P){if(p==='O')return P.party==='I'?P.name:null;if(P.party===p)return P.name;const o=p==='D'?P.oppD:P.oppR;if(o)return o;}
  if(S.scen!=='2026'||typeof GM==='undefined'||!GM.CANDS||ct.office==='pres')return null;
  let row=null;
  if(ct.office==='sen')row=GM.CANDS.sen[ct.st];else if(ct.office==='gov')row=GM.CANDS.gov[ct.st];
  else{const d=String(ct.label).split('-')[1],H=GM.CANDS.house[ct.st];if(H)row=H[d]||(Object.keys(H).length===1?H[Object.keys(H)[0]]:null);}
  if(!row)return null;
  const v=p==='D'?row[0]:p==='R'?row[1]:row[2];
  return v||null;
}
function cn(ct,p,full){const n=cname(ct,p);if(!n)return null;return /\(.\)$/.test(n)?n:n+' ('+p+')';}
function resultsTable(ct){
  const N=S.night,pres=ct.office==='pres';
  const lab={D:pres?esc(N.cand.D.name)+' (D)':esc(cn(ct,'D')||'Democratic'),R:pres?esc(N.cand.R.name)+' (R)':esc(cn(ct,'R')||'Republican'),O:esc(cn(ct,'O')||'Other candidates')};
  const col={D:'var(--dem)',R:'var(--rep)',O:'var(--oth)'};
  const win=ct.called?ct.called.party:null;
  let h='<table class="res">';
  for(const k of ['D','R','O']){
    const v=ct[k];
    h+='<tr><td><span class="swatch" style="background:'+col[k]+'"></span>'+lab[k]+(win===k?' <b>&#10003;</b>':'')+'</td><td class="n">'+(ct.cv>0?(v/ct.cv*100).toFixed(1)+'%':'&ndash;')+'</td><td class="n">'+fmtN(v)+'</td></tr>';
  }
  if(ct.cv>0){const d=ct.D-ct.R;h+='<tr><td colspan="3" class="leadrow">'+(d>0?'Democrats':'Republicans')+' lead by <b>'+fmtN(Math.abs(d))+' votes</b> ('+leadTxt(ct)+' points)</td></tr>';}
  return h+'</table>';
}
function whyHTML(ct){
  const N=S.night,c=ct.called;
  if(ct.cv<=0)return '';
  const W=c?c.why:N.why(ct);
  const lp=W.leader,tp=lp==='D'?'R':'D';
  const parts=[];
  if(c&&W.finished)return '<div class="why"><b>Why it was called</b><p>All expected votes were counted and '+PL[lp]+' finished ahead by '+fmtN(Math.abs(W.lead))+' votes ('+Math.abs(W.leadPct).toFixed(1)+' points).</p></div>';
  if(!c&&ct.status==='recount')return '<div class="why"><b>Why it is not called</b><p>Every expected vote is counted and the margin is '+fmtN(Math.abs(W.lead))+' votes, under 0.5 points. The desk will not call a race this close.</p></div>';
  if(c&&W.pctIn<10){const cp=c.party,pm=W.projLead/Math.max(ct.estTotal,1)*100;
    return '<div class="why"><b>Why it was called</b><p>Called '+(W.pctIn<1?'before any votes were counted':'with only '+W.pctIn.toFixed(0)+'% counted')+'. The desk projected '+PL[cp]+' to win by about '+Math.abs(pm).toFixed(0)+' points from the '+(ct.office==='house'?'district':'state')+'’s partisan lean and the first returns, which is '+W.z.toFixed(1)+' standard errors against the '+W.thr.toFixed(1)+' it requires. The early count is too small to decide anything on its own.</p></div>';}
  let s=PL[lp]+(c?' led by ':' lead by ')+'<b>'+fmtN(Math.abs(W.lead))+' votes</b> ('+Math.abs(W.leadPct).toFixed(1)+' points)'+(c?' when the desk called it':'')+', with about <b>'+fmtN(W.out)+'</b> votes ('+W.outPct.toFixed(0)+'%) still out.';
  if(W.bigType&&W.out>0)s+=' The largest block left is '+W.bigType.toLowerCase()+'.';
  s+=' For '+PL[tp]+' to catch up they would need to win the remaining vote by <b>'+Math.abs(W.need).toFixed(1)+' points</b>; the desk expects it to go '+(W.expRem>=0?'D':'R')+'+'+Math.abs(W.expRem).toFixed(1)+'.';
  s+=' That gap is '+W.z.toFixed(1)+' standard errors'+(c?', above the '+W.thr.toFixed(1)+' the desk requires.':(W.z>=W.thr?', which clears the '+W.thr.toFixed(1)+' bar, so a call is close':' against the '+W.thr.toFixed(1)+' the desk requires before it calls a race.'));
  if(!c&&W.pctIn<30)s+=' Only '+W.pctIn.toFixed(0)+'% of the vote is in, so the desk is also waiting for more of the count.';
  return '<div class="why"><b>'+(c?'Why it was called':'Why it is not called yet')+'</b><p>'+s+'</p></div>';
}
function statusBox(ct){
  const N=S.night;
  if(ct.called){
    const p=ct.called.party;
    const who=ct.office==='pres'?esc(N.cand[p].name)+' ('+p+')':esc(cn(ct,p)||PN[p]);
    return '<div class="callbox '+p.toLowerCase()+'">'+who+' wins<small>'+(ct.called.corrected?'Corrected call':'Called')+' at '+fmtClock(ct.called.t)+' ET'+(ct.office==='pres'?' &middot; '+ct.ev+' electoral votes':'')+(isFlip(ct)?' &middot; <b>Flip from '+PN[ct.prev]+'</b>':'')+'</small></div>';
  }
  if(ct.status==='recount')return '<div class="callbox rc">Too close to call<small>All expected votes are counted and the margin is under 0.5 points. This race would go to a recount.</small></div>';
  if(ct.cv>0){const m=leadM(ct);return '<div class="callbox">'+(m>0?'Democrats':'Republicans')+' lead by '+Math.abs(m).toFixed(1)+' points<small>'+fmtN(leadV(ct))+' votes ahead. Not called yet. The desk calls a race once the outstanding vote cannot close the gap.</small></div>';}
  if(S.t<ct.close)return '<div class="callbox">Polls close at '+fmtClock(ct.close)+' ET</div>';
  return '<div class="callbox">Polls are closed<small>Waiting for the first results.</small></div>';
}
function progressHTML(ct){
  const N=S.night,p=N.pctIn(ct),done=ct.cv>=ct.expTotal*0.99999;
  const rem=Math.max(0,ct.estTotal-ct.cv);
  return '<div class="prog"><i style="width:'+(p*100).toFixed(1)+'%"></i></div><div class="small muted">'+(done?'All votes counted · '+fmtN(ct.cv)+' votes':'Estimated '+Math.round(p*100)+'% of the vote is in · '+fmtN(ct.cv)+' counted · about '+fmtN(rem)+' outstanding')+'</div>';
}
function typeHTML(ct){
  const TYN=['Early in-person','Mail, received early','Election Day','Late mail and provisional'];
  let h='',worst=-1,wv=0;
  for(let ty=0;ty<4;ty++){
    const tot=ct.totT[ty];if(tot<=0)continue;
    const c=ct.cvT[ty],pc=c/tot,m=c>0?(ct.DT[ty]-ct.RT[ty])/c*100:null;
    const out=tot-c;if(out>wv&&pc<0.98){wv=out;worst=ty;}
    h+='<div class="vt"><span>'+TYN[ty]+'</span><span class="muted">'+Math.round(pc*100)+'%</span><div class="prog"><i style="width:'+(pc*100).toFixed(0)+'%"></i></div>'+(m===null?'<span class="muted">&ndash;</span>':'<span class="pill l'+(m>0?'d':'r')+'">'+(m>0?'D':'R')+'+'+Math.abs(m).toFixed(0)+'</span>')+'</div>';
  }
  if(worst>=0&&ct.cv>0){
    const c=ct.cvT[worst],m=c>0?(ct.DT[worst]-ct.RT[worst])/c*100:null;
    h+='<p class="small muted" style="margin:8px 0 0">Biggest block still out: '+TYN[worst].toLowerCase()+' ('+Math.round(c/ct.totT[worst]*100)+'% counted'+(m===null?'':', leaning '+(m>0?'D':'R')+' so far')+').</p>';
  }
  return h;
}
function chartHTML(ct,tNow){
  const H=ct.hist;
  if(H.length<2)return '<div class="empty">The chart starts once enough results are in.</div>';
  const W=540,L=44,R=10,T=8,h1=112,gap=24,h2=38,tot=T+h1+gap+h2+20;
  const t0=H[0][0]-1,t1=Math.max(tNow,H[H.length-1][0])+1;
  const xs=t=>L+(t-t0)/(t1-t0)*(W-L-R);
  let mx=5;for(const p of H)mx=Math.max(mx,Math.abs(p[2])*100);mx=Math.ceil(mx/5)*5;
  const ym=v=>T+(1-(v+mx)/(2*mx))*h1;
  const yb=T+h1+gap,yp=p=>yb+h2*(1-p);
  let d='';H.forEach((p,i)=>{d+=(i?'L':'M')+xs(p[0]).toFixed(1)+' '+ym(p[2]*100).toFixed(1);});
  const last=H[H.length-1];
  d+='L'+xs(t1).toFixed(1)+' '+ym(last[2]*100).toFixed(1);
  let a='M'+xs(t0).toFixed(1)+' '+(yb+h2);
  H.forEach(p=>{a+='L'+xs(p[0]).toFixed(1)+' '+yp(p[1]).toFixed(1);});
  a+='L'+xs(t1).toFixed(1)+' '+yp(last[1]).toFixed(1)+'L'+xs(t1).toFixed(1)+' '+(yb+h2)+'Z';
  const lc=last[2]>0?'var(--dem)':'var(--rep)';
  let s='<svg class="chart-svg" viewBox="0 0 '+W+' '+tot+'" role="img" aria-label="Margin and share of vote counted over time">';
  s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+ym(0)+'" y2="'+ym(0)+'" stroke="var(--line)" stroke-width="1"/>';
  s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+ym(mx)+'" y2="'+ym(mx)+'" stroke="var(--line)" stroke-width=".5" stroke-dasharray="3 3"/>';
  s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+ym(-mx)+'" y2="'+ym(-mx)+'" stroke="var(--line)" stroke-width=".5" stroke-dasharray="3 3"/>';
  s+='<text x="'+(L-5)+'" y="'+(ym(mx)+3)+'" text-anchor="end">D+'+mx+'</text><text x="'+(L-5)+'" y="'+(ym(0)+3)+'" text-anchor="end">Even</text><text x="'+(L-5)+'" y="'+(ym(-mx)+3)+'" text-anchor="end">R+'+mx+'</text>';
  if(ct.called&&ct.called.t>=t0&&ct.called.t<=t1){
    const cx=xs(ct.called.t);
    s+='<line x1="'+cx+'" x2="'+cx+'" y1="'+T+'" y2="'+(yb+h2)+'" stroke="var(--gold)" stroke-width="1.5" stroke-dasharray="4 3"/><text x="'+Math.min(cx+4,W-34)+'" y="'+(T+9)+'" style="fill:var(--gold);font-weight:600">Called</text>';
  }
  s+='<path d="'+d+'" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round"/>';
  s+='<circle cx="'+xs(last[0]).toFixed(1)+'" cy="'+ym(last[2]*100).toFixed(1)+'" r="3.5" style="fill:'+lc+'"/>';
  s+='<path d="'+a+'" style="fill:var(--oth)" fill-opacity=".35"/>';
  s+='<text x="'+(L-5)+'" y="'+(yp(1)+3)+'" text-anchor="end">100%</text><text x="'+(L-5)+'" y="'+(yp(0)+3)+'" text-anchor="end">0%</text>';
  s+='<text x="'+L+'" y="'+(tot-4)+'">'+fmtClock(t0)+'</text><text x="'+((L+W-R)/2)+'" y="'+(tot-4)+'" text-anchor="middle">'+fmtClock((t0+t1)/2)+'</text><text x="'+(W-R)+'" y="'+(tot-4)+'" text-anchor="end">'+fmtClock(t1)+'</text>';
  return s+'</svg>';
}
function layoutTM(items,x,y,w,h,out){
  if(items.length===1){out.push({i:items[0].i,x,y,w,h});return;}
  const total=items.reduce((a,b)=>a+b.v,0);let acc=0,k=0;
  for(k=0;k<items.length-1;k++){acc+=items[k].v;if(acc>=total/2)break;}
  const a=items.slice(0,k+1),b=items.slice(k+1);
  const sa=a.reduce((p,q)=>p+q.v,0);
  if(w>=h){const wa=w*sa/total;layoutTM(a,x,y,wa,h,out);layoutTM(b,x+wa,y,w-wa,h,out);}
  else{const ha=h*sa/total;layoutTM(a,x,y,w,ha,out);layoutTM(b,x,y+ha,w,h-ha,out);}
}
function tmLayout(st){
  if(TM[st.ab])return TM[st.ab];
  const items=st.county.map((c,i)=>({i,v:c.V})).sort((a,b)=>b.v-a.v);
  const out=[];layoutTM(items,0,0,600,300,out);TM[st.ab]=out;return out;
}
const GCM={};
function normN(s){return s.toLowerCase().replace(/ (county|parish|borough|census area|municipality|city and borough)$/,'').replace(/^saint /,'st ').replace(/^st\. /,'st ').replace(/[^a-z]/g,'');}
function geoShapes(st){
  if(GCM[st.ab]!==undefined)return GCM[st.ab];
  const g=window.GM_GEO&&GM_GEO.ct[st.ab];if(!g){return GCM[st.ab]=null;}
  const byF={},byN={};g.s.forEach((s,j)=>{byF[s.f]=j;byN[normN(s.n)]=byN[normN(s.n)]===undefined?j:-1;});
  const map=st.county.map(c=>c.f&&byF[c.f]!==undefined?byF[c.f]:(byN[normN(c.name)]>=0?byN[normN(c.name)]:undefined));
  const hit=map.filter(x=>x!==undefined).length;
  if(hit<st.county.length*0.6||hit<g.s.length*0.6)return GCM[st.ab]=null;   // reported by town or district: no real county shapes to draw
  const out={w:g.w,h:g.h,list:[]};const used=new Set();
  map.forEach((j,i)=>{if(j!==undefined){out.list.push({i,d:g.s[j].d,c:g.s[j].c});used.add(j);}});
  g.s.forEach((s,j)=>{if(!used.has(j))out.list.push({i:-1,d:s.d});});
  return GCM[st.ab]=out;
}
function geoCountyMap(ct,st){
  const G=geoShapes(st);if(!G)return null;
  let s='<svg class="tm-svg geo" viewBox="0 0 '+G.w+' '+G.h+'" role="group" aria-label="County map. Colored counties have reported; grey counties have not.">';
  for(const r of G.list){
    if(r.i<0){s+='<path d="'+r.d+'" style="fill:var(--tileoff)"/>';continue;}
    const cc=st.county[r.i],v=ct.uV[r.i],exp=cc.V*ct.ratio,p=v>0?Math.min(1,v/exp):0;
    let st2='fill:var(--tilepre)';
    if(v>0){const m=(ct.uD[r.i]-ct.uR[r.i])/v*100,a=Math.abs(m),op=a<5?0.45:a<15?0.62:a<30?0.8:1;st2='fill:'+(m>0?'var(--dem)':'var(--rep)')+';fill-opacity:'+(op*(0.45+0.55*p)).toFixed(2);}
    if(S.county===r.i)st2+=';stroke:var(--ink);stroke-width:2.2';
    s+='<path data-act="county" data-i="'+r.i+'" d="'+r.d+'" style="'+st2+';cursor:pointer"><title>'+esc(cc.name)+(v>0?': '+fmtN(v)+' counted ('+Math.round(p*100)+'% in)':': no votes reported')+'</title></path>';
  }
  return s+'</svg>'+'';
}
function bubbleCountyMap(ct,st,mode){
  const G=geoShapes(st);if(!G)return null;
  let maxV=1;for(const r of G.list)if(r.i>=0)maxV=Math.max(maxV,st.county[r.i].V*ct.ratio);
  const rMax=Math.max(14,Math.min(34,Math.min(G.w,G.h)*0.085));
  let s='<svg class="tm-svg geo" viewBox="0 0 '+G.w+' '+G.h+'" role="group" aria-label="County bubble map. Circle area shows '+(mode==='out'?'votes still outstanding':'votes counted')+'; color shows the leader.">';
  for(const r of G.list)s+='<path d="'+r.d+'" style="fill:var(--panel);stroke:var(--line);stroke-width:.6"/>';
  const items=[];
  for(const r of G.list){if(r.i<0||!r.c)continue;const cc=st.county[r.i],v=ct.uV[r.i],exp=cc.V*ct.ratio,left=Math.max(0,exp-v);const val=mode==='out'?left:v;if(val<=0&&!(mode==='out'&&v<=0))continue;items.push({i:r.i,c:r.c,val:mode==='out'&&v<=0?exp:val,v});}
  items.sort((a,b)=>b.val-a.val);
  for(const it of items){
    const rad=Math.max(1.4,rMax*Math.sqrt(it.val/maxV));let style;
    if(it.v>0){const m=(ct.uD[it.i]-ct.uR[it.i])/it.v*100,a=Math.abs(m),op=a<5?0.2:a<15?0.32:a<30?0.46:0.6;const cl=m>0?'var(--dem)':'var(--rep)';style='fill:'+cl+';fill-opacity:'+op+';stroke:'+cl+';stroke-opacity:.85;stroke-width:.9';}
    else style='fill:var(--tilepre);fill-opacity:.9;stroke:var(--muted);stroke-width:.8;stroke-dasharray:2 2';
    if(S.county===it.i)style+=';stroke:var(--ink);stroke-width:2.2';
    s+='<circle data-act="county" data-i="'+it.i+'" cx="'+it.c[0]+'" cy="'+it.c[1]+'" r="'+rad.toFixed(1)+'" style="'+style+';cursor:pointer"/>';
  }
  s+='</svg>';
  const ref=Math.pow(10,Math.floor(Math.log10(maxV)));
  return s+'<div class="muted small bnote">Circle area shows '+(mode==='out'?'votes still to count':'votes counted')+' (the largest possible circle is about '+fmtV(maxV)+' votes). Color shows who leads in the votes counted so far; dashed grey means nothing reported yet.</div>';
}
function countyMap(ct,st){
  if(S.cmode==='cnt'||S.cmode==='out'){const g=bubbleCountyMap(ct,st,S.cmode);if(g)return g;}
  else if(S.cmode!=='boxes'){const g=geoCountyMap(ct,st);if(g)return g;}
  const noGeo=!geoShapes(st);
  const rects=tmLayout(st);
  let s='<svg class="tm-svg" viewBox="0 0 600 300" role="group" aria-label="County map, sized by expected votes. Colored share is counted, grey share is outstanding.">';
  for(const r of rects){
    const cc=st.county[r.i],v=ct.uV[r.i],exp=cc.V*ct.ratio,left=Math.max(0,exp-v);
    const p=v>0?Math.min(1,v/exp):0;
    const ttl='<title>'+esc(cc.name)+': '+fmtN(v)+' counted, about '+fmtN(left)+' outstanding</title>';
    s+='<rect data-act="county" data-i="'+r.i+'" x="'+r.x.toFixed(1)+'" y="'+r.y.toFixed(1)+'" width="'+r.w.toFixed(1)+'" height="'+r.h.toFixed(1)+'" style="fill:var(--tilepre);cursor:pointer">'+ttl+'</rect>';
    if(p>0){
      const fill=ct.uD[r.i]>ct.uR[r.i]?'var(--dem)':'var(--rep)';
      s+='<rect data-act="county" data-i="'+r.i+'" x="'+r.x.toFixed(1)+'" y="'+r.y.toFixed(1)+'" width="'+(r.w*p).toFixed(1)+'" height="'+r.h.toFixed(1)+'" style="fill:'+fill+';cursor:pointer">'+ttl+'</rect>';
    }
    if(r.w>62&&r.h>24){
      const tc=p>0.35?'#fff':'var(--muted)';
      s+='<text x="'+(r.x+4).toFixed(1)+'" y="'+(r.y+12).toFixed(1)+'" style="fill:'+tc+';font-size:9px;pointer-events:none">'+esc(cc.name.replace(/ (County|Parish|Borough|Ward)$/,'').slice(0,14))+'</text>';
      if(r.h>36&&r.w>70&&left>0)s+='<text x="'+(r.x+4).toFixed(1)+'" y="'+(r.y+23).toFixed(1)+'" style="fill:'+tc+';font-size:8px;pointer-events:none;opacity:.9">'+fmtV(left)+' out</text>';
    }
  }
  return s+'</svg>'+(noGeo?'<div class="muted small">This state reports results by '+(st.ab==='AK'?'election district':st.ab==='DC'?'ward':'town')+', so there is no county outline to draw. Boxes are sized by expected votes.</div>':'');
}
const VT=['early in person','mail received early','Election Day','late mail and provisional'];
function cPrior(ct,cc){let n=0,d=0;for(let ty=0;ty<4;ty++){const b=cc.B[ty];if(!b)continue;n+=b*Math.max(-.97,Math.min(.97,cc.m[ty]+ct.shift-ct.e));d+=b;}return d?n/d*100:0;}
function mTxt(m){return (m>=0?'D':'R')+'+'+Math.abs(m).toFixed(1);}
function swTxt(x){return Math.abs(x)<0.05?'no change':(x>0?'D':'R')+' +'+Math.abs(x).toFixed(1);}
function cStats(ct,st,i){
  const cc=st.county[i],v=ct.uV[i],exp=cc.V*ct.ratio,left=Math.max(0,exp-v),p=Math.min(1,v/Math.max(exp,1));
  const cur=v>0?(ct.uD[i]-ct.uR[i])/v*100:null,pri=cPrior(ct,cc);
  return {cc,v,exp,left,p,cur,pri,sw:cur===null?null:cur-pri};
}
function cLabel(ct,k){const pres=ct.office==='pres',N=S.night;if(pres)return k==='D'?N.cand.D.name+' (D)':k==='R'?N.cand.R.name+' (R)':'Other';return cn(ct,k)||(k==='D'?'Democrat':k==='R'?'Republican':'Other');}
function countyInfo(ct,st){
  const i=S.county;
  if(i===null||i>=st.county.length)return '<span class="muted">Click a county for its full count, or hover to preview. Shading shows the leader and margin; grey counties have not reported.</span>';
  const s=cStats(ct,st,i),cc=s.cc;
  const rank=1+st.county.filter(c=>c.V>cc.V).length,share=cc.V/st.county.reduce((a,c)=>a+c.V,0)*100;
  const mixT=cc.B.reduce((a,b)=>a+b,0)||1;
  const rows=['D','R','O'].map(k=>{const val=k==='D'?ct.uD[i]:k==='R'?ct.uR[i]:ct.uO[i];return '<tr><td><span class="swatch" style="background:'+(k==='D'?'var(--dem)':k==='R'?'var(--rep)':'var(--oth)')+'"></span>'+esc(cLabel(ct,k))+'</td><td class="n">'+(s.v>0?(val/s.v*100).toFixed(1)+'%':'&ndash;')+'</td><td class="n">'+fmtN(val)+'</td></tr>';}).join('');
  let h='<div class="cdet"><h5>'+esc(cc.name)+'</h5><div class="small muted">'+(S.t<ct.close?'Polls close '+fmtClock(ct.close)+' ET &middot; ':'')+'#'+rank+' of '+st.county.length+' by votes &middot; '+share.toFixed(1)+'% of the state&rsquo;s expected vote</div>';
  h+='<table class="res">'+rows+'</table>';
  h+='<div class="cgrid"><div><span>Counted</span><b>'+fmtN(s.v)+'</b></div><div><span>Expected total</span><b>'+fmtN(s.exp)+'</b></div><div><span>Still out</span><b>'+fmtN(s.left)+'</b></div><div><span>Reporting</span><b>'+Math.round(s.p*100)+'%</b></div>';
  h+='<div><span>Margin now</span><b>'+(s.cur===null?'&ndash;':mTxt(s.cur))+'</b></div><div><span>Last election</span><b>'+mTxt(s.pri)+'</b></div><div><span>Shift since</span><b>'+(s.sw===null?'&ndash;':swTxt(s.sw))+'</b></div>';
  if(s.v>0){const net=ct.uD[i]-ct.uR[i];h+='<div><span>Net votes</span><b>'+(net>=0?'D +':'R +')+fmtN(Math.abs(net))+'</b></div>';}
  h+='</div><div class="small muted" style="margin-top:6px">Expected vote mix: '+cc.B.map((b,ty)=>Math.round(b/mixT*100)+'% '+VT[ty]).join(', ')+'.</div>';
  if(s.left>0&&s.v>0)h+='<div class="small" style="margin-top:4px">The '+fmtN(s.left)+' outstanding votes here could move the statewide margin by up to about '+fmtN(s.left*Math.abs(s.cur)/100)+' net votes if they match what is counted so far.</div>';
  return h+'</div>';
}
function countyTip(ct,st,i){
  const s=cStats(ct,st,i);
  return '<b>'+esc(s.cc.name)+'</b><div class="small">'+(s.v>0?['D','R'].map(k=>esc(cLabel(ct,k).replace(/ \(.\)$/,''))+' '+((k==='D'?ct.uD[i]:ct.uR[i])/s.v*100).toFixed(1)+'%').join(' &middot; '):'No votes reported yet')+'</div><div class="small muted">'+Math.round(s.p*100)+'% in &middot; '+fmtN(s.left)+' out'+(s.cur!==null?' &middot; '+mTxt(s.cur)+' (last: '+mTxt(s.pri)+')':'')+'</div>';
}
function countyTable(ct,st){
  const sort=S.csort||'size';
  const rows=st.county.map((c,i)=>({i,...cStats(ct,st,i)}));
  const key={size:r=>-r.cc.V,out:r=>-r.left,margin:r=>r.cur===null?9e9:-Math.abs(r.cur),swing:r=>r.sw===null?9e9:-Math.abs(r.sw),name:r=>r.cc.name}[sort];
  rows.sort((a,b)=>{const x=key(a),y=key(b);return typeof x==='string'?x.localeCompare(y):x-y;});
  const th=(k,t,c)=>'<th class="'+(c||'n')+'"><button type="button" class="sb'+(sort===k?' on':'')+'" data-act="csort" data-v="'+k+'">'+t+'</button></th>';
  let h='<div class="ctw"><table class="res ctab"><tr>'+th('name','County','')+th('size','Expected')+th('out','Out')+'<th class="n">In</th><th class="n">D</th><th class="n">R</th>'+th('margin','Margin')+th('swing','Shift')+'</tr>';
  for(const r of rows){
    h+='<tr data-act="county" data-i="'+r.i+'"'+(S.county===r.i?' class="sel"':'')+'><td>'+esc(r.cc.name.replace(/ (County|Parish|Borough)$/,''))+'</td><td class="n">'+fmtV(r.exp)+'</td><td class="n"><b>'+fmtV(r.left)+'</b></td><td class="n">'+Math.round(r.p*100)+'%</td><td class="n">'+(r.v>0?(ct.uD[r.i]/r.v*100).toFixed(0)+'%':'&ndash;')+'</td><td class="n">'+(r.v>0?(ct.uR[r.i]/r.v*100).toFixed(0)+'%':'&ndash;')+'</td><td class="n">'+(r.cur===null?'&ndash;':mTxt(r.cur))+'</td><td class="n">'+(r.sw===null?'&ndash;':(r.sw>0?'D':'R')+Math.abs(r.sw).toFixed(1))+'</td></tr>';
  }
  const tot=rows.reduce((a,r)=>a+r.left,0);
  return h+'</table></div><div class="cinfo muted">All '+rows.length+' counties &middot; about '+fmtV(tot)+' votes outstanding statewide &middot; &ldquo;Shift&rdquo; compares the counted margin with the last election in the same county (early counts skew, so treat it as a guide).</div>';
}
function miniRes(ct){
  const win=ct.called?ct.called.party:null,ks=['D','R'];if(ct.cv>0&&ct.O/ct.cv>0.02)ks.push('O');
  const col={D:'var(--dem)',R:'var(--rep)',O:'var(--oth)'};
  return '<table class="res mini">'+ks.map(k=>{const v=ct[k];return '<tr><td><span class="swatch" style="background:'+col[k]+'"></span>'+esc(cLabel(ct,k))+(win===k?' <b>&#10003;</b>':'')+'</td><td class="n">'+(ct.cv>0?(v/ct.cv*100).toFixed(1)+'%':'&ndash;')+'</td><td class="n">'+(ct.cv>0?fmtN(v):'')+'</td></tr>';}).join('')+'</table>';
}
function ovCard(ct,act,attrs,title){
  const N=S.night,pct=N.pctIn(ct);
  return '<button type="button" class="ovc" data-act="'+act+'" '+attrs+'><div class="ovh"><b>'+esc(title)+'</b><span class="muted small">'+rating(ct)+'</span>'+pillHTML(ct)+'</div>'+miniRes(ct)+'<div class="ovf muted small">'+(S.t<ct.close?'Polls close '+fmtClock(ct.close)+' ET':Math.round(pct*100)+'% of expected vote in'+(ct.cv>0?' &middot; '+fmtN(ct.cv)+' counted':''))+'</div></button>';
}
function sovHTML(st){
  const N=S.night;
  let h=drawerHead(st.name,'All races &middot; polls close '+fmtClock(st.close)+' ET')+chipsHTML(st,'sov');
  const offs=['pres','sen','gov'].filter(o=>st.contests[o]);
  offs.sort((a,b)=>(b===S.tab)-(a===S.tab));
  if(offs.length)h+='<div class="sec"><div class="ovgrid">'+offs.map(o=>ovCard(st.contests[o],'chip','data-off="'+o+'"',OFFN[o])).join('')+'</div></div>';
  if(st.hd>0){
    let cd=0,cr=0;for(const id of st.houseIds){const c=N.byId[id];if(c.called){if(c.called.party==='D')cd++;else cr++;}}
    h+='<div class="sec"><h4>U.S. House &middot; '+st.hd+' seat'+(st.hd>1?'s':'')+'</h4><div class="callbox">'+cd+' Democratic and '+cr+' Republican called<small>'+(st.hd-cd-cr)+' undecided</small></div><div class="ovgrid">'+st.houseIds.map(id=>{const c=N.byId[id];return ovCard(c,'dist','data-id="'+id+'"',c.label);}).join('')+'</div></div>';
  }
  return h;
}
function tipHTML(ab){
  const N=S.night,st=N.states[ab],tab=S.tab;
  if(tab==='house'){
    const hi=houseInfo(st);if(!hi.n)return '<b>'+esc(st.name)+'</b><div class="small muted">No House seats</div>';
    if(hi.n===1){const c=N.byId[st.houseIds[0]];return '<div class="th"><b>'+esc(st.name)+'</b><span class="muted small">U.S. House &middot; '+esc(c.label)+'</span></div>'+miniRes(c)+'<div class="small muted">'+(S.t<c.close?'Polls close '+fmtClock(c.close)+' ET':Math.round(N.pctIn(c)*100)+'% in')+' &middot; '+rating(c)+'</div>'+pillHTML(c);}
    let rows=st.houseIds.map(id=>N.byId[id]).sort((a,b)=>Math.abs(a.rateT)-Math.abs(b.rateT)).slice(0,6);
    return '<div class="th"><b>'+esc(st.name)+'</b><span class="muted small">U.S. House &middot; '+hi.n+' seats</span></div><div class="small">'+hi.cd+' D &middot; '+hi.cr+' R called &middot; '+(hi.n-hi.cd-hi.cr)+' left'+(hi.fl?' &middot; '+hi.fl+' flip'+(hi.fl>1?'s':''):'')+'</div><div class="small muted" style="margin-top:4px">Closest seats</div>'+rows.map(c=>'<div class="small trow2"><span>'+esc(c.label)+'</span>'+pillHTML(c)+'</div>').join('');
  }
  const ct=st.contests[tab];if(!ct)return '<b>'+esc(st.name)+'</b><div class="small muted">No '+TABN[tab].toLowerCase()+' race</div>';
  return '<div class="th"><b>'+esc(st.name)+'</b><span class="muted small">'+OFFN[tab]+(tab==='pres'?' &middot; '+ct.ev+' EV':'')+'</span></div>'+miniRes(ct)+'<div class="small muted">'+(S.t<ct.close?'Polls close '+fmtClock(ct.close)+' ET':Math.round(N.pctIn(ct)*100)+'% in')+' &middot; '+rating(ct)+'</div>'+pillHTML(ct);
}
function chipsHTML(st,cur){
  let h='<div class="chips"><button type="button" class="btn'+(cur==='sov'?' on':'')+'" data-act="sov">Overview</button>';
  for(const o of ['pres','sen','gov']){
    if(!st.contests[o])continue;
    h+='<button type="button" class="btn'+(cur===o?' on':'')+'" data-act="chip" data-off="'+o+'">'+TABN[o]+'</button>';
  }
  if(st.hd>0)h+='<button type="button" class="btn'+(cur==='house'?' on':'')+'" data-act="hs">House ('+st.hd+')</button>';
  return h+'</div>';
}
function drawerHead(title,sub){
  return '<div class="dhead"><div><h2>'+esc(title)+'</h2><small>'+sub+'</small></div><button type="button" class="xbtn" data-act="close" aria-label="Close">&times;</button></div>';
}
const RB=[['sd','Safe D','d',3],['ld2','Likely D','d',2],['lnd','Lean D','d',1],['tu','Toss-up','n',0],['lnr','Lean R','r',1],['lr2','Likely R','r',2],['sr','Safe R','r',3]];
function rbucket(ct){const m=ct.rateT,a=Math.abs(m),p=m>0?'d':'r';if(a<0.03)return 'tu';if(a<0.08)return p==='d'?'lnd':'lnr';if(a<0.15)return p==='d'?'ld2':'lr2';return p==='d'?'sd':'sr';}
function ratingsHTML(off){
  const N=S.night,groups={};for(const b of RB)groups[b[0]]=[];
  for(const c of N.contests)if(c.office===off)groups[rbucket(c)].push(c);
  const total=N.contests.filter(c=>c.office===off).length;
  let h='<div class="chips">';
  for(const o of N.offices)h+='<button type="button" class="btn'+(o===off?' on':'')+'" data-act="rtab" data-off="'+o+'">'+TABN[o]+'</button>';
  h+='</div><div class="sec"><div class="rbar">';
  for(const b of RB){const n=groups[b[0]].length;if(n)h+='<i class="rb-'+b[0]+'" style="flex:'+n+'" title="'+b[1]+': '+n+'"></i>';}
  h+='</div><div class="rleg">';
  for(const b of RB)h+='<span><i class="rb-'+b[0]+'"></i>'+b[1]+' <b>'+groups[b[0]].length+'</b></span>';
  h+='</div><p class="muted small">'+total+' '+(off==='house'?'districts':off==='pres'?'states and districts':'races')+'. Ratings blend each seat’s last election result with its polling average, weighted toward the polls when a race has many. They never see the final count, so a wave shows up as upsets against the ratings. Each seat shows who won it, so upsets stand out.</p></div>';
  for(const b of RB){
    const L=groups[b[0]];if(!L.length)continue;
    let cd=0,cr=0;for(const c of L)if(c.called){if(c.called.party==='D')cd++;else cr++;}
    const un=L.length-cd-cr;
    L.sort((x,y)=>Math.abs(x.rateT)-Math.abs(y.rateT));
    h+='<div class="sec"><h4>'+b[1]+' &middot; '+L.length+'</h4><div class="rsum">'+cd+' D called &middot; '+cr+' R called &middot; '+un+' left'+'</div><div class="rchips">';
    for(const c of L){
      let cl='rc0';if(c.called)cl=c.called.party==='D'?'rcd':'rcr';else if(c.cv>0)cl=c.D>c.R?'rld':'rlr';
      const upset=c.called&&((b[2]==='d'&&c.called.party==='R')||(b[2]==='r'&&c.called.party==='D'));
      h+='<button type="button" class="rchip '+cl+(isFlip(c)?' rf':'')+(upset?' up':'')+'" data-act="rchip" data-id="'+c.id+'" title="'+esc(contestLabel(c))+(upset?' · upset':'')+'">'+esc(off==='house'?c.label:c.st)+'</button>';
    }
    h+='</div></div>';
  }
  h+='<div class="sec rkey muted small"><span class="rchip rcd">D</span> D called <span class="rchip rcr">R</span> R called <span class="rchip rld">&nbsp;</span> D leading <span class="rchip rlr">&nbsp;</span> R leading <span class="rchip rc0">&nbsp;</span> waiting &middot; purple ring = flipped &middot; dashed = upset against the rating</div>';
  return h;
}
function renderDrawer(){
  const D=S.drawer;if(!D)return;
  if(D.kind==='poll'){
    const hp=pollDrawer(D);if(!hp)return;
    const dpp=$('dpanel'),scp=dpp.scrollTop;
    if(cache.drawer!==hp){cache.drawer=hp;dpp.innerHTML=hp;dpp.scrollTop=scp;}
    return;
  }
  if(D.kind==='ratings'){
    const h0=drawerHead('Seats by rating',esc(OFFN[D.office])+' &middot; sorted from closest to safest')+ratingsHTML(D.office);
    const dp0=$('dpanel'),sc0=dp0.scrollTop;
    if(cache.drawer!==h0){cache.drawer=h0;dp0.innerHTML=h0;dp0.scrollTop=sc0;}
    return;
  }
  const N=S.night,st=N.states[D.ab];let h='';
  if(D.kind==='contest'){
    const ct=st.contests[D.office];
    if(!ct){closeDrawer();return;}
    h=drawerHead(st.name,OFFN[D.office]+' &middot; '+rating(ct)+' &middot; '+st.county.length+' '+(D.ab==='LA'?'parishes':D.ab==='AK'?'boroughs':D.ab==='DC'?'wards':'counties')+' &middot; polls close '+fmtClock(ct.close)+' ET');
    h+=chipsHTML(st,D.office);h+=meBox(ct);
    h+='<div class="sec">'+statusBox(ct)+whyHTML(ct)+'</div>';
    h+='<div class="sec"><h4>Results</h4>'+resultsTable(ct)+progressHTML(ct)+'</div>';
    h+='<div class="sec"><h4>Count by vote type</h4>'+typeHTML(ct)+'</div>';
    h+='<div class="sec"><h4>Margin over the night</h4>'+chartHTML(ct,S.t)+'</div>';
    h+='<div class="sec"><h4>County map <span class="mtog">'+[['geo','Shaded'],['cnt','Counted'],['out','Outstanding'],['boxes','Boxes']].map(x=>'<button type="button" class="btn sm'+((S.cmode||'geo')===x[0]?' on':'')+'" data-act="cmode" data-v="'+x[0]+'">'+x[1]+'</button>').join('')+'</span></h4>'+countyMap(ct,st)+'<div class="cinfo" id="cinfo">'+countyInfo(ct,st)+'</div></div>';
    h+='<div class="sec"><h4>All counties</h4>'+countyTable(ct,st)+'</div>';
  }else if(D.kind==='sov'){
    h=sovHTML(st);
  }else if(D.kind==='hstate'){
    let cd=0,cr=0;for(const id of st.houseIds){const c=N.byId[id];if(c.called){if(c.called.party==='D')cd++;else cr++;}}
    h=drawerHead(st.name,'U.S. House &middot; '+st.hd+' seat'+(st.hd>1?'s':'')+' &middot; polls close '+fmtClock(st.close)+' ET');
    h+=chipsHTML(st,'house');
    h+='<div class="sec"><div class="callbox">'+cd+' Democratic and '+cr+' Republican called<small>'+(st.hd-cd-cr)+' undecided</small></div></div><div class="sec"><h4>Districts</h4><div class="ovgrid">'+st.houseIds.map(id=>{const c=N.byId[id];return ovCard(c,'dist','data-id="'+id+'"',c.label);}).join('')+'</div></div>';
  }else{
    const ct=N.byId[D.id];
    if(!ct){closeDrawer();return;}
    h=drawerHead(ct.label,esc(st.name)+' &middot; U.S. House &middot; '+rating(ct)+' &middot; polls close '+fmtClock(ct.close)+' ET');
    h+=meBox(ct);h+='<div class="chips">'+(st.hd>1?'<button type="button" class="btn" data-act="hs">&larr; All '+st.ab+' districts</button>':'')+'</div>';
    h+='<div class="sec">'+statusBox(ct)+whyHTML(ct)+'</div>';
    h+='<div class="sec"><h4>Results</h4>'+resultsTable(ct)+progressHTML(ct)+'</div>';
    h+='<div class="sec"><h4>Count by vote type</h4>'+typeHTML(ct)+'</div>';
  }
  const dp=$('dpanel'),sc=dp.scrollTop;
  if(cache.drawer!==h){cache.drawer=h;dp.innerHTML=h;dp.scrollTop=sc;}
}
function openDrawer(d){
  S.drawer=d;S.county=null;cache.drawer=null;
  S.prevFocus=document.activeElement;
  const dr=$('drawer');dr.classList.add('open');dr.setAttribute('aria-hidden','false');
  $('dpanel').scrollTop=0;
  renderDrawer();
  const x=$('dpanel').querySelector('.xbtn');if(x)x.focus();
  updateMap();
}
function closeDrawer(){
  S.drawer=null;cache.drawer=null;
  const dr=$('drawer');dr.classList.remove('open');dr.setAttribute('aria-hidden','true');
  updateMap();
  if(S.prevFocus&&S.prevFocus.focus&&document.contains(S.prevFocus))S.prevFocus.focus();
}
function openFor(ab){
  const st=S.night.states[ab];
  if(!st.hd&&!Object.keys(st.contests).length)return;
  if(S.tab==='house'&&!st.hd)return;
  if(S.tab!=='house'&&S.tab!=='polls'&&!st.contests[S.tab])return;
  openDrawer({kind:'sov',ab});
}

/* ---------- control ---------- */
function renderAll(){
  if(S.tab==='polls'&&S.pollAuto&&S.t>=0&&S.night){S.pollAuto=false;S.tab=S.night.offices[0];}
  updatePolls();updateMine();
  updateClock();updateTabs();updateLegend();updateMap();updateScore();updateKey();updateFeed();updateHeadline();updateWrap();
  if(S.drawer)renderDrawer();
}
function updateMine(){
  const b=$('bMine');if(!b)return;
  const P=S.player;
  if(!P||!S.night){b.hidden=true;return;}
  b.hidden=false;
  let txt='Your race';
  const ct=P.office==='pres'?null:S.night.byId[P.id];
  if(ct){txt+=': '+(ct.office==='house'?ct.label:S.night.states[ct.st].name+' '+OFFN[ct.office]);
    if(ct.called)txt+=' · '+(ct.called.party===P.party?'You won':'You lost')+(ct.called.party===P.party||P.party!=='I'?'':'');}
  else txt+=': President';
  if(b.textContent!==txt)b.textContent=txt;
}
function meBox(ct){
  const P=ct.player;if(!P)return '';
  const nm=(x,p)=>x?esc(x)+' ('+p+')':'';
  const parts=[P.party==='I'?'<b>'+esc(P.name)+'</b> (Independent)':nm(P.oppD,'D')+'', P.party==='I'?nm(P.oppD,'D'):'' ];
  let line;
  if(P.party==='I')line='<b>'+esc(P.name)+'</b> (Independent) vs '+nm(P.oppD,'D')+' and '+nm(P.oppR,'R');
  else line='<b>'+esc(P.name)+'</b> ('+P.party+') vs '+esc(P.party==='D'?P.oppR:P.oppD)+' ('+(P.party==='D'?'R':'D')+')';
  let res='';
  if(ct.called){const won=ct.called.party===P.party&&P.party!=='I';res=' <b>'+(won?'You won this race.':P.party==='I'?'A major-party candidate won; the independent did not.':'You lost this race.')+'</b>';}
  return '<div class="sec"><div class="mebox"><span class="lb">Your campaign</span> '+line+res+'</div></div>';
}
function seek(t){
  t=Math.max(T0,Math.min(FINAL,t));
  if(S.night.t>t+1e-6){const keep=S.drawer;rebuild();S.drawer=keep;}
  S.fast=t>END;
  S.night.advanceSteps(t,t-Math.max(S.night.t,T0)>200?5:1);
  S.t=t;
  renderAll();
}
function setTab(o){
  if(o!=='polls'&&S.night.offices.indexOf(o)<0)return;
  S.pollAuto=false;
  S.tab=o;
  if(S.drawer)closeDrawer();
  renderAll();
}
let last=performance.now();
function frame(now){
  const dt=Math.min(now-last,200)/1000;last=now;
  const N=S.night;
  if(N&&S.playing&&$('intro').hidden&&S.t<FINAL){
    const over=S.t>=END&&!S.fast;
    if(!over){
      const rate=(S.t<END||!S.fast?BASE_RATE:FAST_RATE)*S.speed;
      let nt=S.t+dt*(S.fast?FAST_RATE:BASE_RATE)*S.speed;
      if(!S.fast&&nt>=END)nt=END;
      if(nt>FINAL)nt=FINAL;
      S.t=nt;
      if(S.fast)N.advanceSteps(S.t,2);else N.advance(S.t);
      if(S.t>=END&&!S.fast)S.playing=false;
    }
  }
  if(N&&now-S.lastRender>250){S.lastRender=now;renderAll();}
  requestAnimationFrame(frame);
}
function startNight(){
  S.scen=document.querySelector('#scenSeg [aria-pressed="true"]').dataset.v;
  S.env=+$('env').value;
  S.seed=Math.floor(Math.random()*900000)+1000;
  S.player=null;
  beginNight();
}
function launchNight(cfg){
  S.scen=cfg.scen;S.env=cfg.env;S.seed=cfg.seed;S.player=cfg.player||null;
  beginNight();
}
function beginNight(){
  S.tab='polls';S.pollAuto=true;S.pollView='votes';S.pollOff=S.scen==='2028'?'pres':'sen';
  closeDrawerQuiet();
  rebuild();
  S.playing=false;S.lastRender=0;
  $('intro').hidden=true;
  renderAll();
  $('tab-'+S.tab).focus({preventScroll:true});
  const gm=$('gm');if(gm)gm.hidden=true;
}
function closeDrawerQuiet(){S.drawer=null;cache.drawer=null;$('drawer').classList.remove('open');$('drawer').setAttribute('aria-hidden','true');}
function menuPanel(p){for(const s of document.querySelectorAll('#intro .mp'))s.hidden=s.dataset.p!==p;const f=document.querySelector('#intro .mp[data-p='+p+'] button');if(f&&!$('intro').hidden)f.focus();}
document.addEventListener('click',e=>{const b=e.target.closest('#toNight,#toHow,[data-menu]');if(!b)return;menuPanel(b.id==='toNight'?'night':b.id==='toHow'?'how':b.dataset.menu);});
function showIntro(){
  S.playing=false;const gm0=$('gm');if(gm0)gm0.hidden=true;
  menuPanel('main');
  $('intro').hidden=false;
  $('goCamp').focus();
}

/* ---------- events ---------- */
$('scenSeg').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  for(const x of $('scenSeg').children)x.setAttribute('aria-pressed',x===b?'true':'false');
});
$('go').addEventListener('click',startNight);
$('bPlay').addEventListener('click',()=>{if(!S.night)return;S.playing=!S.playing;updateClock();});
for(const sp of [1,2,4])$('b'+sp).addEventListener('click',()=>{S.speed=sp;updateClock();});
$('bEnd').addEventListener('click',()=>{if(S.night){S.playing=false;seek(END);}});
$('bFinal').addEventListener('click',()=>{if(S.night){S.playing=false;seek(FINAL);}});
$('bNew').addEventListener('click',showIntro);
$('bMine').addEventListener('click',()=>{const P=S.player;if(!P)return;if(P.office==='pres'){S.tab='pres';S.drawer=null;openContestById('pres:'+P.st);}else openContestById(P.id);});
$('tl').addEventListener('click',e=>{
  if(!S.night)return;
  const r=$('tl').getBoundingClientRect();
  const f=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
  seek(T0+f*SPAN);
});
$('tabs').addEventListener('click',e=>{const b=e.target.closest('.tab[data-tab]');if(b)setTab(b.dataset.tab);});
$('tabs').addEventListener('keydown',e=>{
  if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;
  const offs=['polls'].concat(S.night.offices),i=offs.indexOf(S.tab),n=offs.length;
  const o=offs[(i+(e.key==='ArrowRight'?1:n-1))%n];
  setTab(o);$('tab-'+o).focus();
});
$('map').addEventListener('click',e=>{const g=e.target.closest('.tile');if(g)openFor(g.dataset.ab);});
$('map').addEventListener('keydown',e=>{
  if(e.key!=='Enter'&&e.key!==' ')return;
  const g=e.target.closest('.tile');if(g){e.preventDefault();openFor(g.dataset.ab);}
});
$('waffle').addEventListener('click',e=>{
  const c=e.target.closest('.wc');if(!c)return;
  openDrawer({kind:'district',ab:S.night.byId[c.dataset.id].st,id:c.dataset.id});
});
$('key').addEventListener('click',e=>{
  const b=e.target.closest('.krow');if(!b)return;
  if(b.dataset.pollid){openDrawer({kind:'poll',id:b.dataset.pollid});return;}
  const ct=S.night.byId[b.dataset.id];
  if(ct.office==='house')openDrawer({kind:'district',ab:ct.st,id:ct.id});
  else openDrawer({kind:'contest',ab:ct.st,office:ct.office});
});
$('wrapSlot').addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act;
  if(a==='cont'){S.fast=true;S.playing=true;renderAll();}
  else if(a==='final'){S.playing=false;seek(FINAL);}
  else if(a==='new')showIntro();
});
$('pollView').addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act;
  if(a==='pseg'){S.pollView=b.dataset.v;cache.pollview=null;updatePolls();}
  else if(a==='poff'){S.pollOff=b.dataset.off;cache.pollview=null;updatePolls();}
  else if(a==='pollrace')openDrawer({kind:'poll',id:b.dataset.id});
  else if(a==='pstart'){S.playing=true;renderAll();}
});
$('score').addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  if(b.dataset.act==='ratings')openDrawer({kind:'ratings',office:S.tab});
  else if(b.dataset.act==='rchip')openContestById(b.dataset.id);
});
function openContestById(id){
  const c=S.night.byId[id];if(!c)return;
  if(c.office==='house'){const st=S.night.states[c.st];S.tab='house';openDrawer({kind:'district',ab:c.st,id});updateTabs();updateMap();updateScore();updateKey();}
  else openDrawer({kind:'contest',ab:c.st,office:c.office});
}
$('drawer').addEventListener('click',e=>{
  if(e.target===$('drawer')){closeDrawer();return;}
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act,D=S.drawer;if(!D)return;
  if(a==='rtab'){S.drawer={kind:'ratings',office:b.dataset.off};cache.drawer=null;renderDrawer();return;}
  if(a==='rchip'){openContestById(b.dataset.id);return;}
  if(a==='close')closeDrawer();
  else if(a==='chip'){S.drawer={kind:'contest',ab:D.ab,office:b.dataset.off};S.county=null;cache.drawer=null;renderDrawer();}
  else if(a==='sov'){S.drawer={kind:'sov',ab:D.ab};S.county=null;cache.drawer=null;renderDrawer();}
  else if(a==='hs'){S.drawer={kind:'hstate',ab:D.ab};cache.drawer=null;renderDrawer();}
  else if(a==='dist'){S.drawer={kind:'district',ab:D.ab,id:b.dataset.id};cache.drawer=null;$('dpanel').scrollTop=0;renderDrawer();}
  else if(a==='csort'){S.csort=b.dataset.v;cache.drawer=null;renderDrawer();}
  else if(a==='cmode'){S.cmode=b.dataset.v;cache.drawer=null;renderDrawer();}
  else if(a==='county'){S.county=+b.dataset.i;const ct=S.night.states[D.ab].contests[D.office];$('cinfo').innerHTML=countyInfo(ct,S.night.states[D.ab]);cache.drawer=null;}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&S.drawer)closeDrawer();});

/* ---------- hover cards ---------- */
(function(){
  const tip=document.createElement('div');tip.id='tip';tip.hidden=true;tip.setAttribute('role','tooltip');document.body.appendChild(tip);
  let cur=null;
  function place(e){
    const w=tip.offsetWidth,h=tip.offsetHeight;let x=e.clientX+16,y=e.clientY+16;
    if(x+w>innerWidth-8)x=e.clientX-w-16;if(y+h>innerHeight-8)y=Math.max(8,innerHeight-h-8);
    tip.style.left=Math.max(8,x)+'px';tip.style.top=Math.max(8,y)+'px';
  }
  function show(html,e){if(tip.innerHTML!==html)tip.innerHTML=html;tip.hidden=false;place(e);}
  document.addEventListener('mousemove',e=>{
    if(!S.night||S.tab==='polls'){tip.hidden=true;return;}
    const t=e.target.closest&&e.target.closest('#map .tile');
    if(t&&!t.classList.contains('t-off')){show(tipHTML(t.dataset.ab),e);cur='s';return;}
    const c=e.target.closest&&e.target.closest('[data-act=county][data-i]');
    if(c&&S.drawer&&S.drawer.kind==='contest'&&c.tagName!=='TR'){const st=S.night.states[S.drawer.ab],ct=st.contests[S.drawer.office];if(ct){show(countyTip(ct,st,+c.dataset.i),e);cur='c';return;}}
    tip.hidden=true;
  });
  document.addEventListener('mouseleave',()=>{tip.hidden=true;});
  document.addEventListener('click',()=>{tip.hidden=true;},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')tip.hidden=true;});
})();
/* ---------- boot ---------- */
document.addEventListener('click',e=>{const b=e.target.closest('#mapGeo,#mapTiles');if(!b)return;S.mapMode=b.id==='mapGeo'?'geo':'tiles';$('mapGeo').classList.toggle('on',S.mapMode==='geo');$('mapTiles').classList.toggle('on',S.mapMode==='tiles');buildMap();updateMap();});
(function initTimeline(){
  const tl=$('tl');
  for(let t=0;t<=END;t+=60){
    const k=document.createElement('span');k.className='tl-tick';k.style.left=((t-T0)/SPAN*100)+'%';k.textContent=fmtShort(t).replace('p',' PM').replace('a',' AM');
    tl.appendChild(k);
  }
  const kn=document.createElement('div');kn.className='tl-knob';kn.id='tlKnob';tl.appendChild(kn);
})();
rebuild();
renderAll();
$('go').focus({preventScroll:true});
requestAnimationFrame(frame);
window.__menu=showIntro;window.__launch=launchNight;
if(location.hash==='#debug')window.__demo={S,seek,startNight,renderAll,launchNight};
})();
