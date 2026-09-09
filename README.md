# 논술 나침반 · 2027

경기대·수원대·한국기술교육대·한국공학대·가천대·삼육대와 강남대·중앙대 다빈치·한신대·인하대·연세대 미래·아주대·한국항공대, 총 13개 대학의 논술 경쟁률을 비교하는 개인용 대시보드입니다. **같은 코드와 JSON 데이터로 로컬 서버 또는 GitHub Actions + Pages에서 실행**합니다.

**공개 대시보드: https://junit74.github.io/entrance-exam/**

GitHub Actions가 약 10분마다 13개 대학의 자료를 수집하여 이력을 저장하고 GitHub Pages에 배포합니다. 학교가 발표한 자료가 더 최신일 때만 경쟁률 이력을 갱신합니다. 공개 사이트 운영을 위해 로컬 Mac을 켜둘 필요가 없습니다.

공개 사이트는 진학어플라이 7개 대학을 Scrapling의 브라우저 세션으로, 유웨이 6개 대학을 HTTP로 수집합니다. 기존 파서로 논술 전형·학년도·표 합계·발표 시각을 검증합니다. 추가 범위와 출처는 [7개 대학 추가 검증 기록](docs/local-expansion.md)을 참고하세요.

- 2027 실제 논술 모집단위의 모집인원·지원인원·경쟁률, 학교별 발표 시각과 수집 상태
- 대학별 지역·캠퍼스 표시 및 지역명 검색, 자연과학 제외, 낮은 경쟁률 기본 정렬·공학 우선 정렬 옵션, 계열·검색 필터와 브라우저별 관심 목록
- 전체 비교의 대학별 세로 막대그래프(X축 대학·Y축 경쟁률), 대학별 화면의 경쟁률 추이 및 수집 이후 시간별 그래프, 2024~2026 최종 경쟁률
- 시간별 그래프는 수집된 시점을 같은 간격으로 연결하며 누락값은 추정하지 않습니다. 툴팁에서 실제 발표 시각과 모집·지원 인원을 확인합니다.
- 과거 모집·지원 인원 및 공개된 충원 인원·최종 예비번호·충원율, 2027 수능최저 조건과 예외
- 공식 출처 링크. 지원 가능 여부나 합격 가능성을 판정하지 않습니다.

## 로컬에서 실행

Node.js 22 이상이 필요합니다. GitHub 실행 환경은 Node.js 24입니다.

```sh
npm ci
npm start
```

**http://localhost:4173** 접속. 시작할 때와 이후 10분마다 학교별 경쟁률을 확인합니다. 브라우저를 닫아도 서버가 실행되는 동안 수집됩니다. 종료는 `Ctrl+C`입니다.

```sh
npm run collect  # 지금 한 번 수집
npm test         # 수집·갱신 및 데이터 검증
npm run build    # GitHub Pages용 dist/ 생성
npm run check    # 문법 검사 + 테스트 + 빌드
```

포트 변경: `PORT=4175 npm start`. 다른 저장 위치는 `DATA_DIR=/절대/경로`로 지정할 수 있습니다. 해당 경로에는 `data/catalog.json`과 `data/historical.json`도 복사해야 화면과 빌드가 동작합니다.

컴퓨터가 잠들거나 꺼지면 수집도 중단됩니다. macOS에서 실행 중 잠들지 않게 하려면 `caffeinate -i npm start`를 사용할 수 있습니다. 수집하지 못한 과거 시점을 만들어 채우지는 않습니다. 기본 바인딩은 `127.0.0.1`입니다.

## GitHub에서 실행

GitHub Actions가 Python 3.12·Scrapling 0.4.15·Chromium을 설치하고 `xvfb-run -a npm run collect:browser`로 수집합니다. 브라우저 세션은 실행마다 새로 만들며, 개인 쿠키·외부 수집 API·유료 프록시가 필요하지 않습니다. 결과는 `data/`에 커밋한 뒤 Pages로 배포합니다. 브라우저 전체 수집은 5분으로 제한하며, 일부 실패 시 이미 수집한 대학은 검증 후 처리하고 실패한 대학은 기존 정상 이력과 오류 상태를 남깁니다.

예약은 매시 03·13·23·33·43·53분입니다. 학교가 같은 시각의 자료를 유지하면 이력도 추가되지 않습니다. GitHub 예약 실행은 지연될 수 있으므로 정확히 10분 간격을 보장하지 않습니다.

### 로컬 수집으로 운영을 되돌리는 경우

