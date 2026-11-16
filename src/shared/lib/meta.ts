import type { MetaDescriptor } from 'react-router';

import { site } from '@/shared/config';

type LdJson = Record<string, unknown>;

export interface PageMetaOptions {
  /** 탭 제목(<title>) */
  title: string;
  description: string;
  /** 이 페이지의 대표 주소(검색 조건 없이). 예: '/works/fate' */
  path: string;
  /** 공유 미리보기 제목. 없으면 탭 제목 */
  shareTitle?: string;
  /** 공유 미리보기 이미지(1200×630). 없으면 사이트 대표 이미지 */
  image?: { src: string; alt: string };
  /** 구조화 데이터(schema.org). 여러 개면 @graph로 묶어 한 번에 넣습니다. */
  jsonLd?: LdJson[];
  /** 검색 결과에 싣지 않을 페이지(404 등) */
  noindex?: boolean;
}

/** 사이트 안 경로를 공개 주소로 바꿉니다. '/works/fate' → 'https://…/works/fate' */
export function absoluteUrl(path: string): string {
  return new URL(path, site.url).href;
}

/** 경로 이동 표시(빵 부스러기)의 구조화 데이터 */
export function breadcrumbList(items: readonly { name: string; path: string }[]): LdJson {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * 페이지 meta를 한 모양으로 만듭니다: 제목·설명, canonical, 공유 미리보기(Open Graph·X), 구조화 데이터.
 * 각 페이지의 meta 함수가 이것을 돌려줍니다.
 */
export function pageMeta({
  title,
  description,
  path,
  shareTitle = title,
  image = { src: site.image, alt: `${site.name} — ${site.tagline}` },
  jsonLd,
  noindex = false,
}: PageMetaOptions): MetaDescriptor[] {
  const url = absoluteUrl(path);
  return [
    { title },
    { name: 'description', content: description },
    noindex
      ? { name: 'robots', content: 'noindex' }
      : { tagName: 'link', rel: 'canonical', href: url },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'ko_KR' },
    { property: 'og:url', content: url },
    { property: 'og:title', content: shareTitle },
    { property: 'og:description', content: description },
    { property: 'og:image', content: absoluteUrl(image.src) },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: image.alt },
    { name: 'twitter:card', content: 'summary_large_image' },
    ...(jsonLd?.length
      ? [{ 'script:ld+json': { '@context': 'https://schema.org', '@graph': jsonLd } }]
      : []),
  ];
}
