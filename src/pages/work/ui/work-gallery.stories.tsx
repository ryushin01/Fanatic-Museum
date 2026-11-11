import type { Meta, StoryObj } from '@storybook/react-vite';

import { makeWork } from '@/shared/lib/test/fixtures';
import { sampleImage } from '@/shared/lib/test/sample-images';

import { WorkGallery } from './work-gallery';

const meta = {
  title: 'pages/work/WorkGallery',
  component: WorkGallery,
  decorators: [
    (Story) => (
      <div className="container" style={{ paddingBlock: 24 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WorkGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 로컬 이미지가 있을 때: 밀어서 넘기고 눌러서 크게 봅니다. */
export const WithImages: Story = {
  args: {
    work: makeWork({
      title: '신세기 GPX 사이버 포뮬러',
      images: [
        sampleImage(1, '#d7261e'),
        sampleImage(2, '#1f6fb2', 'landscape'),
        sampleImage(3, '#2c4a9a'),
        sampleImage(4, '#8a6a2b', 'landscape'),
        sampleImage(5, '#5a2a82'),
      ],
    }),
  },
};

/** 공개 사이트: 이미지 대신 자리 표시 그래픽 */
export const Placeholder: Story = {
  args: { work: makeWork({ title: '창세기전 시리즈', number: 7, accent: '#8a6a2b' }) },
};
