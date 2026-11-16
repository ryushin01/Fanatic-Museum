import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OriginalTitle } from './original-title';

describe('OriginalTitle', () => {
  it('줄임말과 원제를 잇고, 원제에만 언어를 표시한다', () => {
    const { container } = render(
      <OriginalTitle work={{ nickname: '사에카노', originalTitle: '冴えない彼女の育てかた' }} />,
    );
    expect(container).toHaveTextContent('사에카노 · 冴えない彼女の育てかた');
    expect(screen.getByText('冴えない彼女の育てかた')).toHaveAttribute('lang', 'ja');
  });

  it('영문 원제는 영어로, 둘 다 없으면 그리지 않는다', () => {
    render(<OriginalTitle work={{ originalTitle: 'The Breaker' }} />);
    expect(screen.getByText('The Breaker')).toHaveAttribute('lang', 'en');
    const { container } = render(<OriginalTitle work={{}} as="p" />);
    expect(container).toBeEmptyDOMElement();
  });
});
