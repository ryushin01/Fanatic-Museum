# 개발 가이드

## 구조 (Feature-Sliced Design)

React Router 8 프레임워크 모드의 `appDirectory`를 FSD의 `app` 계층(`src/app`)으로 둡니다.

| 계층           | 내용                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app`      | 루트 레이아웃(`root.tsx`), 라우트 설정(`routes.ts`), 라우트 모듈(`routes/`), 전역 스타일, 모니터링, `entry.client.tsx`                     |
| `src/pages`    | 홈, 소장품, 작품 상세, 카테고리, 소개, 404. 한 페이지에서만 쓰는 부품(갤러리, 크게 보기, 검색 필터, 전시 띠)은 그 페이지 슬라이스에 둡니다 |
| `src/widgets`  | 헤더, 푸터, 번호가 붙은 소장품 목록                                                                                                        |
| `src/entities` | 소장품(`work`), 카테고리(`category`) 데이터와 표지                                                                                         |
| `src/shared`   | OpenAPI 타입(`api`), 설정, 유틸리티, 공용 UI                                                                                               |

- 라우트 모듈(`src/app/routes/*.tsx`)은 페이지 슬라이스를 다시 내보내기만 합니다. 로더는 페이지의 `index.server.ts`에서 내보냅니다.
- 서버(빌드)에서만 도는 코드는 `*.server.ts`로 두고 `index.server.ts`로 공개합니다. 클라이언트 번들에 들어가지 않습니다.
- `pnpm lint:fsd`(Steiger)로 계층 규칙을 검사합니다.

## 렌더링과 배포

`ssr: false`와 `prerender`로 모든 주소를 빌드할 때 HTML로 미리 그립니다(`build/client`). 서버 없이 정적 호스팅(Vercel)에 올립니다.

- 없는 주소는 `404.html`(앱 셸)이 404 화면을 그립니다.
- 미리보기는 `pnpm preview`(sirv)로 합니다. `vite preview`는 폴더의 `index.html` 대신 루트 `index.html`을 돌려줘서 하이드레이션 오류가 납니다.

## 정적 JSON API와 OpenAPI 타입

`openapi/archive.yaml`이 API 문서이고, 화면의 데이터 타입은 이 문서에서 생성합니다.

```bash
pnpm api:types   # src/shared/api/schema.d.ts 다시 생성
pnpm api:check   # 생성 결과가 커밋된 파일과 다르면 실패 (CI)
```

| 주소                     | 내용                 |
| ------------------------ | -------------------- |
| `/api/works.json`        | 소장품 전체          |
| `/api/works/{slug}.json` | 소장품 하나          |
| `/api/categories.json`   | 카테고리와 소장품 수 |

TypeScript 7에는 JS API가 없어서 `typescript` 패키지는 TypeScript 6 호환판(`@typescript/typescript6`)으로 두고 openapi-typescript·typescript-eslint가 씁니다. 타입 검사(`tsc`)는 TypeScript 7(`@typescript/native`)이 합니다.

## 소장품 이미지

작품 이미지는 저작권자에게 권리가 있어 저장소와 배포본에 넣지 않습니다. 관리자 컴퓨터에만 보관합니다.

```bash
pnpm media:download   # 원본을 ~/Documents/Fanatic-Museum/<작품>/ 에 내려받기 (기본 200GB 한도)
pnpm media:build      # 작품별로 골라 public/media/에 WebP 변환본과 index.json 만들기
pnpm build && pnpm preview
```

- 출처와 검색 태그는 `scripts/media/sources.json`에서 작품 slug별로 정합니다. 출처 종류는 yande.re·Konachan(전체 이용가 판)·Safebooru·Steam 공식 스크린샷·교보문고 표지·네이버 웹툰(작품 포스터와 회차 썸네일, 본문 원고는 받지 않음)·pixiv(작가 사용자 ID로 공개 전체 연령 작품만, 성인 등급·AI 생성 작품 제외)입니다. 회사·시리즈 모음(`collections`: TYPE-MOON, FF7 컴필레이션)과 상품 모음(`merch-*`: 윙건담, 사이버 포뮬러, 고죠 사토루, FF7, 사에카노 피규어·프라모델 등 HobbyLink Japan 상품 사진, 성인 상품 제외)과 보드게임 모음(`boardgame-*`: 미식 배틀, 이클립스 2판, 에이언즈 엔드, 타임 스토리즈, 히어로 렐름, 테인티드 그레일, 패스파인더 ACG, 어센션, 도라스레의 기본판·확장, BoardGameGeek 갤러리 원본)은 `collections/<slug>/`에 받습니다.
- 다운로드는 일반 등급만 받고 선정적 태그를 거릅니다. 해상도·점수 하한은 없고, 이미지 게시판은 점수 높은 순서로 받다가 전체 한도(200GB)에서 멈춥니다. 출처에 `minLongEdge`·`minScore`를 주면 그 출처만 기준을 둘 수 있습니다. 이미지마다 출처 페이지를 `manifest.jsonl`에 남깁니다.
- 작가 모음(`sources.json`의 `artists`)은 `~/Documents/Fanatic-Museum/artists/<작가>/`에 받습니다. 박성우, 김형태, 미사키 쿠레히토, 쿠로야 시노부, 시라비의 작가 태그와 참여작 표지·스크린샷입니다. 다른 폴더에 이미 있는 이미지와 다른 사이트에 올라온 같은 그림(MD5가 같은 파일)은 하드 링크로 연결해 용량을 쓰지 않습니다(`pnpm media:download --only artists`로 작가 모음만 받을 수 있습니다).
- 중간에 멈춰도 다시 실행하면 이어서 받습니다. 인터넷이 끊기면 받던 쪽을 넘기지 않고, 연결될 때까지 30초마다 확인하며 기다립니다.
- `pnpm media:agent install [한도GB]`로 macOS 로그인 항목(LaunchAgent)에 등록하면, 로그인할 때 자동으로 시작하고 비정상 종료되면 1분 뒤 다시 시작합니다. 다 받았거나 한도에 도달해 정상 종료하면 다시 시작하지 않습니다. `status`로 상태를, `uninstall`로 해제합니다. 잠자기 중에는 멈추고 깨어나면 이어 받습니다(`caffeinate -i`로 자동 잠자기는 막지만 덮개를 닫으면 잠듭니다). 위치는 `FANATIC_MEDIA_DIR`로 바꿀 수 있습니다.
- `public/media/`가 없으면(CI, 배포) 로더가 빈 목록을 받고, 화면은 번호와 대표색으로 만든 자리 표시 그래픽을 보여 줍니다.
- Vercel CLI는 `.gitignore`를 따르지 않으므로 `.vercelignore`에서 `media/`·`public/media/`를 뺍니다. 그래도 들어가는 일이 없도록 `VERCEL`·`CI` 환경의 빌드는 `build/client/media`를 지웁니다(`scripts/prune-assets.mjs`).

## 모니터링

`src/app/monitoring`이 첫 화면을 그린 뒤 Sentry와 web-vitals를 불러옵니다.

| 환경 변수         | 설명                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `VITE_SENTRY_DSN` | 있으면 오류와 나쁜(poor) Web Vitals를 Sentry로 보냅니다. 없으면 개발 모드에서 콘솔에만 찍습니다 |
| `VITE_RELEASE`    | Sentry release 이름(선택)                                                                       |

## 접근성

- 갤러리는 WAI-ARIA APG 캐러셀 패턴(자동 넘김 없음)입니다. 터치 스와이프는 CSS scroll-snap이 처리하고, 이전·다음 버튼과 위치 안내(`aria-live`)를 함께 둡니다.
- 버튼·검색·토글·대화상자는 React Aria Components로 만듭니다.
- `eslint-plugin-jsx-a11y`(strict)로 코드를 쓸 때 검사하고, E2E에서 모든 페이지를 axe로 검사합니다.
- 홈 전시관의 움직임은 CSS 스크롤 타임라인(`animation-timeline: view()`)으로만 만듭니다. `@supports`와 `prefers-reduced-motion: no-preference` 안에만 두어, 지원하지 않거나 동작 줄이기를 켜면 정지 화면입니다. 전시관을 화면에 붙이면(sticky) 붙은 동안 타임라인이 멈추고, 화면이 낮거나 글자를 키웠을 때 내용이 다음 전시관에 가려지므로 붙이지 않습니다.

## 테스트와 품질

| 명령                                                    | 내용                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm test`                                             | Vitest 단위·컴포넌트 테스트, 모든 스토리 렌더 검사                                        |
| `pnpm test:e2e`                                         | 프로덕션 빌드에서 axe 접근성, 320~1440px 가로 넘침, 글자 200%, 키보드·검색·이동, 정적 API |
| `pnpm size`                                             | 번들 크기 예산(size-limit)                                                                |
| `pnpm lhci`                                             | Lighthouse CI 예산(성능 0.9, 접근성 1.0, LCP 2.5초 등)                                    |
| `pnpm format:check` / `lint` / `lint:fsd` / `typecheck` | Prettier / ESLint / Steiger / 타입 검사                                                   |

CI(GitHub Actions)는 위 단계를 모두 돌립니다. Dependabot이 의존성을 매주 확인합니다.
