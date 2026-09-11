import { cp,mkdir,rm,readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { root,dataDir } from '../src/collect.mjs';
const dist=path.join(root,'dist');
await rm(dist,{recursive:true,force:true});await mkdir(path.join(dist,'data'),{recursive:true});
await cp(path.join(root,'public'),dist,{recursive:true});
// A changed asset must get a new URL so browsers cannot reuse an older release.
// Keep plain names too, for clients still holding the previous index.html.
let html=await readFile(path.join(dist,'index.html'),'utf8');
for(const name of ['favorites.js','style.css','app.js']) {
  const content=await readFile(path.join(dist,name));
  const hash=createHash('sha256').update(content).digest('hex').slice(0,12);
  const ext=path.extname(name),versioned=`${path.basename(name,ext)}.${hash}${ext}`;
  await writeFile(path.join(dist,versioned),content);
  if(name==='favorites.js'){const app=await readFile(path.join(dist,'app.js'),'utf8');await writeFile(path.join(dist,'app.js'),app.replace("'./favorites.js'",`'./${versioned}'`));}
  html=html.replaceAll(`./${name}`,`./${versioned}`);
}
await writeFile(path.join(dist,'index.html'),html);
for(const file of ['latest.json','historical.json','catalog.json','history'])await cp(path.join(dataDir,file),path.join(dist,'data',file),{recursive:true});
await writeFile(path.join(dist,'runtime.json'),JSON.stringify({mode:'pages-local',intervalMinutes:10}));
await writeFile(path.join(dist,'.nojekyll'),'');
console.log('정적 사이트 생성 완료: dist/');
