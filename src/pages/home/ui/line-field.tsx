import { useEffect, useRef, type ReactNode } from 'react';

import styles from './line-field.module.css';

export interface LineFieldProps {
  /** 가운데 빈 자리에 놓을 내용(장식용 큰 글자 등) */
  children?: ReactNode;
}

/** 0~1 사이에서 부드럽게 바뀌는 계단 함수 */
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** 열 번호마다 늘 같은 0~1 값을 주는 해시. 줄 간격이 불규칙해 보이게 합니다. */
function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

const COLUMN = 6;
const ROW = 9;

/**
 * 짧은 선을 촘촘히 늘어놓은 장식 그림. 멀리서는 세로줄이고, 가운데 빈 자리 둘레에서는 그 둘레를 따라 휘어
 * 동심원을 이룹니다. 마우스를 움직이면 휘는 중심이 조금 따라옵니다(움직임 줄이기에서는 멈춘 그림).
 * 자바스크립트 없이 미리 그린 HTML에서는 빈 자리 글자만 보입니다.
 */
export function LineField({ children }: LineFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const offset = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let frame = 0;

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== Math.round(width * ratio)) canvas.width = Math.round(width * ratio);
      if (canvas.height !== Math.round(height * ratio)) canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.strokeStyle = getComputedStyle(canvas).color;
      context.lineWidth = 1;

      const cx = width / 2 + offset.x * width * 0.06;
      const cy = height / 2 + offset.y * height * 0.08;
      // 가운데 빈 자리(글자가 놓이는 곳, 움직이지 않음)와 그 둘레의 휘는 영역(마우스를 따라 조금 움직임)
      const holeX = Math.min(Math.max(width * 0.16, 112), 240);
      const holeY = height * 0.21;
      const rx = holeX * 1.15;
      const ry = holeY * 2.1;

      context.beginPath();
      for (let col = 0; col * COLUMN <= width; col += 1) {
        const x = col * COLUMN + COLUMN / 2;
        // 바깥쪽 세로줄은 일부 열만 그려 간격이 들쭉날쭉하게
        const band = 0.5 + 0.5 * Math.sin(col * 0.21);
        const keepOuter = hash(col) < 0.3 + band * 0.5;
        for (let row = 0; row * ROW <= height; row += 1) {
          const y = row * ROW + ROW / 2;
          const dx = (x - cx) / rx;
          const dy = (y - cy) / ry;
          const d = Math.hypot(dx, dy);
          if (Math.abs(x - width / 2) < holeX && Math.abs(y - height / 2) < holeY) continue;
          const bend = smoothstep(1.6, 0.85, d);
          if (bend < 0.05 && !keepOuter) continue;
          if (bend >= 0.05 && hash(col * 31 + row) > 0.35 + bend * 0.65 && !keepOuter) continue;
          const tangent = Math.atan2(dy, dx) + Math.PI / 2;
          const angle = Math.PI / 2 + (tangent - Math.PI / 2) * bend;
          const half = (ROW / 2) * (1 - bend * 0.25);
          const ux = Math.cos(angle) * half;
          const uy = Math.sin(angle) * half;
          context.moveTo(x - ux, y - uy);
          context.lineTo(x + ux, y + uy);
        }
      }
      context.stroke();
    };

    const animate = () => {
      offset.x += (target.x - offset.x) * 0.12;
      offset.y += (target.y - offset.y) * 0.12;
      draw();
      frame =
        Math.abs(target.x - offset.x) + Math.abs(target.y - offset.y) > 0.002
          ? requestAnimationFrame(animate)
          : 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (reduce.matches) return;
      const box = canvas.getBoundingClientRect();
      target.x = ((event.clientX - box.left) / box.width - 0.5) * 2;
      target.y = ((event.clientY - box.top) / box.height - 0.5) * 2;
      if (!frame) frame = requestAnimationFrame(animate);
    };

    const onPointerLeave = () => {
      target.x = 0;
      target.y = 0;
      if (!frame && !reduce.matches) frame = requestAnimationFrame(animate);
    };

    draw();
    const resize = new ResizeObserver(() => draw());
    resize.observe(canvas);
    // 테마를 바꾸면 선 색을 다시 읽습니다.
    const theme = new MutationObserver(() => draw());
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    scheme.addEventListener('change', draw);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      theme.disconnect();
      scheme.removeEventListener('change', draw);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <div className={styles.field} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
      {children && <div className={styles.center}>{children}</div>}
    </div>
  );
}
