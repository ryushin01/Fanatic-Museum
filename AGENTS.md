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
pnpm test:e2e       # Playwright + axe, 320~1440px, 글자 200%, 키보드
pnpm lhci           # Lighthouse CI(성능 0.9, 접근성 1.0, LCP 2.5초 등)
```

## 5. 코드 스타일

- Prettier(`printWidth: 100`, `singleQuote: true`), ESLint(`eslint-plugin-jsx-a11y` strict, react-hooks).
- 버튼·검색·토글·대화상자는 React Aria Components로 만듭니다. 이전·다음 버튼은 `shared/ui`의 `StepButtons` 하나를 씁니다.
- 페이지 메타는 `pageMeta()`(`shared/lib/meta.ts`)로 만듭니다. 사이트 주소가 바뀌면 `shared/config/site.ts`의 `url`과 사이트맵 `SITE_URL`을 함께 바꿉니다.
- 외부 자료의 출처는 화면이 아니라 README `## 출처`에 모읍니다. `sources.json`에 출처 종류를 더하면 README 표도 고칩니다.
- 접근성(KWCAG 2.2): 네이티브 요소 먼저, 텍스트 대비 4.5:1 이상, 모든 기능 키보드 조작과 보이는 초점(`outline: none` 단독 금지), 조작 크기 24×24px 이상, 입력칸 레이블과 오류의 `aria-invalid`·`aria-describedby` 연결, 화면 전환 없는 안내는 `role="status"`. 화면 이동 시 `RouteAnnouncer`가 제목을 알리고, 움직임 줄이기에서는 애니메이션·View Transitions를 끕니다.

## 6. Git·PR

- `main`에 직접 커밋·푸시하지 않습니다. 최신 `main`에서 `feat/…`, `fix/…`, `docs/…`, `chore/…` 브랜치를 만들어 PR을 올립니다.
- 커밋·PR 제목은 한국어 요약 뒤에 버전: `feat: 한글 초성 검색, 소장품 정렬, 작품별 공유 이미지 v1.7.0`, `fix: … v1.4.2`, `chore: 의존성 갱신(…) v1.7.2`. 문서만 바꾸면 버전 없이 `docs: …`.
- 기능·수정 PR은 `package.json` 버전, README 버전 배지, `CHANGELOG.md`(표 형식: 버전·날짜 `2026.11.20.`·내용)를 함께 올립니다. 여러 Dependabot PR은 하나로 묶어 올립니다.
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

## 9. 공통 규칙

공통 규칙은 `~/Documents/GitHub/CLAUDE.md`에 있습니다(이 파일과 충돌하면 이 파일이 우선). 요점:

- 답변·커밋·PR·문서는 한국어로 씁니다.
- 허락을 묻지 않고 끝까지 진행한 뒤 결과를 한 번에 보고합니다. 비용·비밀값·디자인 결정·되돌릴 수 없는 공개 행동은 하지 않고 보고합니다.
- 사용자의 진행 중인 작업을 보호합니다. 로컬 변경이 있으면 `git worktree add /tmp/<이름> -b <브랜치> origin/main`에서 작업하고 끝나면 지웁니다.
- 다른 세션에 공지할 때는 ryushin01 그룹 세션에만 보냅니다.
