import { useId, useState } from 'react';
import { Button } from 'react-aria-components';

import { WorkCover } from '@/entities/work';
import { ImageViewer } from './image-viewer';
import type { Work } from '@/shared/api';
import { useSnapIndex } from '@/shared/lib';

import styles from './work-gallery.module.css';

export interface WorkGalleryProps {
  work: Pick<Work, 'title' | 'number' | 'accent' | 'images'>;
}

/**
 * 작품 이미지 캐러셀(WAI-ARIA APG Carousel 패턴, 자동 넘김 없음).
 * 손가락으로 밀거나 이전·다음 버튼으로 넘기고, 이미지를 누르면 크게 봅니다.
 */
export function WorkGallery({ work }: WorkGalleryProps) {
  const { images } = work;
  const trackId = useId();
  const headingId = useId();
  const { trackRef, index, goTo } = useSnapIndex<HTMLDivElement>(images.length);
  const [viewing, setViewing] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <section className={styles.gallery} aria-labelledby={headingId}>
        <h2 id={headingId} className="label">
          전시 이미지
        </h2>
        <div className={styles.placeholder}>
          <WorkCover number={work.number} title={work.title} accent={work.accent} priority />
        </div>
        <p className={styles.note}>
          이 소장품의 이미지는 로컬 보관함에만 있습니다. 공개 사이트에는 저작권 때문에 자리 표시
          그래픽을 보여 줍니다.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.gallery} aria-roledescription="캐러셀" aria-labelledby={headingId}>
      <div className={styles.head}>
        <h2 id={headingId} className="label">
          전시 이미지 <span className="num">{images.length}</span>장
        </h2>
        <div className={styles.controls}>
          <Button
            className={styles.button}
            aria-controls={trackId}
            onPress={() => goTo(Math.max(0, index - 1))}
            isDisabled={index === 0}
          >
            이전
          </Button>
          <p className="num" aria-live="polite" aria-atomic="true">
            <span className="visually-hidden">이미지 </span>
            {index + 1} / {images.length}
          </p>
          <Button
            className={styles.button}
            aria-controls={trackId}
            onPress={() => goTo(Math.min(images.length - 1, index + 1))}
            isDisabled={index === images.length - 1}
          >
            다음
          </Button>
        </div>
      </div>
      <div id={trackId} ref={trackRef} className={styles.track}>
        {images.map((image, i) => (
          <div
            key={image.src}
            className={styles.slide}
            role="group"
            aria-roledescription="슬라이드"
            aria-label={`${i + 1} / ${images.length}`}
          >
            <button type="button" className={styles.open} onClick={() => setViewing(i)}>
              <img
                src={image.src}
                srcSet={image.srcSet}
                sizes="(min-width: 768px) 60vw, 90vw"
                width={image.width}
                height={image.height}
                alt={`${image.alt}, 크게 보기`}
                loading={i < 2 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'auto'}
                decoding="async"
              />
            </button>
          </div>
        ))}
      </div>
      <ImageViewer
        title={work.title}
        images={images}
        index={viewing}
        onIndexChange={(i) => {
          setViewing(i);
          goTo(i);
        }}
        onClose={() => setViewing(null)}
      />
    </section>
  );
}
