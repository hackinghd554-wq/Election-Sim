/* ===== Campaign game data (creator + campaign). Plain data, no DOM. ===== */
"use strict";
const GM={};

/* State attributes, rounded and approximate (Census/ACS/Pew scale): black%, hispanic%, asian%, evangelical%, college%, rural%.
   Replace with exact Census/ACS/Pew values before shipping. */
GM.STATE_ATTR={};
`AL|26|5|1.5|49|28|42
AK|3|7|6|26|30|34
AZ|5|32|4|21|31|10
AR|15|8|1.7|44|25|44
CA|6|40|15|15|36|6
CO|4|22|3.5|18|44|14
CT|11|17|5|12|42|12
DE|22|11|4.5|18|35|17
DC|45|11|4.5|8|62|0
FL|16|27|3|21|33|9
GA|33|10|5|33|34|25
HI|2|11|38|15|35|8
ID|0.8|13|1.5|24|30|29
IL|14|18|6|20|38|12
IN|10|8|3|31|28|28
IA|4|7|2.8|24|30|36
KS|6|13|3.3|28|35|26
KY|8|4|1.7|41|26|42
LA|32|7|2|36|26|27
ME|2|2|1.5|12|36|61
MD|30|12|7|14|42|13
MA|7|13|7.5|8|46|8
MI|14|6|3.5|21|32|25
MN|7|6|5.5|21|38|26
MS|38|3.5|1.2|49|24|51
MO|12|5|2.5|36|31|30
MT|0.7|4.5|1|20|35|44
NE|5|12|2.8|25|34|27
NV|10|29|9|19|27|6
NH|1.5|4|3.5|11|40|40
NJ|15|21|10|12|43|5
NM|2.5|50|2|25|30|23
NY|17|20|9|9|40|12
NC|21|11|3.6|34|33|33
ND|3.5|4|1.5|18|31|40
OH|13|4.5|2.7|25|30|22
OK|7|12|2.5|47|27|34
OR|2|14|5|17|37|19
PA|12|8|4|17|33|26
RI|8|17|3.5|7|38|9
SC|26|7|2|40|31|33
SD|2|4|1.7|28|30|43
TN|16|6|2|52|29|33
TX|13|40|5.5|31|33|16
UT|1.5|15|2.5|6|37|10
VT|1.5|2.5|2.5|8|43|65
VA|19|10|7|21|41|24
WA|4.5|13|10|17|38|16
WV|3.5|1.9|0.9|40|23|54
WI|6|7.5|3|20|33|29
WY|1.5|10|1.2|26|29|36`.split('\n').forEach(l=>{const p=l.split('|');GM.STATE_ATTR[p[0]]={black:+p[1],hisp:+p[2],asian:+p[3],evang:+p[4],college:+p[5],rural:+p[6]};});

