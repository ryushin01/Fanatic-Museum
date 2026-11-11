import type { CategorySlug, Work } from '@/shared/api';

export interface WorkFilter {
  query: string;
  categories: readonly CategorySlug[];
}

/** 공백·대소문자를 무시하고 비교합니다. */
function normalize(value: string): string {
  return value.toLocaleLowerCase('ko').replace(/\s+/g, '');
}

function haystack(work: Work): string {
  return normalize(
    [
      work.title,
      work.originalTitle,
      work.nickname,
      work.summary,
      work.origin,
      ...work.creators.map((c) => c.name),
    ]
      .filter(Boolean)
      .join(' '),
  );
}

/** 검색어(제목·원제·줄임말·작가·설명)와 분류(하나라도 맞으면)로 거릅니다. */
export function filterWorks(works: readonly Work[], { query, categories }: WorkFilter): Work[] {
  const needle = normalize(query);
  return works.filter(
    (work) =>
      (needle === '' || haystack(work).includes(needle)) &&
      (categories.length === 0 || work.categories.some((c) => categories.includes(c))),
  );
}
