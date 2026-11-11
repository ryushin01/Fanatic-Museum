import { useCallback, useDeferredValue, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import type { CategorySlug, Work } from '@/shared/api';

import { filterWorks, type WorkFilter } from './filter';

/** 검색 조건을 주소의 ?q=&c= 에 두고, 입력이 잦은 검색은 지연값으로 거릅니다. */
export function useWorkFilter(works: readonly Work[], validCategories: readonly CategorySlug[]) {
  const [params, setParams] = useSearchParams();

  const value = useMemo<WorkFilter>(
    () => ({
      query: params.get('q') ?? '',
      categories: (params.get('c')?.split(',') ?? []).filter((c): c is CategorySlug =>
        validCategories.includes(c as CategorySlug),
      ),
    }),
    [params, validCategories],
  );

  const deferred = useDeferredValue(value);
  const results = useMemo(() => filterWorks(works, deferred), [works, deferred]);

  const onChange = useCallback(
    (next: WorkFilter) => {
      const search = new URLSearchParams();
      if (next.query) search.set('q', next.query);
      if (next.categories.length) search.set('c', next.categories.join(','));
      setParams(search, { replace: true, preventScrollReset: true });
    },
    [setParams],
  );

  return { value, onChange, results };
}
