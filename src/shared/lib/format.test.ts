import { describe, expect, it } from 'vitest';

import { padNumber, textLang } from './format';

describe('padNumber', () => {
  it('세 자리로 맞춘다', () => {
    expect(padNumber(1)).toBe('001');
    expect(padNumber(17)).toBe('017');
    expect(padNumber(1234)).toBe('1234');
  });
});

describe('textLang', () => {
  it('가나·한자가 있으면 일본어, 라틴 문자만 있으면 영어로 본다', () => {
    expect(textLang('新世紀GPXサイバーフォーミュラ')).toBe('ja');
    expect(textLang('黒神')).toBe('ja');
    expect(textLang('Fate/stay night')).toBe('en');
    expect(textLang('NOW')).toBe('en');
    expect(textLang('사에카노')).toBeUndefined();
    expect(textLang('2004')).toBeUndefined();
  });
});
