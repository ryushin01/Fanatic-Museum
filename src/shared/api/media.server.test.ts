import { describe, expect, it } from 'vitest';

import { usesLocalMedia } from './media.server';

describe('usesLocalMedia', () => {
  it('보관함이 있는 컴퓨터의 일반 빌드는 로컬 이미지를 쓴다', () => {
    expect(usesLocalMedia({})).toBe(true);
  });

  it('CI·배포 빌드는 이미지 폴더를 지우므로 로컬 이미지를 쓰지 않는다', () => {
    expect(usesLocalMedia({ CI: 'true' })).toBe(false);
    expect(usesLocalMedia({ VERCEL: '1' })).toBe(false);
  });
});
