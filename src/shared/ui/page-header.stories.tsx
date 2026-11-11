import type { Meta, StoryObj } from '@storybook/react-vite';

import { PageHeader } from './page-header';

const meta = {
  title: 'shared/PageHeader',
  component: PageHeader,
  args: {
    eyebrow: 'Collection',
    title: '소장품',
    description: '애니메이션부터 프라모델까지, 전시 번호순으로 늘어놓은 대장정의 기록입니다.',
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
