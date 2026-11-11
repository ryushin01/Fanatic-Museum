import { Link, useLocation } from 'react-router';

import { site } from '@/shared/config';

import styles from './site-header.module.css';

const items = [
  { to: '/works', label: '소장품', match: '/works' },
  { to: '/categories/game', label: '카테고리', match: '/categories' },
  { to: '/about', label: '소개', match: '/about' },
] as const;

export function SiteHeader() {
  const { pathname } = useLocation();

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo} viewTransition>
          <span aria-hidden="true">
            FM<span className={styles.logoDot}>.</span>A
          </span>
          <span className="visually-hidden">{site.koreanName} 홈</span>
          <span className={styles.logoName} aria-hidden="true">
            {site.name.toUpperCase()}
          </span>
        </Link>
        <nav aria-label="주 메뉴" className={styles.nav}>
          <ul>
            {items.map((item, i) => {
              const exact = pathname === item.to;
              const inSection = pathname === item.match || pathname.startsWith(`${item.match}/`);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={styles.link}
                    viewTransition
                    aria-current={exact ? 'page' : inSection ? 'true' : undefined}
                  >
                    {item.label}
                    <sup aria-hidden="true">{i + 1}</sup>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
