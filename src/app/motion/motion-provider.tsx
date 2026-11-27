import { LazyMotion, MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

const loadFeatures = () => import('./motion-features').then((mod) => mod.default);

/**
 * Motion 설정. 애니메이션 기능은 하이드레이션 뒤에 따로 받고(`m` 컴포넌트만 씀, strict),
 * 운영체제의 움직임 줄이기 설정을 켜면 위치·크기 전환을 끕니다.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
