import { useCallback, useSyncExternalStore } from 'react';

export type ThemeChoice = 'system' | 'light' | 'dark';

const KEY = 'fm-theme';
const listeners = new Set<() => void>();

function read(): ThemeChoice {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function apply(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === 'system') delete root.dataset.theme;
  else root.dataset.theme = choice;
}

/** 첫 화면을 그리기 전에 저장된 테마를 적용하는 인라인 스크립트(깜빡임 방지) */
export const themeInitScript = `try{var t=localStorage.getItem('${KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

/** 화면 테마 선택. 서버(사전 렌더링)에서는 항상 'system'입니다. */
export function useTheme() {
  const choice = useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    read,
    () => 'system' as const,
  );

  const setChoice = useCallback((next: ThemeChoice) => {
    try {
      if (next === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      // 저장할 수 없어도 이번 화면에는 적용합니다.
    }
    apply(next);
    listeners.forEach((l) => l());
  }, []);

  return [choice, setChoice] as const;
}
