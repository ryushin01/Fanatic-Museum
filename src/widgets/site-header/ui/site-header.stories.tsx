import type { Meta, StoryObj } from '@storybook/react-vite';

import { SiteHeader } from './site-header';

const meta = { title: 'widgets/SiteHeader', component: SiteHeader } satisfies Meta<
  typeof SiteHeader
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {};

export const OnWorks: Story = { parameters: { route: '/works' } };

export const InCategory: Story = { parameters: { route: '/categories/comic' } };
