import { fireEvent, render, screen, within } from '@testing-library/react';
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
    expect(within(dialog).getByRole('link', { name: /원본 출처/ })).toHaveAttribute(
      'href',
      'https://example.com/post/2',
    );

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('받지 못한 이미지는 빼고 남은 이미지만 보여 준다', () => {
    render(<WorkGallery work={makeWork({ images: [1, 2, 3].map(makeImage) })} />);
    fireEvent.error(screen.getByRole('img', { name: '테스트 작품 일러스트 2, 크게 보기' }));
    expect(screen.getByRole('heading', { name: /전시 이미지 2장/ })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /일러스트 2/ })).toBeNull();
  });

  it('이미지를 하나도 받지 못하면 자리 표시 그래픽과 안내로 바꾼다', () => {
    render(<WorkGallery work={makeWork({ images: [1, 2].map(makeImage) })} />);
    for (const img of screen.getAllByRole('img')) fireEvent.error(img);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText(/로컬 보관함에만 있습니다/)).toBeInTheDocument();
  });

  it('크게 보기에서 큰 이미지를 받지 못하면 안내를 보여 주고 대화상자는 그대로 쓸 수 있다', async () => {
    const user = userEvent.setup();
    render(<WorkGallery work={makeWork({ images: [1, 2].map(makeImage) })} />);
    await user.click(screen.getByRole('button', { name: '테스트 작품 일러스트 1, 크게 보기' }));
    const dialog = await screen.findByRole('dialog', { name: '테스트 작품 이미지 크게 보기' });
    fireEvent.error(within(dialog).getByRole('img', { name: '테스트 작품 일러스트 1' }));
    expect(within(dialog).getByRole('status')).toHaveTextContent('이 이미지를 불러오지 못했습니다');
    await user.keyboard('{ArrowRight}');
    expect(within(dialog).getByRole('img', { name: '테스트 작품 일러스트 2' })).toBeInTheDocument();
  });
});
