import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collect, fetchHTML, root, dataDir } from '../src/collect.mjs';
import { schools } from '../src/schools.mjs';

// Bound the entire browser batch, including any challenge that outlives navigation timeout.
export function runWorker(command, args, { timeoutMs = 300_000 } = {}) {
  return new Promise(resolve => {
    const grouped = process.platform !== 'win32';
    const child = spawn(command, args, { detached: grouped, stdio: ['ignore', 'pipe', 'pipe'] });
    let timedOut = false, stderr = '', forceTimer;
    const kill = signal => {
      try { process.kill(grouped ? -child.pid : child.pid, signal); }
      catch (e) { if (e.code !== 'ESRCH') console.error('[브라우저 종료]', e.message); }
    };
    child.stdout.on('data', chunk => process.stdout.write(chunk));
    child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-2000); });
    const timer = setTimeout(() => {
      timedOut = true;
      kill('SIGTERM');
      forceTimer = setTimeout(() => kill('SIGKILL'), 5000);
    }, timeoutMs);
    const finish = result => { clearTimeout(timer); clearTimeout(forceTimer); resolve(result); };
    child.once('error', e => finish({ error: `브라우저 실행 실패: ${e.message}` }));
    child.once('close', code => finish({ error: timedOut ? '브라우저 수집 제한 시간 초과'
      : code === 0 ? null : `브라우저 종료 (${code}): ${stderr.trim().slice(-600)}` }));
  });
}

async function runBrowser({ directory }) {
  return runWorker(process.env.PYTHON || 'python3', [path.join(root, 'scripts/fetch-browser.py'), directory]);
}

export async function collectWithBrowser({ dir = dataDir, browser = runBrowser, httpFetcher = fetchHTML } = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'admissions-browser-'));
  const targets = schools.filter(s => s.provider === 'jinhak');
  try {
    await writeFile(path.join(directory, 'requests.json'), JSON.stringify(targets.map(({ id, url }) => ({ id, url }))));
    let failure = null;
    try { failure = (await browser({ directory, targets }))?.error; }
    catch (e) { failure = e.message; }
    let manifest = {};
    try { manifest = JSON.parse(await readFile(path.join(directory, 'results.json'), 'utf8')); }
    catch (e) { failure ||= `브라우저 수집 결과를 읽을 수 없습니다: ${e.message}`; }
    // Keep successful pages from a partial batch. Missing/failed pages never reuse a prior HTML file.
    return await collect({ dir, fetcher: async url => {
      const school = targets.find(s => s.url === url);
      if (!school) return httpFetcher(url);
      const result = manifest[school.id];
      if (result?.url !== url || !result.ok) throw Error(result?.error || failure || '브라우저 수집 결과 없음');
      return readFile(path.join(directory, `${school.id}.html`), 'utf8');
    } });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await collectWithBrowser();
    for (const s of result.schools) console.log(`${s.name}: ${s.outcome} · ${s.error || s.snapshot?.sourceAt}`);
    const failures = result.schools.filter(s => s.error || s.outcome === 'review');
    console.log(`[전체 수집] ${result.generatedAt} · ${result.schools.length - failures.length}/${result.schools.length}개 대학 정상`);
    if (failures.length) process.exitCode = 1;
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
