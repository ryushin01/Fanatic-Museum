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