/* Issues: stance -2 (left) .. +2 (right). load = how strongly the electorate's average follows partisanship. sal = matching national issue id from the polls. */
GM.ISSUES=[
 {id:'econ',name:'Economy and regulation',load:0.9,sal:'econ',lab:['Heavy government role','Active government role','Mixed','Light-touch government','Free-market first']},
 {id:'tax',name:'Taxes',load:1.0,sal:'tax',lab:['Tax the wealthy sharply','Raise taxes on high earners','Keep taxes as they are','Cut taxes broadly','Slash taxes and spending']},
 {id:'health',name:'Health care',load:1.0,sal:'health',lab:['Medicare for all','Public option','Fix the current system','Market-based reforms','Repeal and replace']},
 {id:'immig',name:'Immigration',load:1.3,sal:'immig',lab:['Open path for most','Path to citizenship','Balanced reform','Tighter border first','Mass deportations']},
 {id:'abort',name:'Abortion',load:1.4,sal:'abort',lab:['Legal throughout, codify Roe','Legal with few limits','Legal with limits','Restrictions with exceptions','Ban with minimal exceptions']},
 {id:'guns',name:'Guns',load:1.2,sal:'guns',lab:['Ban assault weapons, strict licensing','Universal checks and red flags','Targeted measures','Protect gun rights, few limits','No new gun laws']},
 {id:'climate',name:'Climate and energy',load:1.3,sal:'climate',lab:['Rapid transition, Green New Deal','Clean energy push','All of the above','Drill and build','Climate policy is overblown']},
 {id:'foreign',name:'Foreign policy and defense',load:0.6,sal:'foreign',lab:['Cut defense, diplomacy first','Multilateral engagement','Pragmatic','Strong military, tough on rivals','America first, pull back']},
 {id:'trade',name:'Trade',load:0.4,sal:'econ',lab:['Fair-trade, labor standards','Selective deals','Mixed','Free trade','Tariffs and decoupling']},
 {id:'educ',name:'Education',load:0.8,sal:'educ',lab:['Fully fund public schools','Expand public school funding','Reform within public schools','Charters and choice','Universal school choice']},
 {id:'police',name:'Policing and crime',load:1.0,sal:'crime',lab:['Divest and reimagine policing','Reform and oversight','Balanced','More police, tougher sentences','Zero tolerance']},
 {id:'house',name:'Housing',load:0.4,sal:'house',lab:['Federal housing build-out','Rent protection and building','Local flexibility','Cut zoning and permitting','Let markets decide']},
 {id:'tech',name:'Technology and AI',load:0.3,sal:'other',lab:['Strong regulation','Guardrails','Case by case','Light rules','Hands off']},
 {id:'democ',name:'Voting and elections',load:1.0,sal:'democ',lab:['Expand access, automatic registration','Expand early and mail voting','Keep current rules','Tighter ID and rolls','Strict limits on mail voting']},
 {id:'safety',name:'Social Security and Medicare',load:0.5,sal:'cost',lab:['Expand benefits','Protect and expand','Protect as is','Reform for solvency','Privatize and cut']},
 {id:'culture',name:'Social and cultural issues',load:1.2,sal:'other',lab:['Fully inclusive, protect LGBTQ rights','Broadly inclusive','Live and let live','Traditional values','Religion in public life']},
 {id:'ukraine',name:'Ukraine and Russia',load:0.7,sal:'foreign',lab:['Give Ukraine whatever it takes to win','Keep arming Ukraine and sanction Russia','Support talks while keeping some aid','End new aid and push a negotiated deal','Cut off aid and stay out'],short:'Ukraine'},
 {id:'israel',name:'Israel and Gaza',load:0.8,sal:'foreign',lab:['End arms sales and recognize Palestine','Condition aid and press hard on Gaza','Back Israel and push a ceasefire','Strong support for Israel with few conditions','Unconditional support for Israel'],short:'Israel'},
 {id:'china',name:'China and Taiwan',load:0.3,sal:'foreign',lab:['Engage and cooperate with China','Compete but cooperate where possible','Firm on Taiwan, managed trade','Decouple from China','Confront China on every front'],short:'China'},
 {id:'nato',name:'NATO and alliances',load:0.8,sal:'foreign',lab:['Deepen alliances','Keep alliances, ask allies for more','Mixed','Make allies pay or lose US protection','Leave NATO'],short:'Alliances'},
 {id:'tariffs',name:'Tariffs',load:0.9,sal:'econ',lab:['Repeal the new tariffs','Roll back most tariffs','Targeted tariffs only','Broad tariffs to rebuild industry','Higher tariffs on everything'],short:'Tariffs'},
 {id:'studentdebt',name:'Student debt',load:0.6,sal:'educ',lab:['Cancel broadly','Targeted forgiveness','Reform repayment','No forgiveness, cut college costs','End federal student loans'],short:'Student debt'},
 {id:'minwage',name:'Minimum wage and unions',load:0.8,sal:'econ',lab:['$20 minimum wage and card-check unions','Raise to $15','Modest increase','Leave it to states and employers','Right to work everywhere, no federal minimum'],short:'Wages'},
 {id:'energy',name:'Oil, gas and nuclear',load:0.8,sal:'climate',lab:['Phase out fossil fuels','Wind and solar first','All of the above','Drill more and build nuclear','Drill everywhere, scrap climate rules'],short:'Energy'},
 {id:'justice',name:'Justice Department and presidential power',load:1.1,sal:'democ',lab:['Strict limits and an independent DOJ','Restore guardrails','Mixed','Strong president, DOJ follows the White House','Unchecked executive power'],short:'DOJ'},
 {id:'ice',name:'Deportation tactics',load:1.1,sal:'immig',lab:['Abolish ICE','Reform ICE and end raids','Targeted enforcement','Expand enforcement and detention','Mass deportation by any means'],short:'ICE'},
 {id:'vaccines',name:'Vaccines and public health',load:0.9,sal:'health',lab:['Strengthen mandates and the CDC','Keep the current system','Individual choice with guidance','Cut mandates and question vaccines','End the federal role'],short:'Vaccines'},
 {id:'aca',name:'ACA premium subsidies',load:0.9,sal:'health',lab:['Expand them permanently','Extend them','Reform and target them','Let them expire','Repeal the ACA'],short:'ACA'},
 {id:'spending',name:'Federal debt and spending',load:0.8,sal:'tax',lab:['Spend more on public needs','Accept deficits for priorities','Balance over time','Cut spending sharply','Radical cuts'],short:'Spending'},
 {id:'redistrict',name:'Redistricting',load:0.9,sal:'democ',lab:['Independent commissions everywhere','Match other states gerrymander for gerrymander','Ban mid-decade redistricting','Maximize our party\'s advantage','Redraw by any means'],short:'Redistricting'},
 {id:'trans',name:'Transgender policy',load:1.1,sal:'other',lab:['Full protections and care access','Protections with some limits','Case by case','Restrict care and sports participation','Broad federal restrictions'],short:'Trans policy'},
 {id:'drugs',name:'Marijuana and drugs',load:0.7,sal:'crime',lab:['Legalize and expunge records','Legalize nationally','Decriminalize, states decide','Keep illegal and expand treatment','Tough enforcement'],short:'Drugs'},
 {id:'iran',name:'War with Iran',load:1.0,sal:'foreign',lab:['End the war now and bring troops home','Push for a ceasefire and talks','Support limited strikes with congressional oversight','Support the war effort','Escalate until Iran capitulates'],short:'Iran war'},
 {id:'ethics',name:'Government corruption and ethics',load:0.8,sal:'democ',lab:['Ban stock trading and crypto self-dealing, enforce hard','Strengthen ethics rules and watchdogs','Mixed','Leave it to voters and the courts','Corruption claims are partisan attacks'],short:'Corruption'}
];
GM.PARTY_STANCE={D:{econ:-1,tax:-1.3,health:-1.3,immig:-1,abort:-1.7,guns:-1.3,climate:-1.5,foreign:-0.5,trade:-0.5,educ:-1,police:-1,house:-0.7,tech:-0.5,democ:-1.3,safety:-1.2,culture:-1.3,ukraine:-0.9,israel:-0.4,china:0,nato:-1.3,tariffs:-1.2,studentdebt:-0.9,minwage:-1.2,energy:-1.1,justice:-1.3,ice:-1.3,vaccines:-1.1,aca:-1.3,spending:-0.8,redistrict:-0.6,trans:-1.2,drugs:-0.9,iran:-1.2,ethics:-1.3},
 R:{econ:1,tax:1.3,health:1,immig:1.4,abort:1.2,guns:1.3,climate:1.2,foreign:0.7,trade:0.8,educ:1,police:1.2,house:0.6,tech:0.4,democ:1.0,safety:0.6,culture:1.2,ukraine:0.8,israel:1.2,china:0.9,nato:0.6,tariffs:1.0,studentdebt:1.0,minwage:1.0,energy:1.4,justice:1.0,ice:1.4,vaccines:0.8,aca:0.9,spending:1.2,redistrict:0.9,trans:1.4,drugs:0.6,iran:1.0,ethics:0.6},
 I:{econ:0,tax:0,health:0,immig:0,abort:0,guns:0,climate:0,foreign:0,trade:0,educ:0,police:0,house:0,tech:0,democ:0,safety:0,culture:0,ukraine:0,israel:0,china:0,nato:0,tariffs:0,studentdebt:0,minwage:0,energy:0,justice:0,ice:0,vaccines:0,aca:0,spending:0,redistrict:0,trans:0,drugs:0,iran:0,ethics:0}};

