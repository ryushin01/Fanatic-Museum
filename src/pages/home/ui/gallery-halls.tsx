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
 * 카테고리를 전시관처럼 한 칸씩 보여 줍니다. 더 현대 서울처럼 큰 공간이 들어오며 화면을 채우듯 펼쳐지고,
 * 지나갈 때 작아지며 어두워집니다. 화면에 붙이지 않으므로 화면이 낮거나 글자를 키워도 내용이 가려지지 않습니다.
 * 움직임은 CSS 스크롤 타임라인으로만 만들고, 지원하지 않거나 동작 줄이기를 켜면 정지 화면입니다.
 */
export function GalleryHalls({ categories, works }: GalleryHallsProps) {
  return (
    <section className={styles.halls} aria-labelledby="home-categories">
      <div className={`container ${styles.head}`}>
        <h2 id="home-categories" className={styles.title}>
          전시관
        </h2>
        <p className="label">카테고리별로 걸어 보기</p>
      </div>
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
                <span className={styles.caption}>
                  <span className={styles.hallNo} aria-hidden="true">
                    Hall {padNumber(i + 1, 2)}
                  </span>
                  <span className={styles.name}>
                    {category.name}
                    <small lang="en">{category.englishName}</small>
                  </span>
                  <span className={styles.description}>{category.description}</span>
                  <span className={styles.count}>{category.count}점 전시 중</span>
                </span>
                <span className={styles.wall} aria-hidden="true">
                  {pieces.map((work, p) => (
                    <span key={work.slug} className={styles.piece} data-depth={p}>
                      <WorkCover
                        number={work.number}
                        title={work.title}
                        accent={work.accent}
                        image={work.images[0]}
                        sizes="(min-width: 900px) 22vw, 40vw"
                        alt=""
                      />
                    </span>
                  ))}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
