import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { makeImage, makeWork } from '@/shared/lib/test/fixtures';

import { WorkGallery } from './work-gallery';

describe('WorkGallery', () => {
  it('이미지가 없으면 자리 표시 그래픽과 안내를 보여 준다', () => {
    render(<WorkGallery work={makeWork()} />);
    expect(screen.getByText(/로컬 보관함에만 있습니다/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '다음' })).toBeNull();
  });

  it('APG 캐러셀 구조와 슬라이드 위치를 알려 준다', () => {
    render(<WorkGallery work={makeWork({ images: [1, 2, 3].map(makeImage) })} />);
    const carousel = screen.getByRole('region', { name: /전시 이미지/ });
    expect(carousel).toHaveAttribute('aria-roledescription', '캐러셀');
    const slides = within(carousel).getAllByRole('group');
    expect(slides).toHaveLength(3);
    expect(slides[1]).toHaveAttribute('aria-roledescription', '슬라이드');
    expect(slides[1]).toHaveAccessibleName('2 / 3');
    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled();
  });

  it('다음 버튼으로 넘기면 위치 안내가 바뀐다', async () => {
    const user = userEvent.setup();
    render(<WorkGallery work={makeWork({ images: [1, 2, 3].map(makeImage) })} />);
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(screen.getByText(/2 \/ 3/, { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이전' })).toBeEnabled();
  });

  it('이미지를 누르면 크게 보기 대화상자가 열리고, 화살표 키로 넘기고 Esc로 닫는다', async () => {
    const user = userEvent.setup();
    render(<WorkGallery work={makeWork({ images: [1, 2, 3].map(makeImage) })} />);
    await user.click(screen.getByRole('button', { name: '테스트 작품 일러스트 1, 크게 보기' }));

    const dialog = await screen.findByRole('dialog', { name: '테스트 작품 이미지 크게 보기' });
    expect(within(dialog).getByRole('img', { name: '테스트 작품 일러스트 1' })).toBeInTheDocument();

    await user.keyboard('{ArrowRight}');
    expect(within(dialog).getByRole('img', { name: '테스트 작품 일러스트 2' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
