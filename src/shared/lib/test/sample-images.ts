import type { WorkImage } from '@/shared/api';

/** 스토리·테스트용 이미지. 저작권 없는 SVG를 코드로 만듭니다. */
export function sampleImage(
  i: number,
  accent = '#d7261e',
  ratio: 'portrait' | 'landscape' = 'portrait',
): WorkImage {
  const [w, h] = ratio === 'portrait' ? [1200, 1500] : [1920, 1080];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="${accent}"/><circle cx="${w * 0.7}" cy="${h * 0.3}" r="${w * 0.25}" fill="rgba(255,255,255,.25)"/><text x="60" y="${h - 80}" font-family="sans-serif" font-size="160" font-weight="900" fill="#fff">${String(i).padStart(2, '0')}</text></svg>`;
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return {
    src,
    srcSet: `${src} ${w}w`,
    width: w,
    height: h,
    alt: `예시 이미지 ${i}`,
    sourcePage: null,
  };
}
