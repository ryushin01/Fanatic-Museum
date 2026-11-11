import { describe, expect, it } from 'vitest';

import { padNumber } from './format';

describe('padNumber', () => {
  it('세 자리로 맞춘다', () => {
    expect(padNumber(1)).toBe('001');
    expect(padNumber(17)).toBe('017');
    expect(padNumber(1234)).toBe('1234');
  });
});
