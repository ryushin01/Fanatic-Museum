import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** scripts/media/build-variants.mjs가 만드는 public/media/index.json의 항목 */
export interface MediaEntry {
  key: string;
  kind: 'illustration' | 'screenshot' | 'cover';
  src: string;
  srcSet: string;
  width: number;
  height: number;
  sourcePage: string | null;
  origin: string | null;
}

export type MediaIndex = Record<string, MediaEntry[]>;

let cache: Promise<MediaIndex> | undefined;

/**
 * 배포(Vercel)·CI 빌드는 scripts/prune-assets.mjs가 build/client/media를 지우므로 로컬 이미지를 쓰지 않습니다.
 * (보관함이 있는 컴퓨터에서 CI=1로 빌드해도 HTML이 지워진 이미지를 가리키지 않게)
 */
export function usesLocalMedia(env: Readonly<Record<string, string | undefined>>): boolean {
  return !env.VERCEL && !env.CI;
}

/**
 * 로컬 이미지 변환본 목록을 읽습니다. 빌드(사전 렌더링) 때만 실행됩니다.
 * 변환본이 없는 환경(보관함이 없는 컴퓨터, CI, 배포)에서는 빈 목록을 돌려주고, 화면은 자리 표시 그래픽을 씁니다.
 */
export function loadMediaIndex(): Promise<MediaIndex> {
  if (!usesLocalMedia(process.env)) return Promise.resolve({});
  cache ??= readFile(join(process.cwd(), 'public', 'media', 'index.json'), 'utf8')
    .then((text) => JSON.parse(text) as MediaIndex)
    .catch(() => ({}));
  return cache;
}
