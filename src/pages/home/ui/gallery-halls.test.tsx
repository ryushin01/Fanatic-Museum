import { render, screen, within } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import { makeWork } from '@/shared/lib/test/fixtures';

import { GalleryHalls } from './gallery-halls';

const categories = [
  {
    slug: 'game',
    name: '게임',
    englishName: 'Games',
    description: '밤을 새우게 만든 게임.',
    count: 2,
  },
  {
    slug: 'novel',
    name: '소설',
    englishName: 'Novels',
    description: '서가를 채운 소설.',
    count: 1,
  },
] as const;

const works = [
  makeWork({ slug: 'a', number: 1, title: '가', categories: ['game'] }),
  makeWork({ slug: 'b', number: 2, title: '나', categories: ['game'] }),
  makeWork({ slug: 'c', number: 3, title: '다', categories: ['novel'] }),
];

function renderHalls() {
  const Stub = createRoutesStub([
    { path: '/', Component: () => <GalleryHalls categories={categories} works={works} /> },
  ]);
  return render(<Stub />);
}

describe('GalleryHalls', () => {
  it('카테고리마다 전시관 링크 하나를 순서 목록으로 보여 준다', async () => {
    renderHalls();
    const section = await screen.findByRole('region', { name: '전시관' });
    const items = within(section).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    const link = within(items[0]!).getByRole('link');
    expect(link).toHaveAttribute('href', '/categories/game');
    expect(link).toHaveTextContent('게임');
    expect(link).toHaveTextContent('2점 전시 중');
  });

  it('벽에 건 대표 소장품은 꾸밈이라 보조기기에서 숨기고, 그 카테고리 작품만 건다', async () => {
    const { container } = renderHalls();
    await screen.findByRole('region', { name: '전시관' });
    const walls = container.querySelectorAll('[aria-hidden="true"] [data-depth]');
    expect(walls).toHaveLength(3);
  });
});
