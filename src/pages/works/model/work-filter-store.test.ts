import { autorun } from 'mobx';
import { describe, expect, it } from 'vitest';

import { makeWork } from '@/shared/lib/test/fixtures';

import { WorkFilterStore } from './work-filter-store';

const works = [
  makeWork({
    slug: 'sao',
    number: 1,
    title: '소드 아트 온라인',
    categories: ['light-novel', 'game'],
    firstReleased: 2009,
  }),
  makeWork({ slug: 'breaker', number: 2, title: '브레이커', categories: ['comic'] }),
  makeWork({
    slug: 'ff',
    number: 3,
    title: '파이널 판타지',
    categories: ['game'],
    firstReleased: 1987,
  }),
];

describe('WorkFilterStore', () => {
  it('조건이 없으면 번호순으로 전부 보여 준다', () => {
    const store = new WorkFilterStore(works);
    expect(store.results.map((w) => w.slug)).toEqual(['sao', 'breaker', 'ff']);
    expect(store.total).toBe(3);
    expect(store.resultCount).toBe(3);
  });

  it('검색어·분류로 거르고 결과 수가 따라 바뀐다', () => {
    const store = new WorkFilterStore(works);
    store.setFilter({ query: '브레이커', categories: [], sort: 'number' });
    expect(store.results.map((w) => w.slug)).toEqual(['breaker']);
    store.setFilter({ query: '', categories: ['game'], sort: 'number' });
    expect(store.resultCount).toBe(2);
  });

  it('정렬을 바꾸면 순서가 바뀐다', () => {
    const store = new WorkFilterStore(works);
    store.setFilter({ query: '', categories: [], sort: 'year' });
    expect(store.results.map((w) => w.slug)).toEqual(['ff', 'sao', 'breaker']);
  });

  it('조건이 같으면 파생 값을 다시 계산하지 않고 같은 배열을 돌려 준다', () => {
    const store = new WorkFilterStore(works);
    const seen: unknown[] = [];
    const dispose = autorun(() => seen.push(store.results));
    store.setFilter({ ...store.filter });
    expect(new Set(seen).size).toBeGreaterThanOrEqual(1);
    dispose();
  });

  it('목록을 바꾸면 결과가 갱신된다', () => {
    const store = new WorkFilterStore(works);
    store.setWorks(works.slice(0, 1));
    expect(store.total).toBe(1);
    expect(store.results).toHaveLength(1);
  });

  it('스토어마다 상태가 독립이다', () => {
    const a = new WorkFilterStore(works);
    const b = new WorkFilterStore(works);
    a.setFilter({ query: 'x', categories: [], sort: 'title' });
    expect(b.filter.query).toBe('');
  });
});
