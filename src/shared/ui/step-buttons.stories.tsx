import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { StepButtons } from './step-buttons';

function Demo({ count }: { count: number }) {
  const [index, setIndex] = useState(0);
  return (
    <div style={{ padding: 24 }}>
      <StepButtons index={index} count={count} onChange={setIndex}>
        <p className="num" aria-live="polite" aria-atomic="true">
          {index + 1} / {count}
        </p>
      </StepButtons>
    </div>
  );
}

const meta = {
  title: 'shared/StepButtons',
  component: Demo,
  args: { count: 3 },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 끝에 닿으면 초점이 비활성된 버튼에 남지 않고 반대쪽 버튼으로 옮겨 갑니다. */
export const KeepsFocusAtEnds: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole('button', { name: '다음' });
    next.focus();
    await userEvent.keyboard('{Enter}{Enter}');
    await expect(canvas.getByRole('button', { name: '이전' })).toHaveFocus();
  },
};

/** 항목이 둘이면 누를 때마다 두 버튼이 한꺼번에 바뀝니다. 그래도 초점이 남은 버튼으로 옮겨 갑니다. */
export const TwoItems: Story = {
  args: { count: 2 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole('button', { name: '다음' });
    const previous = canvas.getByRole('button', { name: '이전' });
    next.focus();
    await userEvent.keyboard('{Enter}');
    await expect(previous).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(next).toHaveFocus();
  },
};
