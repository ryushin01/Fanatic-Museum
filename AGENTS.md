# AGENTS.md — Fanatic Museum

이 저장소에서 일하는 AI 에이전트(Codex, Claude Code 등)를 위한 안내입니다. 자세한 내용은 [개발 가이드](docs/development.md)에 있고, 여기에는 작업할 때 꼭 지킬 것만 모았습니다.

## 1. 프로젝트 개요

- 한 사람의 서브컬처 대장정(애니메이션·게임·라이트 노벨·판타지 소설·만화·웹툰·피규어·프라모델)을 소장품처럼 번호를 붙여 전시하는 박물관 사이트입니다.
- 화면 축: 웹 사이트 하나(공개 전시실).
- 운영: https://fanatic-museum-ryushin01.vercel.app/ · Storybook `/storybook/index.html` · 정적 API `/api/works.json`
- 작품 이미지는 저작권 때문에 저장소·배포본에 넣지 않고 관리자 컴퓨터(`~/Documents/Archive/Fanatic-Museum/`)에만 둡니다. 공개 사이트는 번호와 대표색으로 만든 자리 표시 그래픽을 보여 줍니다.
- **이미지 다운로더**(`scripts/media/`): 출처·검색 태그는 `scripts/media/sources.json`에서 작품 slug별로 정합니다. `pnpm media:download`로 받고 `pnpm media:build`로 `public/media/`에 WebP 변환본을 만듭니다. macOS LaunchAgent로 등록해 자동으로 돌립니다.
  - `pnpm media:agent install [한도GB]`(기본 200) · `pause [시간]`(기본 6시간 뒤 또는 재부팅 때 자동 재개) · `resume` · `status` · `uninstall`(완전 해제, 다시 켜지지 않음). 스크립트는 `scripts/media/launch-agent.sh`입니다.
  - 잠시 멈출 때는 `uninstall`이 아니라 `pause`를 씁니다. 보관함 위치를 바꾸면 `FANATIC_MEDIA_DIR=<새 위치> pnpm media:agent install 200`으로 다시 등록합니다.

## 2. 기술 스택과 구조

- React Router 8(프레임워크 모드, `ssr: false` + `prerender` 정적 사전 렌더링), React 19, TypeScript 7(`@typescript/native`로 `tsc`; `typescript` 패키지는 TS 6 호환판), React Aria Components, CSS Modules, Sentry·web-vitals, OpenAPI 3.1(`openapi/archive.yaml`) + openapi-typescript.
- Feature-Sliced Design: `src/app` → `pages` → `widgets` → `entities` → `shared` (위 층만 아래 층을 가져옴). `pnpm lint:fsd`(Steiger)로 검사합니다.
  - 라우트 모듈(`src/app/routes/*.tsx`)은 페이지 슬라이스를 다시 내보내기만 하고, 로더는 페이지의 `index.server.ts`에서 내보냅니다.
  - 빌드에서만 도는 코드는 `*.server.ts`로 두고 `index.server.ts`로 공개합니다(소장품 데이터 `works`가 클라이언트 번들에 실리지 않게).
- 상태 관리: 소장품 찾기의 검색 조건·결과만 MobX(`mobx`, `mobx-react-lite`)로 다룹니다. `WorkFilterStore`(`pages/works/model`)는 `observable`·`computed`, 컴포넌트는 `observer`. 스토어는 화면마다 새로 만들고 모듈 전역에 두지 않습니다(서버·요청 사이 공유 금지). 다른 상태는 억지로 옮기지 않습니다.
- 애니메이션: Motion(`motion/react`). 루트 `MotionProvider`(`src/app/motion`)가 `MotionConfig reducedMotion="user"`로 감싸고, 쓰는 부품은 `shared/motion`의 `MotionFeatures`(`LazyMotion strict` + `domMax`)로 감싸 `motion/react-m`의 `m.*`만 씁니다(`shared/ui`·`shared/lib`에 두면 모든 페이지 JS에 실림). 전시 띠 끌기(`useStripDrag`), 갤러리 크게 보기 `layoutId` 전환에 씁니다.
- 미리 그린 HTML과 다르게 그릴 값(주소의 검색 조건 등)은 하이드레이션이 끝난 뒤(`useHydrated()`)에 씁니다.