`COLLECTION_MODE=local`로 설정하여 Actions 직접 수집을 끈 뒤 아래 명령을 사용합니다. 클라우드 수집과 로컬 자동 게시를 동시에 실행하지 마세요. 별도 작업 폴더에서 최신 원격 이력을 가져오고 데이터만 커밋·게시합니다. GitHub SSH 인증과 저장소 쓰기 권한이 필요합니다.

```sh
npm run publish        # 한 번 수집하고 게시
npm run publish:watch  # 시작 시와 이후 약 10분마다 수집하고 게시
```

macOS에서 잠들지 않게 실행하려면 `caffeinate -i npm run publish:watch`를 사용합니다. 종료는 `Ctrl+C`이며 컴퓨터 재시작 후에는 다시 실행해야 합니다. `npm start`는 로컬 화면용이고, 공개 사이트 자동 갱신은 `publish:watch`가 담당합니다.

### macOS 자동 재시작

계속 운영하려면 기존 `npm start`와 `publish:watch`를 `Ctrl+C`로 종료한 뒤 아래 명령으로 서비스를 설치합니다.

```sh
npm run service:install  # 최초 설치 및 즉시 시작
npm run service:status   # 서버·게시·잠자기 방지 프로세스 상태
npm run service:stop     # 모두 중지하고 로그인 시 자동 실행도 해제
npm run service:start    # 다시 시작하고 로그인 시 자동 실행 복구
npm run service:uninstall # 서비스 설정 제거 (수집 데이터와 로그 보존)
```

macOS `launchd`가 로컬 서버와 10분 주기 GitHub 게시 프로세스를 각각 감시합니다. 프로세스가 종료되면 재시작하며, 연속 종료 시 실행 간격을 10초로 제한합니다. 터미널을 닫아도 실행되고, 재부팅 후 사용자 로그인 시 자동으로 시작합니다. `caffeinate -i`도 별도 서비스로 실행하여 화면은 꺼져도 자동 잠자기는 방지합니다. 덮개를 닫거나 직접 잠자기를 선택한 경우, 전원이 꺼진 동안에는 수집할 수 없습니다.

설치 시 현재 Node 실행 경로와 프로젝트 경로를 저장합니다. 프로젝트를 이동하거나 Node 설치 경로를 바꾸면 다시 설치하세요. `PORT`, `DATA_DIR`, `PUBLISH_WORKSPACE`, `PUBLISH_REMOTE`를 지정하려면 설치 명령 앞에 설정합니다. 서비스 설치 후에는 수동 실행 명령을 중복 실행하지 마세요. 의도적으로 중지할 때는 프로세스 종료 대신 `service:stop`을 사용해야 합니다.

설정 파일은 `~/Library/LaunchAgents/kr.entrance-exam.*.plist`, 로그는 `~/Library/Logs/entrance-exam/`의 `server.log`, `publisher.log` 및 각각의 `.error.log`에 저장합니다. 프로세스 재시작은 네트워크 차단이나 Git 충돌까지 해결하지 않으므로 게시 로그도 확인해야 합니다.

게시 작업 폴더는 `tmp/pages-publisher`이며 개발 중인 작업 트리를 자동 커밋하지 않습니다. `PUBLISH_WORKSPACE`와 `PUBLISH_REMOTE`로 별도 경로·원격 주소를 지정할 수 있습니다. 게시 폴더에서 미완료 변경이나 원격 커밋 충돌을 발견하면 파일을 보존하고 중단합니다. 해당 폴더의 Git 상태를 확인한 뒤 해결해야 합니다.

저장소의 **Settings → Secrets and variables → Actions → Variables**에서 `COLLECTION_MODE=github` 또는 변수 미설정이면 Scrapling을 포함한 Actions 직접 수집이 실행됩니다. `local`이면 직접 수집과 예약 실행을 건너뛰고, 로컬에서 push한 자료만 배포합니다. macOS 자동 게시 서비스가 설치되어 있다면 Actions 모드로 전환할 때 게시 서비스를 중지해야 합니다.

다른 저장소에 배포하려면:

1. GitHub에 **공개 저장소**를 만들고 이 프로젝트를 올립니다. `data/`를 함께 올려야 합니다. `node_modules/`, `dist/`, `tmp/`는 제외되어 있습니다.
2. 저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정합니다.
3. **Actions → Collect and publish dashboard → Run workflow**를 실행합니다. 포크한 저장소라면 먼저 Actions 실행을 활성화합니다.
4. 완료되면 Pages에 표시되는 주소, 보통 `https://계정.github.io/저장소명/`에 접속합니다.

