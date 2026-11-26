/* ===== October surprises: specific stories about a real issue, your own record, or (for invented opponents only) the opponent's past. ===== */
(function(){
const oc=(label,hint,fx,res,more)=>Object.assign({label,hint,fx,res},more||{});
const lab=(id,x)=>GM.ISSUES.find(i=>i.id===id).lab[Math.max(0,Math.min(4,Math.round(x)+2))];
const pickR=(r,a)=>a[Math.floor(r()*a.length)];
const fn=C=>C.cand.name.split(' ')[0];
/* your own baggage, as a specific late story */
const BAG={
 bankrupt:['Court filings from your old bankruptcy surface','A reporter obtains the full file from your old bankruptcy, including a creditor who says he was never repaid. Opponents are already quoting it.'],
 dui:['Police report from your old DUI arrest published','A local outlet publishes the arrest report and booking photo from your old DUI. The photo is the lead image on every feed.'],
 divorce:['Your ex-spouse speaks out','Your former spouse gives a long interview about the divorce and the court fight over it. The clip is circulating widely.'],
 statements:['Old posts and clips resurface','A researcher compiles your old statements into a single video. The worst line is quoted in a new ad.'],
 ethics:['Ethics file reopened','Watchdog groups demand the ethics complaint against you be reopened, citing documents released this week.'],
 lobbying:['Lobbying records leak','Records show you were paid for work you never disclosed. Two outlets are about to publish.'],
 health:['Questions about your health go mainstream','A photo of you leaving a clinic sets off weeks of rumors, and a national outlet asks for your medical records.'],
 relative:['A relative makes headlines','A family member says something inflammatory on camera and is identified as your relative. Reporters are calling your office.'],
 affair:['A story about your past affair is about to run','A magazine has been in touch with a former associate and says it will publish this week.'],
 taxes:['Tax lien turns up in a record search','A reporter notes an old lien in county records and asks why it took years to pay.'],
 flipflop:['Side-by-side video of your old and new positions','A rival group releases a video comparing your earlier stance with the platform you run on now.'],
 temper:['Video of you snapping at a staffer','A recording of you shouting at a staff member in a hotel hallway is posted online.'],
 plagiar:['Plagiarism accusation resurfaces','A new analysis lines up passages of your old speech with another source. It is spreading fast.'],
 novote:['Records show you skipped elections','A database search shows you sat out several past elections, including ones you now urge voters to take seriously.'],
 trades:['Your stock trades are examined','A financial site charts your trades against news about your committee work, and asks whether the timing was luck.'],
 resume:['Your résumé is fact-checked','A fact-check finds parts of your bio overstated. Two of the claims appear in your own ads.'],
 donorties:['A major donor is in the news','One of your biggest backers is accused of serious misconduct, and reporters are asking if you will return the money.']
};
function ownBaggage(C,id){
  const b=BAG[id],bg=GM.BAGGAGE.find(x=>x.id===id);if(!b)return null;
  return {t:b[0],tag:'past',x:b[1]+' This is the '+bg.name.toLowerCase()+' you have carried into this race.',ch:[
   oc('Own it and apologize','Direct and honest.',{},'',{roll:{sk:'cha',base:0.4,per:0.06,win:{fav:2,media:3,enth:1},lose:{fav:-3,media:-3}},winRes:'Voters respected the straight answer and the story faded.',loseRes:'The apology sounded forced and the story ran another week.'}),
   oc('Attack the timing and the source','Pay to change the subject.',{cash:-40,oppFav:-1,fav:-1.5,media:-1},'The counterattack split the coverage but kept the story alive.'),
   oc('Say nothing','Hope it passes.',{fav:-2.5,enth:-1},'The silence was read as an admission.')]};
}
/* opponent past: only for invented opponents. Real named candidates never get invented scandals. */
const OPPPAST=[
 ['Contractors say they were never paid','Local contractors allege that a company tied to {o} left them unpaid. Documents are with two reporters.'],
 ['A settled lawsuit comes to light','A settled civil suit involving {o} is unsealed after a request from a news organization.'],
 ['No-bid contract questions','Records show a no-bid contract went to a donor during {o}’s time in office.'],
 ['Old interview contradicts the platform','A recording of {o} from years ago directly contradicts the position {o} now campaigns on.'],
 ['Missing disclosures','A watchdog finds {o}’s financial disclosures omitted several accounts.']];
function oppPast(C,r){
  const o=C.opp,p=pickR(r,OPPPAST);
  return {t:p[0],tag:'opp',x:p[1].replace(/\{o\}/g,o.name)+' Your team has confirmed the documents are authentic.',ch:[
   oc('Run it hard','Paid ads and a press push.',{cash:-60},'',{roll:{sk:'med',base:0.45,per:0.05,win:{oppFav:-6,media:3,fav:1},lose:{oppFav:-2,fav:-2,media:-2}},winRes:'The story landed and dominated the closing week.',loseRes:'Voters read the push as desperate and it barely moved numbers.'}),
   oc('Let reporters carry it','Quiet, lower risk.',{oppFav:-2.5},'The story ran without your fingerprints on it.'),
   oc('Stay positive','Ignore it.',{fav:1,enth:1},'You kept the focus on your own message.')]};
}
/* a late development on a salient issue: lean in if voters agree with you, risk it if they do not */
const DEV={
 aca:['Insurers file steep premium increases','Insurers announce premium increases for next year. Health costs are the first thing voters mention at your events.'],
 tariffs:['Tariff announcement rattles markets','A new round of tariff announcements lands this week and prices are the story at every grocery store.'],
 iran:['Iran war deadline passes','A deadline in the Iran conflict passes without a deal, and every candidate is being asked where they stand on the war.'],
 ice:['Raid video goes viral','Video of an immigration raid in a nearby neighborhood spreads widely and forces every candidate to answer.'],
 redistrict:['Court ruling on district maps','A court ruling on district maps this week makes redistricting a closing-week story.'],
 justice:['New subpoenas dominate the news','New subpoenas and a dispute over the Justice Department dominate the weekend shows.'],
 ethics:['Report on stock trading and ethics','A new report on congressional stock trading puts corruption on the front page.'],
 vaccines:['Outbreak reaches the state','A preventable-disease outbreak reaches the state, and the public health response is the story.'],
 immig:['New border and visa numbers released','New border and visa numbers are released and both parties claim vindication.'],
 abort:['Court ruling on abortion access','A ruling affecting abortion access hits in the final stretch.'],
 guns:['A mass shooting shakes the state','A mass shooting leaves families and the state in shock, and gun laws are suddenly the central question.'],
 econ:['Jobs report jolts the race','A surprise jobs report rocks the race in its closing weeks.'],
 ukraine:['Ukraine talks make headlines','Peace-talk headlines and a new aid dispute make Ukraine a closing-week issue.'],
 israel:['Gaza headlines return','A major development in Gaza puts U.S. support for Israel back at the center of the debate.'],
 spending:['Budget fight dominates Washington','A budget showdown in Washington makes federal spending the story.'],
 safety:['Trustees report warns on Social Security','New trustees’ projections on Social Security and Medicare solvency make seniors the center of the closing week.'],
 health:['Hospital costs and coverage dominate coverage','A new report on rising hospital bills and coverage gaps becomes the story of the week.'],
 tax:['Tax bills hit household budgets','New figures on how the tax law affects families put taxes at the center of the closing argument.'],
 educ:['School funding fight reaches the state','A dispute over federal school funding and the Education Department reaches local districts.'],
 climate:['Extreme weather hits the region','Severe weather and rising insurance rates make climate the story of the week.'],
 police:['A high-profile crime dominates local news','A high-profile violent crime and a debate over policing take over local coverage.'],
 house:['Rent and home prices hit a record','New data show record housing costs in the state, and every candidate is asked about it.'],
 minwage:['Strike and wage fight make headlines','A strike and a wage dispute at a major local employer put pay and unions in the headlines.'],
 energy:['Gas and power prices spike','A spike in gas and electricity prices puts energy policy on every local broadcast.'],
 nato:['Alliance dispute makes headlines','A dispute among allies makes headlines and forces candidates to define their positions on alliances.'],
 china:['Taiwan tensions and a chip dispute','Tensions over Taiwan and a technology dispute put China policy on the front page.'],
 studentdebt:['Loan repayment news hits borrowers','New repayment rules and wage garnishment notices put student debt in the headlines.'],
 trans:['Court fight over transgender policy','A court ruling and a state fight over transgender policy become a closing-week flashpoint.'],
 drugs:['Overdose numbers released','New overdose and enforcement numbers put drug policy in the spotlight.'],
 democ:['Voting rules fight reaches the courts','A dispute over mail ballots and voter rolls reaches the courts days before the election.']
};
function issueSurprise(C,r){
  const vis=GM.visIssues(),sal=GM.salNow(C);
  const cands=vis.filter(i=>DEV[i.id]||true).map(i=>({i,w:(sal[i.id]||0)*(DEV[i.id]?3:1)+0.001}));
  let tot=cands.reduce((s,x)=>s+x.w,0),pick=r()*tot,sel=cands[0];for(const x of cands){pick-=x.w;if(pick<=0){sel=x;break;}}
  const is=sel.i,d=DEV[is.id]||['Late development on '+is.name.toLowerCase(),'A late development puts '+is.name.toLowerCase()+' in the spotlight.'];
  const e=C.e[is.id],mine=GM.mine(C,is.id),adv=GM.adv(C,is.id,e);
  const fits=adv>0.03,bad=adv<-0.03;
  const line=' You back “'+lab(is.id,mine)+'”; voters here lean toward “'+lab(is.id,e)+'”.'+(fits?' You are on the right side of this one.':bad?' That puts you on the wrong side of most voters.':' You are close to even with your opponent on this.');
  const p0=0.5+Math.max(-0.28,Math.min(0.28,adv*2.4));
  return {t:d[0],tag:'issue',pi:is.id,x:d[1]+line,ch:[
   oc('Lean into it','Make it your closing argument.',{},'',{roll:{sk:'cri',base:p0-0.1,per:0.05,win:{fav:3,media:3,enth:2},lose:{fav:-2.5,media:-2,oppFav:1}},winRes:'You framed the issue and it carried into the final week.',loseRes:'The issue did not break your way and the opposition used it against you.'}),
   oc('Pivot back to your message','Keep the strategy.',{fav:0.5},'You kept the closing message intact, though some voters wanted more on '+is.name.toLowerCase()+'.'),
   oc('Call for a bipartisan response','Looks above the fray.',{fav:1,enth:-1.5},'The response played well with independents and flat with your base.')]};
}
GM.octSurprise=function(C){
  const r=C.rng,opts=[];
  const bag=(C.cand.baggage||[]).filter(id=>BAG[id]);
  for(const id of bag)opts.push({w:2.0*(C.hid?C.hid.scand:1),f:()=>ownBaggage(C,id)});
  if(!C.indep&&C.opp&&!C.opp.real)opts.push({w:1.6*(C.opp.weak&&C.opp.weak.id==='scandal'?2:1),f:()=>oppPast(C,r)});
  opts.push({w:2.6,f:()=>issueSurprise(C,r)});
  let tot=opts.reduce((s,x)=>s+x.w,0),p=r()*tot,sel=opts[0];for(const x of opts){p-=x.w;if(p<=0){sel=x;break;}}
  return sel.f();
};
})();
