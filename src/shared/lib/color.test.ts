import { describe, expect, it } from 'vitest';

import { isLightColor } from './color';

describe('isLightColor', () => {
  it('밝은 대표색만 밝다고 본다', () => {
    expect(isLightColor('#d9dde3')).toBe(true);
    expect(isLightColor('#d7261e')).toBe(false);
    expect(isLightColor('#121212')).toBe(false);
  });
});
