import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {schools} from '../src/schools.mjs';
import {parseRatio} from '../src/parser.mjs';
const read=async name=>JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
const historical=await read('historical'),catalog=await read('catalog');
// Validate the reviewed catalog against fixed source samples. New live units
// remain collectable and appear as unclassified until their catalog is reviewed.
const latest={schools:await Promise.all(schools.map(async s=>({...s,snapshot:parseRatio(await readFile(new URL(`./fixtures/${s.id}.html`,import.meta.url),'utf8'),s)})))};
const totals={kyonggi:{2026:[239,8193],2025:[239,7773],2024:[167,3483]},suwon:{2026:[441,7568],2025:[455,6008],2024:[450,6215]},koreatech:{2026:[150,2686],2025:[173,2114],2024:[170,2192]},tukorea:{2026:[280,3410],2025:[290,2790],2024:[295,2463]},gachon:{2026:[1009,41940],2025:[1012,44042],2024:[964,33868]},sahmyook:{2026:[154,7962],2025:[127,5380],2024:[134,5663]}};
test('historical rows reconcile against published year totals and preserve reserve ranks',()=>{
 for(const [school,years] of Object.entries(totals))for(const [year,expected] of Object.entries(years)){
  const entry=historical.schools[school][year],rows=entry.rows;
  assert.ok(entry.sourceUrl.startsWith('https://'));
  assert.deepEqual(rows.reduce((t,r)=>[t[0]+r.seats,t[1]+r.applicants],[0,0]),expected,`${school} ${year}`);
  assert.equal(new Set(rows.map(r=>`${r.campus||''}|${r.name}`)).size,rows.length);
  for(const row of rows){
   assert.ok(Number.isInteger(row.seats)&&row.seats>0);
   assert.ok(Number.isInteger(row.applicants)&&row.applicants>=0);
   assert.ok(Math.abs(row.ratio-row.applicants/row.seats)<(school==='tukorea'?.051:.011),`${school} ${year} ${row.name}`);
   assert.ok(row.reserveRank===null||(Number.isInteger(row.reserveRank)&&row.reserveRank>=0));
   assert.equal(row.additionalAdmissions,undefined,'Do not relabel reserve ranks as admission counts');
  }
 }
});
test('all collected essay units have reviewed categories; school minimums include specific exceptions',()=>{
 for(const s of latest.schools){
  assert.ok(catalog.schools[s.id].minimum.sourceUrl);
  for(const r of s.snapshot.rows)assert.ok(catalog.units[r.id]?.category,`${s.id} ${r.name}`);
 }
 const find=(school,name)=>latest.schools.find(s=>s.id===school).snapshot.rows.find(r=>r.name===name).id;
 assert.equal(catalog.units[find('gachon','화학과')].category,'natural');
 assert.equal(catalog.units[find('gachon','화공생명배터리공학부')].category,'engineering');
 assert.match(catalog.units[find('gachon','바이오로직스학과')].minimumText,/2개 영역/);
 assert.match(catalog.units[find('sahmyook','약학과')].minimumText,/3개 영역/);
});

