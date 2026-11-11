import type { WorkImage } from '@/shared/api';
import { padNumber } from '@/shared/lib';

import styles from './work-cover.module.css';

export interface WorkCoverProps {
  number: number;
  title: string;
  accent: string;
  image?: WorkImage;
  /** 가로세로 비율. 기본 4/5 */
  ratio?: string;
  sizes?: string;
  /** 첫 화면에 보이는 이미지면 true */
  priority?: boolean;
  /** 이미지 대체 텍스트. 주변에 제목이 있어 꾸밈용이면 빈 문자열 */
  alt?: string;
}

/** 밝은 대표색 위에는 어두운 글자를 씁니다(명도 대비). */
function isLight(hex: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lum = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lum(r!) + 0.7152 * lum(g!) + 0.0722 * lum(b!) > 0.4;
}

/**
 * 작품 대표 이미지. 로컬 이미지가 없으면 번호와 제목으로 만든 자리 표시 그래픽을 보여 줍니다.
 */
export function WorkCover({
  number,
  title,
  accent,
  image,
  ratio,
  sizes = '(min-width: 768px) 33vw, 80vw',
  priority = false,
  alt,
}: WorkCoverProps) {
  return (
    <div className={styles.cover} style={ratio ? { ['--ratio' as string]: ratio } : undefined}>
      {image ? (
        <img
          className={styles.image}
          src={image.src}
          srcSet={image.srcSet}
          sizes={sizes}
          width={image.width}
          height={image.height}
          alt={alt ?? image.alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
        />
      ) : (
        <div className={styles.artFrame} aria-hidden="true">
          <div
            className={`${styles.art} ${isLight(accent) ? styles.artLight : ''}`}
            style={{ ['--accent' as string]: accent }}
          >
            <span className={styles.artNumber}>{padNumber(number)}</span>
            <span className={styles.artTitle}>{title}</span>
          </div>
        </div>
      )}
    </div>
  );
}
