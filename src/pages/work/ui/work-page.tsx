import { Link, useLoaderData } from 'react-router';

import { findCategory } from '@/entities/category';
import { site } from '@/shared/config';
import { padNumber } from '@/shared/lib';
import { PageHeader } from '@/shared/ui';
import { WorkGallery } from './work-gallery';
import { WorkIndex } from '@/widgets/work-index';

import type { loader } from '../api/loader.server';
import styles from './work-page.module.css';

export function meta({ loaderData }: { loaderData?: Awaited<ReturnType<typeof loader>> }) {
  if (!loaderData) return [{ title: `소장품 — ${site.name}` }];
  const { work } = loaderData;
  return [
    { title: `${work.title} — ${site.name}` },
    { name: 'description', content: work.summary },
    { property: 'og:title', content: work.title },
    { property: 'og:description', content: work.summary },
  ];
}

export function WorkPage() {
  const { work, previous, next, related } = useLoaderData<typeof loader>();

  return (
    <article>
      <PageHeader
        eyebrow={
          <span className="num">
            No. {padNumber(work.number)} ·{' '}
            {work.categories.map((c) => findCategory(c)?.name).join(' / ')}
          </span>
        }
        title={work.title}
      >
        {(work.originalTitle || work.nickname) && (
          <p className={styles.original}>
            {[work.nickname, work.originalTitle].filter(Boolean).join(' · ')}
          </p>
        )}
      </PageHeader>

      <div className="container">
        <div className={styles.body}>
          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt>분류</dt>
              <dd>
                {work.categories.map((slug) => (
                  <Link key={slug} to={`/categories/${slug}`}>
                    {findCategory(slug)?.name ?? slug}
                  </Link>
                ))}
              </dd>
            </div>
            {work.creators.map((creator) => (
              <div key={`${creator.role}-${creator.name}`} className={styles.fact}>
                <dt>{creator.role}</dt>
                <dd>{creator.name}</dd>
              </div>
            ))}
            <div className={styles.fact}>
              <dt>나라</dt>
              <dd>{work.origin}</dd>
            </div>
            {work.firstReleased && (
              <div className={styles.fact}>
                <dt>처음 나온 해</dt>
                <dd className="num">{work.firstReleased}년</dd>
              </div>
            )}
          </dl>
          <div>
            <p className={styles.summary}>{work.summary}</p>
            {work.notes && work.notes.length > 0 && (
              <ul className={styles.notes} aria-label="전시 메모">
                {work.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className={styles.gallery}>
          <WorkGallery work={work} />
        </div>

        {related.length > 0 && (
          <section className={styles.related} aria-labelledby="related-title">
            <h2 id="related-title" className={styles.relatedTitle}>
              함께 보면 좋은 소장품
            </h2>
            <WorkIndex works={related} />
          </section>
        )}

        <nav className={styles.pager} aria-label="이전·다음 소장품">
          <div>
            {previous && (
              <Link to={`/works/${previous.slug}`} viewTransition>
                <span className="label">이전 소장품 {padNumber(previous.number)}</span>
                <strong>{previous.title}</strong>
              </Link>
            )}
          </div>
          <div className={styles.next}>
            {next && (
              <Link to={`/works/${next.slug}`} viewTransition>
                <span className="label">다음 소장품 {padNumber(next.number)}</span>
                <strong>{next.title}</strong>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </article>
  );
}
