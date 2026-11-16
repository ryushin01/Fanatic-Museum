import { Link, useLoaderData } from 'react-router';

import { categories } from '@/entities/category';
import { site } from '@/shared/config';
import { absoluteUrl, breadcrumbList, pageMeta } from '@/shared/lib';
import { errorTitle, PageHeader } from '@/shared/ui';
import { WorkIndex } from '@/widgets/work-index';

import type { loader } from '../api/loader.server';
import styles from './category-page.module.css';

export function meta({
  loaderData,
  error,
}: {
  loaderData?: Awaited<ReturnType<typeof loader>>;
  error?: unknown;
}) {
  if (!loaderData) return [{ title: errorTitle(error) }, { name: 'robots', content: 'noindex' }];
  const { category } = loaderData;
  const path = `/categories/${category.slug}`;
  return pageMeta({
    title: `${category.name} — ${site.name}`,
    description: category.description,
    path,
    jsonLd: [
      {
        '@type': 'CollectionPage',
        name: category.name,
        description: category.description,
        url: absoluteUrl(path),
      },
      breadcrumbList([
        { name: '홈', path: '/' },
        { name: category.name, path },
      ]),
    ],
  });
}

export function CategoryPage() {
  const { category, works } = useLoaderData<typeof loader>();

  return (
    <>
      <PageHeader
        eyebrow={category.englishName}
        title={category.name}
        description={category.description}
      >
        <nav aria-label="카테고리 바꾸기">
          <ul className={styles.tabs}>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  to={`/categories/${c.slug}`}
                  className={styles.tab}
                  aria-current={c.slug === category.slug ? 'page' : undefined}
                  preventScrollReset
                  viewTransition
                  prefetch="intent"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>
      <section className="container" aria-label={`${category.name} 소장품 ${works.length}점`}>
        <WorkIndex works={works} headingLevel={2} />
      </section>
    </>
  );
}
