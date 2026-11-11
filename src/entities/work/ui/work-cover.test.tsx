import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeImage } from '@/shared/lib/test/fixtures';

import { WorkCover } from './work-cover';

describe('WorkCover', () => {
  it('이미지가 있으면 반응형 이미지를 그린다', () => {
    render(<WorkCover number={3} title="사에카노" accent="#e8789a" image={makeImage(1)} />);
    const img = screen.getByRole('img', { name: '테스트 작품 일러스트 1' });
    expect(img).toHaveAttribute('srcset', expect.stringContaining('640w'));
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('주변에 제목이 있으면 alt를 비워 꾸밈 이미지로 둔다', () => {
    const { container } = render(
      <WorkCover number={3} title="사에카노" accent="#e8789a" image={makeImage(1)} alt="" />,
    );
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('이미지가 없으면 번호와 제목으로 만든 자리 표시 그래픽을 화면 낭독기에서 숨긴다', () => {
    const { container } = render(<WorkCover number={7} title="창세기전" accent="#8a6a2b" />);
    expect(screen.queryByRole('img')).toBeNull();
    const art = container.querySelector('[aria-hidden="true"]');
    expect(art).toHaveTextContent('007');
    expect(art).toHaveTextContent('창세기전');
  });

  it('밝은 대표색에는 어두운 글자를 쓴다', () => {
    const { container } = render(<WorkCover number={8} title="윙건담" accent="#d9dde3" />);
    expect(container.querySelector('.artLight')).not.toBeNull();
  });
});