## 3. 설치·개발 명령

- Node.js 26(`.nvmrc`), pnpm 12(`packageManager`).

```bash
nvm use
corepack enable pnpm
pnpm install
pnpm dev        # http://localhost:5173
pnpm build && pnpm preview   # http://localhost:4173 (vite preview 대신 sirv)
```

- 환경 변수(`.env.example`): `VITE_SENTRY_DSN`, `VITE_RELEASE`. 다운로더용: `FANATIC_MEDIA_DIR`, `FANATIC_NOTIFY_INTERVAL`, `FANATIC_PAUSE_HOURS`.
- 그 밖의 명령: `pnpm api:types`(OpenAPI 타입 생성), `pnpm og:build`(공유 이미지), `pnpm icons:build`(앱 아이콘), `pnpm screenshots`(README 화면).

## 4. 검사·테스트 명령

CI(`.github/workflows/ci.yml`)가 도는 순서입니다. PR 전에 로컬에서 같은 순서로 돌립니다.

```bash
pnpm format:check   # Prettier
pnpm lint           # ESLint (jsx-a11y strict)
pnpm lint:fsd       # Steiger
pnpm api:check      # OpenAPI 생성 타입이 커밋된 것과 같은지
pnpm typecheck
pnpm test           # Vitest 단위·컴포넌트
pnpm build:all      # 앱 + Storybook(build/client/storybook)
pnpm size           # size-limit 예산
pnpm test:storybook # 모든 스토리를 Chromium에서 그리고 axe 검사
pnpm test:e2e       # Playwright + axe, 320~1440px, 글자 200%, 키보드, 오프라인
pnpm lhci           # Lighthouse CI(성능 0.9, 접근성 1.0, LCP 2.5초 등)
```

- **오프라인 E2E**(`e2e/offline.spec.ts`, `pnpm test:e2e`에 포함, 따로 `pnpm test:offline`): localhost 밖 요청을 모두 막고 `.env`·보관함 이미지 없이 빌드한 사이트의 모든 화면·404·주요 상태·정적 API가 내용과 함께 뜨는지, 실패한 요청이 0개인지, axe 위반이 없는지 봅니다. 운영 배포본은 `pnpm test:offline:prod`. 이미지를 받지 못하면 `useImageFailures`(`shared/lib`)로 자리 표시 그래픽·안내로 바꿉니다. 외부에서 불러오는 코드(CDN 글꼴·스크립트, 외부 이미지, 분석 도구)를 더하면 실패하므로, 꼭 필요하면 실패해도 화면이 보이게 만들고 그 주소만 허용합니다.
- **Testing Library 원칙:** 구현 세부가 아니라 사용자가 보는 동작을 검사하고, 요소는 역할·이름(`getByRole`)으로 찾습니다. 단위·컴포넌트는 Vitest + Testing Library(`@testing-library/react`, `user-event`, `jest-dom`), 화면 흐름은 Playwright E2E, 접근성은 axe(`@axe-core/playwright`, Storybook `addon-a11y`)로 검사합니다. 버그를 고치면 고치기 전에 실패하는 테스트를 함께 넣습니다.

## 5. 코드 스타일

