import { defineConfig, devices } from '@playwright/test';

// 다른 서버와 겹치지 않게 E2E_PORT로 포트를 바꿀 수 있습니다.
const port = Number(process.env.E2E_PORT ?? 4173);
// E2E_BASE_URL을 주면 로컬 서버 없이 그 주소(예: 운영 배포본)를 검사합니다.
const remote = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: remote ?? `http://localhost:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  // 프로덕션 빌드(사전 렌더링된 정적 파일)를 띄워 검사합니다.
  webServer: remote
    ? undefined
    : {
        command: `pnpm exec sirv build/client --port ${port} --single __spa-fallback.html`,
        port,
        reuseExistingServer: !process.env.CI,
      },
});
