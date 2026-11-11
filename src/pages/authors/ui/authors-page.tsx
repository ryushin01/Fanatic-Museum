import { Link, useLoaderData } from 'react-router';

import { site } from '@/shared/config';
import { PageHeader } from '@/shared/ui';

import type { loader } from '../api/loader.server';
import styles from './authors-page.module.css';

export function meta() {
  return [
    { title: `작가 — ${site.name}` },
    {
      name: 'description',
      content: '박성우, 박진환, 이경영, 이영도. 대장정을 함께한 한국 만화가와 판타지 소설가.',
    },
  ];
}

export function AuthorsPage() {
  const { authors } = useLoaderData<typeof loader>();

  return (
    <>
      <PageHeader
        eyebrow="Authors"
        title="작가"
        description="서가와 만화방에서 만난 한국의 만화가와 판타지 소설가. 작가마다 소장품을 모아 봅니다."
      />
      <ul className={`container ${styles.list}`}>
        {authors.map((author) => (
          <li key={author.slug} className={styles.item}>
            <p className="label">
              {author.occupation}
              {'born' in author && ` · ${author.born}년생`}
            </p>
            <h2 className={styles.name}>
              <Link to={`/authors/${author.slug}`} viewTransition prefetch="intent">
                {author.name}
              </Link>
            </h2>
            <p className={styles.summary}>{author.summary}</p>
            <p className={styles.works}>
              소장품 {author.works.length}점 — {author.works.map((w) => w.title).join(', ')}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
