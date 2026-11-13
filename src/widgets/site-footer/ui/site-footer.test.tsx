import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';

import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  it('외부 자료의 출처는 화면에 적지 않고 README의 출처로 잇는다', async () => {
    const Stub = createRoutesStub([{ path: '*', Component: SiteFooter }]);
    render(<Stub initialEntries={['/']} />);
    expect(await screen.findByRole('link', { name: 'README의 출처' })).toHaveAttribute(
      'href',
      'https://github.com/ryushin01/Fanatic-Museum#출처',
    );
  });
});
