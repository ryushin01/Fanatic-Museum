import { makeAutoObservable, observableRef } from 'mobx';

import type { Work } from '@/shared/api';

import { filterWorks, type WorkFilter } from './filter';

export const EMPTY_FILTER: WorkFilter = { query: '', categories: [], sort: 'number' };

/**
 * 소장품 목록의 검색 조건(observable)과 거른 결과(computed)를 가진 스토어입니다.
 * 서버 요청·화면 사이에 공유되지 않도록 모듈 전역에 두지 않고, 화면(WorksPage)마다 하나씩 만듭니다.
 * 조건은 통째로 바꿔 끼우는 값이라 참조만 관찰하고(`observable.ref`), 결과는 조건·목록이 바뀔 때만 다시 계산합니다.
 */
export class WorkFilterStore {
  works: readonly Work[];
  filter: WorkFilter;

  constructor(works: readonly Work[], filter: WorkFilter = EMPTY_FILTER) {
    this.works = works;
    this.filter = filter;
    makeAutoObservable(this, { works: observableRef, filter: observableRef });
  }

  /** 검색어·분류·정렬이 적용된 소장품 */
  get results(): Work[] {
    return filterWorks(this.works, this.filter);
  }

  get total(): number {
    return this.works.length;
  }

  get resultCount(): number {
    return this.results.length;
  }

  setWorks(works: readonly Work[]): void {
    this.works = works;
  }

  setFilter(filter: WorkFilter): void {
    this.filter = filter;
  }
}
