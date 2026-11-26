/* ===== Media and social media data. Outlets and platforms are fictional; storylines marked real follow reported 2026 events. ===== */
GM.OUTLETS=[
 {id:'post',name:'The Meridian Post',kind:'National newspaper',slant:-0.35,desc:'Center-left. Strong on policy, skeptical of the right.'},
 {id:'ledger',name:'Capitol Ledger',kind:'Business daily',slant:0.35,desc:'Center-right. Cares about markets, taxes and regulation.'},
 {id:'common',name:'The Commonwealth',kind:'Cable news',slant:-0.8,desc:'Left. Prime-time opinion, loud on rights and corruption.'},
 {id:'front',name:'Frontline News',kind:'Cable news',slant:0.8,desc:'Right. Prime-time opinion, loud on border, crime and culture.'},
 {id:'wire',name:'National Wire',kind:'Wire service',slant:0,desc:'Straight news. Sets the baseline other outlets react to.'},
 {id:'radio',name:'Heartland Public Radio',kind:'Public radio',slant:-0.1,desc:'Center. Local angles, longer interviews.'}];
GM.PLATFORMS=[
 {id:'chirp',name:'Chirp',kind:'Short posts',aud:'Political junkies, journalists, activists',slant:0.15,young:0.4,size:1.0,blocs:['indep','college','young','white_wc']},
 {id:'face',name:'Facegram',kind:'Friends and groups',aud:'Older voters, parents, churches',slant:0.1,young:0.15,size:1.5,blocs:['seniors','evang','rural','union']},
 {id:'clip',name:'ClipClap',kind:'Short video',aud:'Under-35s, first-time voters',slant:-0.25,young:0.95,size:1.3,blocs:['young','latino','black','asian']},
 {id:'sub',name:'Subthread',kind:'Forums',aud:'Highly engaged, issue-by-issue',slant:-0.3,young:0.6,size:0.6,blocs:['young','college','veteran','indep']}];

