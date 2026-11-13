import { useEffect } from 'react';
import { Button, Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';

import type { WorkImage } from '@/shared/api';

import styles from './image-viewer.module.css';

export interface ImageViewerProps {
  title: string;
  images: readonly WorkImage[];
  /** 보고 있는 이미지 번호(0부터). null이면 닫힘 */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/**
 * 이미지를 화면 가득 크게 보는 대화상자.
 * 좌우 화살표 키와 이전·다음 버튼으로 넘기고, Esc나 닫기 버튼으로 닫습니다.
 */
export function ImageViewer({ title, images, index, onIndexChange, onClose }: ImageViewerProps) {
  const image = index === null ? undefined : images[index];
  const total = images.length;

  const go = (step: number) => {
    if (index === null) return;
    const next = index + step;
    if (next >= 0 && next < total) onIndexChange(next);
  };

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
                {image && (
                  <img
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
              <div className={styles.controls}>
                <Button className={styles.button} onPress={() => go(-1)} isDisabled={index === 0}>
                  이전 이미지
                </Button>
                <p className="num" aria-live="polite">
                  {index === null ? 0 : index + 1} / {total}
                </p>
                <Button
                  className={styles.button}
                  onPress={() => go(1)}
                  isDisabled={index === total - 1}
                >
                  다음 이미지
                </Button>
              </div>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
