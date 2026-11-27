import { animate, useMotionValue, useReducedMotionConfig } from 'motion/react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
} from 'react';

import { useHydrated } from '@/shared/lib';

/** 버튼·초점·트랙패드로 옮길 때의 전환(부드러운 스크롤과 비슷한 느낌) */
const SNAP_TRANSITION = { type: 'tween', duration: 0.5, ease: [0.22, 1, 0.36, 1] } as const;
/** 트랙패드 가로 스크롤이 이만큼 멈추면 가까운 항목에 붙입니다. */
const WHEEL_SETTLE_MS = 150;

interface Snaps {
  /** 항목마다 띠를 옮길 거리(px). 끝 무렵 항목은 끝까지 옮긴 거리로 맞춥니다. */
  points: number[];
  /** 띠를 옮길 수 있는 가장 먼 거리(px) */
  max: number;
}

function measure(track: HTMLElement): Snaps {
  const items = Array.from(track.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );
  const last = items.at(-1);
  const max = last ? Math.max(0, last.offsetLeft + last.offsetWidth - track.clientWidth) : 0;
  return { points: items.map((item) => Math.min(item.offsetLeft, max)), max };
}

/** 옮긴 거리에서 가장 가까운 항목 번호. 끝까지 옮겼으면 마지막 항목으로 봅니다. */
function nearest({ points, max }: Snaps, position: number) {
  if (points.length > 0 && position >= max - 2) return points.length - 1;
  let best = 0;
  points.forEach((point, i) => {
    if (Math.abs(point - position) < Math.abs((points[best] ?? 0) - position)) best = i;
  });
  return best;
}

/**
 * 가로 띠를 손가락·마우스로 끌어 넘기고(Motion drag, 놓으면 관성으로 가까운 항목에 붙음),
 * 번호로 옮기는 함수를 돌려줍니다. 트랙패드 가로 스크롤과 Tab 초점 이동도 띠를 옮깁니다.
 *
 * `trackRef`와 `dragProps`는 띠(항목의 부모)에, `viewportProps`는 띠를 감싼 창에 줍니다.
 * 창은 하이드레이션 전에는 브라우저 가로 스크롤(scroll-snap)로 넘기고, 그 뒤 `data-drag`가 붙으면
 * `overflow-x: clip`으로 바꿔 끌기만 씁니다.
 */
export function useStripDrag<T extends HTMLElement>(count: number) {
  const trackRef = useRef<T>(null);
  const x = useMotionValue(0);
  const [index, setIndex] = useState(0);
  const [max, setMax] = useState(0);
  const indexRef = useRef(0);
  const draggedRef = useRef(false);
  const reduce = useReducedMotionConfig() ?? false;
  const hydrated = useHydrated();

  const select = useCallback((next: number) => {
    indexRef.current = next;
    setIndex(next);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      const track = trackRef.current;
      if (!track) return;
      const point = measure(track).points[next];
      if (point === undefined) return;
      if (reduce) {
        x.stop();
        x.set(-point);
      } else {
        animate(x, -point, SNAP_TRANSITION);
      }
      select(next);
    },
    [reduce, select, x],
  );

  // 화면 크기가 바뀌면 옮길 수 있는 거리를 다시 재고, 보던 항목을 그대로 맨 앞에 둡니다.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      const snaps = measure(track);
      setMax(snaps.max);
      x.set(-(snaps.points[indexRef.current] ?? 0));
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(track);
    return () => observer.disconnect();
  }, [count, x]);

  // 하이드레이션 전에 브라우저 스크롤로 옮겼거나 Tab으로 초점을 옮겼으면, 끌기로 바꿀 때 그 자리를 이어 받습니다.
  const nativeScrollRef = useRef(0);
  useLayoutEffect(() => {
    nativeScrollRef.current = trackRef.current?.parentElement?.scrollLeft ?? 0;
  }, []);
  useEffect(() => {
    const track = trackRef.current;
    if (!hydrated || !track) return;
    const snaps = measure(track);
    const focused = Array.from(track.children).findIndex((item) =>
      item.contains(document.activeElement),
    );
    const scrolled = nativeScrollRef.current > 0 ? nearest(snaps, nativeScrollRef.current) : -1;
    const next = focused >= 0 ? focused : scrolled;
    if (next < 0) return;
    x.set(-(snaps.points[next] ?? 0));
    select(next);
  }, [hydrated, select, x]);

  // 트랙패드 가로 스크롤(또는 Shift+휠)로도 띠를 옮기고, 멈추면 가까운 항목에 붙입니다.
  useEffect(() => {
    const track = trackRef.current;
    const viewport = track?.parentElement;
    if (!track || !viewport) return;
    let settle = 0;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      const snaps = measure(track);
      const current = -x.get();
      const position = Math.min(snaps.max, Math.max(0, current + event.deltaX));
      // 끝에 닿았으면 브라우저 기본 동작(뒤로 가기 제스처 등)에 맡깁니다.
      if (position === current) return;
      event.preventDefault();
      x.stop();
      x.set(-position);
      window.clearTimeout(settle);
      settle = window.setTimeout(() => goTo(nearest(snaps, position)), WHEEL_SETTLE_MS);
    };
    // 링크·이미지의 기본 끌어 놓기(drag and drop)가 띠 끌기를 가로채지 않게 합니다.
    const onNativeDragStart = (event: DragEvent) => event.preventDefault();
    viewport.addEventListener('wheel', onWheel, { passive: false });
    track.addEventListener('dragstart', onNativeDragStart);
    return () => {
      window.clearTimeout(settle);
      viewport.removeEventListener('wheel', onWheel);
      track.removeEventListener('dragstart', onNativeDragStart);
    };
  }, [goTo, x]);

  /** 놓을 때 관성으로 멈출 자리를 가장 가까운 항목에 맞춥니다. */
  const modifyTarget = useCallback(
    (target: number) => {
      const track = trackRef.current;
      if (!track) return target;
      const snaps = measure(track);
      const next = nearest(snaps, -target);
      select(next);
      return -(snaps.points[next] ?? 0);
    },
    [select],
  );

  /** Tab으로 띠 밖에 있는 항목에 초점이 가면 그 항목이 보이게 옮깁니다. */
  const onFocus = useCallback(
    (event: FocusEvent<T>) => {
      const track = trackRef.current;
      const viewport = track?.parentElement;
      if (!track || !viewport || !(event.target instanceof Element)) return;
      const item = Array.from(track.children).find((child) => child.contains(event.target));
      if (!item) return;
      const box = item.getBoundingClientRect();
      const view = viewport.getBoundingClientRect();
      if (box.left >= view.left - 1 && box.right <= view.right + 1) return;
      goTo(Array.from(track.children).indexOf(item));
    },
    [goTo],
  );

  const dragProps = {
    drag: 'x',
    style: { x },
    dragConstraints: { left: -max, right: 0 },
    dragElastic: 0.2,
    dragTransition: { power: 0.3, timeConstant: 200, modifyTarget },
    onDragStart: () => {
      draggedRef.current = true;
    },
    onPointerDownCapture: () => {
      draggedRef.current = false;
    },
    // 끌고 놓았을 때 그 자리의 링크가 눌리지 않게 합니다.
    onClickCapture: (event: MouseEvent<T>) => {
      if (!draggedRef.current) return;
      draggedRef.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
    onFocus,
  } as const;

  const viewportProps = { 'data-drag': hydrated ? '' : undefined };

  return { trackRef, index, goTo, dragProps, viewportProps };
}
