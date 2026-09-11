import test from 'node:test';
import assert from 'node:assert/strict';
import {SharedFavorites} from '../public/favorites.js';
const A='a'.repeat(16),B='b'.repeat(16);
function service(){
 const rows=new Map();let revision=0;
 const fetcher=async(url,options)=>{
  if(options.method==='POST'){
   const body=JSON.parse(options.body);
   if(url.endsWith('/import')){for(const id of body.ids)if(!rows.has(id))rows.set(id,true);}
   else rows.set(body.id,body.selected);
   revision++;
  }
  return Response.json({revision,ids:[...rows].filter(([,v])=>v).map(([id])=>id)});
 };return {fetcher};
}
const storage=values=>({getItem:k=>values[k]??null,setItem:(k,v)=>{values[k]=v;}});
test('two visitors share changes and merge legacy lists only once without resurrecting removals',async()=>{
 const api=service(),old={'essay-favorites':JSON.stringify([A])};
 const one=new SharedFavorites({...api,storage:storage(old)}),two=new SharedFavorites({...api,storage:storage({'essay-favorites':JSON.stringify([A,B])})});
 await one.sync(new Set([A,B]));assert.deepEqual([...one.ids],[A]);
 await one.set(A,false);await two.sync(new Set([A,B]));assert.deepEqual([...two.ids],[B]);
 await one.sync(new Set([A,B]));assert.deepEqual([...one.ids],[B]);
 await two.set(B,false);await one.sync(new Set([A,B]));assert.equal(one.ids.size,0);
 assert.equal(old['essay-favorites'],JSON.stringify([A]),'keep original local list as backup');
});
test('slow reads cannot replace a newer save, and failed writes do not appear saved',async()=>{
 const api=service();let release,hold=false;
 const c=new SharedFavorites({fetcher:async(...args)=>{
  const result=await api.fetcher(...args);
  if(hold&&args[1].method==='GET')await new Promise(r=>{release=r;});
  return result;
 }});
 await c.sync();hold=true;const read=c.sync();await new Promise(r=>setImmediate(r));
 await c.set(A,true);release();await read;assert.deepEqual([...c.ids],[A]);
 c.fetcher=async()=>{throw Error('offline');};assert.equal(await c.set(A,false),false);assert.deepEqual([...c.ids],[A]);assert.equal(c.busy,false);
});
