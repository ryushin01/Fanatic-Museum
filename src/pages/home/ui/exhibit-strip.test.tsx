import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import { makeWork } from '@/shared/lib/test/fixtures';

import { ExhibitStrip } from './exhibit-strip';

const works = [1, 2, 3].map((n) =>
  makeWork({ slug: `work-${n}`, number: n, title: `소장품 ${n}` }),
);

function renderStrip() {
  const Stub = createRoutesStub([
    { path: '/', Component: () => <ExhibitStrip title="전시실" works={works} /> },
  ]);
  return render(<Stub />);
}

describe('ExhibitStrip', () => {
  it('소장품을 순서 목록의 링크로 보여 주고, 이전·다음 버튼이 그 목록을 가리킨다', async () => {
    renderStrip();
    const section = await screen.findByRole('region', { name: '전시실' });
    const list = within(section).getByRole('list');
    const links = within(list).getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute('href', '/works/work-1');
    expect(screen.getByRole('button', { name: '다음' })).toHaveAttribute('aria-controls', list.id);
    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled();
  });

  it('다음 버튼으로 끝까지 넘기면 다음 버튼이 꺼지고 초점이 이전 버튼으로 간다', async () => {
    const user = userEvent.setup();
    renderStrip();
    const next = await screen.findByRole('button', { name: '다음' });
    await user.click(next);
    expect(screen.getByRole('button', { name: '이전' })).toBeEnabled();
    await user.click(next);
    expect(next).toBeDisabled();
    expect(screen.getByRole('button', { name: '이전' })).toHaveFocus();
  });

  it('Tab으로 표지 링크에 초점을 옮길 수 있다', async () => {
    const user = userEvent.setup();
    renderStrip();
    await screen.findByRole('region', { name: '전시실' });
    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('link', { name: /소장품 2/ })).toHaveFocus();
  });
});
