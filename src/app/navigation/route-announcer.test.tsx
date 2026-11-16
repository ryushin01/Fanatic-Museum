import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { createRoutesStub, Link, Outlet } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { RouteAnnouncer } from './route-announcer';

/** 제목을 바꾸는 페이지. 실제 앱에서는 라우트 meta가 <title>을 바꿉니다. */
function Page({ title, children }: { title: string; children?: React.ReactNode }) {
  useEffect(() => {
    document.title = title;
  }, [title]);
  return <>{children}</>;
}

/** 루트 레이아웃처럼 머리글 메뉴·본문·알림 영역은 화면을 옮겨도 그대로 남습니다. */
function Layout() {
  return (
    <>
      <nav>
        <Link to="/timeline">연표</Link>
      </nav>
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <RouteAnnouncer />
    </>
  );
}

function renderApp() {
  const Stub = createRoutesStub([
    {
      path: '/',
      Component: Layout,
      children: [
        {
          index: true,
          Component: () => (
            <Page title="홈">
              <Link to="/works/fate">Fate 시리즈</Link>
            </Page>
          ),
        },
        { path: 'works/fate', Component: () => <Page title="Fate 시리즈 — Fanatic Museum" /> },
        { path: 'timeline', Component: () => <Page title="연표 — Fanatic Museum" /> },
      ],
    },
  ]);
  return render(<Stub initialEntries={['/']} />);
}

describe('RouteAnnouncer', () => {
  it('처음 열 때는 알리지 않는다', async () => {
    renderApp();
    expect(await screen.findByRole('status')).toBeEmptyDOMElement();
  });

  it('누른 링크가 사라져 초점을 잃으면 본문으로 옮기고 새 페이지 제목을 알린다', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(await screen.findByRole('link', { name: 'Fate 시리즈' }));
    await vi.waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Fate 시리즈 — Fanatic Museum'),
    );
    expect(document.getElementById('main')).toHaveFocus();
  });

  it('그대로 남는 머리글 링크로 옮기면 초점은 두고 제목만 알린다', async () => {
    const user = userEvent.setup();
    renderApp();
    const link = await screen.findByRole('link', { name: '연표' });
    await user.click(link);
    await vi.waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('연표 — Fanatic Museum'),
    );
    expect(link).toHaveFocus();
  });
});
