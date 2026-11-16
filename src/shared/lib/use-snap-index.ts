import { useCallback, useEffect, useRef, useState } from 'react';

/** 스크롤 이벤트가 이만큼 멈추면 스크롤이 끝난 것으로 봅니다. */
const SETTLE_MS = 150;

/**
 * scroll-snap 가로 목록에서 지금 보이는 항목 번호를 추적하고, 번호로 이동하는 함수를 돌려줍니다.
 * 터치 스와이프와 트랙패드 스크롤은 브라우저의 scroll-snap이 처리합니다.
 *
 * 버튼으로 옮기는 동안(부드러운 스크롤)에는 지나가는 항목으로 번호를 바꾸지 않습니다.
 * 바꾸면 버튼을 빠르게 연달아 누를 때 옛 번호에서 다시 계산해 누른 만큼 넘어가지 않습니다.
 */
export function useSnapIndex<T extends HTMLElement>(count: number) {
  const trackRef = useRef<T>(null);
  const targetRef = useRef<number | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    let settle = 0;
    const measure = () => {
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
      return best;
    };
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const best = measure();
        if (targetRef.current === null || targetRef.current === best) {
          targetRef.current = null;
          setIndex(best);
        }
      });
      // 스크롤이 멈추면 실제 위치에 맞춥니다(손으로 밀어 버튼 이동을 끊은 경우 포함).
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        targetRef.current = null;
        setIndex(measure());
      }, SETTLE_MS);
    };
    track.addEventListener('scroll', update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      track.removeEventListener('scroll', update);
    };
  }, [count]);

  const goTo = useCallback((next: number) => {
    const track = trackRef.current;
    const item = track?.children[next] as HTMLElement | undefined;
    if (!track || !item) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 항목이 붙는 자리(scroll-padding 안쪽)로 정확히 보냅니다.
    const padding = parseFloat(getComputedStyle(track).scrollPaddingInlineStart) || 0;
    const offset = item.getBoundingClientRect().left - track.getBoundingClientRect().left;
    const left = Math.max(0, track.scrollLeft + offset - padding);
    // 이미 그 자리면 스크롤이 일어나지 않으므로 기다릴 목표를 두지 않습니다.
    targetRef.current = Math.abs(left - track.scrollLeft) < 1 ? null : next;
    track.scrollTo({ left, behavior: reduce ? 'auto' : 'smooth' });
    setIndex(next);
  }, []);

  return { trackRef, index, goTo };
}
