import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { categories } from '@/entities/category';

import type { WorkFilter as WorkFilterValue } from '../model/filter';
import { WorkFilter } from './work-filter';

function Stateful() {
  const [value, setValue] = useState<WorkFilterValue>({ query: '', categories: ['game'] });
  return (
    <WorkFilter
      value={value}
      onChange={setValue}
      categories={categories}
      resultCount={4}
      total={17}
    />
  );
}

const meta = {
  title: 'pages/works/WorkFilter',
  component: WorkFilter,
  render: () => <Stateful />,
  decorators: [
    (Story) => (
      <div className="container" style={{ paddingBlock: 24 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    value: { query: '', categories: [] },
    onChange: () => {},
    categories,
    resultCount: 17,
    total: 17,
  },
} satisfies Meta<typeof WorkFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
