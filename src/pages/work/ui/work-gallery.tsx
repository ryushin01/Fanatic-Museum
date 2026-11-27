import * as m from 'motion/react-m';
import { useId, useState } from 'react';

import { WorkCover } from '@/entities/work';
import type { Work } from '@/shared/api';
import { useImageFailures, useSnapIndex } from '@/shared/lib';
import { MotionFeatures } from '@/shared/motion';
import { StepButtons } from '@/shared/ui';

import { ImageViewer, LAYOUT_TRANSITION } from './image-viewer';

import styles from './work-gallery.module.css';

export interface WorkGalleryProps {
  work: Pick<Work, 'title' | 'number' | 'accent' | 'images'>;
}

/**
 * 작품 이미지 캐러셀(WAI-ARIA APG Carousel 패턴, 자동 넘김 없음).
 * 손가락으로 밀거나 이전·다음 버튼으로 넘기고, 이미지를 누르면 크게 봅니다.
 * 크게 보기는 누른 썸네일이 그 자리에서 커지며 열리고(Motion layoutId), 닫으면 썸네일 자리로 돌아갑니다.
 * 받지 못한 이미지(보관함에서 지움, 네트워크 끊김)는 빼고, 하나도 없으면 자리 표시 그래픽을 보여 줍니다.
 */
export function WorkGallery({ work }: WorkGalleryProps) {
  const { failed, track } = useImageFailures();
  const images = work.images.filter((image) => !failed.has(image.src));
  const trackId = useId();
  const headingId = useId();
  const { trackRef, index, goTo } = useSnapIndex<HTMLDivElement>(images.length);
  const layoutId = useId();
  const [viewing, setViewing] = useState<number | null>(null);
  // 크게 보기 안에서 넘긴 뒤에는 썸네일에서 날아오지 않고 바로 바꿉니다.
  const [moved, setMoved] = useState(false);

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
    <MotionFeatures>
      <section className={styles.gallery} aria-roledescription="캐러셀" aria-labelledby={headingId}>
        <div className={styles.head}>
          <h2 id={headingId} className="label">
            전시 이미지 <span className="num">{images.length}</span>장
          </h2>
          <StepButtons index={index} count={images.length} onChange={goTo} controls={trackId}>
            <p className="num" aria-live="polite" aria-atomic="true">
              <span className="visually-hidden">이미지 </span>
              {index + 1} / {images.length}
            </p>
          </StepButtons>
        </div>
        <m.div id={trackId} ref={trackRef} className={styles.track} layoutScroll>
          {images.map((image, i) => (
            <div
              key={image.src}
              className={styles.slide}
              role="group"
              aria-roledescription="슬라이드"
              aria-label={`${i + 1} / ${images.length}`}
            >
              <button
                type="button"
                className={styles.open}
                onClick={() => {
                  setMoved(false);
                  setViewing(i);
                }}
              >
                <m.img
                  {...track(image.src)}
                  layoutId={`${layoutId}-${i}`}
                  // 크게 보기가 열려 있는 동안 넘겨서 썸네일이 되돌아올 때는 바로 제자리로 옵니다.
                  transition={{ layout: viewing === null ? LAYOUT_TRANSITION : { duration: 0 } }}
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
        </m.div>
        <ImageViewer
          title={work.title}
          images={images}
          index={viewing}
          layoutId={layoutId}
          instant={moved}
          onIndexChange={(i) => {
            setMoved(true);
            setViewing(i);
            goTo(i);
          }}
          onClose={() => setViewing(null)}
        />
      </section>
    </MotionFeatures>
  );
}
