import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { useLocation, useNavigationType, useSearchParams } from 'react-router';

import type { CategorySlug, Work } from '@/shared/api';

import { filterWorks, type WorkFilter } from './filter';

function readCategories(params: URLSearchParams, valid: readonly CategorySlug[]): CategorySlug[] {
  return (params.get('c')?.split(',') ?? []).filter((c): c is CategorySlug =>
    valid.includes(c as CategorySlug),
  );
}

/**
 * 검색 조건을 주소의 ?q=&c= 에 남겨 공유·새로 고침에도 유지합니다.
 * 입력값은 화면 상태로 바로 반영하고(빠르게 입력해도 글자가 빠지지 않게) 주소는 뒤따라 맞춥니다.
 * 결과 목록은 지연값으로 걸러 입력이 버벅이지 않게 합니다.
 */
export function useWorkFilter(works: readonly Work[], validCategories: readonly CategorySlug[]) {
  const [params, setParams] = useSearchParams();
  const [value, setValue] = useState<WorkFilter>(() => ({
    query: params.get('q') ?? '',
    categories: readCategories(params, validCategories),
  }));

  // 뒤로·앞으로 가기로 주소가 바뀌었을 때만 화면 상태를 주소에 맞춥니다.
  // (입력 중에는 화면 상태가 앞서 있으므로 아직 반영되지 않은 주소로 덮어쓰지 않습니다)
  const { key } = useLocation();
  const navigationType = useNavigationType();
  const [syncedKey, setSyncedKey] = useState(key);
  if (key !== syncedKey) {
    setSyncedKey(key);
    if (navigationType === 'POP') {
      setValue({
        query: params.get('q') ?? '',
        categories: readCategories(params, validCategories),
      });
    }
  }

  const deferred = useDeferredValue(value);
  const results = useMemo(() => filterWorks(works, deferred), [works, deferred]);

  const onChange = useCallback(
    (next: WorkFilter) => {
      setValue(next);
      const search = new URLSearchParams();
      if (next.query) search.set('q', next.query);
      if (next.categories.length) search.set('c', next.categories.join(','));
      setParams(search, { replace: true, preventScrollReset: true });
    },
    [setParams],
  );

  return { value, onChange, results };
}
