import { Link } from 'react-router';

import { findCategory } from '@/entities/category';
import { WorkCover } from '@/entities/work';
import type { Work } from '@/shared/api';
import { padNumber } from '@/shared/lib';

import styles from './work-index.module.css';

export interface WorkIndexProps {
  works: readonly Work[];
  /** 각 행 제목의 제목 수준. 페이지 구조에 맞춰 정합니다. */
  headingLevel?: 2 | 3;
  emptyMessage?: string;
}

/** 전시 번호순 소장품 목록. 행 전체가 상세 페이지 링크입니다. */
export function WorkIndex({
  works,
  headingLevel = 3,
  emptyMessage = '소장품이 없습니다.',
}: WorkIndexProps) {
  const Heading = `h${headingLevel}` as const;

  if (works.length === 0) return <p className={styles.empty}>{emptyMessage}</p>;

  return (
    <ol className={styles.list}>
      {works.map((work) => (
        <li key={work.slug} className={styles.row}>
          <span className={styles.number} aria-hidden="true">
            {padNumber(work.number)}
          </span>
          <Heading className={styles.title}>
            <Link to={`/works/${work.slug}`} viewTransition>
              <span className="visually-hidden">{work.number}번 </span>
              {work.title}
            </Link>
            {(work.originalTitle || work.nickname) && (
              <span className={styles.original}>
                {[work.nickname, work.originalTitle].filter(Boolean).join(' · ')}
              </span>
            )}
          </Heading>
          <ul className={styles.tags} aria-label="분류">
            {work.categories.map((slug) => (
              <li key={slug} className={styles.tag}>
                {findCategory(slug)?.name ?? slug}
              </li>
            ))}
            <li className={styles.tag}>{work.origin}</li>
          </ul>
          <p className={styles.summary}>{work.summary}</p>
          <div className={styles.thumb}>
            <WorkCover
              number={work.number}
              title={work.title}
              accent={work.accent}
              image={work.images[0]}
              sizes="96px"
              alt=""
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
