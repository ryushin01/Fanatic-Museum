import { Link } from 'react-router';

import { categories } from '@/entities/category';
import { site } from '@/shared/config';
import { padNumber } from '@/shared/lib';
import { ArrowLink } from '@/shared/ui';

import styles from './site-footer.module.css';

export interface SiteFooterProps {
  /** 소장품 수. 있으면 맨 아래에 전시 번호 범위(001–030)를 보여 줍니다. */
  workCount?: number;
}

export function SiteFooter({ workCount }: SiteFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.cta}>
          <p className={styles.statement}>
            보고 싶은 작품이 있나요?
            <br />
            번호와 초성만으로 소장품을 찾아보세요.
          </p>
          <ArrowLink to="/works" tone="brand">
            소장품 찾아보기
          </ArrowLink>
        </div>
        <div className={styles.top}>
          <p className={styles.lede}>{site.description}</p>
          <nav aria-label="카테고리">
            <h2 className={`label ${styles.navTitle}`}>카테고리</h2>
            <ul className={styles.list}>
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link to={`/categories/${c.slug}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="바로 가기">
            <h2 className={`label ${styles.navTitle}`}>바로 가기</h2>
            <ul className={styles.list}>
              <li>
                <Link to="/works">소장품 전체</Link>
              </li>
              <li>
                <Link to="/authors">작가</Link>
              </li>
              <li>
                <Link to="/timeline">대장정 연표</Link>
              </li>
              <li>
                <Link to="/about">박물관 소개</Link>
              </li>
              <li>
                <a href={site.repository}>GitHub 저장소</a>
              </li>
            </ul>
          </nav>
          {workCount !== undefined && workCount > 0 && (
            <div className={styles.badge}>
              <p className={styles.wordmark} aria-hidden="true">
                {site.name.toLowerCase()}
              </p>
              <p className={`num ${styles.bigNumber}`}>{padNumber(workCount)}</p>
              <p className={`label num ${styles.badgeBar}`}>
                소장품 {padNumber(1)}–{padNumber(workCount)}
              </p>
            </div>
          )}
        </div>
        <div className={`label ${styles.bottom}`}>
          <span>
            {site.koreanName} {'\\'} {site.tagline}
          </span>
          <span>{site.name}</span>
        </div>
      </div>
    </footer>
  );
}
