import { Link } from 'react-router';

import { categories } from '@/entities/category';
import { works } from '@/entities/work';
import { site } from '@/shared/config';
import { padNumber } from '@/shared/lib';

import styles from './site-footer.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <p className={styles.lede}>{site.description}</p>
          <nav aria-label="카테고리">
            <h2 className="label">카테고리</h2>
            <ul className={styles.list}>
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link to={`/categories/${c.slug}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="바로 가기">
            <h2 className="label">바로 가기</h2>
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
        </div>
        <p className={styles.wordmark} aria-hidden="true">
          {site.name}
        </p>
        <div className={styles.bottom}>
          <span>
            {site.koreanName} · {site.tagline}
          </span>
          <span className="num">
            소장품 {padNumber(1)}–{padNumber(works.length)}
          </span>
        </div>
      </div>
    </footer>
  );
}
