import type { Author } from '@/shared/api';

/** 작가. 내용은 참고 문서(나무위키)에서 확인한 것만 적습니다. */
export const authors = [
  {
    slug: 'park-sung-woo',
    name: '박성우',
    occupation: '만화가',
    born: 1972,
    debut: '1993년 「8용신전설」',
    summary:
      '부산 출생. 일본식 그림체 1세대로 꼽히며, 아이큐 점프의 출판 만화에서 웹툰까지, 그리고 일본 잡지 연재까지 활동 무대를 넓혔습니다.',
    reference: 'https://namu.wiki/w/박성우(만화가)',
  },
  {
    slug: 'park-jin-hwan',
    name: '박진환',
    occupation: '만화가·웹툰 작가',
    summary:
      '1990년대부터 활동한 작가. 전극진과 함께 만든 「브레이커」 시리즈가 대표작으로 꼽히며, 출판 만화에서 네이버·다음 웹툰으로 이어 갔습니다.',
    reference: 'https://namu.wiki/w/박진환(만화가)',
  },
  {
    slug: 'lee-kyung-young',
    name: '이경영',
    occupation: '판타지 소설가',
    born: 1978,
    debut: '1999년 「가즈 나이트」',
    summary:
      '한국 판타지 1세대 작가 가운데 한 명. 고등학교 때부터 쓰기 시작한 「가즈 나이트」가 최고의 히트작으로, 40권이 넘는 시리즈가 되었습니다.',
    reference: 'https://namu.wiki/w/이경영(1978)',
  },
  {
    slug: 'lee-young-do',
    name: '이영도',
    occupation: '판타지 소설가',
    born: 1972,
    debut: '1997년 「드래곤 라자」',
    summary:
      '부산 출생. 하이텔 연재로 시작해 황금가지에서 책을 냈습니다. 「드래곤 라자」와 「눈물을 마시는 새」·「피를 마시는 새」가 대표작으로 꼽힙니다.',
    reference: 'https://namu.wiki/w/이영도',
  },
] as const satisfies readonly Author[];

export const AUTHOR_SLUGS: readonly string[] = authors.map((a) => a.slug);

export function findAuthor(slug: string): Author | undefined {
  return authors.find((a) => a.slug === slug);
}
