import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

/**
 * 화면을 옮기면(경로가 바뀌면) 새 페이지 제목을 화면 낭독기에 알립니다.
 * 누른 링크가 사라져 초점을 잃었으면 본문(main)으로 초점을 옮겨, 키보드로 이어서 쓸 수 있게 합니다.
 * 머리글 메뉴처럼 그대로 남는 링크에서는 초점을 건드리지 않습니다. 검색 조건(?q=)만 바뀔 때는 알리지 않습니다.
 *
 * 알림 영역은 처음부터 비워 두고 내용만 바꿉니다(그래야 화면 낭독기가 읽습니다).
 * 제목(<title>)은 새 페이지를 그린 뒤에 바뀌므로 효과에서 읽어 영역에 직접 씁니다.
 */
export function RouteAnnouncer() {
  const { pathname } = useLocation();
  const region = useRef<HTMLParagraphElement>(null);
  const previous = useRef(pathname);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    if (region.current) region.current.textContent = document.title;
    const active = document.activeElement;
    if (!active || active === document.body) {
      document.getElementById('main')?.focus({ preventScroll: true });
    }
  }, [pathname]);

  return <p ref={region} className="visually-hidden" role="status" />;
}
