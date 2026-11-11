import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import { SiteHeader } from './site-header';

function renderAt(path: string) {
  const Stub = createRoutesStub([{ path: '*', Component: SiteHeader }]);
  return render(<Stub initialEntries={[path]} />);
}

describe('SiteHeader', () => {
  it('지금 있는 메뉴에 aria-current="page"를 붙인다', async () => {
    renderAt('/works');
    expect(await screen.findByRole('link', { name: '소장품' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: '소개' })).not.toHaveAttribute('aria-current');
  });

  it('하위 페이지에서는 상위 메뉴에 aria-current="true"를 붙인다', async () => {
    renderAt('/categories/comic');
    expect(await screen.findByRole('link', { name: '카테고리' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('로고 링크의 이름은 홈이다', async () => {
    renderAt('/');
    expect(await screen.findByRole('link', { name: '파나틱 뮤지엄 홈' })).toHaveAttribute(
      'href',
      '/',
    );
  });
});

describe('ThemeToggle', () => {
  it('시스템 → 밝게 → 어둡게 → 시스템 순서로 바꾸고 html에 적용·저장한다', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    renderAt('/');
    const button = await screen.findByRole('button', { name: '화면 테마: 시스템' });
    await user.click(button);
    expect(button).toHaveAccessibleName('화면 테마: 밝게');
    expect(document.documentElement.dataset.theme).toBe('light');
    await user.click(button);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('fm-theme')).toBe('dark');
    await user.click(button);
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem('fm-theme')).toBeNull();
  });
});
