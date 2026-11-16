import type { Decorator, Preview } from '@storybook/react-vite';
import { createMemoryRouter, RouterProvider } from 'react-router';

import { FONT_FACE_CSS } from '../src/app/fonts/font-loader';
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

const preview: Preview = {
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
  },
  tags: ['autodocs'],
};

export default preview;
