import type { Work, WorkImage } from '@/shared/api';

export function makeImage(i: number): WorkImage {
  return {
    src: `/media/test/${i}-1280.webp`,
    srcSet: `/media/test/${i}-640.webp 640w, /media/test/${i}-1280.webp 1280w`,
    width: 1280,
    height: 1600,
    alt: `테스트 작품 일러스트 ${i}`,
    sourcePage: `https://example.com/post/${i}`,
  };
}

export function makeWork(overrides: Partial<Work> = {}): Work {
  return {
    slug: 'test-work',
    number: 1,
    title: '테스트 작품',
    categories: ['animation'],
    creators: [{ role: '제작', name: '테스트 스튜디오' }],
    origin: '일본',
    summary: '테스트용 소장품 설명입니다.',
    accent: '#d7261e',
    related: [],
    images: [],
    ...overrides,
  };
}
