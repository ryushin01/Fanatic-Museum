import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

import { site } from '@/shared/config';

import { PageHeader } from './page-header';

/** 없는 주소의 안내. 없는 주소 페이지와 작품·카테고리·작가의 404가 함께 씁니다. */
export function NotFoundNotice() {
  return (
    <PageHeader
      eyebrow="404"
      title="전시실을 찾을 수 없습니다"
      description="주소가 바뀌었거나 아직 들어오지 않은 소장품입니다."
    >
      <p style={{ marginTop: 24 }}>
        <Link to="/works">소장품 전체 보기</Link>
      </p>
    </PageHeader>
  );
}

/**
 * 라우트 오류 경계: 로더가 404를 던지면 그 자리에서 안내를 보여 줍니다.
 * 루트까지 올라가면 문서 전체를 다시 그리므로, 404는 여기서 받고 다른 오류만 루트 오류 화면으로 다시 던집니다.
 */
export function NotFoundBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundNotice />;
  throw error;
}

/** 오류가 났을 때 라우트 meta가 쓰는 제목 */
export function errorTitle(error: unknown): string {
  return isRouteErrorResponse(error) && error.status === 404
    ? `찾을 수 없는 페이지 — ${site.name}`
    : `문제가 생겼습니다 — ${site.name}`;
}