GM.GENDERS=['Woman','Man','Non-binary'];
GM.RACES=['White','Black','Hispanic or Latino','Asian American','Native American','Middle Eastern or North African','Multiracial'];
GM.RELIGIONS=['Evangelical Protestant','Mainline Protestant','Catholic','Jewish','Muslim','Latter-day Saint','Hindu or Buddhist','Unaffiliated','Atheist'];
GM.HEALTH=['Robust','Average','Frail'];
GM.THIRD=['Independent','Libertarian','Green'];

GM.SKILLS=[
 {id:'cha',name:'Charisma',desc:'Rallies, visits and debates win more voters.'},
 {id:'deb',name:'Debating',desc:'Debate performance and answering attacks.'},
 {id:'fund',name:'Fundraising',desc:'Dollars raised per call and donor goodwill.'},
 {id:'pol',name:'Policy depth',desc:'Policy rollouts land, fewer policy gaffes.'},
 {id:'med',name:'Media savvy',desc:'Ads and interviews work harder, fewer gaffes.'},
 {id:'org',name:'Organizing',desc:'Volunteers, field and turnout programs.'},
 {id:'cri',name:'Crisis handling',desc:'Bad events cost less and good ones pay more.'}];
GM.SKILL_BASE=3;GM.SKILL_POINTS=22;GM.SKILL_MAX=9;

