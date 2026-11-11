import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // React Router의 라우트 모듈(app/routes)은 페이지를 다시 내보내기만 합니다.
    ignores: ['**/*.test.ts', '**/*.test.tsx', '**/*.stories.tsx', '**/schema.d.ts'],
  },
]);
