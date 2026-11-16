import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { works } from '../src/entities/work/model/works.ts';

describe('공유 미리보기 이미지', () => {
  it('사이트와 모든 소장품의 이미지가 있다(소장품을 더했으면 pnpm og:build)', () => {
    expect(existsSync(join('public', 'og', 'site.png'))).toBe(true);
    const missing = works.filter(
      (w) => !existsSync(join('public', 'og', 'works', `${w.slug}.png`)),
    );
    expect(missing.map((w) => w.slug)).toEqual([]);
  });
});