/* Backgrounds: sk = skill bonuses, base = pts of margin, geo = urban(+)/rural(-) slope, fav/name = starting favorability / name ID, cred = issues you are trusted on, ev = event hooks */
GM.BACKGROUNDS=[
 {id:'veteran',name:'Military veteran',sk:{cri:1,cha:1},base:1.0,geo:-0.6,fav:3,nm:6,cred:['foreign'],ev:['vet']},
 {id:'prosecutor',name:'Prosecutor',sk:{deb:2},base:0.5,geo:0.1,fav:1,nm:6,cred:['police'],ev:['record']},
 {id:'bizowner',name:'Business owner',sk:{fund:2},base:0.6,geo:-0.2,fav:1,nm:5,cred:['econ','tax'],ev:['biz']},
 {id:'teacher',name:'Teacher',sk:{org:1,pol:1},base:0.7,geo:0.1,fav:3,nm:2,cred:['educ'],ev:[]},
 {id:'activist',name:'Community activist',sk:{org:2,cha:1},base:-0.3,geo:0.5,fav:0,nm:3,cred:[],ev:['activist'],enth:8},
 {id:'doctor',name:'Doctor or nurse',sk:{pol:1,cri:1},base:0.8,geo:0.1,fav:3,nm:2,cred:['health'],ev:[]},
 {id:'legislator',name:'State legislator',sk:{pol:2},base:0.2,geo:0,fav:0,nm:10,cred:[],ev:['record']},
 {id:'mayor',name:'Mayor or county official',sk:{cri:1,org:1},base:0.6,geo:0,fav:1,nm:12,cred:['house'],ev:['record']},
 {id:'journalist',name:'Journalist or broadcaster',sk:{med:2},base:0.2,geo:0.3,fav:0,nm:8,cred:[],ev:[]},
 {id:'farmer',name:'Farmer or rancher',sk:{org:1,cri:1},base:0.5,geo:-1.1,fav:2,nm:1,cred:['econ'],ev:[]},
 {id:'union',name:'Union organizer',sk:{org:2},base:0.4,geo:-0.3,fav:1,nm:3,cred:['econ','trade'],ev:['activist']},
 {id:'celebrity',name:'Athlete or entertainer',sk:{cha:2,med:1,pol:-1},base:0.8,geo:0.2,fav:2,nm:28,cred:[],ev:['famous']},
 {id:'clergy',name:'Clergy or faith leader',sk:{cha:1,org:1},base:0.4,geo:-0.4,fav:2,nm:3,cred:['culture'],ev:[]},
 {id:'scientist',name:'Scientist or engineer',sk:{pol:2},base:0.2,geo:0.5,fav:0,nm:1,cred:['tech','climate'],ev:[]},
 {id:'nonprofit',name:'Nonprofit executive',sk:{fund:1,org:1},base:0.3,geo:0.4,fav:1,nm:3,cred:[],ev:[]},
 {id:'operative',name:'Campaign operative',sk:{org:1,fund:1,med:1},base:0,geo:0.1,fav:-1,nm:2,cred:[],ev:['insider']},
 {id:'creator',name:'Online creator',sk:{med:2,cha:1,pol:-1},base:0.2,geo:0.3,fav:0,nm:12,cred:['tech'],ev:['famous']},
 {id:'lawyer',name:'Attorney',sk:{deb:2},base:0.3,geo:0.2,fav:0,nm:3,cred:[],ev:[]},
 {id:'smallbiz',name:'Small-town business owner',sk:{fund:1,org:1},base:0.7,geo:-0.4,fav:2,nm:3,cred:['econ'],ev:['biz']}];
