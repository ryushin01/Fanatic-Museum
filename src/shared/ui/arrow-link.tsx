import type { ReactNode } from 'react';
import { Link } from 'react-router';

export interface ArrowLinkProps {
  to: string;
  children: ReactNode;
  /** 바탕색. 기본은 옅은 회색, brand는 청록 */
  tone?: 'default' | 'brand';
  className?: string;
}

/** 이름 칸과 화살표 칸으로 나뉜 버튼 모양 링크. 마우스를 올리면 어두운 판이 밀려 들어옵니다. */
export function ArrowLink({ to, children, tone = 'default', className }: ArrowLinkProps) {
  return (
    <Link
      to={to}
      className={className ? `arrow-button ${className}` : 'arrow-button'}
      data-tone={tone === 'brand' ? 'brand' : undefined}
      viewTransition
      prefetch="intent"
    >
      <span className="arrow-button__label">{children}</span>
      <span className="arrow-button__icon" aria-hidden="true">
        <ArrowIcon />
      </span>
    </Link>
  );
}

/** 오른쪽 화살표(→). 장식용이라 읽지 않습니다. */
export function ArrowIcon({ direction = 'right' }: { direction?: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden="true"
      focusable="false"
      style={direction === 'left' ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M1 6h9.5M6.5 2l4 4-4 4" />
    </svg>
  );
}
