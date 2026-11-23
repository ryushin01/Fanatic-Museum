import { observer } from 'mobx-react-lite';
import { useLoaderData } from 'react-router';

import { categories, CATEGORY_SLUGS } from '@/entities/category';
import { useWorkFilter } from '../model/use-work-filter';
import { WorkFilter } from './work-filter';
import { site } from '@/shared/config';
import { absoluteUrl, breadcrumbList, pageMeta } from '@/shared/lib';
import { PageHeader } from '@/shared/ui';
import { WorkIndex } from '@/widgets/work-index';

import type { loader } from '../api/loader.server';

const DESCRIPTION = '파나틱 뮤지엄의 소장품 전체를 제목, 작가, 분류로 찾아봅니다.';

export function meta() {
  return pageMeta({
    title: `소장품 — ${site.name}`,
    description: DESCRIPTION,
    path: '/works',
    jsonLd: [
      {
        '@type': 'CollectionPage',
        name: '소장품',
        description: DESCRIPTION,
        url: absoluteUrl('/works'),
      },
      breadcrumbList([
        { name: '홈', path: '/' },
        { name: '소장품', path: '/works' },
      ]),
    ],
  });
}

export const WorksPage = observer(function WorksPage() {
  const { works } = useLoaderData<typeof loader>();
  const { store, onChange } = useWorkFilter(works, CATEGORY_SLUGS);

  return (
    <>
      <PageHeader
        eyebrow="Collection"
        title="소장품"
        description="애니메이션부터 프라모델까지, 전시 번호순으로 늘어놓은 대장정의 기록입니다."
      />
      <div className="container">
        <WorkFilter
          value={store.filter}
          onChange={onChange}
          categories={categories}
          resultCount={store.resultCount}
          total={store.total}
        />
        <h2 className="visually-hidden">검색 결과</h2>
        <div style={{ marginTop: 32 }}>
          <WorkIndex
            works={store.results}
            emptyMessage="조건에 맞는 소장품이 없습니다. 검색어나 분류를 바꿔 보세요."
          />
        </div>
      </div>
    </>
  );
});
