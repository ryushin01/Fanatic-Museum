import type { Decorator, Preview } from '@storybook/react-vite';
import { createMemoryRouter, RouterProvider } from 'react-router';

import { FONT_FACE_CSS } from '../src/app/fonts/font-loader';
import { MotionProvider } from '../src/app/motion/motion-provider';
import '../src/app/styles/global.css';

// 사이트와 같은 클래식체 정의(원본 파일, 해시 이름)를 씁니다.
const fontFaces = document.createElement('style');
fontFaces.textContent = FONT_FACE_CSS;
document.head.append(fontFaces);

/** Link·useSearchParams를 쓰는 컴포넌트를 위해 메모리 라우터 안에서 그립니다. */
const withRouter: Decorator = (Story, context) => {
  const path = (context.parameters.route as string | undefined) ?? '/';
  const router = createMemoryRouter([{ path: '*', element: <Story /> }], {
    initialEntries: [path],
  });
  return <RouterProvider router={router} />;
};

/** 사이트와 같은 Motion 설정(LazyMotion·움직임 줄이기) */
const withMotion: Decorator = (Story) => (
  <MotionProvider>
    <Story />
  </MotionProvider>
);

const preview: Preview = {
  decorators: [withRouter, withMotion],
  parameters: {
    layout: 'fullscreen',
    // 사용자 지시(2026-11-23)로 글자 대비(color-contrast)만 끄고 나머지 규칙은 오류로 검사합니다.
    a11y: { test: 'error', config: { rules: [{ id: 'color-contrast', enabled: false }] } },
  },
  tags: ['autodocs'],
};

export default preview;
