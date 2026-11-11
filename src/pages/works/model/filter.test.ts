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
    expect(slugs(filterWorks(works, { query: '', categories: [] }))).toEqual([
      'sao',
      'breaker',
      'ff',
    ]);
  });

  it('공백과 대소문자를 무시하고 제목·줄임말·작가로 찾는다', () => {
    expect(slugs(filterWorks(works, { query: '파이널판타지', categories: [] }))).toEqual(['ff']);
    expect(slugs(filterWorks(works, { query: 'sao', categories: [] }))).toEqual(['sao']);
    expect(slugs(filterWorks(works, { query: '박진환', categories: [] }))).toEqual(['breaker']);
  });

  it('분류는 하나라도 맞으면 남긴다', () => {
    expect(slugs(filterWorks(works, { query: '', categories: ['game'] }))).toEqual(['sao', 'ff']);
    expect(slugs(filterWorks(works, { query: '', categories: ['comic', 'light-novel'] }))).toEqual([
      'sao',
      'breaker',
    ]);
  });

  it('검색어와 분류를 함께 적용한다', () => {
    expect(slugs(filterWorks(works, { query: '온라인', categories: ['comic'] }))).toEqual([]);
  });
});
