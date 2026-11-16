import type { WorkImage } from '@/shared/api';
import { isLightColor, padNumber } from '@/shared/lib';

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
            className={`${styles.art} ${isLightColor(accent) ? styles.artLight : ''}`}
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
