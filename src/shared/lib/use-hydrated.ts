import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * 미리 그린 HTML에 붙는 첫 렌더(하이드레이션)와 사전 렌더링에서는 false, 그 뒤와 브라우저에서 새로 그릴 때는 true입니다.
 * 주소의 검색 조건처럼 미리 그린 HTML과 다르게 그려야 하는 값은 true일 때만 씁니다.
 * (하이드레이션 중에 다르게 그리면 React가 문서 전체를 다시 그립니다)
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
