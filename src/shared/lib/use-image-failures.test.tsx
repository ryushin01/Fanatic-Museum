import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useImageFailures } from './use-image-failures';

function Gallery({ srcs }: { srcs: string[] }) {
  const { failed, track } = useImageFailures();
  return (
    <>
      <p role="status">받지 못함 {failed.size}</p>
      {srcs
        .filter((src) => !failed.has(src))
        .map((src) => (
          <img key={src} {...track(src)} src={src} alt={src} />
        ))}
    </>
  );
}

describe('useImageFailures', () => {
  it('onError가 난 이미지만 실패로 모으고, 같은 이미지를 두 번 세지 않는다', () => {
    render(<Gallery srcs={['/a.webp', '/b.webp']} />);
    const a = screen.getByRole('img', { name: '/a.webp' });
    fireEvent.error(a);
    fireEvent.error(a);
    expect(screen.getByRole('status')).toHaveTextContent('받지 못함 1');
    expect(screen.getByRole('img', { name: '/b.webp' })).toBeInTheDocument();
  });

  it('하이드레이션 전에 이미 실패한 이미지(complete인데 크기 0)도 붙을 때 알아챈다', () => {
    const complete = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'complete');
    const currentSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'currentSrc');
    Object.defineProperty(HTMLImageElement.prototype, 'complete', {
      configurable: true,
      get: () => true,
    });
    Object.defineProperty(HTMLImageElement.prototype, 'currentSrc', {
      configurable: true,
      get(this: HTMLImageElement) {
        return this.getAttribute('src') ?? '';
      },
    });
    try {
      render(<Gallery srcs={['/a.webp']} />);
      expect(screen.getByRole('status')).toHaveTextContent('받지 못함 1');
      expect(screen.queryByRole('img')).toBeNull();
    } finally {
      if (complete) Object.defineProperty(HTMLImageElement.prototype, 'complete', complete);
      if (currentSrc) Object.defineProperty(HTMLImageElement.prototype, 'currentSrc', currentSrc);
    }
  });
});
