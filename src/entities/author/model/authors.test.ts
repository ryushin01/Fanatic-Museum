import { describe, expect, it } from 'vitest';

import { AUTHOR_SLUGS, authors, findAuthor } from './authors';

describe('작가', () => {
  it('주소(slug)로 작가를 찾고, 없으면 undefined', () => {
    expect(AUTHOR_SLUGS).toEqual(authors.map((a) => a.slug));
    expect(findAuthor(authors[0].slug)?.name).toBe(authors[0].name);
    expect(findAuthor('nobody')).toBeUndefined();
  });
});