test('historical name links resolve uniquely within the school and include official evidence',()=>{
 for(const school of latest.schools)for(const current of school.snapshot.rows){
  const unit=catalog.units[current.id];
  for(const [year,name] of Object.entries(unit.historicalNames||{})){
   const matches=historical.schools[school.id][year].rows.filter(row=>row.name.replace(/\s/g,'')===name.replace(/\s/g,'')&&(!row.campus||row.campus===current.campus));
   assert.equal(matches.length,1,`${school.id} ${current.name} ${year}: ambiguous or missing historical unit`);
   assert.match(unit.historicalNameSources?.[year]||'',/^https:\/\//,`${school.id} ${current.name} ${year}: source required`);
  }
 }
});

test('added university history retains track/campus identities and published counts',()=>{
 const expected={kangnam:{2026:[359,3061]},caudavinci:{2024:[52,672],2025:[48,549],2026:[48,512]},hanshin:{2024:[168,833],2025:[265,1198],2026:[261,1537]},inha:{2024:[459,20345],2025:[458,16923],2026:[457,13361]},yonseim:{2024:[251,6028],2025:[227,3599],2026:[240,3424]},ajou:{2024:[158,13667],2025:[178,16357],2026:[173,14111]},kau:{2024:[201,5075],2025:[195,5532],2026:[198,6098]}};
 for(const [id,years] of Object.entries(expected))for(const [year,total] of Object.entries(years)){
  const rows=historical.schools[id][year].rows;
  assert.deepEqual(rows.reduce((a,r)=>[a[0]+r.seats,a[1]+r.applicants],[0,0]),total,`${id} ${year}`);
  assert.equal(new Set(rows.map(r=>`${r.campus||''}|${r.track||''}|${r.name}`)).size,rows.length);
  for(const r of rows){
   assert.ok(Math.abs(r.ratio-r.applicants/r.seats)<(r.ratioPrecision===1?.051:.011),`${id} ${year} ${r.name}`);
   assert.ok(r.category&&r.category!=='unknown');
   assert.ok(!(r.reserveRank!=null&&r.additionalAdmissions!=null));
  }
 }
 for(const y of [2024,2025]){assert.equal(historical.schools.kangnam[y].rows.length,0);assert.match(historical.schools.kangnam[y].status,/미운영/);}
 for(const y of [2024,2025,2026])assert.ok(historical.schools.caudavinci[y].rows.every(r=>r.campus==='다빈치'));
 assert.ok(historical.schools.yonseim[2026].rows.filter(r=>r.name==='자율융합계열').length===2);
 assert.equal(historical.schools.kau[2026].rows.find(r=>r.name==='공과대학').additionalAdmissions,14);
 assert.equal(historical.schools.inha[2026].rows.find(r=>r.name==='전기전자공학부').reserveRank,11);
 assert.equal(historical.schools.caudavinci[2026].rows.find(r=>r.name==='첨단소재공학과').admissionText,'충원율 14.3%');
});

test('added schools distinguish natural sciences from engineering and aptitude labels',()=>{
 const category=(id,name)=>catalog.units[latest.schools.find(s=>s.id===id).snapshot.rows.find(r=>r.name===name).id].category;
 assert.equal(category('inha','생명과학과'),'natural');
 assert.equal(category('inha','생명공학과'),'engineering');
 assert.equal(category('caudavinci','식품공학부 · 식품영양학'),'natural');
 assert.equal(category('caudavinci','식품공학부 · 식품공학'),'engineering');
 assert.equal(category('hanshin','금융공학'),'natural');
 assert.equal(category('hanshin','AI시스템반도체학'),'engineering');
 assert.equal(category('kau','자유전공학부(이학적성)'),'mixed');
 assert.equal(category('kau','항공운항학과'),'other');
});

test('every reviewed essay unit maps to exactly one sourced 2027 exam scope',()=>{
 for(const s of latest.schools){
  const exam=catalog.schools[s.id].essayExam;
  assert.equal(exam.year,2027,s.id);
  assert.ok(exam.durationMinutes>0&&exam.durationMinutes<=180,s.id);
  assert.ok(exam.sourceUrl.startsWith('https://')&&exam.sourceUrl.includes('#page='),s.id);
  for(const group of exam.groups){assert.ok(group.subjects.length&&group.units.length&&group.format,`${s.id}: ${group.label}`);}
  for(const row of s.snapshot.rows)assert.equal(exam.groups.filter(g=>g.units.includes(row.name)).length,1,`${s.id}: ${row.name}`);
 }
});
test('exam scopes preserve track and medical exceptions independently of dashboard categories',()=>{
 const scope=(school,name)=>catalog.schools[school].essayExam.groups.find(g=>g.units.includes(name)).subjects;
 assert.ok(scope('caudavinci','예술공학부').includes('확률과 통계'),'Davinci uses general-track scope, not creative-track scope');
 assert.ok(!scope('caudavinci','예술공학부').includes('기하'));
 assert.deepEqual(scope('yonseim','소프트웨어학부'),['수학','수학Ⅰ','수학Ⅱ','미적분','기하','확률과 통계']);
 assert.ok(scope('tukorea','경영학부 경영 자율전공').includes('수학Ⅱ'));
 assert.ok(scope('inha','수학교육과').includes('미적분'));
 assert.ok(scope('kau','자유전공학부(공학적성)').includes('미적분'));
 assert.ok(!scope('kau','자유전공학부(이학적성)').includes('미적분'));
 for(const school of ['gachon','sahmyook']){
  assert.ok(scope(school,'약학과').includes('미적분'));
  assert.ok(!scope(school,'간호학과').includes('미적분'));
 }
 assert.ok(scope('ajou','의학과').includes('생명과학Ⅱ'));
 assert.ok(!scope('ajou','약학과').includes('생명과학Ⅱ'));
});
