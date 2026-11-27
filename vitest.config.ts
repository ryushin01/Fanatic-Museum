import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const alias = { '@': new URL('./src', import.meta.url).pathname };

export default defineConfig({
  test: {
    /*
     * 커버리지 (pnpm test:coverage, 단위 테스트만)
     * - 로직 계층(shared/lib, 각 슬라이스의 model·api, 다운로더의 순수 함수)은 80% 아래로 내려가면 실패합니다.
     * - 전체는 이 기준을 걸 때의 값 아래로 내려가지 못하게 합니다(올라가면 숫자를 올려 둡니다).
     */
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'scripts/**/*.mjs'],
      exclude: [
        '**/*.test.{ts,tsx,mjs}',
        '**/*.stories.tsx',
        '**/*.d.ts',
        'src/shared/lib/test/**',
        'src/shared/config/test-setup.ts',
        // 검사·CI를 부르기만 하는 실행 스크립트
        'scripts/check.mjs',
        'scripts/ci/coverage-summary.mjs',
      ],
      reporter: ['text-summary', 'json-summary', 'html'],
      reportsDirectory: 'coverage',
      thresholds: {
        // 2026-11-27 기준선(문장 37.21%, 분기 36%, 함수 52.14%, 줄 37.48%). 다운로더 본체(download.mjs 등)는 실행하지 않아 낮습니다.
        statements: 37,
        branches: 36,
        functions: 52,
        lines: 37,
        'src/shared/lib/**': { lines: 80, statements: 80, functions: 80, branches: 80 },
        'src/**/model/**': { lines: 80, statements: 80, functions: 80, branches: 80 },
        'src/**/api/**': { lines: 80, statements: 80, functions: 80, branches: 80 },
        'scripts/media/run-state.mjs': { lines: 80, statements: 80, functions: 80, branches: 80 },
      },
    },
    projects: [
      /* 단위 테스트 (pnpm test) */
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: false,
          setupFiles: ['./src/shared/config/test-setup.ts'],
          include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
          css: { modules: { classNameStrategy: 'non-scoped' } },
        },
      },
      /*
       * 스토리 테스트 (pnpm test:storybook)
       * 모든 스토리를 실제 브라우저(Chromium)에서 그리고, play 함수와 접근성 검사(addon-a11y)를 돌립니다.
       */
      {
        plugins: [storybookTest({ configDir: '.storybook' })],
        resolve: { alias },
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
