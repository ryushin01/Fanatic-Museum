import { useId } from 'react';
import { Button } from 'react-aria-components';
import { Link } from 'react-router';

import { WorkCover } from '@/entities/work';
import type { Work } from '@/shared/api';
import { padNumber, useSnapIndex } from '@/shared/lib';

import styles from './exhibit-strip.module.css';

export interface ExhibitStripProps {
  title: string;
  description?: string;
  works: readonly Work[];
}

/** 소장품 표지를 가로로 늘어놓은 전시 띠. 밀어서 넘기거나 버튼으로 넘깁니다. */
export function ExhibitStrip({ title, description, works }: ExhibitStripProps) {
  const headingId = useId();
  const listId = useId();
  const { trackRef, index, goTo } = useSnapIndex<HTMLOListElement>(works.length);

  return (
    <section className={styles.strip} aria-labelledby={headingId}>
      <div className={`container ${styles.head}`}>
        <div>
          <h2 id={headingId} className={styles.title}>
            {title}
          </h2>
          {description && <p className="label">{description}</p>}
        </div>
        <div className={styles.controls}>
          <Button
            className={styles.button}
            aria-controls={listId}
            onPress={() => goTo(Math.max(0, index - 1))}
            isDisabled={index === 0}
          >
            이전
          </Button>
          <Button
            className={styles.button}
            aria-controls={listId}
            onPress={() => goTo(Math.min(works.length - 1, index + 1))}
            isDisabled={index === works.length - 1}
          >
            다음
          </Button>
        </div>
      </div>
      <ol id={listId} ref={trackRef} className={styles.track}>
        {works.map((work, i) => (
          <li key={work.slug} className={styles.item}>
            <Link
              to={`/works/${work.slug}`}
              className={styles.link}
              viewTransition
              prefetch="intent"
            >
              <div className={styles.coverWrap}>
                <WorkCover
                  number={work.number}
                  title={work.title}
                  accent={work.accent}
                  image={work.images[0]}
                  sizes="(min-width: 768px) 360px, 78vw"
                  priority={i < 2}
                  alt=""
                />
              </div>
              <span className={styles.meta}>
                <span className={styles.name}>{work.title}</span>
                <span className={styles.num} aria-hidden="true">
                  {padNumber(work.number)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
