import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm, access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { schools } from '../src/schools.mjs';
import { collectWithBrowser, runWorker } from '../scripts/collect-browser.mjs';

const fixtures = new Map(await Promise.all(schools.map(async s => [s.id, await readFile(new URL(`./fixtures/${s.id}.html`, import.meta.url), 'utf8')])));
const httpFetcher = async url => {
  const school = schools.find(s => s.url === url);
  assert.equal(school.provider, 'uway', 'Jinhak requests must use the browser results');
  return fixtures.get(school.id);
};
async function temporary(fn) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'browser-collector-test-'));
  try { await fn(dir); } finally { await rm(dir, { recursive: true, force: true }); }
}
async function completedBrowser({ directory, targets }) {
  const results = {};
  for (const school of targets) {
    await writeFile(path.join(directory, `${school.id}.html`), fixtures.get(school.id));
    results[school.id] = { ok: true, url: school.url };
  }
  await writeFile(path.join(directory, 'results.json'), JSON.stringify(results));
}

test('browser batch validates all schools and keeps prior data after partial failure or challenge HTML', () => temporary(async dir => {
  let scratch;
  const first = await collectWithBrowser({ dir, httpFetcher, browser: async options => {
    scratch = options.directory;
    await completedBrowser(options);
  } });
  assert.ok(first.schools.every(s => s.outcome === 'updated'));
  await assert.rejects(() => access(scratch), { code: 'ENOENT' });

  const next = await collectWithBrowser({ dir, httpFetcher, browser: async options => {
    await completedBrowser(options);
    const resultFile = path.join(options.directory, 'results.json');
    const results = JSON.parse(await readFile(resultFile, 'utf8'));
    delete results.suwon; // A page was never reached before the process died.
    await writeFile(resultFile, JSON.stringify(results));
    await writeFile(path.join(options.directory, 'tukorea.html'), '<html>Security check</html>');
    return { error: 'Browser timed out' };
  } });
  for (const id of ['suwon', 'tukorea']) {
    const school = next.schools.find(s => s.id === id);
    assert.equal(school.outcome, 'error');
    assert.deepEqual(school.snapshot, first.schools.find(s => s.id === id).snapshot);
  }
  assert.ok(next.schools.filter(s => !['suwon', 'tukorea'].includes(s.id)).every(s => s.outcome === 'unchanged'));
  const restored = await collectWithBrowser({ dir, httpFetcher, browser: completedBrowser });
  assert.ok(restored.schools.every(s => s.outcome === 'unchanged' && !s.error));
}));

test('browser startup failure still collects Uway and records errors without inventing Jinhak data', () => temporary(async dir => {
  const result = await collectWithBrowser({ dir, httpFetcher, browser: async () => { throw Error('Python unavailable'); } });
  assert.equal(result.schools.filter(s => s.outcome === 'updated').length, 6);
  const failed = result.schools.filter(s => s.provider === 'jinhak');
  assert.equal(failed.length, 7);
  assert.ok(failed.every(s => s.outcome === 'error' && s.snapshot === null && /Python unavailable/.test(s.error)));
}));

test('browser worker deadline terminates a stalled process and missing executable is reported', async () => {
  const result = await runWorker(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { timeoutMs: 100 });
  assert.match(result.error, /제한 시간 초과/);
  const absent = await runWorker('/no-such-admissions-python', [], { timeoutMs: 1000 });
  assert.match(absent.error, /실행 실패/);
});
