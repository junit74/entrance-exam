import { mkdir, readFile, writeFile, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';

export async function readJSON(file,fallback) { try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;} }
export async function atomicJSON(file,value) {
  await mkdir(path.dirname(file),{recursive:true});
  const tmp=`${file}.${process.pid}.tmp`;
  await writeFile(tmp,JSON.stringify(value,null,2)+'\n');await rename(tmp,file);
}
export async function withLock(dir,fn) {
  await mkdir(dir,{recursive:true});const lock=path.join(dir,'.collect.lock');
  try{await mkdir(lock);}catch(e){
    if(e.code!=='EEXIST')throw e;
    // Every HTTP call has a timeout; a lock older than 15 minutes is abandoned.
    if(Date.now()-(await stat(lock)).mtimeMs<15*60_000)throw Error('다른 수집 작업이 실행 중입니다.');
    await rm(lock,{recursive:true,force:true});await mkdir(lock);
  }
  try{return await fn();}finally{await rm(lock,{recursive:true,force:true});}
}
export async function saveSnapshot(dir,school,snapshot,checkedAt) {
  const file=path.join(dir,'history',`${school.id}.json`);
  const archive=await readJSON(file,{schemaVersion:1,schoolId:school.id,year:school.year,snapshots:[]});
  const previous=archive.snapshots.at(-1);
  let outcome='unchanged';
  if(snapshot.sourceAt && Date.parse(snapshot.sourceAt)>Date.parse(checkedAt)+5*60_000)throw Error('원문 기준 일시가 현재보다 미래입니다.');
  if(previous && snapshot.year!==archive.year)throw Error('저장된 학년도 불일치');
  if(previous?.isFinal && !snapshot.isFinal)outcome='older';
  else if(previous && !snapshot.sourceAt && (snapshot.contentHash!==previous.contentHash||snapshot.isFinal!==previous.isFinal)) {
    await atomicJSON(path.join(dir,'review',`${school.id}.json`),{reason:'원문 발표 일시가 없는 변경: 기존 자료 유지',checkedAt,candidate:snapshot});
    outcome='review';
  } else if(!previous||Date.parse(snapshot.sourceAt)>Date.parse(previous.sourceAt)) {
    archive.snapshots.push({...snapshot,collectedAt:checkedAt});
    await atomicJSON(file,archive);outcome='updated';
  } else if(snapshot.sourceAt===previous.sourceAt && (snapshot.contentHash!==previous.contentHash||snapshot.isFinal!==previous.isFinal)) {
    // Preserve the complete candidate for inspection without inventing a publication time.
    await atomicJSON(path.join(dir,'review',`${school.id}.json`),{reason:'동일 기준 일시의 원문 변경',checkedAt,candidate:snapshot});
    outcome='review';
  } else if(Date.parse(snapshot.sourceAt)<Date.parse(previous.sourceAt))outcome='older';
  const before=archive.snapshots.at(-2);
  return {outcome,snapshot:archive.snapshots.at(-1),previousSourceAt:before?.sourceAt??null,previousApplicants:before?Object.fromEntries(before.rows.map(r=>[r.id,r.applicants])):{}};
}
