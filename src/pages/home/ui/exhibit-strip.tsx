import { useId } from 'react';
import { Link } from 'react-router';

import { findCategory } from '@/entities/category';
import { WorkCover } from '@/entities/work';
import type { Work } from '@/shared/api';
import { padNumber, useSnapIndex } from '@/shared/lib';
import { StepButtons } from '@/shared/ui';

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
      <div className={`rule-head ${styles.head}`}>
        <div className={styles.titleGroup}>
          <h2 id={headingId} className="label">
            {title}
          </h2>
          {description && <p className={`label ${styles.description}`}>{description}</p>}
        </div>
        <StepButtons
          index={index}
          count={works.length}
          onChange={goTo}
          controls={listId}
          className={styles.controls}
          buttonClassName={styles.step}
        >
          <p className={`label num ${styles.counter}`} aria-hidden="true">
            {padNumber(index + 1, 2)} <span>{'\\'}</span> {padNumber(works.length, 2)}
          </p>
        </StepButtons>
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
                  ratio="868 / 461"
                  sizes="(min-width: 768px) 50vw, 88vw"
                  priority={i < 2}
                  alt=""
                />
              </div>
              <span className={styles.meta}>
                <span className={styles.metaLines}>
                  <span className={styles.name}>{work.title}</span>
                  <span className="label">
                    {work.categories.map((slug) => findCategory(slug)?.name ?? slug).join(' · ')}
                    {work.firstReleased ? ` · ${work.firstReleased}` : ''}
                  </span>
                </span>
                <span className={`label ${styles.num}`} aria-hidden="true">
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
