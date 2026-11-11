import { Button } from 'react-aria-components';

import { useTheme, type ThemeChoice } from '@/shared/lib';

import styles from './site-header.module.css';

const order: ThemeChoice[] = ['system', 'light', 'dark'];
const labels: Record<ThemeChoice, string> = { system: '시스템', light: '밝게', dark: '어둡게' };
const icons: Record<ThemeChoice, string> = { system: '◐', light: '○', dark: '●' };

/** 화면 테마를 시스템 → 밝게 → 어둡게 순서로 바꿉니다. */
export function ThemeToggle() {
  const [choice, setChoice] = useTheme();
  const next = order[(order.indexOf(choice) + 1) % order.length]!;

  return (
    <Button className={styles.theme} onPress={() => setChoice(next)}>
      <span aria-hidden="true">{icons[choice]}</span>
      <span className="visually-hidden">화면 테마:</span>{' '}
      <span className={styles.themeLabel}>{labels[choice]}</span>
    </Button>
  );
}
