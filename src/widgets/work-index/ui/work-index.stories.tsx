import type { Meta, StoryObj } from '@storybook/react-vite';

import { makeWork } from '@/shared/lib/test/fixtures';

import { WorkIndex } from './work-index';

const meta = {
  title: 'widgets/WorkIndex',
  component: WorkIndex,
  decorators: [
    (Story) => (
      <div className="container" style={{ paddingBlock: 24 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    works: [
      makeWork({
        slug: 'cyber-formula',
        number: 1,
        title: '신세기 GPX 사이버 포뮬러',
        originalTitle: '新世紀GPXサイバーフォーミュラ',
      }),
      makeWork({
        slug: 'saekano',
        number: 3,
        title: '시원찮은 그녀를 위한 육성방법',
        nickname: '사에카노',
        categories: ['light-novel', 'animation'],
        accent: '#e8789a',
      }),
      makeWork({
        slug: 'the-breaker',
        number: 17,
        title: '브레이커',
        categories: ['comic'],
        origin: '한국',
        accent: '#3c3c3c',
      }),
    ],
  },
} satisfies Meta<typeof WorkIndex>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { works: [], emptyMessage: '조건에 맞는 소장품이 없습니다.' },
};
