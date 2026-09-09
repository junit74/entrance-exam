import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { schools } from './schools.mjs';
import { parseRatio } from './parser.mjs';
import { readJSON,atomicJSON,withLock,saveSnapshot } from './store.mjs';

export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const dataDir=path.resolve(process.env.DATA_DIR||path.join(root,'data'));
export async function fetchHTML(url) {
  const response=await fetch(url,{signal:AbortSignal.timeout(25_000),headers:{'User-Agent':'EssayAdmissionsDashboard/1.0 (public admissions statistics)','Accept':'text/html'}});
  if(!response.ok)throw Error(`원문 응답 HTTP ${response.status}`);
  const bytes=new Uint8Array(await response.arrayBuffer());
  const head=new TextDecoder('ascii').decode(bytes.slice(0,2000));
  const charset=/charset\s*=\s*["']?(euc-kr|ks_c_5601-1987|cp949)/i.test((response.headers.get('content-type')||'')+' '+head)?'euc-kr':'utf-8';
  return new TextDecoder(charset).decode(bytes);
}
export async function collect({dir=dataDir,fetcher=fetchHTML}={}) {
  return withLock(dir,async()=>{
    const latest=await readJSON(path.join(dir,'latest.json'),{schemaVersion:1,year:2027,schools:[]});
    const results=await Promise.all(schools.map(async school=>{
      const prior=latest.schools.find(s=>s.id===school.id);
      const checkedAt=new Date().toISOString();
      try {
        const snapshot=parseRatio(await fetcher(school.url),school,{allowUndatedFinal:true});
        const saved=await saveSnapshot(dir,school,snapshot,checkedAt);
        return {...school,...saved,lastCheckedAt:checkedAt,lastSuccessfulCheckAt:checkedAt,error:null};
      }catch(e){
        // Recover from history if interrupted between an archive write and the index write.
        const archive=await readJSON(path.join(dir,'history',`${school.id}.json`),null);
        return {...school,snapshot:archive?.snapshots.at(-1)||prior?.snapshot||null,previousApplicants:prior?.previousApplicants||{},previousSourceAt:prior?.previousSourceAt??null,lastCheckedAt:checkedAt,lastSuccessfulCheckAt:prior?.lastSuccessfulCheckAt||null,outcome:'error',error:e.message};
      }
    }));
    const value={schemaVersion:1,year:2027,generatedAt:new Date().toISOString(),schools:results};
    await atomicJSON(path.join(dir,'latest.json'),value);
    return value;
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try{
    const result=await collect();
    for(const s of result.schools)console.log(`${s.name}: ${s.outcome}${s.error?' · '+s.error:' · '+s.snapshot.sourceAt}`);
    if(result.schools.some(s=>s.outcome==='error'||s.outcome==='review'))process.exitCode=1;
  }catch(e){console.error(e.message);process.exitCode=1;}
}
