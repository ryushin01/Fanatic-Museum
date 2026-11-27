import { describe, expect, it } from 'vitest';

import { formatCreators } from './labels';

describe('formatCreators', () => {
  it('맡은 일과 이름을 가운뎃점으로 잇는다', () => {
    expect(
      formatCreators([
        { role: '글', name: '마루토 후미아키' },
        { role: '그림', name: '미사키 쿠레히토' },
      ]),
    ).toBe('글 마루토 후미아키 · 그림 미사키 쿠레히토');
  });
});
