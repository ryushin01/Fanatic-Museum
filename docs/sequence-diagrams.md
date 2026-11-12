# 시퀀스 다이어그램

서버 없이 정적 파일로 배포하는 전시실의 주요 흐름입니다. 데이터는 빌드할 때 한 번 읽고, 방문자의 브라우저는 미리 만든 HTML과 JSON만 받습니다.

## 1. 빌드할 때 사전 렌더링과 이미지

`react-router.config.ts`의 `prerender`에 적힌 주소마다 로더를 한 번씩 실행해 HTML을 만듭니다. 저작권 이미지는 관리자 컴퓨터에만 있으므로, 배포 빌드에서는 이미지 목록이 비어 자리 표시 그래픽이 그려집니다.

```mermaid
sequenceDiagram
    actor 관리자
    participant 변환 as 이미지 변환<br/>(scripts/media/build-variants.mjs)
    participant 빌드 as react-router build<br/>(ssr: false, prerender)
    participant 로더 as 페이지 로더<br/>(pages/*/api/loader.server)
    participant 작품 as getWorks<br/>(entities/work/api/get-works.server)
    participant 미디어 as loadMediaIndex<br/>(shared/api/media.server)
    participant 정리 as 빌드 뒤 정리<br/>(scripts/prune-assets.mjs)

    opt 관리자 컴퓨터에서만
        관리자->>변환: pnpm media:build
        변환->>변환: ~/Downloads/Fanatic-Museum 원본을 WebP로 변환
        변환-->>관리자: public/media/:slug/, index.json
    end
    관리자->>빌드: pnpm build
    loop prerender 주소마다 (/, /works, /works/:slug …)
        빌드->>로더: loader()
        로더->>작품: getWorks() / getWork(slug)
        작품->>미디어: 이미지 목록 (처음 한 번만 읽고 재사용)
        alt public/media/index.json 있음
            미디어-->>작품: 작품별 이미지 목록
        else 없음 (CI, Vercel)
            미디어-->>작품: 빈 목록
        end
        작품-->>로더: 번호순 소장품 + 이미지(대체 텍스트 포함)
        로더-->>빌드: 화면 데이터
        빌드->>빌드: HTML 생성 (이미지가 없으면 번호·대표색 자리 표시)
    end
    빌드->>정리: 참조 없는 CSS 삭제, 404.html 생성
    alt VERCEL 또는 CI 환경
        정리->>정리: build/client/media 삭제 (저작권 이미지 배포 방지)
    end
```

## 2. 소장품 검색 조건을 주소에 남기기

입력은 화면 상태에 먼저 반영하고 주소(`?q=&c=`)는 뒤따라 맞춥니다. 결과 목록은 지연값으로 걸러 빠르게 입력해도 버벅이지 않습니다.

```mermaid
sequenceDiagram
    actor 방문자
    participant 화면 as 소장품 화면<br/>(pages/works WorkFilter)
    participant 훅 as useWorkFilter<br/>(pages/works/model)
    participant 주소 as 주소 검색 매개변수<br/>(useSearchParams)
    participant 거르기 as filterWorks<br/>(pages/works/model/filter)

    방문자->>화면: /works?q=브레이커&c=novel 열기
    화면->>훅: 사전 렌더링된 소장품 목록
    훅->>주소: q, c 읽기 (없는 분류는 버림)
    훅->>거르기: 검색어·분류
    거르기-->>화면: 결과 목록
    방문자->>화면: 검색어 입력, 분류 선택
    화면->>훅: onChange(next)
    훅->>훅: 화면 상태 바로 갱신
    훅->>주소: setParams (replace, 스크롤 유지)
    훅->>거르기: 지연값(useDeferredValue)으로 다시 거르기
    거르기-->>화면: 결과 목록
    방문자->>주소: 뒤로 가기
    주소-->>훅: 주소 변경 (POP)
    훅->>훅: 화면 상태를 주소 값으로 되돌림
```

## 3. 정적 JSON API

API 주소도 사전 렌더링 목록에 있어 빌드할 때 JSON 파일로 만들어집니다. 타입은 `openapi/archive.yaml`에서 생성하고, CI가 생성 결과와 커밋된 파일이 같은지 확인합니다. 사전 렌더링 목록에는 있는 소장품만 들어가므로, 없는 소장품 주소는 정적 호스팅의 404가 됩니다.

```mermaid
sequenceDiagram
    participant 빌드 as react-router build
    participant 라우트 as API 라우트<br/>(app/routes/api.*.ts)
    participant 작품 as getWorks / getWork<br/>(entities/work)
    participant 호스팅 as Vercel 정적 호스팅
    actor 이용자 as API 이용자

    loop /api/works.json, /api/works/:slug.json, categories, authors
        빌드->>라우트: loader()
        라우트->>작품: 소장품 조회
        작품-->>라우트: Work (OpenAPI 타입)
        라우트-->>빌드: Response.json
        빌드->>호스팅: build/client/api/*.json
    end
    이용자->>호스팅: GET /api/works.json
    호스팅-->>이용자: { total, items }
```
