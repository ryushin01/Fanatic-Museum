import { Link, useLoaderData } from 'react-router';

import { findCategory } from '@/entities/category';
import { formatCreators } from '@/entities/work';
import type { Work } from '@/shared/api';
import { site } from '@/shared/config';
import { PageHeader } from '@/shared/ui';
import { WorkIndex } from '@/widgets/work-index';

import type { loader } from '../api/loader.server';
import styles from './timeline-page.module.css';

export function meta() {
  return [
    { title: `연표 — ${site.name}` },
    { name: 'description', content: '처음 나온 해 순서로 따라가는 서브컬처 대장정.' },
  ];
}

function groupByDecade(works: readonly Work[]) {
  const groups = new Map<number, Work[]>();
  for (const work of works) {
    const decade = Math.floor(work.firstReleased! / 10) * 10;
    groups.set(decade, [...(groups.get(decade) ?? []), work]);
  }
  return [...groups.entries()];
}

export function TimelinePage() {
  const { dated, undated } = useLoaderData<typeof loader>();
  const first = dated[0]?.firstReleased;
  const last = dated.at(-1)?.firstReleased;

  return (
    <>
      <PageHeader
        eyebrow={
          <span className="num">
            Timeline · {first}–{last}
          </span>
        }
        title="대장정 연표"
        description="작품이 처음 나온 해 순서로 따라갑니다. 연재·방영·발매가 시작된 해를 기준으로 합니다."
      />
      <div className="container">
        <div className={styles.decades}>
          {groupByDecade(dated).map(([decade, works]) => (
            <section key={decade} className={styles.decade} aria-labelledby={`decade-${decade}`}>
              <h2 id={`decade-${decade}`} className={styles.decadeTitle}>
                {decade}년대
              </h2>
              <ol className={styles.entries}>
                {works.map((work) => (
                  <li key={work.slug} className={styles.entry}>
                    <span className={styles.year}>{work.firstReleased}</span>
                    <h3 className={styles.title}>
                      <Link to={`/works/${work.slug}`} viewTransition prefetch="intent">
                        {work.title}
                      </Link>
                    </h3>
                    <p className={styles.meta}>
                      {work.categories.map((c) => findCategory(c)?.name).join(' · ')}
                      {work.creators.length > 0 && ` — ${formatCreators(work.creators)}`}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
        {undated.length > 0 && (
          <section className={styles.undated} aria-labelledby="undated-title">
            <h2 id="undated-title" className="label" style={{ marginBottom: 16 }}>
              연도를 정하지 않은 소장품
            </h2>
            <WorkIndex works={undated} />
          </section>
        )}
      </div>
    </>
  );
}
