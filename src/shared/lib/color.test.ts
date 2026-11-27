import { describe, expect, it } from 'vitest';

import { isLightColor } from './color';

describe('isLightColor', () => {
  it('밝은 대표색만 밝다고 본다', () => {
    expect(isLightColor('#d9dde3')).toBe(true);
    expect(isLightColor('#d7261e')).toBe(false);
    expect(isLightColor('#121212')).toBe(false);
    // 아주 어두운 채널(선형 구간)도 셉니다.
    expect(isLightColor('#000000')).toBe(false);
    expect(isLightColor('#ffffff')).toBe(true);
  });
});
