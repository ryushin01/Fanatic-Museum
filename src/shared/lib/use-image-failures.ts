import { useCallback, useState } from 'react';

/** 받지 못한 이미지 하나를 알아채는 데 쓰는 속성(img에 그대로 펼쳐 넣습니다) */
export interface ImageFailureProps {
  ref: (img: HTMLImageElement | null) => void;
  onError: () => void;
}

/**
 * 받지 못한 이미지(보관함에 파일이 없거나 네트워크가 끊김)를 주소별로 모읍니다.
 * 미리 그린 HTML의 이미지는 하이드레이션 전에 실패할 수 있어 onError를 놓치므로,
 * 붙을 때 이미 실패해 있으면(complete인데 naturalWidth가 0) 그때 실패로 칩니다.
 */
export function useImageFailures() {
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());

  const markFailed = useCallback((src: string) => {
    setFailed((prev) => (prev.has(src) ? prev : new Set(prev).add(src)));
  }, []);

  const track = useCallback(
    (src: string): ImageFailureProps => ({
      ref: (img) => {
        if (img && img.complete && img.naturalWidth === 0 && img.currentSrc !== '') {
          markFailed(src);
        }
      },
      onError: () => markFailed(src),
    }),
    [markFailed],
  );

  return { failed, track };
}
