import { domMax, LazyMotion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * 끌기·공유 레이아웃(layoutId)을 쓰는 부품을 감싸 Motion 기능 묶음(domMax)을 줍니다.
 * 공통 조각(`shared/ui`·`shared/lib`)과 떨어진 세그먼트라 이 부품을 쓰는 페이지(홈·작품 상세)의 JS에만 실리고,
 * 하이드레이션 때부터 바로 움직입니다.
 * strict라 안쪽에서는 `motion.*` 대신 `motion/react-m`의 `m.*`만 씁니다.
 */
export function MotionFeatures({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      {children}
    </LazyMotion>
  );
}