GM.STRENGTHS=[
 {id:'hero',name:'Local hero',desc:'A well-known good deed at home.',base:0.8,fav:3,nm:6,sk:{}},
 {id:'orator',name:'Natural orator',desc:'Voters remember your speeches.',base:0.3,fav:1,nm:0,sk:{cha:2,deb:1}},
 {id:'fixer',name:'Crisis manager',desc:'Calm when things go wrong.',base:0.2,fav:0,nm:0,sk:{cri:2}},
 {id:'rainmaker',name:'Rainmaker',desc:'Donors pick up when you call.',base:0.2,fav:0,nm:0,sk:{fund:2},cash:1.15},
 {id:'family',name:'Famous family name',desc:'Everyone knows the name. Opponents will use it.',base:0.3,fav:0,nm:22,sk:{}},
 {id:'outsider',name:'Outsider credentials',desc:'You have never held office and voters like that.',base:0.5,fav:1,nm:0,sk:{},geo:-0.3},
 {id:'bipart',name:'Bipartisan record',desc:'You have worked across the aisle and have the bills to show it.',base:0.6,fav:2,nm:0,sk:{pol:1}},
 {id:'bilingual',name:'Bilingual',desc:'You can campaign in two languages.',base:0.4,fav:1,nm:0,sk:{cha:1},geo:0.2},
 {id:'dynasty',name:'Political dynasty',desc:'Relatives opened doors and donors. Voters notice.',base:0.2,fav:0,nm:14,sk:{fund:1,org:1}},
 {id:'selfmade',name:'Self-made story',desc:'From nothing to something, and you tell it well.',base:0.5,fav:2,nm:0,sk:{cha:1}},
 {id:'faithnet',name:'Faith community ties',desc:'Congregations turn out and volunteer for you.',base:0.4,fav:1,nm:0,sk:{org:2},geo:-0.2},
 {id:'wonk',name:'Policy wonk',desc:'You know the details better than anyone on stage.',base:0.2,fav:0,nm:0,sk:{pol:2,deb:1}},
 {id:'digital',name:'Digital native',desc:'You live online and it shows.',base:0.2,fav:0,nm:2,sk:{med:2,org:1},geo:0.2},
 {id:'cleanrec',name:'Spotless record',desc:'Nothing for opposition researchers to find.',base:0.6,fav:1,nm:0,sk:{}},
 {id:'cause',name:'Signature cause',desc:'A long fight on one issue earned you a loyal following.',base:0.3,fav:1,nm:0,sk:{org:1,cha:1}},
 {id:'bridge',name:'Coalition builder',desc:'You can bring unlikely allies to the same table.',base:0.4,fav:1,nm:0,sk:{org:1,pol:1}}];
