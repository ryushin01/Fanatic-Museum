import type { Category, CategorySlug } from '@/shared/api';

export const categories = [
  {
    slug: 'game',
    name: '게임',
    englishName: 'Games',
    description: '롤플레잉부터 비주얼 노벨까지, 밤을 새우게 만든 게임.',
  },
  {
    slug: 'novel',
    name: '소설',
    englishName: 'Novels',
    description: 'PC 통신 시절부터 서가를 채워 온 한국 판타지 소설.',
  },
  {
    slug: 'light-novel',
    name: '라이트 노벨',
    englishName: 'Light Novels',
    description: '삽화와 함께 읽는 일본 라이트 노벨.',
  },
  {
    slug: 'comic',
    name: '만화·웹툰',
    englishName: 'Comics',
    description: '단행본과 웹툰으로 이어진 한국과 일본의 만화.',
  },
  {
    slug: 'animation',
    name: '애니메이션',
    englishName: 'Animation',
    description: 'TV 시리즈와 극장판으로 기억되는 애니메이션.',
  },
  {
    slug: 'figure',
    name: '피규어',
    englishName: 'Figures',
    description: '화면 속 캐릭터와 머신을 손에 쥘 수 있게 만든 피규어.',
  },
  {
    slug: 'plastic-model',
    name: '프라모델',
    englishName: 'Plastic Models',
    description: '직접 조립하고 칠해서 완성하는 프라모델.',
  },
] as const satisfies readonly Category[];

export const CATEGORY_SLUGS: readonly CategorySlug[] = categories.map((c) => c.slug);

export function findCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
