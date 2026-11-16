import { useLoaderData } from 'react-router';

import { site } from '@/shared/config';
import { absoluteUrl, breadcrumbList, pageMeta } from '@/shared/lib';
import { errorTitle, PageHeader } from '@/shared/ui';
import { WorkIndex } from '@/widgets/work-index';

import type { loader } from '../api/loader.server';
import styles from './author-page.module.css';

export function meta({
  loaderData,
  error,
}: {
  loaderData?: Awaited<ReturnType<typeof loader>>;
  error?: unknown;
}) {
  if (!loaderData) return [{ title: errorTitle(error) }, { name: 'robots', content: 'noindex' }];
  const { author } = loaderData;
  const path = `/authors/${author.slug}`;
  return pageMeta({
    title: `${author.name} — ${site.name}`,
    shareTitle: author.name,
    description: author.summary,
    path,
    jsonLd: [
      {
        '@type': 'Person',
        name: author.name,
        jobTitle: author.occupation,
        description: author.summary,
        ...(author.born && { birthDate: String(author.born) }),
        url: absoluteUrl(path),
        sameAs: [author.reference],
      },
      breadcrumbList([
        { name: '홈', path: '/' },
        { name: '작가', path: '/authors' },
        { name: author.name, path },
      ]),
    ],
  });
}

export function AuthorPage() {
  const { author, works } = useLoaderData<typeof loader>();

  return (
    <>
      <PageHeader eyebrow={author.occupation} title={author.name} description={author.summary}>
        <dl className={styles.facts}>
          {author.born && (
            <div>
              <dt>태어난 해</dt>
              <dd className="num">{author.born}년</dd>
            </div>
          )}
          {author.debut && (
            <div>
              <dt>데뷔</dt>
              <dd>{author.debut}</dd>
            </div>
          )}
          <div>
            <dt>소장품</dt>
            <dd className="num">{works.length}점</dd>
          </div>
        </dl>
        <a className={styles.reference} href={author.reference} rel="noreferrer" target="_blank">
          참고 문서(나무위키)<span className="visually-hidden">, 새 창</span>
        </a>
      </PageHeader>
      <section className="container" aria-labelledby="author-works">
        <h2 id="author-works" className={styles.worksTitle}>
          소장품
        </h2>
        <WorkIndex works={works} />
      </section>
    </>
  );
}
