import { Link, useLoaderData } from 'react-router';

import { site } from '@/shared/config';
import { padNumber } from '@/shared/lib';
import { ExhibitStrip } from './exhibit-strip';
import { WorkIndex } from '@/widgets/work-index';

import type { loader } from '../api/loader.server';
import styles from './home-page.module.css';

export function meta() {
  return [
    { title: `${site.name} — ${site.tagline}` },
    { name: 'description', content: site.description },
    { property: 'og:title', content: `${site.name} — ${site.tagline}` },
    { property: 'og:description', content: site.description },
  ];
}

export function HomePage() {
  const { works, categories } = useLoaderData<typeof loader>();
  const origins = new Set(works.map((w) => w.origin));
  const years = works.flatMap((w) => (w.firstReleased ? [w.firstReleased] : []));
  const since = Math.min(...years);

  return (
    <>
      <section className={`container ${styles.hero}`} aria-labelledby="home-title">
        <div className={`label ${styles.eyebrow}`}>
          <span>{site.koreanName}</span>
          <span className="num">{since} — Now</span>
        </div>
        <h1 id="home-title" className={styles.title}>
          <span className={styles.titleLine}>Fanatic</span>
          <span className={styles.titleLine}>
            Museum<span className={styles.accent}>.</span>
          </span>
          <span className={`${styles.titleLine} ${styles.accent}`}>{site.tagline}</span>
        </h1>
        <div className={styles.intro}>
          <p className={styles.lede}>
            사이버 포뮬러의 아스라다에서 시작해 Fate와 소드 아트 온라인, 파이널 판타지와 창세기전,
            이영도와 이경영의 판타지 소설, 박성우·박진환의 만화까지. 한 사람의 서브컬처 대장정을
            소장품처럼 번호를 붙여 전시합니다.
          </p>
          <dl className={styles.stats}>
            <div>
              <dt>소장품</dt>
              <dd>{works.length}</dd>
            </div>
            <div>
              <dt>카테고리</dt>
              <dd>{categories.length}</dd>
            </div>
            <div>
              <dt>나라</dt>
              <dd>{origins.size}</dd>
            </div>
          </dl>
        </div>
      </section>

      <ExhibitStrip title="전시실" description="밀어서 둘러보기" works={works} />

      <section className={`container ${styles.section}`} aria-labelledby="home-works">
        <div className={styles.sectionHead}>
          <h2 id="home-works" className={styles.sectionTitle}>
            소장품 목록
          </h2>
          <Link to="/works" className={styles.more}>
            찾아보기
          </Link>
        </div>
        <WorkIndex works={works} />
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="home-categories">
        <div className={styles.sectionHead}>
          <h2 id="home-categories" className={styles.sectionTitle}>
            카테고리
          </h2>
        </div>
        <ul className={styles.categories}>
          {categories.map((category, i) => (
            <li key={category.slug} className={styles.category}>
              <Link to={`/categories/${category.slug}`} viewTransition prefetch="intent">
                <span className={styles.categoryIndex} aria-hidden="true">
                  {padNumber(i + 1, 2)}
                </span>
                <span className={styles.categoryName}>
                  {category.name}
                  <small lang="en">{category.englishName}</small>
                </span>
                <span className={styles.categoryCount}>{category.count}점</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
