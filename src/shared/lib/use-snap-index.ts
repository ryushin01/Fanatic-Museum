import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * scroll-snap 가로 목록에서 지금 보이는 항목 번호를 추적하고, 번호로 이동하는 함수를 돌려줍니다.
 * 터치 스와이프와 트랙패드 스크롤은 브라우저의 scroll-snap이 처리합니다.
 */
export function useSnapIndex<T extends HTMLElement>(count: number) {
  const trackRef = useRef<T>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const items = Array.from(track.children) as HTMLElement[];
        const start = track.getBoundingClientRect().left;
        let best = 0;
        let bestDistance = Number.POSITIVE_INFINITY;
        items.forEach((item, i) => {
          const distance = Math.abs(item.getBoundingClientRect().left - start);
          if (distance < bestDistance) {
            best = i;
            bestDistance = distance;
          }
        });
        // 끝까지 스크롤했으면 마지막 항목으로 봅니다.
        if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 2) best = items.length - 1;
        setIndex(best);
      });
    };
    track.addEventListener('scroll', update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener('scroll', update);
    };
  }, [count]);

  const goTo = useCallback((next: number) => {
    const track = trackRef.current;
    const item = track?.children[next] as HTMLElement | undefined;
    if (!track || !item) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({
      left: item.offsetLeft - track.offsetLeft,
      behavior: reduce ? 'auto' : 'smooth',
    });
    setIndex(next);
  }, []);

  return { trackRef, index, goTo };
}
