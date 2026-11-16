import { render, screen } from '@testing-library/react';
import { createRoutesStub, data, Outlet, useRouteError } from 'react-router';
import { describe, expect, it } from 'vitest';

import { errorTitle, NotFoundBoundary } from './not-found-notice';

function ParentBoundary() {
  const error = useRouteError();
  return <p>상위 오류 화면: {error instanceof Error ? error.message : String(error)}</p>;
}

function renderAt(path: string) {
  const Stub = createRoutesStub([
    {
      path: '/',
      Component: Outlet,
      ErrorBoundary: ParentBoundary,
      HydrateFallback: () => null,
      children: [
        {
          path: 'works/:slug',
          Component: () => <h1>작품</h1>,
          ErrorBoundary: NotFoundBoundary,
          loader: ({ params }) => {
            if (params.slug === 'broken') throw new Error('망가짐');
            if (params.slug !== 'fate') throw data('없는 소장품입니다.', { status: 404 });
            return null;
          },
        },
        { path: 'works', Component: () => <p>소장품 목록</p> },
      ],
    },
  ]);
  return render(<Stub initialEntries={[path]} />);
}

describe('NotFoundBoundary', () => {
  it('로더가 404를 던지면 그 자리에서 안내와 소장품 목록 링크를 보여 준다', async () => {
    renderAt('/works/nope');
    expect(
      await screen.findByRole('heading', { level: 1, name: '전시실을 찾을 수 없습니다' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '소장품 전체 보기' })).toHaveAttribute(
      'href',
      '/works',
    );
  });

  it('404가 아닌 오류는 상위 오류 화면으로 넘긴다', async () => {
    renderAt('/works/broken');
    expect(await screen.findByText(/상위 오류 화면: 망가짐/)).toBeInTheDocument();
  });
});

describe('errorTitle', () => {
  it('404와 다른 오류의 제목을 나눈다', () => {
    // 로더가 던진 data(…, { status })는 라우터가 이런 오류 응답으로 바꿔 넘깁니다.
    const response = (status: number) => ({ status, statusText: '', internal: false, data: '' });
    expect(errorTitle(response(404))).toMatch(/^찾을 수 없는 페이지 — /);
    expect(errorTitle(response(500))).toMatch(/^문제가 생겼습니다 — /);
    expect(errorTitle(new Error('x'))).toMatch(/^문제가 생겼습니다 — /);
  });
});
