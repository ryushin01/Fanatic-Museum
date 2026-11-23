import { Link, useLoaderData } from 'react-router';

import { site } from '@/shared/config';
import { absoluteUrl, padNumber, pageMeta } from '@/shared/lib';
import { ArrowLink } from '@/shared/ui';
import { ExhibitStrip } from './exhibit-strip';
import { GalleryHalls } from './gallery-halls';
import { LineField } from './line-field';
import { WorkIndex } from '@/widgets/work-index';

import type { loader } from '../api/loader.server';
import styles from './home-page.module.css';

export function meta() {
  return pageMeta({
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    path: '/',
    jsonLd: [
      {
        '@type': 'WebSite',
        name: site.name,
        alternateName: site.koreanName,
        url: absoluteUrl('/'),
        description: site.description,
        inLanguage: 'ko',
      },
    ],
  });
}

export function HomePage() {
  const { works, categories } = useLoaderData<typeof loader>();
  const origins = new Set(works.map((w) => w.origin));
  const years = works.flatMap((w) => (w.firstReleased ? [w.firstReleased] : []));
  const since = Math.min(...years);
  const shown = categories.filter((c) => c.count > 0);

  return (
    <>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroText}>
          <h1 id="home-title" className={styles.title}>
            <span className={styles.titleLine}>{site.name}.</span>
            <span className={styles.titleLine}>{site.tagline}.</span>
          </h1>
          <p className={styles.lede}>
            사이버 포뮬러의 아스라다에서 시작해 Fate와 소드 아트 온라인, 파이널 판타지와 창세기전,
            이영도·이경영·박건의 판타지 소설, 박성우·박진환의 만화까지. 한 사람의 서브컬처 대장정을
            소장품처럼 번호를 붙여 전시합니다.
          </p>
        </div>
        <LineField>
          <span className={styles.fieldMark}>
            <span className="num">
              {padNumber(1)}—{padNumber(works.length)}
            </span>
          </span>
        </LineField>
        <div className={styles.now}>
          <p className="label">지금 전시 중인 카테고리</p>
          <ul className={styles.chips}>
            {shown.map((category) => (
              <li key={category.slug}>
                <Link
                  to={`/categories/${category.slug}`}
                  className={styles.chip}
                  viewTransition
                  prefetch="intent"
                >
                  <span className={styles.chipName}>{category.name}</span>
                  <span className="visually-hidden">, {category.count}점</span>
                  <span className={styles.chipHover} aria-hidden="true">
                    {category.count}점 전시 중
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <ArrowLink to="/works" className={styles.nowMore}>
            소장품 둘러보기
          </ArrowLink>
        </div>
      </section>

      <ExhibitStrip title="전시실" description="밀어서 둘러보기" works={works} />

      <section className={styles.stats} aria-label="숫자로 보는 박물관">
        <dl className={styles.statList}>
          <div>
            <dt className="label">소장품</dt>
            <dd className="num">{works.length}</dd>
          </div>
          <div>
            <dt className="label">카테고리</dt>
            <dd className="num">{categories.length}</dd>
          </div>
          <div>
            <dt className="label">나라</dt>
            <dd className="num">{origins.size}</dd>
          </div>
          <div>
            <dt className="label">가장 오래된 소장품</dt>
            <dd className="num">{since}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="home-works">
        <div className="rule-head">
          <p className="label" aria-hidden="true">
            Collection
          </p>
          <p className={`label ${styles.headCount}`}>
            <span className="num">{padNumber(works.length, 2)}</span>점
          </p>
        </div>
        <div className={styles.sectionHead}>
          <h2 id="home-works" className={styles.sectionTitle}>
            소장품 목록
          </h2>
          <ArrowLink to="/works" className={styles.more}>
            찾아보기
          </ArrowLink>
        </div>
        <WorkIndex works={works} />
      </section>

      <GalleryHalls categories={categories} works={works} />
    </>
  );
}
