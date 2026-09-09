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
