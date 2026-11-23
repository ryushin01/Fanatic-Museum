import { Link } from 'react-router';

import { WorkCover } from '@/entities/work';
import type { CategorySummary, Work } from '@/shared/api';
import { padNumber } from '@/shared/lib';

import styles from './gallery-halls.module.css';

export interface GalleryHallsProps {
  categories: readonly CategorySummary[];
  works: readonly Work[];
}

/** 전시관 하나에 걸어 둘 대표 소장품 수 */
const PIECES = 3;

/**
 * 카테고리를 전시관 카드로 늘어놓습니다. 옅은 회색 카드 위쪽에 대표 소장품 세 점을 걸고,
 * 아래쪽에 이름·설명·전시 수를 둡니다. 카드 전체가 카테고리 페이지 링크입니다.
 */
export function GalleryHalls({ categories, works }: GalleryHallsProps) {
  return (
    <section className={styles.halls} aria-labelledby="home-categories">
      <div className="rule-head">
        <h2 id="home-categories" className="label">
          전시관
        </h2>
        <p className="label">카테고리별로 걸어 보기</p>
      </div>
      <p className={styles.statement}>
        게임부터 프라모델까지, {categories.length}개의 전시관을 차례로 걷습니다.
      </p>
      <ol className={styles.list}>
        {categories.map((category, i) => {
          const pieces = works.filter((w) => w.categories.includes(category.slug)).slice(0, PIECES);
          return (
            <li key={category.slug} className={styles.hall}>
              <Link
                to={`/categories/${category.slug}`}
                className={styles.room}
                viewTransition
                prefetch="intent"
              >
                <span className={styles.wall} aria-hidden="true">
                  {pieces.map((work, p) => (
                    <span key={work.slug} className={styles.piece} data-depth={p}>
                      <WorkCover
                        number={work.number}
                        title={work.title}
                        accent={work.accent}
                        image={work.images[0]}
                        sizes="(min-width: 1024px) 7vw, 22vw"
                        alt=""
                      />
                    </span>
                  ))}
                </span>
                <span className={styles.caption}>
                  <span className={`label ${styles.hallNo}`} aria-hidden="true">
                    Hall {padNumber(i + 1, 2)}
                  </span>
                  <span className={styles.name}>
                    {category.name}
                    <small lang="en">{category.englishName}</small>
                  </span>
                  <span className={styles.description}>{category.description}</span>
                  <span className={`label ${styles.count}`}>{category.count}점 전시 중</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