- Prettier(`printWidth: 100`, `singleQuote: true`), ESLint(`eslint-plugin-jsx-a11y` strict, react-hooks).
- **TypeScript strict:** `tsconfig.json`에 `strict: true`. `any`·`as` 단언·`@ts-ignore`를 피하고 외부 입력은 검증합니다.
- 버튼·검색·토글·대화상자는 React Aria Components로 만듭니다. 이전·다음 버튼은 `shared/ui`의 `StepButtons` 하나를 씁니다.
- 페이지 메타는 `pageMeta()`(`shared/lib/meta.ts`)로 만듭니다. 사이트 주소가 바뀌면 `shared/config/site.ts`의 `url`과 사이트맵 `SITE_URL`을 함께 바꿉니다.
- 외부 자료의 출처는 화면이 아니라 README `## 출처`에 모읍니다. `sources.json`에 출처 종류를 더하면 README 표도 고칩니다.
- **접근성(WCAG 2.2·KWCAG 2.2):** 네이티브 요소 먼저, 텍스트 대비 4.5:1 이상, 모든 기능 키보드 조작과 보이는 초점(`outline: none` 단독 금지), 조작 크기 24×24px 이상, 입력칸 레이블과 오류의 `aria-invalid`·`aria-describedby` 연결, 화면 전환 없는 안내는 `role="status"`. 화면 이동 시 `RouteAnnouncer`가 제목을 알리고, 움직임 줄이기에서는 애니메이션·View Transitions를 끕니다. 자동 검사는 `eslint-plugin-jsx-a11y`(strict), Storybook 스토리 axe(`pnpm test:storybook`), Playwright + axe E2E, Lighthouse 접근성 1.0입니다. 자동 검사를 통과해도 키보드·초점·대체 텍스트는 직접 확인합니다.

## 6. Git·PR

