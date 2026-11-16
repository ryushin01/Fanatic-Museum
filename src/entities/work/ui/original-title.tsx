import type { Work } from '@/shared/api';
import { textLang } from '@/shared/lib';

export interface OriginalTitleProps {
  work: Pick<Work, 'nickname' | 'originalTitle'>;
  className?: string;
  as?: 'span' | 'p';
}

/**
 * 줄임말과 원제 "사에카노 · 冴えない彼女の育てかた".
 * 원제에는 언어(lang)를 붙여 화면 낭독기가 한국어 음성으로 일본어를 읽지 않게 합니다.
 */
export function OriginalTitle({
  work: { nickname, originalTitle },
  className,
  as: Tag = 'span',
}: OriginalTitleProps) {
  if (!nickname && !originalTitle) return null;
  return (
    <Tag className={className}>
      {nickname}
      {nickname && originalTitle && ' · '}
      {originalTitle && <span lang={textLang(originalTitle)}>{originalTitle}</span>}
    </Tag>
  );
}
