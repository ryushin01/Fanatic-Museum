import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import { makeWork } from '@/shared/lib/test/fixtures';

import { WorksPage } from './works-page';

const works = [
  makeWork({
    slug: 'sao',
    number: 1,
    title: '소드 아트 온라인',
    categories: ['light-novel', 'game'],
  }),
  makeWork({
    slug: 'breaker',
    number: 2,
    title: '브레이커',
    categories: ['comic'],
    origin: '한국',
  }),
  makeWork({ slug: 'ff', number: 3, title: '파이널 판타지 시리즈', categories: ['game'] }),
];

function renderPage(initial = '/works') {
  const Stub = createRoutesStub([
    {
      path: '/works',
      Component: WorksPage,
      loader: () => ({ works }),
      HydrateFallback: () => null,
    },
    { path: '/works/:slug', Component: () => <p>상세</p> },
  ]);
  return render(<Stub initialEntries={[initial]} />);
}

describe('WorksPage', () => {
  it('소장품 전체를 번호순 목록으로 보여 준다', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { level: 1, name: '소장품' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /^\d+번 / })).toHaveLength(3);
    expect(screen.getByRole('status')).toHaveTextContent('소장품 3점');
  });

  it('검색어로 거르고 결과 수를 알린다', async () => {
    const user = userEvent.setup();
    renderPage();
    const search = await screen.findByRole('searchbox', { name: '소장품 찾기' });
    await user.type(search, '브레이커');
    expect(search).toHaveValue('브레이커');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('3점 가운데 1점'));
    expect(screen.getByRole('link', { name: /브레이커/ })).toBeInTheDocument();
  });

  it('분류 토글로 거르고 조건을 한 번에 지운다', async () => {
    const user = userEvent.setup();
    renderPage();
    const game = await screen.findByRole('button', { name: '게임' });
    await user.click(game);
    expect(game).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('3점 가운데 2점'));
    await user.click(screen.getByRole('button', { name: '조건 모두 지우기' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('소장품 3점'));
  });

  it('주소의 조건(?c=)을 읽어 처음부터 거른다', async () => {
    renderPage('/works?c=comic');
    expect(await screen.findByRole('status')).toHaveTextContent('3점 가운데 1점');
  });

  it('맞는 소장품이 없으면 안내한다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(await screen.findByRole('searchbox'), '없는작품');
    expect(await screen.findByText(/조건에 맞는 소장품이 없습니다/)).toBeInTheDocument();
  });
});
