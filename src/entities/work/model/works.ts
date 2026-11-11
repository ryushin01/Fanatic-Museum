import type { Work } from '@/shared/api';

/** 이미지를 뺀 소장품 기록. 이미지는 빌드할 때 로컬 보관함에서 붙습니다. */
export type WorkRecord = Omit<Work, 'images'>;

/**
 * 소장품 목록. 번호는 전시 순서입니다.
 * 사실이 확실하지 않은 연도와 설명은 비워 둡니다.
 */
export const works = [
  {
    slug: 'cyber-formula',
    number: 1,
    title: '신세기 GPX 사이버 포뮬러',
    originalTitle: '新世紀GPXサイバーフォーミュラ',
    categories: ['animation'],
    creators: [{ role: '제작', name: '선라이즈' }],
    origin: '일본',
    firstReleased: 1991,
    summary:
      '인공지능이 운전을 돕는 근미래 레이스 "사이버 포뮬러". 인공지능 아스라다를 실은 머신을 우연히 몰게 된 소년 카자미 하야토가 그랑프리에 뛰어듭니다.',
    notes: ['대장정의 출발점. 이 박물관의 1번 소장품입니다.'],
    accent: '#d7261e',
    related: ['asurada-figure'],
  },
  {
    slug: 'asurada-figure',
    number: 2,
    title: '아스라다 피규어',
    categories: ['figure'],
    creators: [{ role: '원작', name: '신세기 GPX 사이버 포뮬러' }],
    origin: '일본',
    summary:
      '사이버 포뮬러의 주역 머신 슈퍼 아스라다를 손에 쥘 수 있는 크기로 옮긴 피규어. 붉은 차체와 날렵한 윙이 그대로 살아 있습니다.',
    accent: '#c41f1f',
    related: ['cyber-formula'],
  },
  {
    slug: 'saekano',
    number: 3,
    title: '시원찮은 그녀를 위한 육성방법',
    originalTitle: '冴えない彼女の育てかた',
    nickname: '사에카노',
    categories: ['light-novel', 'animation'],
    creators: [
      { role: '글', name: '마루토 후미아키' },
      { role: '그림', name: '미사키 쿠레히토' },
    ],
    origin: '일본',
    firstReleased: 2012,
    summary:
      '오타쿠 고등학생 아키 토모야가 "최고의 미소녀 게임"을 만들겠다며 동인 서클을 꾸립니다. 2015년 TV 애니메이션으로도 만들어졌습니다.',
    accent: '#e8789a',
    related: ['sword-art-online'],
  },
  {
    slug: 'fate',
    number: 4,
    title: 'Fate 시리즈',
    originalTitle: 'Fate/stay night',
    categories: ['game', 'animation'],
    creators: [
      { role: '제작', name: 'TYPE-MOON' },
      { role: '글', name: '나스 키노코' },
      { role: '그림', name: '타케우치 타카시' },
    ],
    origin: '일본',
    firstReleased: 2004,
    summary:
      '일곱 명의 마스터와 서번트가 소원을 이루어 준다는 성배를 두고 싸우는 성배전쟁. 비주얼 노벨에서 시작해 애니메이션과 게임으로 넓어진 시리즈입니다.',
    accent: '#2c4a9a',
    related: ['final-fantasy'],
  },
  {
    slug: 'sword-art-online',
    number: 5,
    title: '소드 아트 온라인',
    originalTitle: 'ソードアート・オンライン',
    nickname: 'SAO',
    categories: ['light-novel', 'animation', 'game'],
    creators: [
      { role: '글', name: '카와하라 레키' },
      { role: '그림', name: 'abec' },
    ],
    origin: '일본',
    firstReleased: 2009,
    summary:
      '로그아웃할 수 없는 가상현실 게임에 갇힌 플레이어들. 게임 속 죽음이 현실의 죽음이 되는 세계에서 키리토는 100층 탑의 끝을 향해 나아갑니다.',
    accent: '#1f6fb2',
    related: ['saekano'],
  },
  {
    slug: 'final-fantasy',
    number: 6,
    title: '파이널 판타지 시리즈',
    originalTitle: 'FINAL FANTASY',
    categories: ['game'],
    creators: [
      { role: '제작', name: '스퀘어 에닉스' },
      { role: '기획', name: '사카구치 히로노부' },
    ],
    origin: '일본',
    firstReleased: 1987,
    summary:
      '작품마다 새로운 세계와 인물로 다시 시작하는 롤플레잉 게임 시리즈. 크리스털, 초코보, 소환수 같은 상징을 이어 가며 수십 년째 새 작품이 나오고 있습니다.',
    accent: '#3b6e8f',
    related: ['genesis-war', 'fate'],
  },
  {
    slug: 'genesis-war',
    number: 7,
    title: '창세기전 시리즈',
    categories: ['game'],
    creators: [{ role: '제작', name: '소프트맥스' }],
    origin: '한국',
    firstReleased: 1995,
    summary:
      '안타리아 대륙을 무대로 한 한국 판타지 게임 시리즈. 전략 시뮬레이션과 롤플레잉을 오가며 여러 외전으로 세계를 넓혔습니다.',
    accent: '#8a6a2b',
    related: ['final-fantasy'],
  },
  {
    slug: 'wing-gundam-custom',
    number: 8,
    title: '윙건담 커스텀',
    categories: ['plastic-model'],
    creators: [
      { role: '원작', name: '신기동전기 건담 W' },
      { role: '키트', name: '반다이' },
    ],
    origin: '일본',
    summary:
      '신기동전기 건담 W의 주역기 윙건담을 도색하고 다듬어 완성한 커스텀 건프라. 날개를 펼친 비행 형태와 인간형을 오가는 변형이 특징입니다.',
    accent: '#d9dde3',
    related: ['gunpla'],
  },
  {
    slug: 'gunpla',
    number: 9,
    title: '건프라 컬렉션',
    categories: ['plastic-model'],
    creators: [{ role: '키트', name: '반다이' }],
    origin: '일본',
    summary:
      '건담 시리즈의 기체를 조립하고 칠해서 완성하는 프라모델. 같은 키트라도 만드는 사람에 따라 전혀 다른 작품이 됩니다.',
    accent: '#4c5c73',
    related: ['wing-gundam-custom'],
  },
  {
    slug: 'figures',
    number: 10,
    title: '게임·애니메이션 피규어',
    categories: ['figure'],
    creators: [],
    origin: '일본',
    summary: '게임과 애니메이션 속 캐릭터를 입체로 옮긴 피규어 모음.',
    accent: '#6b5b95',
    related: ['asurada-figure'],
  },
  {
    slug: 'gods-knight',
    number: 11,
    title: '가즈 나이트',
    categories: ['novel'],
    creators: [{ role: '글', name: '이경영' }],
    origin: '한국',
    summary: 'PC 통신 연재로 시작해 한 세대의 독자를 판타지로 이끈 이경영 작가의 대표작.',
    accent: '#5a2a82',
    related: ['granit'],
  },
  {
    slug: 'granit',
    number: 12,
    title: '그라니트',
    categories: ['novel'],
    creators: [{ role: '글', name: '이경영' }],
    origin: '한국',
    summary: '이경영 작가의 판타지 소설.',
    accent: '#5e6b5a',
    related: ['gods-knight'],
  },
  {
    slug: 'tears-drinker',
    number: 13,
    title: '눈물을 마시는 새',
    nickname: '눈마새',
    categories: ['novel'],
    creators: [{ role: '글', name: '이영도' }],
    origin: '한국',
    firstReleased: 2003,
    summary:
      '인간, 레콘, 도깨비, 나가. 서로 다른 네 선민 종족이 사는 세계에서 펼쳐지는 여정. 한국 판타지의 고전으로 꼽힙니다.',
    accent: '#1d5c63',
    related: ['blood-drinker'],
  },
  {
    slug: 'blood-drinker',
    number: 14,
    title: '피를 마시는 새',
    nickname: '피마새',
    categories: ['novel'],
    creators: [{ role: '글', name: '이영도' }],
    origin: '한국',
    firstReleased: 2005,
    summary: '눈물을 마시는 새와 같은 세계를 배경으로 한 이영도 작가의 장편 판타지.',
    accent: '#7a1f2b',
    related: ['tears-drinker'],
  },
  {
    slug: 'now',
    number: 15,
    title: '나우',
    originalTitle: 'NOW',
    categories: ['comic'],
    creators: [{ role: '글·그림', name: '박성우' }],
    origin: '한국',
    summary: '박성우 작가의 무협 액션 만화. 속도감 있는 연출과 선이 굵은 액션으로 사랑받았습니다.',
    accent: '#b5651d',
    related: ['black-god'],
  },
  {
    slug: 'black-god',
    number: 16,
    title: '흑신',
    originalTitle: '黒神',
    categories: ['comic'],
    creators: [
      { role: '글', name: '임달영' },
      { role: '그림', name: '박성우' },
    ],
    origin: '한국',
    summary: '한국 작가들이 일본 잡지에 연재한 액션 판타지 만화. 한국 만화가 바다를 건너 넓어진 장면 가운데 하나입니다.',
    accent: '#22252b',
    related: ['now'],
  },
  {
    slug: 'the-breaker',
    number: 17,
    title: '브레이커',
    originalTitle: 'The Breaker',
    categories: ['comic'],
    creators: [
      { role: '글', name: '전극진' },
      { role: '그림', name: '박진환' },
    ],
    origin: '한국',
    summary:
      '평범한 학교 선생님 한천우는 사실 무림의 고수. 괴롭힘당하던 학생 이시운이 그에게 무공을 배우며 무림으로 들어섭니다. 후속작 뉴 웨이브로 이어졌습니다.',
    accent: '#3c3c3c',
    related: ['now'],
  },
] as const satisfies readonly WorkRecord[];

export const WORK_SLUGS: readonly string[] = works.map((w) => w.slug);

export function findWork(slug: string): WorkRecord | undefined {
  return works.find((w) => w.slug === slug);
}
