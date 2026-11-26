// Loads the game scripts for Node tests in the same order index.html uses (no browser needed).
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
const skip=/(^|\/)(ui|game-ui)\.js$/;            // DOM scripts
const src=scripts.filter(s=>!skip.test(s)).map(s=>fs.readFileSync(path.join(root,s),'utf8')).join('\n');
const m={exports:{}};
new Function('module','require','window',src+'\n;module.exports={buildNight,GM,mulberry32};')(m,require,{});
module.exports=m.exports;
