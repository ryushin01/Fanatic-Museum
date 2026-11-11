import { Link } from 'react-router';

import { site } from '@/shared/config';
import { PageHeader } from '@/shared/ui';

export function meta() {
  return [{ title: `찾을 수 없는 페이지 — ${site.name}` }];
}

export function NotFoundPage() {
  return (
    <PageHeader
      eyebrow="404"
      title="전시실을 찾을 수 없습니다"
      description="주소가 바뀌었거나 아직 들어오지 않은 소장품입니다."
    >
      <p style={{ marginTop: 24 }}>
        <Link to="/works">소장품 전체 보기</Link>
      </p>
    </PageHeader>
  );
}
