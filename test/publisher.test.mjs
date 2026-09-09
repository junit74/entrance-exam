import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { publishOnce } from '../scripts/publish.mjs';
const exec = promisify(execFile);
const git = async (cwd, ...args) => (await exec('git', args, {cwd})).stdout.trim();

test('local publisher pushes only collected data, incorporates remote changes, and preserves unexpected files', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'pages-publisher-'));
  try {
    const remote=path.join(dir,'remote.git'), seed=path.join(dir,'seed'), workspace=path.join(dir,'publisher');
    await git(dir,'init','--bare','--initial-branch=main',remote);
    await mkdir(seed); await git(seed,'init','-b','main');
    await git(seed,'config','user.name','Test');await git(seed,'config','user.email','test@example.invalid');
    await mkdir(path.join(seed,'data'));await writeFile(path.join(seed,'data','latest.json'),'{}');
    await writeFile(path.join(seed,'app.js'),'original app');
    await git(seed,'add','.');await git(seed,'commit','-m','seed');
    await git(seed,'remote','add','origin',remote);await git(seed,'push','-u','origin','main');
    let count=0;
    const collector=async ({dir:data})=>{
      count++;
      const result={schools:[{outcome:count===1?'updated':'error',snapshot:{ratio:3}}],count};
      await writeFile(path.join(data,'latest.json'),JSON.stringify(result));
      return result;
    };
    await publishOnce({workspace,remote,collector});
    assert.equal(JSON.parse(await git(dir,'--git-dir',remote,'show','main:data/latest.json')).count,1);
    assert.equal(await readFile(path.join(seed,'data','latest.json'),'utf8'),'{}','user checkout was not changed');
    await git(seed,'pull','--ff-only');
    await writeFile(path.join(seed,'app.js'),'remote app update');
    await git(seed,'add','app.js');await git(seed,'commit','-m','app update');await git(seed,'push');
    await publishOnce({workspace,remote,collector});
    assert.equal(await git(dir,'--git-dir',remote,'show','main:app.js'),'remote app update');
    const published=JSON.parse(await git(dir,'--git-dir',remote,'show','main:data/latest.json'));
    assert.equal(published.count,2);assert.equal(published.schools[0].outcome,'error');
    await writeFile(path.join(workspace,'private.txt'),'keep this local');
    await assert.rejects(()=>publishOnce({workspace,remote,collector}),/미완료 변경/);
    assert.equal(await readFile(path.join(workspace,'private.txt'),'utf8'),'keep this local');
    await assert.rejects(()=>git(dir,'--git-dir',remote,'show','main:private.txt'));
  } finally { await rm(dir,{recursive:true,force:true}); }
});
