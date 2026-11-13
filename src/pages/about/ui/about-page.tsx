import { site } from '@/shared/config';
import { PageHeader } from '@/shared/ui';

import styles from './about-page.module.css';

export function meta() {
  return [
    { title: `소개 — ${site.name}` },
    { name: 'description', content: '파나틱 뮤지엄이 무엇을, 어떻게 전시하는지 소개합니다.' },
  ];
}

export function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About" title="대장정의 기록" description={site.description} />
      <div className={`container ${styles.sections}`}>
        <section className={styles.section} aria-labelledby="about-what">
          <h2 id="about-what" className={styles.heading}>
            무엇을 전시하나요
          </h2>
          <div className={styles.text}>
            <p>
              브라운관 앞에서 본 사이버 포뮬러, 밤새 붙잡고 있던 파이널 판타지와 창세기전, 책장 한
              칸을 채운 가즈 나이트와 눈물을 마시는 새, 서점에서 기다리던 박성우·박진환 작가의 만화.
              일본 애니메이션에서 출발해 한국의 소설과 만화까지 이어진 서브컬처 대장정을 박물관처럼
              번호를 붙여 전시합니다.
            </p>
            <p>
              작품은 게임, 소설, 라이트 노벨, 만화·웹툰, 애니메이션, 피규어, 프라모델로 나누어
              살펴볼 수 있고, 한 작품이 여러 분류에 걸칠 수 있습니다.
            </p>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="about-images">
          <h2 id="about-images" className={styles.heading}>
            이미지에 대하여
          </h2>
          <div className={styles.text}>
            <p>
              작품 이미지의 저작권은 각 저작권자에게 있습니다. 고화질 이미지는 관리자의 컴퓨터에
              작품별로 보관하고, 공개된 사이트에는 싣지 않습니다. 공개 사이트에서는 작품의 번호와
              대표색으로 만든 자리 표시 그래픽을 보여 줍니다.
            </p>
            <p>로컬에서 이미지를 볼 때는 원본이 올라온 페이지를 함께 표시합니다.</p>
            <p>
              이미지를 받는 곳과 글꼴 같은 외부 자료의 출처는{' '}
              <a href={`${site.repository}#출처`} rel="noreferrer" target="_blank">
                README의 출처<span className="visually-hidden">(새 창)</span>
              </a>
              에 모았습니다.
            </p>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="about-access">
          <h2 id="about-access" className={styles.heading}>
            누구나 볼 수 있게
          </h2>
          <ul className={`${styles.text} ${styles.list}`}>
            <li>모든 기능을 키보드만으로 쓸 수 있습니다. 갤러리는 버튼으로도 넘길 수 있습니다.</li>
            <li>화면 낭독기가 지금 보고 있는 이미지 번호를 읽어 줍니다.</li>
            <li>움직임 줄이기 설정을 켜면 화면 전환과 확대 효과를 줄입니다.</li>
            <li>운영체제의 어두운 화면 설정을 따릅니다.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
