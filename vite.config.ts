import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
  build: {
    // 사이트 CSS는 작아서 한 파일로 묶습니다. 페이지를 옮겨도 같은 파일을 캐시에서 씁니다.
    cssCodeSplit: false,
  },
});