워크플로는 기본 브랜치의 변경, 수동 실행, 매시 03·13·23·33·43·53분(UTC)에 실행됩니다. 화면은 저장된 자료를 1분마다 다시 읽습니다. ‘새로 읽기’ 버튼은 저장된 결과를 읽으며 즉시 수집을 요청하지는 않습니다.

워크플로에 `contents: write`, `pages: write`, `id-token: write` 권한이 포함되어 있습니다. 조직 정책이나 브랜치 보호가 봇의 데이터 커밋을 막는 저장소라면 허용되는 전용 저장소를 사용하세요. 수집 일부가 실패해도 기존 정상 자료와 오류 상태를 배포하고, Actions 실행 결과는 실패로 표시하여 확인할 수 있게 합니다.

공개 저장소의 표준 GitHub Actions 실행과 Pages는 무료 범위에서 운영할 수 있습니다. 비공개 저장소의 무료 실행 시간과 Pages 지원 조건은 다릅니다. 예약 작업은 지연되거나 생략될 수 있고, 공개 저장소는 60일 동안 활동이 없으면 예약 작업이 비활성화될 수 있습니다. 접수 마감 후에는 Actions에서 워크플로를 비활성화해 불필요한 수집을 중지할 수 있습니다.

정책 출처: [Actions 과금](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [Pages 소개](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [예약 실행 제약](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

저장소: https://github.com/junit74/entrance-exam · 실제 Pages 배포와 모바일 접속을 확인했습니다.

## 로컬과 GitHub의 데이터

`publish:watch`는 전용 작업 폴더와 GitHub 사이의 이력을 이어서 수집합니다. 개발 작업 폴더의 `data/`와는 **자동 양방향 동기화하지 않습니다**. GitHub 이력을 개발 폴더로 가져오려면 로컬 수집 서버를 종료한 뒤 Git 변경 사항을 확인하고 `git pull`하세요. 독립적으로 수집한 JSON 파일은 임의로 덮어쓰지 말고 백업 후 병합해야 합니다.

- `data/latest.json`: 대학별 최신 검증 결과 및 확인 상태
- `data/history/*.json`: 원문 발표 시각별 2027 스냅샷
- `data/catalog.json`: 모집단위 분류, 수능최저 조건 및 공식 출처
- `data/historical.json`: 공식 자료에서 확인한 2024~2026 입시결과
- `data/review/*.json`: 자동 반영하지 않은 원문 변경 후보. Pages 배포에는 포함하지 않습니다. 공개 저장소에 커밋하면 저장소 파일 자체는 공개됩니다.

## 갱신 규칙과 해석

학교·학년도·전형·표 합계를 확인한 후 **학교가 발표한 일시가 기존 값보다 최신일 때만** 현황을 추가합니다. 조회한 시각을 학교 발표 시각으로 대체하지 않습니다. 같은 일시의 본문 변경은 검토 대상으로 보관하고, 과거 응답이나 수집 실패 때는 마지막 정상 수치를 유지합니다.

원문이 ‘최종’으로 바뀌면서 발표 일시를 없애는 경우에도 기존 중간 현황을 자동으로 덮어쓰지 않습니다. 화면에 검토 필요를 표시하고 `data/review/`에 후보를 보관합니다. 공식 발표 일시를 확인할 수 있는 자료가 생기면 출처·파서를 보완해야 합니다. 최초 수집부터 명시적인 최종 현황만 있는 경우는 발표 일시 없이 저장하며, 시간 그래프에는 넣지 않습니다. 접수 종료 시각만으로 최종 경쟁률을 추정하지 않습니다.

학교 카드와 학교 상세 상단은 논술 전체 집계이고, 비교표와 비교 그래프는 자연과학을 제외한 현재 필터의 집계입니다. 대학이 사용하는 입시 ‘자연계열’은 공학도 포함하므로 그 계열 전체를 제외하지 않습니다. 자유전공 등 혼합 모집단위는 별도 분류합니다. 새 모집단위는 분류 확인 중으로 표시됩니다.

과거 결과는 당시 실제 모집단위 그대로 보존합니다. 개편·분리·신설된 모집단위는 임의로 연결하지 않습니다. **최종 예비번호는 추가합격한 사람 수가 아닙니다.** 원문 공란·대시는 공개값 없음으로 표시하고 0으로 변환하지 않습니다. 과거 결과와 수능최저는 2026-09-09에 확인한 공식 자료이며 자동 재추출 대상은 아닙니다.

자세한 학교별 출처와 자료 범위는 [조사 기록](docs/sources.md), 요구사항은 [요구사항 문서](docs/requirements.md)를 참고하세요.
