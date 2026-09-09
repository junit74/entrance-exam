import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile, access, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const agents = path.join(os.homedir(), 'Library', 'LaunchAgents');
const logs = path.join(os.homedir(), 'Library', 'Logs', 'entrance-exam');
const domain = `gui/${process.getuid?.()}`;
const names = ['awake', 'server', 'publisher'];
const label = name => `kr.entrance-exam.${name}`;
const target = name => `${domain}/${label(name)}`;
const file = name => path.join(agents, `${label(name)}.plist`);
const launchctl = (...args) => exec('/bin/launchctl', args);
const xml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

function plist(name) {
  const args = name === 'awake' ? ['/usr/bin/caffeinate', '-i']
    : [process.execPath, path.join(root, name === 'server' ? 'src/server.mjs' : 'scripts/publish.mjs'), ...(name === 'publisher' ? ['--watch'] : [])];
  const env = { PATH: `${path.dirname(process.execPath)}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin` };
  for (const key of name === 'server' ? ['PORT', 'DATA_DIR'] : name === 'publisher' ? ['PUBLISH_WORKSPACE', 'PUBLISH_REMOTE'] : []) {
    if (process.env[key]) env[key] = process.env[key];
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${label(name)}</string>
  <key>ProgramArguments</key><array>${args.map(v => `<string>${xml(v)}</string>`).join('')}</array>
  <key>WorkingDirectory</key><string>${xml(root)}</string>
  <key>EnvironmentVariables</key><dict>${Object.entries(env).map(([k, v]) => `<key>${k}</key><string>${xml(v)}</string>`).join('')}</dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>ExitTimeOut</key><integer>120</integer>
  <key>StandardOutPath</key><string>${xml(path.join(logs, `${name}.log`))}</string>
  <key>StandardErrorPath</key><string>${xml(path.join(logs, `${name}.error.log`))}</string>
</dict></plist>
`;
}

async function loaded(name) {
  try { return (await launchctl('print', target(name))).stdout; }
  catch (e) { if (e.code === 113) return null; throw e; }
}

async function unload(name) {
  if (await loaded(name)) await launchctl('bootout', target(name));
}

async function start() {
  // Check every installation before starting any process.
  for (const name of names) await access(file(name));
  for (const name of names) {
    await launchctl('enable', target(name));
    if (!await loaded(name)) await launchctl('bootstrap', domain, file(name));
  }
}

async function status() {
  for (const name of names) {
    const info = await loaded(name);
    const state = info?.match(/^\s*state = (.+)$/m)?.[1];
    const pid = info?.match(/^\s*pid = (\d+)$/m)?.[1];
    console.log(`${name}: ${info ? `${state || '등록됨'}${pid ? ` (PID ${pid})` : ''}` : '중지 / 미등록'}`);
  }
  console.log(`로그: ${logs}`);
}

async function main() {
  if (process.platform !== 'darwin') throw Error('자동 재시작 서비스는 macOS 전용입니다.');
  const command = process.argv[2];
  if (!['install', 'start', 'stop', 'status', 'uninstall'].includes(command)) throw Error('사용법: node scripts/service.mjs install|start|stop|status|uninstall');
  if (command === 'install') {
    await access(path.join(root, 'node_modules', 'cheerio'));
    await mkdir(agents, { recursive: true });
    await mkdir(logs, { recursive: true });
    for (const name of [...names].reverse()) await unload(name);
    for (const name of names) {
      await writeFile(file(name), plist(name), { mode: 0o600 });
      await exec('/usr/bin/plutil', ['-lint', file(name)]);
    }
    await start();
    console.log('자동 재시작 및 로그인 시 자동 실행을 설치했습니다.');
  } else if (command === 'start') {
    await start();
  } else if (command === 'stop' || command === 'uninstall') {
    for (const name of [...names].reverse()) {
      await launchctl('disable', target(name));
      await unload(name);
      if (command === 'uninstall') await rm(file(name), { force: true });
    }
    console.log(command === 'uninstall'
      ? '서비스 설정을 제거했습니다. 다시 설치하려면 npm run service:install'
      : '자동 실행을 중지했습니다. 다시 켜려면 npm run service:start');
  }
  await status();
}

main().catch(e => { console.error(e.message); process.exitCode = 1; });
