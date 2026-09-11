export const FAVORITES_URL='https://entrance-exam-favorites.dydtjs75.chatgpt.site/api/favorites';

// Explicit add/remove operations preserve other visitors' changes. Revisions
// prevent a slow read from replacing a newer write response.
export class SharedFavorites {
 constructor({url=FAVORITES_URL,fetcher=fetch,storage,onChange=()=>{},onStatus=()=>{}}={}){
  Object.assign(this,{url,fetcher,storage,onChange,onStatus});
  this.ids=new Set();this.revision=-1;this.ready=false;this.busy=false;this.syncing=null;
  this.migrationKey=`essay-favorites-imported:${url}`;
 }
 stored(key){try{return this.storage?.getItem(key);}catch{return null;}}
 remember(key,value){try{this.storage?.setItem(key,value);}catch{/* Storage is optional; the shared database remains authoritative. */}}
 async request(path='',body){
  const r=await this.fetcher(this.url+path,{method:body?'POST':'GET',cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(12_000),...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  if(!r.ok)throw Error('공유 목록을 연결하지 못했습니다.');
  const data=await r.json();
  if(!Number.isSafeInteger(data.revision)||data.revision<0||!Array.isArray(data.ids)||data.ids.some(id=>typeof id!=='string'||!/^[a-f0-9]{16}$/.test(id)))throw Error('공유 목록 응답을 확인하지 못했습니다.');
  return data;
 }
 accept(data){
  if(data.revision<this.revision)return;
  const changed=this.revision!==data.revision||!this.ready;
  this.revision=data.revision;this.ids=new Set(data.ids);this.ready=true;
  if(changed)this.onChange(this.ids);
 }
 sync(validIds){
  if(this.busy)return Promise.resolve();
  if(this.syncing)return this.syncing;
  this.syncing=this.read(validIds).finally(()=>{this.syncing=null;});return this.syncing;
 }
 async read(validIds){
  try{
   let data=await this.request();
   if(!this.migrated&&validIds){
    if(!this.stored(this.migrationKey)){
     let legacy;try{legacy=JSON.parse(this.stored('essay-favorites')||'[]');}catch{legacy=[];}
     const ids=Array.isArray(legacy)?[...new Set(legacy.filter(id=>validIds.has(id)))]:[];
     if(ids.length)data=await this.request('/import',{ids});
     this.remember(this.migrationKey,'1');
    }
    this.migrated=true;
   }
   this.accept(data);if(!this.busy)this.onStatus('ready');
  }catch{if(!this.busy)this.onStatus('error');}
 }
 async set(id,selected){
  if(!this.ready||this.busy)return false;
  this.busy=true;this.onStatus('saving');
  try{
   this.accept(await this.request('',{id,selected}));this.onStatus('ready');return true;
  }catch{this.onStatus('error');return false;}
  finally{this.busy=false;this.onChange(this.ids);}
 }
}
