import type { Meta, StoryObj } from '@storybook/react-vite';

import { sampleImage } from '@/shared/lib/test/sample-images';

import { WorkCover } from './work-cover';

const meta = {
  title: 'entities/work/WorkCover',
  component: WorkCover,
  args: { number: 1, title: '신세기 GPX 사이버 포뮬러', accent: '#d7261e' },
  decorators: [
    (Story) => (
      <div style={{ width: 320, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WorkCover>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 공개 사이트에서 보이는 자리 표시 그래픽 */
export const Placeholder: Story = {};

/** 밝은 대표색에는 어두운 글자를 씁니다. */
export const LightAccent: Story = {
  args: { number: 8, title: '윙건담 커스텀', accent: '#d9dde3' },
};

/** 로컬 이미지가 있을 때 */
export const WithImage: Story = {
  args: { image: sampleImage(1) },
};

/** 이미지 목록에는 있지만 파일을 받지 못했을 때(보관함에서 지움, 네트워크 끊김): 자리 표시 그래픽으로 바뀝니다. */
export const MissingFile: Story = {
  args: {
    image: {
      ...sampleImage(1),
      src: '/media/__missing__/1.webp',
      srcSet: '/media/__missing__/1.webp 1200w',
    },
  },
};
