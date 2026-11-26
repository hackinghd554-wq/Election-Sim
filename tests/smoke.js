// Browser smoke test. Needs Playwright: npm i && npx playwright install chromium. Run: node tests/smoke.js
const {chromium}=require('playwright');const path=require('path');
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:900}});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve(process.argv[2]||path.join(__dirname,'..','index.html'))+'#debug');
  await p.click('#toNight');await p.click('#go');await p.waitForTimeout(1500);
  if(await p.evaluate(()=>document.body.innerText.toLowerCase().includes('seed')))errs.push('seed visible');
  await p.click('#bNew');await p.click('#goCamp');await p.waitForTimeout(500);
  await p.click('[data-a=scen][data-v="2026"]');await p.click('[data-a=create]');await p.waitForTimeout(800);
  await p.click('[data-a=tab][data-v=pos]');
  for(let q=0;q<40;q++){const a=await p.$('[data-a=qans][data-s="1"]');if(!a)break;await a.click();await p.click('[data-a=qnext]');}
  await p.click('[data-a=tab][data-v=race]');await p.click('[data-a=office][data-v=sen]');await p.click('[data-a=pick][data-v="sen:ME"]');
  await p.click('[data-a=begin]');
  for(let w=0;w<14;w++){
    if(await p.evaluate(()=>window.__game.G.step)!=='camp')break;
    await p.click('[data-a=runweek]');
    for(let i=0;i<6;i++){const c=await p.$('[data-a=choose]:not([disabled])');if(!c)break;await c.click();const n=await p.$('[data-a=evnext]');if(n)await n.click();}
    const r=await p.$('[data-a=reportok]');if(r)await r.click();
  }
  if(await p.evaluate(()=>window.__game.G.step)!=='done')errs.push('campaign did not finish');
  await p.click('[data-a=launch]');await p.waitForTimeout(1000);
  console.log(errs.length?'FAIL '+errs.join(' | '):'smoke ok');await b.close();process.exit(errs.length?1:0);
})();
