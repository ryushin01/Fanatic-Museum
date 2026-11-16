import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import { SiteFooter } from './site-footer';

function renderFooter(workCount?: number) {
  const Stub = createRoutesStub([
    { path: '/', Component: () => <SiteFooter workCount={workCount} /> },
  ]);
  return render(<Stub />);
}

describe('SiteFooter', () => {
  it('소장품 수로 전시 번호 범위를 보여 준다', async () => {
    renderFooter(30);
    expect(await screen.findByText('소장품 001–030')).toBeInTheDocument();
  });

  it('소장품 수를 모르면 범위를 빼고 나머지는 그대로 보여 준다', async () => {
    renderFooter();
    expect(await screen.findByRole('navigation', { name: '바로 가기' })).toBeInTheDocument();
    expect(screen.queryByText(/소장품 001/)).toBeNull();
  });
});
