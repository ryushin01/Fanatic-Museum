import type { Config } from '@react-router/dev/config';

import { CATEGORY_SLUGS } from './src/entities/category/model/categories';
import { WORK_SLUGS } from './src/entities/work/model/works';

export default {
  appDirectory: 'src/app',
  // 서버 없이 정적 파일로 배포합니다. 모든 주소를 빌드할 때 미리 그립니다.
  ssr: false,
  prerender: [
    '/',
    '/works',
    '/about',
    ...CATEGORY_SLUGS.map((slug) => `/categories/${slug}`),
    ...WORK_SLUGS.map((slug) => `/works/${slug}`),
    '/api/works.json',
    '/api/categories.json',
    ...WORK_SLUGS.map((slug) => `/api/works/${slug}.json`),
  ],
} satisfies Config;
