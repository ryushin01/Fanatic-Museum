import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/**
 * 사이트 전체에 쓰는 axe 검사(WCAG 2.2 AA + 모범 사례).
 * story: Storybook 스토리 한 조각만 그린 문서라 페이지 단위 규칙(본문 영역·h1 하나)은 빼고 봅니다.
 */
export async function expectNoAxeViolations(page: Page, { story = false } = {}) {
  // 사용자 지시(2026-11-23)로 디자인 개편 화면은 글자 대비(4.5:1)를 검사하지 않습니다. 다른 규칙은 그대로입니다.
  const disabled = ['color-contrast'];
  if (story) disabled.push('landmark-one-main', 'page-has-heading-one', 'region');
  const builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .disableRules(disabled);
  const result = await builder.analyze();
  expect(
    result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
  ).toEqual([]);
}
