/* ===== Hidden candidate profiles. Every candidate (the player, opponents, and every name on the election-night ballot) has one.
   Nothing here is shown while playing. It changes how appealing a candidate is, and is revealed only in the final post-mortem. ===== */
GM.hash=function(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
GM.hrng=function(s){let a=GM.hash(s)||1;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
GM.hg=function(r){return Math.sqrt(-2*Math.log(r()||1e-9))*Math.cos(6.283185307*r());};
/* ties from a known background (player only): which voter blocs see themselves in this candidate */
GM.ties=function(c){
  const t={};if(!c)return t;
  const set=(k,v)=>{t[k]=Math.min(1,(t[k]||0)+v);};
  if(c.race==='Black')set('black',1);if(c.race==='Hispanic or Latino')set('latino',1);if(c.race==='Asian American')set('asian',1);
  if(c.religion==='Evangelical Protestant')set('evang',1);
  if(c.age<40)set('young',0.8);if(c.age>=62)set('seniors',0.8);
  if(c.bg==='veteran')set('vets',1);if(c.bg==='union'){set('union',1);set('wc',0.5);}
  if(['farmer'].includes(c.bg)){set('rural',1);set('wc',0.4);}if(c.bg==='smallbiz')set('wc',0.5);
  if(c.tier===2||['professor','doctor','lawyer'].includes(c.bg))set('college',0.5);
  if(c.gender==='Woman')set('women',0.4);
  return t;
};
GM.hidden=function(key,info){
  const r=GM.hrng('hid|'+key),g=()=>GM.hg(r),cl=(x,a,b)=>Math.max(a,Math.min(b,x));
  const H={like:cl(g()*0.7,-1.6,1.6),wing:cl(g()*0.6,-1.2,1.2),grit:cl(g()*0.6,-1.2,1.2),scand:Math.exp(cl(g()*0.35,-0.6,0.6)),rap:{}};
  const ties=GM.ties(info);
  for(const b of GM.BLOCS)H.rap[b.id]=cl(g()*0.4+0.7*(ties[b.id]||0),-1,1);
  return H;
};
/* appeal in points, candidate-signed (positive helps this candidate). A: state attributes, Lm: the seat's D-R margin in points */
GM.hidAppeal=function(H,A,Lm){
  if(!H)return 0;
  let v=H.like*1.0;
  for(const b of GM.BLOCS){let s;try{s=b.sh(A)/100;}catch(e){s=0.1;}v+=s*H.rap[b.id]*2.4;}
  const x=Math.max(0,Math.min(1,1-Math.abs(Lm)/22));
  v-=0.9*H.wing*x;                     // moderates do better where the seat is competitive; wings do not matter in safe seats
  return Math.max(-3.5,Math.min(3.5,v));
};
GM.hidText=function(H,A,Lm,name){
  const parts=[];
  if(!H)return parts;
  if(H.like>0.5)parts.push(name+' was simply well liked, which helped.');else if(H.like<-0.5)parts.push(name+' had a likability problem that never showed in the polls.');
  const x=Math.max(0,1-Math.abs(Lm)/22);
  if(H.wing*x>0.35)parts.push(name+' sat at the edge of their party, which cost votes in a competitive seat.');else if(H.wing*x<-0.35)parts.push(name+' was seen as a pragmatist inside their party, which helped in a competitive seat.');
  let best=null,bv=0;for(const b of GM.BLOCS){let s=0.1;try{s=b.sh(A)/100;}catch(e){}const w=s*H.rap[b.id];if(Math.abs(w)>Math.abs(bv)){bv=w;best=b;}}
  if(best&&Math.abs(bv)>0.07)parts.push(bv>0?name+' connected unusually well with '+best.name.toLowerCase()+'.':name+' struggled to connect with '+best.name.toLowerCase()+'.');
  return parts;
};
/* name-based lookup of a ballot's candidates (2026 real names) used by the election-night engine for every race the player is not in */
GM.ballotNames=function(office,st,label){
  if(!GM.CANDS||office==='pres')return null;
  let row=null;
  if(office==='sen')row=GM.CANDS.sen[st];else if(office==='gov')row=GM.CANDS.gov[st];
  else{const d=String(label).split('-')[1],H=GM.CANDS.house[st];if(H)row=H[d]||(Object.keys(H).length===1?H[Object.keys(H)[0]]:null);}
  return row||null;
};
GM.hidEffect=function(office,st,label,id,scen,seed,Lm){
  const A=GM.STATE_ATTR[st];if(!A)return 0;
  const row=scen==='2026'?GM.ballotNames(office,st,label):null;
  const kD=row&&row[0]?'D|'+row[0]:'D|'+id+'|'+seed,kR=row&&row[1]?'R|'+row[1]:'R|'+id+'|'+seed;
  const d=GM.hidAppeal(GM.hidden(kD),A,Lm*100),rr=GM.hidAppeal(GM.hidden(kR),A,Lm*100);
  return (d-rr)/100;
};
