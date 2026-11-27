import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * 사이트 전체의 Motion 설정. 운영체제의 움직임 줄이기 설정을 켜면 위치·크기 전환을 끕니다.
 * 기능 묶음은 쓰는 부품이 `MotionFeatures`(LazyMotion)로 따로 받습니다.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
