import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { root, collect } from '../src/collect.mjs';
import { withLock } from '../src/store.mjs';

const exec = promisify(execFile);
const git = async (args, cwd) => (await exec('git', args, { cwd, timeout: 90_000, maxBuffer: 2_000_000 })).stdout.trim();

// Only this disposable checkout is changed; the user's working tree is untouched.
export async function publishOnce({ workspace, remote, branch = 'main', collector = collect }) {
  return withLock(`${workspace}-control`, async () => {
    let exists = true;
    try { await stat(path.join(workspace, '.git')); }
    catch (e) { if (e.code !== 'ENOENT') throw e; exists = false; }
    if (!exists) {
      await mkdir(path.dirname(workspace), { recursive: true });
      await git(['clone', '--single-branch', '--branch', branch, remote, workspace], path.dirname(workspace));
    }
    if (await git(['remote', 'get-url', 'origin'], workspace) !== remote) throw Error('게시용 저장소의 원격 주소가 다릅니다.');
    if (await git(['status', '--porcelain'], workspace)) throw Error('게시용 작업 폴더에 미완료 변경이 있습니다. 보존된 파일을 확인해 주세요.');
    await git(['pull', '--ff-only', 'origin', branch], workspace);
    const result = await collector({ dir: path.join(workspace, 'data') });
    await git(['add', '--', 'data'], workspace);
    if (await git(['diff', '--cached', '--name-only'], workspace)) {
      await git(['-c', 'user.name=Admissions publisher', '-c', 'user.email=junit74@users.noreply.github.com', 'commit', '-m', 'Update admissions snapshots from local collector'], workspace);
    }
    // Also retries a previously committed push after a temporary network failure.
    await git(['push', 'origin', `HEAD:${branch}`], workspace);
    return result;
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const remote = process.env.PUBLISH_REMOTE || await git(['remote', 'get-url', 'origin'], root);
  const workspace = path.resolve(process.env.PUBLISH_WORKSPACE || path.join(root, 'tmp', 'pages-publisher'));
  const watch = process.argv.includes('--watch');
  let stopping = false, timer;
  const stop = () => { stopping = true; clearTimeout(timer); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  const run = async () => {
    try {
      const result = await publishOnce({ workspace, remote });
      const failures = result.schools.filter(s => ['error', 'review'].includes(s.outcome));
      console.log(`[게시] ${result.generatedAt} · ${result.schools.length - failures.length}/${result.schools.length}개 대학 확인 정상 · GitHub에 반영`);
      for (const s of failures) console.error(`${s.name}: ${s.error || s.outcome}`);
      if (failures.length && !watch) process.exitCode = 1;
    } catch (e) {
      console.error('[게시 실패]', e.message);
      if (!watch) process.exitCode = 1;
    }
    if (watch && !stopping) timer = setTimeout(run, 600_000);
  };
  await run();
}
