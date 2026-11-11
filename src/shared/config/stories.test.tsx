import { composeStories, setProjectAnnotations } from '@storybook/react-vite';
import { render } from '@testing-library/react';
import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';

import * as preview from '../../../.storybook/preview';

setProjectAnnotations(preview);

type StoryModule = Parameters<typeof composeStories>[0];
type ComposedStory = ComponentType & { run?: () => Promise<void> };

const modules = import.meta.glob<StoryModule>('../../**/*.stories.tsx', { eager: true });

/** 모든 스토리가 오류 없이 그려지는지 확인합니다. */
describe.each(Object.entries(modules))('%s', (_path, module) => {
  const stories = Object.entries(composeStories(module)) as [string, ComposedStory][];
  it.each(stories)('%s', async (_name, Story) => {
    const { container } = render(<Story />);
    await Story.run?.();
    expect(container.innerHTML).not.toBe('');
  });
});
