import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile,mkdtemp,rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {load} from 'cheerio';
import {schools} from '../src/schools.mjs';
import {parseRatio,parseSourceTime} from '../src/parser.mjs';
import {saveSnapshot,readJSON,withLock} from '../src/store.mjs';
import {collect} from '../src/collect.mjs';
const fixtures=new Map(await Promise.all(schools.map(async s=>[s.id,await readFile(new URL(`./fixtures/${s.id}.html`,import.meta.url),'utf8')])));
const expected={kyonggi:[4,239],suwon:[19,434],koreatech:[17,150],tukorea:[6,200],gachon:[47,1036],sahmyook:[22,277],kangnam:[16,309],caudavinci:[7,48],hanshin:[23,231],inha:[48,457],yonseim:[7,182],ajou:[18,182],kau:[8,198],kusejong:[29,308],hongiksejong:[13,195]};
for(const school of schools)test(`${school.name}: official essay table only, expanded spans and reconciled totals`,()=>{
 const p=parseRatio(fixtures.get(school.id),school);assert.equal(p.rows.length,expected[school.id][0]);assert.equal(p.total.seats,expected[school.id][1]);assert.equal(p.year,2027);
 assert.equal(p.rows.reduce((a,r)=>a+r.applicants,0),p.total.applicants);assert.equal(p.isFinal,false);
 if(school.id==='kyonggi'){assert.deepEqual(p.rows.map(r=>r.name),['자유전공학부(수원) · 언어사회','자유전공학부(수원) · 수리','자유전공학부(서울) · 언어사회','자유전공학부(서울) · 수리']);assert.equal(p.rows[1].campus,'수원캠퍼스');assert.ok(p.rows[1].note.includes('AI컴퓨터공학부'));}
 if(school.id==='koreatech')assert.ok(p.rows.some(r=>r.name==='컴퓨터공학부 · AI·소프트웨어전공'));
});
test('Korean AM/PM, Uway and noon timestamps use Korea offset',()=>{
 assert.equal(parseSourceTime('2026-09-09 오전 12:10 현황'),'2026-09-09T00:10:00+09:00');
 assert.equal(parseSourceTime('2026-09-09 오후 12:10 현황'),'2026-09-09T12:10:00+09:00');
 assert.equal(parseSourceTime('2026년 09월 09일 13시 10분 기준'),'2026-09-09T13:10:00+09:00');
 assert.equal(parseSourceTime('최종 마감 현황'),null);
});
test('Wrong year, university, missing date and damaged totals reject a response',()=>{
 const s=schools.find(s=>s.id==='tukorea'),html=fixtures.get(s.id);
 assert.throws(()=>parseRatio(html.replace('2027학년도','2026학년도'),s),/학년도/);
 assert.throws(()=>parseRatio(html.replace(/<title>[\s\S]*?<\/title>/,'<title>다른대학교 경쟁률</title>'),s),/학교명/);
 assert.throws(()=>parseRatio(html.replace(/<p id="RatioTime"[^>]*>[^<]*<\/p>/,'<p id="RatioTime">확인 불가</p>'),s),/기준 일시/);
 assert.throws(()=>parseRatio(html.replace(/>70<\/td>/,'>71</td>'),s),/검증|합계/);
});
async function temporary(fn){const dir=await mkdtemp(path.join(os.tmpdir(),'essay-test-'));try{await fn(dir);}finally{await rm(dir,{recursive:true,force:true});}}
test('newer timestamps append; unchanged, older and corrected-at-same-time responses preserve verified history',()=>temporary(async dir=>{
 const s=schools[0],p=parseRatio(fixtures.get(s.id),s),checked='2026-09-10T00:00:00Z';
 assert.equal((await saveSnapshot(dir,s,p,checked)).outcome,'updated');
 assert.equal((await saveSnapshot(dir,s,p,checked)).outcome,'unchanged');
 assert.equal((await saveSnapshot(dir,s,{...p,sourceAt:'2026-09-08T12:00:00+09:00'},checked)).outcome,'older');
 assert.equal((await saveSnapshot(dir,s,{...p,contentHash:'corrected'},checked)).outcome,'review');
 assert.equal((await readJSON(path.join(dir,'history',s.id+'.json'))).snapshots.length,1);
 const newer={...p,sourceAt:'2026-09-09T23:00:00+09:00'};
 await saveSnapshot(dir,s,newer,checked);
 assert.equal((await readJSON(path.join(dir,'history',s.id+'.json'))).snapshots.length,2);
 assert.equal((await readJSON(path.join(dir,'review',s.id+'.json'))).candidate.contentHash,'corrected');
}));
test('partial network failure keeps a school snapshot and successful schools stay usable after restart',()=>temporary(async dir=>{
 const fetcher=async url=>fixtures.get(schools.find(s=>s.url===url).id);
 const first=await collect({dir,fetcher});assert.equal(first.schools.filter(s=>s.outcome==='updated').length,schools.length);
 const second=await collect({dir,fetcher:async url=>{if(url===schools[0].url)throw Error('network unavailable');return fetcher(url);}});
 assert.equal(second.schools[0].outcome,'error');assert.deepEqual(second.schools[0].snapshot,first.schools[0].snapshot);
 assert.equal(second.schools[1].outcome,'unchanged');
 const restored=await collect({dir,fetcher});assert.equal(restored.schools[0].outcome,'unchanged');assert.equal(restored.schools[0].error,null);
}));
test('concurrent writers are rejected by the shared lock',()=>temporary(async dir=>{
 await withLock(dir,async()=>{await assert.rejects(()=>withLock(dir,async()=>{}),/실행 중/);});
 await withLock(dir,async()=>{});
}));
test('invalid calendar dates and impossible future publication timestamps are rejected',()=>temporary(async dir=>{
 assert.throws(()=>parseSourceTime('2026-02-30 12:00'),/날짜/);
 const p=parseRatio(fixtures.get(schools[0].id),schools[0]);
 await assert.rejects(()=>saveSnapshot(dir,schools[0],p,'2026-09-08T00:00:00Z'),/미래/);
}));
test('undated final pages are retained for review without overwriting dated interim data',()=>temporary(async dir=>{
 const s=schools.find(s=>s.id==='tukorea'),html=fixtures.get(s.id),checked='2026-09-12T00:00:00Z';
 const interim=parseRatio(html,s);
 const finalHtml=html.replace(/<p id="RatioTime"[^>]*>[^<]*<\/p>/,'<p id="RatioTime">최종 마감 현황입니다.</p>');
 const final=parseRatio(finalHtml,s,{allowUndatedFinal:true});
 assert.equal(final.isFinal,true);assert.equal(final.sourceAt,null);
 await saveSnapshot(dir,s,interim,checked);
 const result=await saveSnapshot(dir,s,final,checked);
 assert.equal(result.outcome,'review');assert.equal(result.snapshot.isFinal,false);
 assert.equal((await readJSON(path.join(dir,'review',s.id+'.json'))).candidate.isFinal,true);
 const dated={...final,sourceAt:'2026-09-11T20:00:00+09:00'};
 const accepted=await saveSnapshot(dir,s,dated,checked);
 assert.equal(accepted.snapshot.isFinal,true);assert.equal(accepted.previousApplicants[interim.rows[0].id],interim.rows[0].applicants);
 assert.equal((await saveSnapshot(dir,s,{...interim,sourceAt:'2026-09-11T21:00:00+09:00'},checked)).outcome,'older');
}));

