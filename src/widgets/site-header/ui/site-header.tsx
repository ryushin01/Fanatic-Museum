import { Link, useLocation } from 'react-router';

import { site } from '@/shared/config';

import styles from './site-header.module.css';
import { ThemeToggle } from './theme-toggle';

const items = [
  { to: '/works', label: '소장품', match: '/works' },
  { to: '/categories/game', label: '카테고리', match: '/categories' },
  { to: '/authors', label: '작가', match: '/authors' },
  { to: '/timeline', label: '연표', match: '/timeline' },
  { to: '/about', label: '소개', match: '/about' },
] as const;

export function SiteHeader() {
  const { pathname } = useLocation();

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo} viewTransition prefetch="intent">
          <img src="/brand/logo.svg" alt="" width={32} height={32} className={styles.logoMark} />
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
                    prefetch="intent"
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
        <ThemeToggle />
      </div>
    </header>
  );
}
