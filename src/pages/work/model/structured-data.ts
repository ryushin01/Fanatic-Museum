import { findCategory } from '@/entities/category';
import type { Work } from '@/shared/api';
import { absoluteUrl } from '@/shared/lib';

/** 사람으로 볼 수 있는 역할과 회사로 볼 수 있는 역할. '원작'은 작품일 때도 있어 넣지 않습니다. */
const PERSON_ROLES = new Set(['글', '그림', '만화', '감독', '기획', '각색']);
const ORGANIZATION_ROLES = new Set(['제작', '키트']);

/** 소장품 상세의 구조화 데이터(schema.org CreativeWork) */
export function workJsonLd(work: Work): Record<string, unknown> {
  const url = absoluteUrl(`/works/${work.slug}`);
  const alternateName = [work.originalTitle, work.nickname].filter(Boolean);
  const people = work.creators.filter((c) => PERSON_ROLES.has(c.role));
  const organizations = work.creators.filter((c) => ORGANIZATION_ROLES.has(c.role));
  return {
    '@type': 'CreativeWork',
    '@id': `${url}#work`,
    name: work.title,
    ...(alternateName.length > 0 && { alternateName }),
    description: work.summary,
    url,
    ...(work.firstReleased && { dateCreated: String(work.firstReleased) }),
    countryOfOrigin: { '@type': 'Country', name: work.origin },
    genre: work.categories.map((slug) => findCategory(slug)?.name ?? slug),
    ...(people.length > 0 && {
      creator: people.map((c) => ({
        '@type': 'Person',
        name: c.name,
        ...(c.author && { url: absoluteUrl(`/authors/${c.author}`) }),
      })),
    }),
    ...(organizations.length > 0 && {
      producer: organizations.map((c) => ({ '@type': 'Organization', name: c.name })),
    }),
  };
}
