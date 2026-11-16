import { describe, expect, it } from 'vitest';

import type { Work } from '@/shared/api';

import { filterWorks } from './filter';

const base: Omit<Work, 'slug' | 'title' | 'categories' | 'creators'> = {
  number: 1,
  origin: '일본',
  summary: '',
  accent: '#000000',
  related: [],
  images: [],
};

const works: Work[] = [
  {
    ...base,
    slug: 'sao',
    title: '소드 아트 온라인',
    nickname: 'SAO',
    categories: ['light-novel', 'game'],
    creators: [{ role: '글', name: '카와하라 레키' }],
  },
  {
    ...base,
    slug: 'breaker',
    title: '브레이커',
    categories: ['comic'],
    creators: [{ role: '그림', name: '박진환' }],
    origin: '한국',
  },
  { ...base, slug: 'ff', title: '파이널 판타지 시리즈', categories: ['game'], creators: [] },
];

const slugs = (list: Work[]) => list.map((w) => w.slug);

describe('filterWorks', () => {
  it('조건이 없으면 모두 돌려준다', () => {
    expect(slugs(filterWorks(works, { query: '', categories: [], sort: 'number' }))).toEqual([
      'sao',
      'breaker',
      'ff',
    ]);
  });

  it('공백과 대소문자를 무시하고 제목·줄임말·작가로 찾는다', () => {
    expect(
      slugs(filterWorks(works, { query: '파이널판타지', categories: [], sort: 'number' })),
    ).toEqual(['ff']);
    expect(slugs(filterWorks(works, { query: 'sao', categories: [], sort: 'number' }))).toEqual([
      'sao',
    ]);
    expect(slugs(filterWorks(works, { query: '박진환', categories: [], sort: 'number' }))).toEqual([
      'breaker',
    ]);
  });

  it('분류는 하나라도 맞으면 남긴다', () => {
    expect(slugs(filterWorks(works, { query: '', categories: ['game'], sort: 'number' }))).toEqual([
      'sao',
      'ff',
    ]);
    expect(
      slugs(
        filterWorks(works, { query: '', categories: ['comic', 'light-novel'], sort: 'number' }),
      ),
    ).toEqual(['sao', 'breaker']);
  });

  it('검색어와 분류를 함께 적용한다', () => {
    expect(
      slugs(filterWorks(works, { query: '온라인', categories: ['comic'], sort: 'number' })),
    ).toEqual([]);
  });
});

const korean: Work[] = [
  {
    ...base,
    number: 1,
    slug: 'dragon-raja',
    title: '드래곤 라자',
    categories: ['novel'],
    creators: [{ role: '글', name: '이영도' }],
    firstReleased: 1997,
  },
  {
    ...base,
    number: 2,
    slug: 'breaker',
    title: '브레이커',
    categories: ['comic'],
    creators: [{ role: '그림', name: '박진환' }],
  },
  {
    ...base,
    number: 3,
    slug: 'ff',
    title: '파이널 판타지 시리즈',
    categories: ['game'],
    creators: [],
    firstReleased: 1987,
  },
  {
    ...base,
    number: 4,
    slug: 'fate',
    title: 'Fate 시리즈',
    categories: ['game'],
    creators: [],
    firstReleased: 2004,
  },
];

describe('초성 검색', () => {
  const find = (query: string) =>
    slugs(filterWorks(korean, { query, categories: [], sort: 'number' }));

  it('초성만으로 제목과 작가 이름을 찾는다', () => {
    expect(find('ㄷㄹㄱㄹㅈ')).toEqual(['dragon-raja']);
    expect(find('ㅂㄹㅇㅋ')).toEqual(['breaker']);
    expect(find('ㅇㅇㄷ')).toEqual(['dragon-raja']);
  });

  it('초성과 완성된 글자를 섞어 써도 찾고, 띄어쓰기는 무시한다', () => {
    expect(find('드ㄹ곤')).toEqual(['dragon-raja']);
    expect(find('ㅍㅇㄴ ㅍㅌㅈ')).toEqual(['ff']);
  });

  it('맞는 초성이 없으면 거른다', () => {
    expect(find('ㅋㅋㅋ')).toEqual([]);
  });
});

describe('정렬', () => {
  const sorted = (sort: 'number' | 'year' | 'title') =>
    slugs(filterWorks(korean, { query: '', categories: [], sort }));

  it('번호순이 기본이다', () => {
    expect(sorted('number')).toEqual(['dragon-raja', 'breaker', 'ff', 'fate']);
  });

  it('처음 나온 해 순서로 놓고, 연도를 모르는 소장품은 뒤로 보낸다', () => {
    expect(sorted('year')).toEqual(['ff', 'dragon-raja', 'fate', 'breaker']);
  });

  it('제목 가나다순으로 놓는다', () => {
    const titles = sorted('title');
    expect(titles.indexOf('dragon-raja')).toBeLessThan(titles.indexOf('breaker'));
    expect(titles.indexOf('breaker')).toBeLessThan(titles.indexOf('ff'));
  });
});
