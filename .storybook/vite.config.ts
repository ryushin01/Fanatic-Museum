import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Storybook은 React Router 플러그인 없이 컴포넌트만 그립니다.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': new URL('../src', import.meta.url).pathname },
  },
});
