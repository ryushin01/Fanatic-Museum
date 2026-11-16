import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { StepButtons } from './step-buttons';

function Stepper({ count = 3, initial = 0 }: { count?: number; initial?: number }) {
  const [index, setIndex] = useState(initial);
  return (
    <StepButtons index={index} count={count} onChange={setIndex}>
      <p>
        {index + 1} / {count}
      </p>
    </StepButtons>
  );
}

describe('StepButtons', () => {
  it('처음에는 이전이, 끝에서는 다음이 비활성된다', async () => {
    const user = userEvent.setup();
    render(<Stepper count={2} />);
    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '다음' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it('키보드로 끝까지 넘기면 비활성된 버튼 대신 반대쪽 버튼으로 초점을 옮긴다', async () => {
    const user = userEvent.setup();
    render(<Stepper count={3} />);
    const next = screen.getByRole('button', { name: '다음' });
    const previous = screen.getByRole('button', { name: '이전' });
    next.focus();
    await user.keyboard('{Enter}');
    expect(next).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(previous).toHaveFocus();
    await user.keyboard('{Enter}{Enter}');
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(next).toHaveFocus();
  });
});