- **흐름: GitHub Flow.** `main`에 직접 커밋·푸시하지 않습니다. 최신 `main`에서 브랜치를 만들어 PR로만 병합하고, PR은 목적 하나로 작게 만들어 본문에 무엇·왜·검사 결과를 적습니다.
- **브랜치 이름:** `feat/…`, `fix/…`, `refactor/…`, `docs/…`, `test/…`, `chore/…`, `release/…`.
- **커밋 메시지: Conventional Commits**(`feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `style`, `chore`, `ci`, `build`) + 한국어 요약. 예: `feat: 한글 초성 검색, 소장품 정렬, 작품별 공유 이미지 v1.7.0`, `fix: 검색 조건 주소의 하이드레이션 실패와 없는 주소의 제목·테마 문제 v1.4.2`. 표준과 다른 점: 이 저장소는 버전을 괄호 없이 `vX.Y.Z`로 끝에 붙여 왔고, 타입 없는 제목(`블리자드 게임 모음 추가: …`)도 있었습니다. 새 커밋은 타입을 꼭 붙입니다. 문서만 바꾸면 버전 없이 `docs: …`.
- 커밋 작성자는 ryushin01(`ryushin0 <141554987+ryushin01@users.noreply.github.com>`)입니다. 백엔드 저장소가 아니므로 `Co-Authored-By` 줄은 넣지 않습니다.
- GitHub Actions가 커밋하는 워크플로를 만들면 커밋 작성자를 ryushin01로 설정합니다(`github-actions[bot]` 금지).
- Dependabot PR(`.github/dependabot.yml`)은 그대로 병합하지 않고, 같은 변경을 ryushin01 커밋으로 다시 만들어 PR로 병합합니다.
- **버전: Semantic Versioning(주.부.수).** 호환이 깨지면 주, 기능은 부, 수정·작은 개선은 수를 올립니다.
  - 버전은 `package.json`의 `version`과 README 버전 배지에서 함께 맞춥니다.
- **변경 기록: Keep a Changelog를 기준으로 하되 실제 형식을 따릅니다.**
  - 표준과 다른 점: `CHANGELOG.md`는 표(버전·날짜 `2026.11.20.`·내용·비고) 형식이고 내용 칸 안에 `**분류**<br>- …`로 나눕니다. `[Unreleased]`는 쓰지 않고 버전을 올리는 PR에서 바로 그 버전 행을 더합니다.
- 병합은 squash(`제목 (#번호)`)입니다. CI가 통과하면 바로 병합하고 CodeRabbit 리뷰는 기다리지 않습니다(이미 달린 맞는 지적은 반영).

## 7. 배포·릴리스

- Vercel 프로젝트 `fanatic-museum`. `vercel.json`의 `git.deploymentEnabled`로 **`main`만 운영 배포**하고 PR 미리보기 배포는 끕니다. `buildCommand`는 `pnpm build:all`, 출력은 `build/client`.
- 보안 헤더(CSP 등)는 `vercel.json`에 있습니다. 새 외부 출처를 쓰면 CSP를 함께 고칩니다.
- 사용자가 배포일을 정해 두면 그 전에는 병합하지 않고 PR만 올려 둡니다.
- 릴리스: 병합 커밋(전체 SHA)에 태그 `vX.Y.Z`, GitHub 릴리스 제목 `vX.Y.Z`, 본문은 CHANGELOG의 해당 내용.
- 릴리스 뒤 백업 `bash ~/Documents/Archive/Backup/backup.sh`(DONE 확인), 보관함 계획 문서 `~/Documents/Obsidian Vault/Fanatic-Museum v1.0.0 고도화 계획.md`에 날짜와 진행 기록. 소개가 크게 바뀌면 프로필 저장소 `ryushin01/ryushin01` README 표를 고칩니다.

## 8. 보안·주의사항

- 비밀값과 `.env`는 커밋하지 않습니다. Sentry에는 오류 내용만 보내고 사용자 정보·쿠키·헤더·쿼리를 모으지 않습니다.
- 작품 이미지(`media/`, `public/media/`)는 저장소·배포본에 넣지 않습니다. `.vercelignore`에서 빼고, `VERCEL`·`CI` 빌드는 `build/client/media`를 지웁니다(`scripts/prune-assets.mjs`).
- 다운로드는 일반 등급만 받고 선정적 태그·성인 등급·AI 생성 작품을 거릅니다. 이 기준을 느슨하게 바꾸지 않습니다.
- 클래식체 글꼴은 수정 금지 라이선스라 서브셋·변환하지 않고 원본을 그대로 씁니다.
- 상태(CI·배포·릴리스·주소)는 명령 결과(`gh run`, `curl` 등)로 확인한 것만 말합니다.
- 먼저 묻기: 새 런타임 의존성 추가, 빌드·배포 설정(`react-router.config.ts`, `vite.config.ts`, `vercel.json`, 워크플로) 변경.
- 절대 금지: 비밀값을 `VITE_*`에 넣기(클라이언트 번들에 실림, `VITE_SENTRY_DSN`처럼 공개해도 되는 값만), `.env` 커밋, 작품 이미지 커밋, `eslint-disable`·`--no-verify`로 검사 우회, `main`에 직접 푸시.

## 9. 공통 규칙

규칙은 3계층입니다. 1층 전역(`~/.claude/CLAUDE.md`, OpenCode는 `~/.config/opencode/AGENTS.md`로 같은 파일) → 2층 ryushin01 공통(`~/Documents/GitHub/CLAUDE.md`, Claude Code만 읽음) → 3층 이 파일. 충돌하면 이 파일이 우선합니다. 2층을 읽지 못하는 도구를 위해 핵심을 아래에 요약합니다.

- 답변·커밋·PR·문서는 한국어로 씁니다.
- 허락을 묻지 않고 끝까지 진행한 뒤 결과를 한 번에 보고합니다. 비용·비밀값 생성·디자인 결정·되돌리기 어려운 일·다른 조직 저장소에 공개로 글 올리기는 진행 전에 보고하고 결정을 받습니다.
- 사용자의 진행 중인 작업을 보호합니다. 로컬에 커밋하지 않은 변경이나 원격에 없는 브랜치가 있으면 `git worktree add`로 따로 작업하고 끝나면 지웁니다.
- 기여자는 ryushin01만 남깁니다(커밋 작성자·`Co-Authored-By`·Actions·Dependabot 규칙은 6절).
- Vercel은 Hobby 요금제로 계정 전체 하루 100회 배포 한도가 있습니다. 배포가 많은 날은 버전 단위로 묶고, 한도에 걸리면 병합·릴리스까지만 하고 다음 날 반영합니다.
- 공개 데모에 실제 DB 접속 정보·유료 API 키·로컬 `.env` 값을 넣지 않고, 데모 모드가 꺼지면 원래 동작이 그대로여야 합니다.
- 병합 뒤 릴리스·백업·보관함 기록·프로필 README 갱신은 7절을 따릅니다.
- 다른 세션에 보내는 공지는 ryushin01 그룹 세션에만 보냅니다.
