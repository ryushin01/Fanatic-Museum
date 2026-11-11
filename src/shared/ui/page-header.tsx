import type { ReactNode } from 'react';

import styles from './page-header.module.css';

export interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}

/** 페이지 맨 위의 제목 영역. 페이지마다 h1은 이것 하나입니다. */
export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <header className={`container ${styles.header}`}>
      {eyebrow && <p className={`label ${styles.eyebrow}`}>{eyebrow}</p>}
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
      {children}
    </header>
  );
}
