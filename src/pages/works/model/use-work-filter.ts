import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigationType, useSearchParams } from 'react-router';

import type { CategorySlug, Work } from '@/shared/api';
import { useHydrated } from '@/shared/lib';

import { WORK_SORTS, type WorkFilter, type WorkSort } from './filter';
import { EMPTY_FILTER, WorkFilterStore } from './work-filter-store';

function readCategories(params: URLSearchParams, valid: readonly CategorySlug[]): CategorySlug[] {
  return (params.get('c')?.split(',') ?? []).filter((c): c is CategorySlug =>
    valid.includes(c as CategorySlug),
  );
}

function readSort(params: URLSearchParams): WorkSort {
  const value = params.get('s');
  return WORK_SORTS.find((sort) => sort === value) ?? 'number';
}

function readFilter(params: URLSearchParams, valid: readonly CategorySlug[]): WorkFilter {
  return {
    query: params.get('q') ?? '',
    categories: readCategories(params, valid),
    sort: readSort(params),
  };
}

/**
 * 검색 조건과 정렬을 주소의 ?q=&c=&s= 에 남겨 공유·새로 고침에도 유지합니다.
 * 입력값은 화면 상태로 바로 반영하고(빠르게 입력해도 글자가 빠지지 않게) 주소는 뒤따라 맞춥니다.
 * 조건과 거른 결과는 MobX 스토어(WorkFilterStore)가 들고 있고, 이 훅을 쓰는 컴포넌트는 observer여야 합니다.
 *
 * /works는 조건 없이 미리 그린 HTML 하나뿐이라, 하이드레이션하는 동안에는 조건 없이 그리고
 * 끝난 뒤에 주소의 조건을 읽습니다. 다른 화면에서 들어오면 처음부터 주소대로 그립니다.
 */
export function useWorkFilter(works: readonly Work[], validCategories: readonly CategorySlug[]) {
  const [params, setParams] = useSearchParams();
  const hydrated = useHydrated();
  const [store] = useState(
    () => new WorkFilterStore(works, hydrated ? readFilter(params, validCategories) : EMPTY_FILTER),
  );

  useEffect(() => store.setWorks(works), [store, works]);

  // 하이드레이션이 끝나면 주소의 조건을 한 번 읽습니다. (처음부터 주소대로 그렸다면 같은 값이라 그대로입니다)
  const readUrl = useRef(hydrated);
  useEffect(() => {
    if (!hydrated || readUrl.current) return;
    readUrl.current = true;
    store.setFilter(readFilter(params, validCategories));
  }, [hydrated, params, validCategories, store]);

  // 뒤로·앞으로 가기로 주소가 바뀌었을 때만 화면 상태를 주소에 맞춥니다.
  // (입력 중에는 화면 상태가 앞서 있으므로 아직 반영되지 않은 주소로 덮어쓰지 않습니다)
  const { key } = useLocation();
  const navigationType = useNavigationType();
  const syncedKey = useRef(key);
  useEffect(() => {
    if (key === syncedKey.current) return;
    syncedKey.current = key;
    if (navigationType === 'POP') store.setFilter(readFilter(params, validCategories));
  }, [key, navigationType, params, validCategories, store]);

  const onChange = useCallback(
    (next: WorkFilter) => {
      store.setFilter(next);
      const search = new URLSearchParams();
      if (next.query) search.set('q', next.query);
      if (next.categories.length) search.set('c', next.categories.join(','));
      if (next.sort !== 'number') search.set('s', next.sort);
      setParams(search, { replace: true, preventScrollReset: true });
    },
    [store, setParams],
  );

  return { store, onChange };
}
