/**
 * 밝은 색인지 봅니다(WCAG 상대 휘도 0.4 넘음). 밝은 대표색 위에는 어두운 글자를 써서 명도 대비를 지킵니다.
 * 자리 표시 그래픽(WorkCover)과 공유 이미지(scripts/og-images.mjs)가 함께 씁니다.
 */
export function isLightColor(hex: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lum = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lum(r!) + 0.7152 * lum(g!) + 0.0722 * lum(b!) > 0.4;
}
