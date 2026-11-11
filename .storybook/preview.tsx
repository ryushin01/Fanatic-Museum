import type { Decorator, Preview } from '@storybook/react-vite';
import { createMemoryRouter, RouterProvider } from 'react-router';

import '../src/app/styles/global.css';

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
