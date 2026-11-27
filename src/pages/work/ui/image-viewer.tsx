import * as m from 'motion/react-m';
import { useEffect } from 'react';
import { Button, Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';

import type { WorkImage } from '@/shared/api';
import { useImageFailures } from '@/shared/lib';
import { StepButtons } from '@/shared/ui';

import styles from './image-viewer.module.css';

/** 썸네일 ↔ 크게 보기 공유 레이아웃 전환(배경이 깔리는 240ms 페이드와 같은 감속 곡선) */
export const LAYOUT_TRANSITION = { duration: 0.32, ease: [0.22, 1, 0.36, 1] } as const;

export interface ImageViewerProps {
  title: string;
  images: readonly WorkImage[];
  /** 보고 있는 이미지 번호(0부터). null이면 닫힘 */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** 썸네일과 같은 layoutId 앞부분(`${layoutId}-${번호}`). 주면 썸네일에서 커지며 열립니다. */
  layoutId?: string;
  /** true면 전환 없이 바로 바꿉니다(크게 보기 안에서 넘긴 뒤). */
  instant?: boolean;
}

/**
 * 이미지를 화면 가득 크게 보는 대화상자.
 * 좌우 화살표 키와 이전·다음 버튼으로 넘기고, Esc나 닫기 버튼으로 닫습니다.
 */
export function ImageViewer({
  title,
  images,
  index,
  onIndexChange,
  onClose,
  layoutId,
  instant = false,
}: ImageViewerProps) {
  const image = index === null ? undefined : images[index];
  const total = images.length;
  // 썸네일은 받았어도 큰 변환본을 받지 못할 수 있습니다(보관함에서 지움, 네트워크 끊김).
  const { failed, track } = useImageFailures();

  // 열려 있는 동안 좌우 화살표 키로 넘깁니다.
  useEffect(() => {
    if (index === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' && index < total - 1) onIndexChange(index + 1);
      if (event.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [index, total, onIndexChange]);

  return (
    <ModalOverlay
      className={styles.overlay}
      isOpen={image !== undefined}
      onOpenChange={(open) => !open && onClose()}
      isDismissable
    >
      <Modal className={styles.modal}>
        <Dialog className={styles.dialog}>
          {({ close }) => (
            <>
              <div className={styles.bar}>
                <Heading slot="title" className={styles.heading}>
                  {title} 이미지 크게 보기
                </Heading>
                <Button className={styles.button} onPress={close}>
                  닫기
                </Button>
              </div>
              <figure className={styles.stage}>
                {image && failed.has(image.src) && (
                  <p className={styles.missing} role="status">
                    이 이미지를 불러오지 못했습니다. 네트워크가 끊겼거나 로컬 보관함에 파일이
                    없습니다.
                  </p>
                )}
                {image && !failed.has(image.src) && (
                  <m.img
                    {...track(image.src)}
                    key={image.src}
                    layoutId={layoutId === undefined ? undefined : `${layoutId}-${index}`}
                    transition={{ layout: instant ? { duration: 0 } : LAYOUT_TRANSITION }}
                    className={styles.image}
                    src={image.src}
                    srcSet={image.srcSet}
                    sizes="100vw"
                    width={image.width}
                    height={image.height}
                    alt={image.alt}
                  />
                )}
              </figure>
              <StepButtons
                index={index ?? 0}
                count={total}
                onChange={onIndexChange}
                previousLabel="이전 이미지"
                nextLabel="다음 이미지"
                className={styles.controls}
                buttonClassName={styles.button}
                trailing={
                  image?.sourcePage && (
                    <a
                      className={styles.source}
                      href={image.sourcePage}
                      rel="noreferrer"
                      target="_blank"
                    >
                      원본 출처<span className="visually-hidden">(새 창)</span>
                    </a>
                  )
                }
              >
                <p className="num" aria-live="polite">
                  {index === null ? 0 : index + 1} / {total}
                </p>
              </StepButtons>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
