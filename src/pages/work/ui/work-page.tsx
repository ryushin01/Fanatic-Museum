import { Link, useLoaderData } from 'react-router';

import { findCategory } from '@/entities/category';
import { OriginalTitle } from '@/entities/work';
import { site } from '@/shared/config';
import { breadcrumbList, padNumber, pageMeta } from '@/shared/lib';
import { errorTitle, PageHeader } from '@/shared/ui';
import { WorkGallery } from './work-gallery';
import { WorkIndex } from '@/widgets/work-index';

import type { loader } from '../api/loader.server';
import { workJsonLd } from '../model/structured-data';
import styles from './work-page.module.css';

export function meta({
  loaderData,
  error,
}: {
  loaderData?: Awaited<ReturnType<typeof loader>>;
  error?: unknown;
}) {
  if (!loaderData) return [{ title: errorTitle(error) }, { name: 'robots', content: 'noindex' }];
  const { work } = loaderData;
  const path = `/works/${work.slug}`;
  return pageMeta({
    title: `${work.title} — ${site.name}`,
    shareTitle: work.title,
    description: work.summary,
    path,
    jsonLd: [
      workJsonLd(work),
      breadcrumbList([
        { name: '홈', path: '/' },
        { name: '소장품', path: '/works' },
        { name: work.title, path },
      ]),
    ],
  });
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
        <OriginalTitle work={work} className={styles.original} as="p" />
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
                <dd>
                  {creator.author ? (
                    <Link to={`/authors/${creator.author}`} prefetch="intent">
                      {creator.name}
                    </Link>
                  ) : (
                    creator.name
                  )}
                </dd>
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
              <Link to={`/works/${previous.slug}`} viewTransition prefetch="intent">
                <span className="label">이전 소장품 {padNumber(previous.number)}</span>
                <strong>{previous.title}</strong>
              </Link>
            )}
          </div>
          <div className={styles.next}>
            {next && (
              <Link to={`/works/${next.slug}`} viewTransition prefetch="intent">
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
