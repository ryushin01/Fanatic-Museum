import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { useHydrated } from './use-hydrated';

function Probe() {
  return <p>{useHydrated() ? '하이드레이션 뒤' : '미리 그린 HTML'}</p>;
}

describe('useHydrated', () => {
  it('사전 렌더링에서는 false', () => {
    expect(renderToString(<Probe />)).toContain('미리 그린 HTML');
  });

  it('브라우저에서 새로 그리면 true', () => {
    render(<Probe />);
    expect(screen.getByText('하이드레이션 뒤')).toBeInTheDocument();
  });
});
