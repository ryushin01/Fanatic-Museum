export const site = {
  name: 'Fanatic Museum',
  koreanName: '파나틱 뮤지엄',
  tagline: '서브컬처 대장정',
  description:
    '애니메이션, 게임, 라이트 노벨, 판타지 소설, 만화, 피규어, 프라모델까지. 한 사람의 덕질 대장정을 소장품처럼 기록한 서브컬처 박물관입니다.',
  /** 공개 주소. canonical·공유 미리보기·구조화 데이터에 씁니다(사이트맵은 SITE_URL로 바꿀 수 있음). */
  url: 'https://fanatic-museum-ryushin01.vercel.app',
  /** 공유 미리보기 대표 이미지(1200×630). `pnpm og:build`로 만듭니다. */
  image: '/og/site.png',
  repository: 'https://github.com/ryushin01/Fanatic-Museum',
} as const;
