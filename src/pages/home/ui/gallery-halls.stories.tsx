import type { Meta, StoryObj } from '@storybook/react-vite';

import { categories } from '@/entities/category';
import { makeWork } from '@/shared/lib/test/fixtures';

import { GalleryHalls } from './gallery-halls';

const accents = ['#d7261e', '#2c4a9a', '#e8789a', '#1f6fb2', '#8a6a2b', '#3b6e8f'];

const works = categories.flatMap((category, c) =>
  [0, 1, 2].map((p) =>
    makeWork({
      slug: `${category.slug}-${p}`,
      number: c * 3 + p + 1,
      title: `${category.name} ${p + 1}`,
      accent: accents[(c + p) % accents.length],
      categories: [category.slug],
    }),
  ),
);

const meta = {
  title: 'pages/home/GalleryHalls',
  component: GalleryHalls,
  args: {
    categories: categories.map((c) => ({ ...c, count: 3 })),
    works,
  },
} satisfies Meta<typeof GalleryHalls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