test('Davinci totals exclude Seoul only after validating the entire official essay table',()=>{
 const school=schools.find(s=>s.id==='caudavinci'),html=fixtures.get(school.id),p=parseRatio(html,school);
 assert.ok(p.rows.every(r=>r.campus==='다빈치'));
 assert.deepEqual(p.sourceTotal,{seats:403,applicants:8608});
 assert.deepEqual(p.total,{seats:48,applicants:67,ratio:1.4});
 const $=load(html),table=$('table').filter((_,t)=>$(t).find('caption').text().trim()==='논술(일반형)').first();
 // A damaged Seoul row must still reject the full source, even though Seoul is hidden.
 const cell=table.find('tr').eq(1).children('td').filter((_,td)=>/^\d+$/.test($(td).text().trim())).first();
 assert.ok(cell.length);cell.text(Number(cell.text())+1);
 assert.throws(()=>parseRatio($.html(),school),/검증|합계/);
 assert.throws(()=>parseRatio(html.replaceAll('캠퍼스','소재지'),school),/캠퍼스/);
});

test('Korea Sejong keeps regional pharmacy separate and recognizes an explicit undated Uway final',()=>temporary(async dir=>{
 const school=schools.find(s=>s.id==='kusejong');
 const current=parseRatio(fixtures.get(school.id),school);
 assert.equal(current.rows.filter(r=>r.name==='약학과').length,1);
 assert.deepEqual(current.total,{seats:308,applicants:1623,ratio:5.27});
 assert.equal(current.isFinal,false,'a future final announcement is not a final result');
 const historicalHtml=await readFile(new URL('./fixtures/kusejong-final-2026.html',import.meta.url),'utf8');
 const final=parseRatio(historicalHtml,{...school,year:2026},{allowUndatedFinal:true});
 assert.equal(final.isFinal,true);assert.equal(final.sourceAt,null);
 assert.deepEqual(final.total,{seats:318,applicants:2820,ratio:8.87});
 const checked='2026-09-12T00:00:00Z';
 await saveSnapshot(dir,school,current,checked);
 const result=await saveSnapshot(dir,school,{...final,year:2027},checked);
 assert.equal(result.outcome,'review','an undated final must not overwrite dated interim history');
 assert.equal(result.snapshot.sourceAt,current.sourceAt);
}));


test('Hongik Sejong rejects the Seoul service and preserves its full essay table',()=>{
 const school=schools.find(s=>s.id==='hongiksejong'),html=fixtures.get(school.id),p=parseRatio(html,school);
 assert.deepEqual(p.total,{seats:195,applicants:1654,ratio:8.48});
 assert.ok(p.rows.some(r=>r.name==='세종캠퍼스자율전공(인문·예능)'));
 assert.ok(!p.rows.some(r=>r.name.includes('서울')));
 assert.throws(()=>parseRatio(html.replace('수시모집(세종캠퍼스)','수시모집(서울캠퍼스)'),school),/캠퍼스/);
 assert.throws(()=>parseRatio(html.replace('id="TitleService"','id="MissingTitle"'),school),/캠퍼스/);
});
