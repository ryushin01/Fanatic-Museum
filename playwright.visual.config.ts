import { defineConfig, devices } from '@playwright/test';

/**
 * 시각 회귀 검사(pnpm test:visual). 기준 이미지는 Linux CI와 같은 Playwright 공식 Docker 이미지에서 만듭니다
 * (pnpm test:visual:docker, 글꼴·안티에일리어싱이 운영체제마다 달라 macOS에서 만든 이미지는 쓰지 않습니다).
 * 화면은 데스크톱·모바일 × 라이트·다크, Storybook 스토리는 데스크톱 라이트·다크입니다.
 */
const port = Number(process.env.E2E_PORT ?? 4173);

const themes = [
  { theme: 'light', colorScheme: 'light' },
  { theme: 'dark', colorScheme: 'dark' },
] as const;

export default defineConfig({
  testDir: 'e2e/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      // Motion은 움직임 줄이기로, CSS 애니메이션·전환은 animations: 'disabled'로 멈춥니다.
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      stylePath: './e2e/visual/freeze.css',
      maxDiffPixelRatio: 0.002,
    },
  },
  use: {
    baseURL: `http://localhost:${port}`,
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  projects: [
    ...themes.map(({ theme, colorScheme }) => ({
      name: `desktop-${theme}`,
      use: { ...devices['Desktop Chrome'], colorScheme },
    })),
    ...themes.map(({ theme, colorScheme }) => ({
      name: `mobile-${theme}`,
      use: { ...devices['Pixel 7'], colorScheme },
      // 스토리는 데스크톱에서만 비교합니다.
      grepInvert: /스토리/,
    })),
  ],
  webServer: {
    command: `node ./node_modules/sirv-cli/bin.js build/client --port ${port} --single __spa-fallback.html`,
    port,
    reuseExistingServer: !process.env.CI,
  },
});
