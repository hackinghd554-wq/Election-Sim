// Regenerates data/geo.js (state outlines, county outlines, label positions, county centroids) from the us-atlas package.
// Needs: npm i us-atlas topojson-client polylabel    Run: node tools/gen_geo.js
const fs=require('fs');const pl=require('polylabel');const PL=pl.default||pl;const tc=require('topojson-client');
const fips={AL:'01',AK:'02',AZ:'04',AR:'05',CA:'06',CO:'08',CT:'09',DE:'10',DC:'11',FL:'12',GA:'13',HI:'15',ID:'16',IL:'17',IN:'18',IA:'19',KS:'20',KY:'21',LA:'22',ME:'23',MD:'24',MA:'25',MI:'26',MN:'27',MS:'28',MO:'29',MT:'30',NE:'31',NV:'32',NH:'33',NJ:'34',NM:'35',NY:'36',NC:'37',ND:'38',OH:'39',OK:'40',OR:'41',PA:'42',RI:'44',SC:'45',SD:'46',TN:'47',TX:'48',UT:'49',VT:'50',VA:'51',WA:'53',WV:'54',WI:'55',WY:'56'};
const F2A={};for(const a in fips)F2A[fips[a]]=a;
function rings(g){const out=[];if(g.type==='Polygon')out.push(...g.coordinates);else if(g.type==='MultiPolygon')for(const p of g.coordinates)out.push(...p);return out;}
function simp(r,tol){const o=[r[0]];for(let i=1;i<r.length-1;i++){const p=o[o.length-1];if(Math.hypot(r[i][0]-p[0],r[i][1]-p[1])>=tol)o.push(r[i]);}o.push(r[r.length-1]);return o;}
function area(r){let a=0;for(let i=0;i<r.length-1;i++)a+=r[i][0]*r[i+1][1]-r[i+1][0]*r[i][1];return Math.abs(a/2);}
function pathOf(rs,tx,ty,k,tol){let d='';for(const r0 of rs){if(area(r0)*k*k<0.6)continue;const r=simp(r0,tol/k);if(r.length<4)continue;d+='M'+r.map(p=>((p[0]-tx)*k).toFixed(1)+' '+((p[1]-ty)*k).toFixed(1)).join('L')+'Z';}return d;}

function pip(x,y,polys){let ins=false;for(const rg of polys)for(let i=0,j=rg.length-1;i<rg.length;j=i++){const a=rg[i],b=rg[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])ins=!ins;}return ins;}
function dseg(px,py,a,b){const dx=b[0]-a[0],dy=b[1]-a[1];const l=dx*dx+dy*dy;let t=l?((px-a[0])*dx+(py-a[1])*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(a[0]+t*dx),py-(a[1]+t*dy));}
function dist(px,py,polys){let m=1e9;for(const rg of polys)for(let i=0;i<rg.length-1;i++){const d=dseg(px,py,rg[i],rg[i+1]);if(d<m)m=d;}return m;}
function centroid(r){let a=0,cx=0,cy=0;for(let i=0;i<r.length-1;i++){const f=r[i][0]*r[i+1][1]-r[i+1][0]*r[i][1];a+=f;cx+=(r[i][0]+r[i+1][0])*f;cy+=(r[i][1]+r[i+1][1])*f;}a/=2;return a?[cx/(6*a),cy/(6*a)]:r[0];}
/* label block: a w x h rectangle placed where it fits with the most clearance, nearest the middle of the shape */
function bestBlock(poly,w,h,cen){
  const rings=poly.map(r=>simp(r,1.2));let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of rings[0]){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);}
  const step=Math.max(1.5,Math.min(x1-x0,y1-y0)/40);const cands=[];let best=-1e9;
  for(let x=x0;x<=x1;x+=step)for(let y=y0;y<=y1;y+=step){
    const pts=[[x,y],[x-w/2,y-h/2],[x+w/2,y-h/2],[x-w/2,y+h/2],[x+w/2,y+h/2],[x,y-h/2],[x,y+h/2],[x-w/2,y],[x+w/2,y]];
    if(!pts.every(p=>pip(p[0],p[1],rings)))continue;
    let sc=1e9;for(const p of pts){const d=dist(p[0],p[1],rings);if(d<sc)sc=d;}
    cands.push([x,y,sc]);if(sc>best)best=sc;}
  if(!cands.length)return null;
  const ok=cands.filter(c=>c[2]>=best*0.8);let bc=null,bd=1e9;for(const c of ok){const d=Math.hypot(c[0]-cen[0],c[1]-cen[1]);if(d<bd){bd=d;bc=c;}}
  return {x:bc[0],y:bc[1],s:bc[2]};
}
const ct=require('us-atlas/counties-albers-10m.json'),stt=require('us-atlas/states-albers-10m.json');
const cf=tc.feature(ct,ct.objects.counties).features,sf=tc.feature(stt,stt.objects.states).features;
const G={st:{},ct:{}};
for(const f of sf){const ab=F2A[f.id];if(!ab)continue;const rs=rings(f.geometry);let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const r of rs)for(const p of r){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);}
 let best=null,ba=-1;const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;for(const p of polys){const a=area(p[0]);if(a>ba){ba=a;best=p;}}
 const lp=PL(best,1.0);const cen=centroid(best[0]);const small=(lp.distance||0)<12;
 let bb=bestBlock(best,small?22:26,small?12:27,cen);const lbl=bb?[bb.x,bb.y-(small?0:6)]:[lp[0],lp[1]];
 G.st[ab]={d:pathOf(rs,0,0,1,0.5),c:[+lbl[0].toFixed(0),+lbl[1].toFixed(0)],r:+(lp.distance||0).toFixed(1),w:+(x1-x0).toFixed(0),h:+(y1-y0).toFixed(0)};}
const by={};for(const f of cf){(by[F2A[f.id.slice(0,2)]]=by[F2A[f.id.slice(0,2)]]||[]).push(f);}
for(const ab in by){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const L=by[ab].map(f=>({f,rs:rings(f.geometry)}));
 for(const o of L)for(const r of o.rs)for(const p of r){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);}
 const k=Math.min(600/(x1-x0),360/(y1-y0));const W=Math.round((x1-x0)*k),H=Math.round((y1-y0)*k);
 G.ct[ab]={w:W,h:H,s:L.map(o=>{const polys=o.f.geometry.type==='Polygon'?[o.f.geometry.coordinates]:o.f.geometry.coordinates;let bp=null,ba=-1;for(const p of polys){const a=area(p[0]);if(a>ba){ba=a;bp=p;}}const cc=centroid(bp[0]);return ({c:[+((cc[0]-x0)*k).toFixed(1),+((cc[1]-y0)*k).toFixed(1)],f:o.f.id,n:o.f.properties.name,a:+o.rs.reduce((s,r)=>s+area(r),0).toFixed(1),d:pathOf(o.rs,x0,y0,k,0.5)});})};}
G.st.DC.c=G.st.DC.c;
fs.writeFileSync(require('path').join(__dirname,'..','data','geo.js'),'window.GM_GEO='+JSON.stringify(G)+';');
console.log(fs.statSync('../geo.js').size);
