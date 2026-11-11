import type { Meta, StoryObj } from '@storybook/react-vite';

import { makeWork } from '@/shared/lib/test/fixtures';

import { ExhibitStrip } from './exhibit-strip';

const accents = ['#d7261e', '#c41f1f', '#e8789a', '#2c4a9a', '#1f6fb2', '#3b6e8f', '#8a6a2b'];

const meta = {
  title: 'pages/home/ExhibitStrip',
  component: ExhibitStrip,
  args: {
    title: '전시실',
    description: '밀어서 둘러보기',
    works: accents.map((accent, i) =>
      makeWork({ slug: `work-${i}`, number: i + 1, title: `소장품 ${i + 1}`, accent }),
    ),
  },
} satisfies Meta<typeof ExhibitStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