/* Story fields: id, real, date (yyyy-mm-dd, '' = anytime), sal (poll issue id), pi (issue id in the platform test or ''), dir (+1 helps Democrats, -1 helps Republicans, 0 neutral), mag (points of national environment at full traction), headlines n/l/r, tag, state (optional) */
GM.STORIES=[];
(function(){
const S=(id,real,date,sal,pi,dir,mag,n,l,r,tag,st)=>GM.STORIES.push({id,real,date,sal,pi,dir,mag,h:{n,l,r},tag,st:st||null});
/* ----- Real 2025-26 storylines ----- */
S('liberation',1,'2025-04-02','econ','tariffs',1,0.5,'Administration announces sweeping tariffs, with a 10% minimum on imports','Trump’s "Liberation Day" tariffs rattle markets and importers','White House says new tariffs will rebuild American industry','#tariffs');
S('obbb',1,'2025-07-04','tax','spending',0,0.3,'Congress passes the tax-and-spending package Republicans call the One Big Beautiful Bill','Democrats say the GOP law guts health care to pay for tax cuts','Republicans tout tax relief in the "Big Beautiful Bill"','#BigBeautifulBill');
S('texasmap',1,'2025-07-20','democ','redistrict',0,0.3,'Texas redraws its congressional map at the president’s request; other states follow','Redistricting arms race: Republican states redraw, California and Utah answer','Republicans say new maps correct years of Democratic gerrymanders','#redistricting');
S('offyear',1,'2025-11-04','democ','',1,0.5,'Democrats win Virginia and New Jersey governorships and New York City’s mayoralty','Democrats sweep off-year elections in a warning shot to the GOP','Republicans shrug off off-year losses as local','#Spanberger #Sherrill #Mamdani');
S('minnesota',1,'2026-01-20','immig','ice',1,0.7,'Immigration surge in Minnesota ends in two fatal shootings','Calls to abolish ICE grow after deadly Minnesota shootings','Officials defend Minnesota enforcement as targeting criminals','#ICE #Minnesota');
S('irantrikes',1,'2026-02-28','foreign','iran',0,0.3,'U.S. and Israel launch strikes on Iran','Strikes on Iran open a new, uncertain war','Administration says strikes will deter Iran','#Iran');
S('callais',1,'2026-04-29','democ','redistrict',1,0.4,'Supreme Court narrows the Voting Rights Act; Alabama, Louisiana and Tennessee redraw','Court’s ruling guts Voting Rights Act protections, majority-Black districts at risk','Court ruling ends race-based map drawing, supporters say','#Callais #VRA');
S('resign',1,'2026-04-15','democ','ethics',0,0.2,'Rep. Swalwell and Rep. Gonzales resign over misconduct allegations','Two House members step down amid misconduct claims','Two House members step down amid misconduct claims','#resign');
S('paxton',1,'2026-05-26','other','',1,0.3,'Trump-endorsed Ken Paxton beats Sen. John Cornyn in the Texas Senate runoff','Paxton’s win gives Democrats an opening in Texas','Trump-backed Paxton wins Texas nomination','#TXSen','TX');
S('purge',1,'2026-05-19','other','',-1,0.2,'Trump-backed challengers beat Sen. Bill Cassidy and Rep. Thomas Massie in primaries','Trump purges GOP dissenters in primaries','Trump’s endorsement proves decisive again','#primaries');
S('mamdani',1,'2026-06-23','other','',0,0.1,'Three Mamdani-backed candidates win New York House primaries, ousting two incumbents','Left wing’s New York wave unseats incumbents','Democratic infighting claims incumbents in New York','#NYprimary');
S('platner',1,'2026-07-14','other','',-1,0.3,'Maine Democrat Graham Platner ends Senate bid after an allegation he denies; Troy Jackson becomes nominee','Democrats scramble in Maine after Platner exits','Democratic turmoil in Maine hands Collins an opening','#MESen','ME');
S('grahamdeath',1,'2026-07-30','other','',0,0.2,'Sen. Lindsey Graham dies suddenly; Gov. McMaster appoints sister Darline Graham','South Carolina mourns Lindsey Graham as seat passes to his sister','Darline Graham takes her late brother’s Senate seat','#SCSen','SC');
S('sullivans',1,'2026-08-18','other','',0,0.2,'A second "Dan Sullivan" with no party listed will appear on Alaska’s Senate ballot','Ballot confusion looms in Alaska with two Dan Sullivans and Peltola','Two Dan Sullivans on the ballot sets off ballot-naming fight in Alaska','#AKSen','AK');
S('elsayed',1,'2026-08-05','other','',0,0.2,'Abdul El-Sayed narrowly beats Rep. Haley Stevens in Michigan’s Democratic Senate primary','El-Sayed’s win energizes the left in Michigan','Michigan Democrats nominate a progressive, Republicans see opening','#MISen','MI');
S('andrews',1,'2026-08-26','other','',1,0.3,'Darline Graham wins GOP nomination; race with Democrat Annie Andrews tightens','Annie Andrews gains ground in South Carolina','Darline Graham says she will carry on her brother’s work','#SCSen','SC');
S('convention',1,'2026-09-10','other','',1,0.2,'Republicans hold first midterm convention in Dallas; polls show no bounce','GOP midterm convention fails to move the polls','Republicans rally in Dallas as convention opens','#RNC2026');
S('earlyvote',1,'2026-10-28','democ','',1,0.4,'Early voting runs ahead of 2018 and 2022 totals','Early vote surge points to high Democratic enthusiasm','Republicans urge supporters to vote as early totals climb','#EarlyVoting');
S('stevens',1,'2026-11-01','other','',-1,0.3,'Rep. Haley Stevens endorses Republican Mike Rogers for Senate in Michigan, two days before the election','Stevens endorses Rogers, snubs El-Sayed days before vote','Democratic congresswoman endorses Rogers for Senate','#MISen','MI');
/* Real storylines that were running through the whole 2026 campaign */
S('prices',1,'','cost','tariffs',1,0.9,'Voters name prices and cost of living their top concern as tariffs and fuel costs bite','Tariffs and war-driven fuel costs squeeze family budgets','Administration says inflation would be worse without its policies','#prices #tariffs');
S('oil',1,'','cost','iran',1,0.8,'Oil prices stay elevated as the Iran war drags on','The Iran war’s cost shows up at the pump','White House says pressure on Iran will pay off despite higher fuel prices','#gasprices #Iran');
S('farm',1,'','econ','tariffs',1,0.6,'Farmers face retaliatory tariffs on exports and higher diesel and fertilizer costs','Farm country pays for the trade war','Administration promises farm aid as trade talks continue','#farmers');
S('icecities',1,'','immig','ice',1,0.7,'Majority in polls says immigration agents’ conduct has gone too far','Raids in big cities spark protests and calls to rein in ICE','Border crossings stay low; officials say raids target criminals','#ICE');
S('corrupt',1,'','democ','ethics',1,0.6,'Gallup: 89% say corruption in government is widespread','Trump’s crypto income feeds corruption concerns across party lines','Republicans call corruption attacks a distraction from results','#corruption');
S('healthcosts',1,'','health','aca',1,0.6,'Health costs and the Republican tax law remain a campaign flashpoint','Democrats hammer GOP law’s health care cuts and rising premiums','Republicans promote the law’s tax relief for families','#healthcare');
S('approval',1,'','cost','',1,0.6,'President’s job approval averages near 39%, with 59% disapproving','Trump’s approval sinks as midterms near','Republicans point to base loyalty despite soft approval','#approval');
S('border',1,'','immig','ice',-1,0.5,'Border security earns the administration credit even as other approval slips','Even critics concede border crossings have fallen','Border security remains the administration’s strongest card','#border');
/* ----- Generic storylines for any cycle ----- */
S('jobsgood',0,'','econ','',-1,0.5,'Jobs report beats expectations as unemployment holds steady','Jobs numbers look solid, but many families say they do not feel it','Strong jobs report gives the party in power a boost','#jobs');
S('jobsbad',0,'','econ','',1,0.6,'Hiring stalls and unemployment ticks up in latest report','Weak jobs report raises recession worries','Weak jobs report blamed on policy uncertainty','#jobsreport');
S('inflcool',0,'','cost','',-1,0.5,'Inflation cools for third straight month','Inflation eases but grocery prices stay high','Falling inflation shows plan is working, officials say','#inflation');
S('inflhot',0,'','cost','',1,0.6,'Inflation surprises to the upside, driven by food and shelter','Prices climb faster than wages again','Officials blame supply problems for hotter inflation','#prices');
S('gasdrop',0,'','cost','energy',-1,0.4,'Gas prices fall to their lowest level in months','Pump prices fall, but voters are not impressed yet','Cheaper gas gives drivers a break','#gasprices');
S('gasspike',0,'','cost','energy',1,0.5,'Gas prices jump after supply disruption','Pump prices spike ahead of the election','Officials blame overseas supply disruption for gas spike','#gasprices');
S('stocksrec',0,'','econ','',-1,0.3,'Stocks hit record highs','Markets soar while paychecks lag','Record markets lift retirement accounts','#markets');
S('selloff',0,'','econ','',1,0.4,'Stocks tumble in sharpest drop in a year','Market rout rattles retirees and small business owners','Market drop seen as short-lived correction','#selloff');
S('layoffs',0,'','econ','',1,0.5,'Wave of layoffs hits tech and manufacturing','Layoffs spread as companies cut costs','Layoffs trace to regulation and uncertainty, executives say','#layoffs');
S('aijobs',0,'','econ','tech',1,0.4,'AI tools start replacing entry-level office jobs','Workers fear AI is coming for their jobs while companies cash in','Business leaders say AI will create more jobs than it kills','#AI #jobs');
S('datacenter',0,'','cost','tech',0,0.3,'Data center boom raises local electricity bills','Neighbors fight giant data centers and rising power bills','Tech investment brings jobs to small towns','#datacenters');
S('shooting',0,'','guns','guns',1,0.4,'Mass shooting at a public event leaves multiple dead','After another shooting, calls for background checks grow','Gun rights groups urge focus on mental health and enforcement','#guns');
S('crimespike',0,'','crime','police',-1,0.5,'Violent crime rises in several big cities','A string of violent incidents shakes city residents','Crime wave puts pressure on local leaders','#crime');
S('crimefall',0,'','crime','police',1,0.3,'Murder rates fall to multi-year lows','Violent crime falls in cities that invested in prevention','Police credit tough enforcement for falling crime','#crime');
S('borderwave',0,'','immig','ice',-1,0.6,'Border encounters surge for a second month','Border chaos returns to the headlines','Border surge strains local resources','#border');
S('borderfall',0,'','immig','ice',1,0.3,'Border crossings fall to historic lows','Border calm eases a top GOP talking point','Crossings fall, officials credit new policies','#border');
S('abortcourt',0,'','abort','abort',1,0.6,'Court ruling on abortion pills sets off a fresh fight','Court ruling threatens access to abortion medication','Court ruling gives states more say, supporters say','#abortion');
S('heat',0,'','climate','climate',1,0.3,'Record heat wave strains power grids across the country','Deadly heat and wildfires bring climate back to the front page','Grid strain proves need for all-of-the-above energy, critics say','#heatwave');
S('storm',0,'','other','',0,0.3,'Hurricane makes landfall; officials race to respond','Residents criticize slow recovery response','Federal agencies praise recovery effort','#hurricane');
S('foreigncrisis',0,'','foreign','nato',-1,0.4,'Crisis abroad dominates the news; voters watch leadership','Allies urge calm as crisis escalates','Crisis puts a spotlight on strength and resolve','#foreignpolicy');
S('ceasefire',0,'','foreign','ukraine',0,0.3,'Ceasefire deal announced in a major overseas conflict','Ceasefire holds, but details remain murky','Ceasefire seen as a diplomatic win','#ceasefire');
S('indict',0,'','democ','ethics',0,0.3,'Senator indicted on corruption charges','Indictment adds to voters’ distrust of Washington','Prosecutors accused of political motives in indictment','#indicted');
S('shutdown',0,'','democ','spending',1,0.4,'Government shutdown threat looms as spending talks stall','Shutdown fight leaves federal workers unpaid and angry','Republicans blame Democrats for shutdown threat','#shutdown');
S('debtfight',0,'','tax','spending',-1,0.3,'Debt and deficit hit a new record, budget hawks warn','Deficit grows as tax cuts pile up, analysts say','Spending, not taxes, drives the deficit, think tank says','#deficit');
S('socsec',0,'','cost','safety',1,0.4,'Trust fund warning puts Social Security on the campaign trail','Seniors fear cuts as trust fund runs low','Reform needed to save Social Security, experts say','#SocialSecurity');
S('housing',0,'','house','house',1,0.3,'Rents and home prices keep climbing in fast-growing metros','Young families priced out as housing costs soar','Zoning rules blamed for housing shortage','#housing');
S('studentloan',0,'','educ','studentdebt',1,0.2,'Student loan payments restart for millions of borrowers','Borrowers face bills they cannot afford','Taxpayer fairness at issue in loan relief debate','#studentloans');
S('vaccine',0,'','health','vaccines',0,0.3,'Health agency changes vaccine guidance, splitting medical groups','Doctors warn against changes to vaccine guidance','Parents welcome more choice on vaccines','#vaccines');
S('protest',0,'','democ','',0,0.3,'Large protests spread across cities over a police shooting','Demonstrators demand accountability after police shooting','Some protests turn destructive, local officials say','#protests');
S('scandalgop',0,'','democ','ethics',1,0.4,'Republican officeholder faces scandal over campaign funds','Scandal engulfs a Republican incumbent','Republicans call coverage of the scandal overblown','#scandal');
S('scandaldem',0,'','democ','ethics',-1,0.4,'Democratic officeholder faces scandal over campaign funds','Scandal engulfs a Democratic incumbent','Democrats call coverage of the scandal overblown','#scandal');
S('turnout',0,'','democ','',0,0.3,'Turnout looks high in early reports from battleground states','Young voters turn out in surprising numbers','Turnout surge may reshape midterm map','#turnout');
S('trade',0,'','econ','tariffs',0,0.3,'Trade talks with major partners stall over tariffs','Trade deal collapse leaves importers uncertain','Talks stall, officials say leverage is rising','#trade');
S('teacher',0,'','educ','educ',0,0.2,'School funding fights flare as districts cut budgets','Teachers rally over funding cuts','Parents push school choice amid budget fights','#schools');
})();

/* helpers */
GM.slantHead=function(st,slant){return slant<=-0.25?st.h.l:slant>=0.25?st.h.r:st.h.n;};
GM.fmtDate=function(d){const M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return M[d.getUTCMonth()]+' '+d.getUTCDate();};
