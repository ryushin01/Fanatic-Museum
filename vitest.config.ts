import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const alias = { '@': new URL('./src', import.meta.url).pathname };

export default defineConfig({
  test: {
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
