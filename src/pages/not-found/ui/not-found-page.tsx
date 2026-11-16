import { site } from '@/shared/config';
import { NotFoundNotice } from '@/shared/ui';

export function meta() {
  return [{ title: `찾을 수 없는 페이지 — ${site.name}` }];
}

export function NotFoundPage() {
  return <NotFoundNotice />;
}
