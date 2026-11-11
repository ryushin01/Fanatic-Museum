import type { Meta, StoryObj } from '@storybook/react-vite';

import { SiteFooter } from './site-footer';

const meta = { title: 'widgets/SiteFooter', component: SiteFooter } satisfies Meta<
  typeof SiteFooter
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
