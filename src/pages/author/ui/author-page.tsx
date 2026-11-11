import { useLoaderData } from 'react-router';

import { site } from '@/shared/config';
import { PageHeader } from '@/shared/ui';
import { WorkIndex } from '@/widgets/work-index';

import type { loader } from '../api/loader.server';
import styles from './author-page.module.css';

export function meta({ loaderData }: { loaderData?: Awaited<ReturnType<typeof loader>> }) {
  if (!loaderData) return [{ title: `작가 — ${site.name}` }];
  return [
    { title: `${loaderData.author.name} — ${site.name}` },
    { name: 'description', content: loaderData.author.summary },
  ];
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
