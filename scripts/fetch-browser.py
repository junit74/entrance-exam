"""Fetch configured public Jinhak pages in one disposable browser session."""
import json
import pathlib
import sys
import time
from scrapling.fetchers import StealthySession

directory = pathlib.Path(sys.argv[1])
schools = json.loads((directory / 'requests.json').read_text(encoding='utf-8'))
results = {}

def save(name, content):
    temporary = directory / (name + '.tmp')
    temporary.write_text(content, encoding='utf-8')
    temporary.replace(directory / name)

with StealthySession(headless=False, solve_cloudflare=True, timeout=45_000, retries=1) as session:
    for index, school in enumerate(schools):
        started = time.monotonic()
        result = {'url': school['url']}
        try:
            response = session.fetch(school['url'], wait=1000)
            if response.status != 200:
                raise RuntimeError(f'원문 응답 HTTP {response.status}')
            save(school['id'] + '.html', response.body.decode('utf-8'))
            result['ok'] = True
        except Exception as error:
            result.update(ok=False, error=str(error)[:500])
        results[school['id']] = result
        # Preserve completed schools even if a later page stalls or the browser exits.
        save('results.json', json.dumps(results, ensure_ascii=False))
        print(f'[Scrapling] {school["id"]}: {"fetched" if result["ok"] else "failed"} ({time.monotonic() - started:.1f}s)', flush=True)
        if index < len(schools) - 1:
            time.sleep(2)
