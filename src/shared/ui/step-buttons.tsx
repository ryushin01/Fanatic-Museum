import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { Button } from 'react-aria-components';

import styles from './step-buttons.module.css';

export interface StepButtonsProps {
  /** 지금 위치(0부터) */
  index: number;
  count: number;
  onChange: (index: number) => void;
  /** 버튼이 움직이는 영역의 id (aria-controls) */
  controls?: string;
  previousLabel?: string;
  nextLabel?: string;
  /** 두 버튼 사이에 둘 내용(위치 안내 등) */
  children?: ReactNode;
  /** 다음 버튼 뒤에 둘 내용 */
  trailing?: ReactNode;
  /** 묶음과 버튼의 모양을 바꿀 때만 줍니다. 기본은 밝은 테두리 버튼입니다. */
  className?: string;
  buttonClassName?: string;
}

/**
 * 이전·다음 버튼 묶음. 처음과 끝에서는 그쪽 버튼이 비활성됩니다.
 * 초점이 있던 버튼이 비활성되면 브라우저가 초점을 body로 옮겨 버리므로, 반대쪽 버튼으로 옮겨 줍니다.
 * 눌러서 끝에 닿든, 끝 무렵 항목이 맨 앞에 오지 못해 끝으로 맞춰지든, 손으로 밀어 끝에 닿든 같습니다.
 */
export function StepButtons({
  index,
  count,
  onChange,
  controls,
  previousLabel = '이전',
  nextLabel = '다음',
  children,
  trailing,
  className = styles.controls,
  buttonClassName = styles.button,
}: StepButtonsProps) {
  const previousRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const last = count - 1;

  const step = (delta: -1 | 1) => {
    const target = Math.min(last, Math.max(0, index + delta));
    if (target !== index) onChange(target);
  };

  // 비활성된 버튼에 초점이 그대로 남아 있으면(브라우저가 아직 옮기기 전) 바로 옮깁니다.
  useLayoutEffect(() => {
    const active = document.activeElement;
    if (index <= 0 && active === previousRef.current) nextRef.current?.focus();
    else if (index >= last && active === nextRef.current) previousRef.current?.focus();
  }, [index, last]);

  // 브라우저가 먼저 초점을 body로 옮기면(렌더 중 레이아웃 계산 등) 그때 나는 blur에서 옮깁니다.
  useEffect(() => {
    const previous = previousRef.current;
    const next = nextRef.current;
    if (!previous || !next) return;
    const onBlur = (event: FocusEvent) => {
      const button = event.currentTarget as HTMLButtonElement;
      if (event.relatedTarget !== null || !button.disabled) return;
      const other = button === previous ? next : previous;
      // 두 버튼이 한 번에 바뀌면(항목이 둘일 때) blur가 반대쪽 버튼이 풀리기 전에 날 수 있어,
      // 그리기를 마친 뒤 초점이 여전히 body에 있을 때만 옮깁니다.
      queueMicrotask(() => {
        if (!other.disabled && document.activeElement === document.body) other.focus();
      });
    };
    previous.addEventListener('blur', onBlur);
    next.addEventListener('blur', onBlur);
    return () => {
      previous.removeEventListener('blur', onBlur);
      next.removeEventListener('blur', onBlur);
    };
  }, []);

  return (
    <div className={className}>
      <Button
        ref={previousRef}
        className={buttonClassName}
        aria-controls={controls}
        onPress={() => step(-1)}
        isDisabled={index <= 0}
      >
        {previousLabel}
      </Button>
      {children}
      <Button
        ref={nextRef}
        className={buttonClassName}
        aria-controls={controls}
        onPress={() => step(1)}
        isDisabled={index >= last}
      >
        {nextLabel}
      </Button>
      {trailing}
    </div>
  );
}
