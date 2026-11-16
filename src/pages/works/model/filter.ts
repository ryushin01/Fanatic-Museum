import type { CategorySlug, Work } from '@/shared/api';

/** 정렬: 전시 번호순(기본), 처음 나온 해 순, 가나다순 */
export type WorkSort = 'number' | 'year' | 'title';
export const WORK_SORTS: readonly WorkSort[] = ['number', 'year', 'title'];

export interface WorkFilter {
  query: string;
  categories: readonly CategorySlug[];
  sort: WorkSort;
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

/** 초성으로 찾을 이름들(제목·줄임말·작가). 줄거리까지 넣으면 짧은 초성이 너무 많이 걸립니다. */
function nameHaystack(work: Work): string {
  return normalize(
    [work.title, work.nickname, ...work.creators.map((c) => c.name)].filter(Boolean).join(' '),
  );
}

const CHOSEONG = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const SYLLABLES_PER_CHOSEONG = 21 * 28;
const HANGUL_START = 0xac00;

/**
 * 초성(ㄱ~ㅎ)이 섞인 검색어를 정규식으로 바꿉니다.
 * 초성은 그 초성으로 시작하는 모든 음절과 맞습니다. "ㄷㄹㄱ" → 드래곤, "드ㄹ곤" → 드래곤.
 */
function choseongPattern(needle: string): RegExp | null {
  if (![...needle].some((ch) => CHOSEONG.includes(ch))) return null;
  const source = [...needle]
    .map((ch) => {
      const index = CHOSEONG.indexOf(ch);
      if (index < 0) return ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const first = HANGUL_START + index * SYLLABLES_PER_CHOSEONG;
      const last = first + SYLLABLES_PER_CHOSEONG - 1;
      return `[${ch}${String.fromCharCode(first)}-${String.fromCharCode(last)}]`;
    })
    .join('');
  return new RegExp(source);
}

const collator = new Intl.Collator('ko');

function sortWorks(works: Work[], sort: WorkSort): Work[] {
  if (sort === 'year') {
    // 연도를 모르는 소장품은 뒤로 보냅니다.
    return works.sort(
      (a, b) =>
        (a.firstReleased ?? Number.MAX_SAFE_INTEGER) -
          (b.firstReleased ?? Number.MAX_SAFE_INTEGER) || a.number - b.number,
    );
  }
  if (sort === 'title') return works.sort((a, b) => collator.compare(a.title, b.title));
  return works.sort((a, b) => a.number - b.number);
}

/**
 * 검색어(제목·원제·줄임말·작가·설명)와 분류(하나라도 맞으면)로 거르고 정렬합니다.
 * 검색어에 초성이 있으면 제목·줄임말·작가 이름을 초성으로도 찾습니다.
 */
export function filterWorks(
  works: readonly Work[],
  { query, categories, sort }: WorkFilter,
): Work[] {
  const needle = normalize(query);
  const pattern = choseongPattern(needle);
  const matched = works.filter(
    (work) =>
      (needle === '' ||
        haystack(work).includes(needle) ||
        (pattern !== null && pattern.test(nameHaystack(work)))) &&
      (categories.length === 0 || work.categories.some((c) => categories.includes(c))),
  );
  return sortWorks(matched, sort);
}