GM.BAGGAGE=[
 {id:'bankrupt',name:'Past bankruptcy',desc:'Comes up in attack ads.',base:-0.6,fav:-1,ev:'baggage_bankrupt',sk:{}},
 {id:'dui',name:'Old DUI arrest',desc:'Resurfaces at a bad moment.',base:-0.8,fav:-2,ev:'baggage_dui',sk:{}},
 {id:'divorce',name:'Messy divorce',desc:'Court records and ex-spouse interviews.',base:-0.5,fav:-1,ev:'baggage_divorce',sk:{}},
 {id:'statements',name:'Controversial old statements',desc:'Old posts and clips will surface.',base:-0.8,fav:-1,ev:'baggage_statements',sk:{}},
 {id:'ethics',name:'Ethics complaint',desc:'Closed, but never forgotten.',base:-1.0,fav:-2,ev:'baggage_ethics',sk:{}},
 {id:'lobbying',name:'Undisclosed lobbying',desc:'Reporters are digging.',base:-0.9,fav:-1,ev:'baggage_lobby',sk:{}},
 {id:'health',name:'Health issues',desc:'Rumors about your stamina.',base:-0.4,fav:0,ev:'baggage_health',sk:{cri:-1}},
 {id:'relative',name:'Unpopular relative',desc:'A family member is a political liability.',base:-0.5,fav:-1,ev:'baggage_relative',sk:{}},
 {id:'affair',name:'Past affair',desc:'Someone always knows someone who talks.',base:-0.7,fav:-1.5,ev:'baggage_affair',sk:{}},
 {id:'taxes',name:'Unpaid taxes',desc:'A lien from years ago is public record.',base:-0.8,fav:-1.5,ev:'baggage_taxes',sk:{}},
 {id:'flipflop',name:'Flip-flopper reputation',desc:'Your old positions do not match your new ones.',base:-0.6,fav:-1,ev:'baggage_flip',sk:{}},
 {id:'temper',name:'Bad temper',desc:'You have snapped at staff and reporters before.',base:-0.4,fav:-1,ev:'baggage_temper',sk:{cha:-1}},
 {id:'plagiar',name:'Plagiarism accusation',desc:'A speech or paper has been called a copy.',base:-0.6,fav:-1,ev:'baggage_plag',sk:{}},
 {id:'novote',name:'Spotty voting record',desc:'You skipped elections you now ask others to vote in.',base:-0.4,fav:-0.5,ev:'baggage_novote',sk:{}},
 {id:'trades',name:'Suspicious stock trades',desc:'Timing that looks too good.',base:-0.9,fav:-1.5,ev:'baggage_trades',sk:{}},
 {id:'resume',name:'Padded résumé',desc:'Parts of your bio will not survive fact-checking.',base:-0.7,fav:-1,ev:'baggage_resume',sk:{}},
 {id:'donorties',name:'Embarrassing donor',desc:'A big backer is now toxic.',base:-0.6,fav:-1,ev:'baggage_donor',sk:{fund:1}}];
GM.TIERS=['Community or regional college','State flagship university','Elite university'];
GM.DEGREES=[
 {id:'hs',name:'High school diploma',yrs:0,sk:{}},
 {id:'some',name:'Some college',yrs:1,sk:{}},
 {id:'ba',name:'Bachelor’s degree',yrs:4,sk:{pol:1}},
 {id:'ma',name:'Master’s (MA, MBA, MPA)',yrs:6,sk:{pol:2}},
 {id:'jd',name:'Law degree (JD)',yrs:7,sk:{deb:1,pol:1}},
 {id:'md',name:'Medical degree (MD)',yrs:8,sk:{pol:1,cri:1}},
 {id:'phd',name:'Doctorate (PhD)',yrs:9,sk:{pol:2}}];

GM.OFFICES={
 house:{name:'U.S. House',weeks:10,scale:1,minAge:0,staffCap:1},
 gov:{name:'Governor',weeks:12,scale:4,minAge:0,staffCap:1},
 sen:{name:'U.S. Senate',weeks:12,scale:5,minAge:0,staffCap:1},
 pres:{name:'President',weeks:14,scale:25,minAge:0,staffCap:1}};

