import { describe, expect, it } from 'vitest';

import { coverageMarkdown, groupCoverage } from './coverage-table.mjs';

const metric = (covered, total) => ({ covered, total, pct: 0 });
const file = (covered, total) => ({
  statements: metric(covered, total),
  branches: metric(covered, total),
  functions: metric(covered, total),
  lines: metric(covered, total),
});

describe('groupCoverage', () => {
  it('파일별 요약을 묶음별 합계로 모은다', () => {
    const rows = groupCoverage(
      {
        total: file(0, 0),
        '/repo/src/shared/lib/a.ts': file(3, 4),
        '/repo/src/pages/works/model/b.ts': file(1, 4),
        '/repo/src/pages/home/api/c.ts': file(2, 2),
        '/repo/scripts/media/run-state.mjs': file(1, 3),
      },
      '/repo/',
    );
    expect(rows.map((r) => [r.name, r.files, r.lines])).toEqual([
      ['전체', 4, 53.85],
      ['shared/lib', 1, 75],
      ['model', 1, 25],
      ['api', 1, 100],
      ['다운로더 순수 함수', 1, 33.33],
    ]);
  });

  it('파일이 없는 묶음은 100%로 둔다', () => {
    expect(groupCoverage({ total: file(0, 0) }, '/repo/')[1]).toMatchObject({
      files: 0,
      lines: 100,
    });
  });
});

describe('coverageMarkdown', () => {
  it('묶음마다 한 줄씩 표를 만든다', () => {
    const markdown = coverageMarkdown([
      { name: '전체', files: 2, statements: 50, branches: 40, functions: 60, lines: 55 },
    ]);
    expect(markdown).toContain('| 묶음 | 파일 | 문장 | 분기 | 함수 | 줄 |');
    expect(markdown).toContain('| 전체 | 2 | 50% | 40% | 60% | 55% |');
  });
});
