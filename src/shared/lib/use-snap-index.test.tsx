import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSnapIndex } from './use-snap-index';

const WIDTH = 100;

/** 항목 3개가 가로로 100px씩 놓인 목록. 스크롤 위치(scrollLeft)만큼 왼쪽으로 밀립니다. */
function Strip() {
  const { trackRef, index, goTo } = useSnapIndex<HTMLDivElement>(3);
  return (
    <>
      <p role="status">{index + 1}</p>
      <button type="button" onClick={() => goTo(2)}>
        셋째로
      </button>
      <button type="button" onClick={() => goTo(9)}>
        없는 항목
      </button>
      <div ref={trackRef} data-testid="track">
        {[0, 1, 2].map((i) => (
          <div key={i} data-left={i * WIDTH} />
        ))}
      </div>
    </>
  );
}

function rect(left: number): DOMRect {
  return new DOMRect(left, 0, WIDTH, WIDTH);
}

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const track = this.parentElement?.dataset.testid === 'track' ? this.parentElement : null;
    if (!track) return rect(0);
    return rect(Number(this.dataset.left) - track.scrollLeft);
  });
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0);
    return 1;
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function scrollTrack(left: number, clientWidth = WIDTH, scrollWidth = WIDTH * 3) {
  const track = screen.getByTestId('track');
  Object.defineProperty(track, 'clientWidth', { configurable: true, value: clientWidth });
  Object.defineProperty(track, 'scrollWidth', { configurable: true, value: scrollWidth });
  track.scrollLeft = left;
  fireEvent.scroll(track);
}

describe('useSnapIndex', () => {
  it('스크롤하면 맨 앞에 가장 가까운 항목 번호로 바꾼다', () => {
    render(<Strip />);
    expect(screen.getByRole('status')).toHaveTextContent('1');
    scrollTrack(90, 50);
    expect(screen.getByRole('status')).toHaveTextContent('2');
  });

  it('끝까지 스크롤하면 마지막 항목으로 본다', () => {
    render(<Strip />);
    scrollTrack(160, 140);
    expect(screen.getByRole('status')).toHaveTextContent('3');
  });

  it('버튼으로 옮기는 동안에는 지나가는 항목으로 바꾸지 않고, 스크롤이 멈추면 실제 위치에 맞춘다', () => {
    vi.useFakeTimers();
    render(<Strip />);
    const scrollTo = vi.spyOn(screen.getByTestId('track'), 'scrollTo');
    fireEvent.click(screen.getByRole('button', { name: '셋째로' }));
    expect(scrollTo).toHaveBeenCalledWith({ left: 200, behavior: 'smooth' });
    expect(screen.getByRole('status')).toHaveTextContent('3');

    // 부드러운 스크롤이 둘째를 지나가는 중: 번호는 그대로
    scrollTrack(100, 50);
    expect(screen.getByRole('status')).toHaveTextContent('3');

    // 손으로 밀어 둘째에서 멈춤: 멈춘 자리로 맞춤
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole('status')).toHaveTextContent('2');
  });

  it('없는 항목으로는 옮기지 않는다', async () => {
    const user = userEvent.setup();
    render(<Strip />);
    await user.click(screen.getByRole('button', { name: '없는 항목' }));
    expect(screen.getByRole('status')).toHaveTextContent('1');
  });
});
