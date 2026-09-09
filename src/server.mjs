import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { root,dataDir,collect } from './collect.mjs';

const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
let running=null;
function run(){return running??=(collect().then(r=>console.log(`[수집] ${r.generatedAt}: ${r.schools.filter(s=>s.outcome==='updated').length}개 대학 갱신`)).catch(e=>console.error('[수집 실패]',e.message)).finally(()=>{running=null;}));}
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,`http://localhost:${port}`);
    const requestPath=decodeURIComponent(url.pathname);
    const headers={'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'};
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,headers);return res.end();}
    if(requestPath==='/runtime.json'){res.writeHead(200,{...headers,'Content-Type':types['.json']});return res.end(JSON.stringify({mode:'local',intervalMinutes:10}));}
    // Serve only public assets and explicitly public data. Review candidates remain private.
    const isData=requestPath.startsWith('/data/');
    const relative=isData?requestPath.slice(6):(requestPath==='/'?'index.html':requestPath.slice(1));
    if(relative.includes('..')||relative.split('/').some(p=>p.startsWith('.'))||(isData&&!/^(latest|historical|catalog)\.json$|^history\/[a-z]+\.json$/.test(relative))){res.writeHead(404,headers);return res.end('Not found');}
    const file=path.resolve(isData?dataDir:path.join(root,'public'),relative);
    const content=await readFile(file);
    res.writeHead(200,{...headers,'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:content);
  }catch(e){res.writeHead(e.code==='ENOENT'?404:500,{'Content-Type':'text/plain; charset=utf-8'});res.end(e.code==='ENOENT'?'Not found':'파일을 읽을 수 없습니다.');}
});
server.listen(port,'127.0.0.1',()=>{console.log(`대시보드: http://localhost:${port} · 10분마다 수집`);run();});
const timer=setInterval(run,600_000);
async function stop(){clearInterval(timer);server.close();await running;process.exit(0);}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