GM.ROLES=[
 {id:'mgr',name:'Campaign manager',desc:'Runs the operation. Adds staff capacity and lifts every action a little.',cap:3},
 {id:'comm',name:'Communications director',desc:'Makes ads, press and rapid response work harder.',cap:2},
 {id:'poll',name:'Pollster',desc:'Sharper internal polls and early warning on trends.',cap:2},
 {id:'field',name:'Field director',desc:'Volunteers, canvassing and turnout programs.',cap:2},
 {id:'fin',name:'Finance director',desc:'Bigger fundraising calls and donor goodwill.',cap:2},
 {id:'policy',name:'Policy advisor',desc:'Policy rollouts and debate prep land better.',cap:2}];
GM.QUIRKS=[
 {id:'leaker',name:'Leaker',desc:'Sometimes talks to reporters.'},
 {id:'hothead',name:'Hothead',desc:'Fast and effective, but picks fights in public.'},
 {id:'loyal',name:'Loyalist',desc:'Will stay through bad weeks.'},
 {id:'merc',name:'Mercenary',desc:'Quits quickly if the campaign looks like it is losing.'},
 {id:'worker',name:'Workaholic',desc:'Adds an extra staff point each week.'},
 {id:'fixer',name:'Fixer',desc:'Cuts the damage from bad events.'},
 {id:'data',name:'Data nerd',desc:'More accurate polling.'},
 {id:'none',name:'No quirks',desc:''}];

GM.FIRST=['Ana','Marcus','Priya','Daniel','Keisha','Tomás','Grace','Isaiah','Mei','Connor','Fatima','Walter','Lucia','Andre','Hannah','Rafael','Nora','Terrence','Elena','Caleb','Yusuf','Brianna','Gordon','Imani','Luke','Soo-jin','Dwight','Marisol','Owen','Tamika','Victor','Annika','Jerome','Paloma','Hugh','Delia','Samir','Colleen','Rene','Darius'];
GM.LAST=['Okafor','Brennan','Castellano','Whitfield','Nguyen','Alvarado','Prescott','Hargrove','Sandoval','Kowalski','Abernathy','Lindqvist','Delacroix','Boone','Farrow','Ibarra','Montague','Teller','Voss','Yamada','Ellison','Rourke','Salazar','Thibodeaux','Wainwright','Quinlan','Mbeki','Garrity','Halvorsen','Pruitt','Santiago','Cho','Duvall','Ferris','Okoye','Lundgren','Mercer','Tran','Beaumont','Rosales'];
GM.OPP_ARCH=[
 {id:'ads',name:'Ad blitz',desc:'Buys airtime early and often.',w:{tv:4,digital:2,fund:3,attack:1,rally:0.5,visit:0.5,field:0.5}},
 {id:'retail',name:'Retail grinder',desc:'Lives at diners, fairs and town halls.',w:{visit:4,rally:2,press:2,fund:1,tv:1,field:1}},
 {id:'attack',name:'Attack dog',desc:'Goes negative early and stays there.',w:{attack:4,oppo:3,tv:2,press:2,fund:1,rally:1}},
 {id:'estab',name:'Establishment favorite',desc:'Big donors, big endorsements, safe messaging.',w:{fund:4,endorse:3,tv:2,digital:1,press:1,visit:0.5}},
 {id:'ground',name:'Ground-game operator',desc:'Wins on volunteers and turnout.',w:{field:4,gotv:3,visit:2,rally:1,fund:1.5,tv:0.5}},
 {id:'pop',name:'Populist firebrand',desc:'Rallies, fights and viral moments.',w:{rally:4,press:3,digital:2,attack:1.5,fund:1,tv:0.5}}];
GM.OPP_WEAK=[
 {id:'gaffe',name:'Gaffe-prone',desc:'Says the wrong thing under pressure.'},
 {id:'cash',name:'Weak fundraiser',desc:'Donors are lukewarm.'},
 {id:'thin',name:'Thin record',desc:'Little to point to, little to attack.'},
 {id:'scandal',name:'Scandal-prone',desc:'Something is waiting to be found.'},
 {id:'bland',name:'Low charisma',desc:'Rallies and debates fall flat.'},
 {id:'over',name:'Overconfident',desc:'Ignores the ground game until late.'}];
