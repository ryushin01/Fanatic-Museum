/**
 * 커버리지 요약(coverage/coverage-summary.json)을 마크다운 표로 만듭니다(부수 효과 없는 함수).
 * CI는 이 표를 $GITHUB_STEP_SUMMARY에 씁니다(scripts/ci/coverage-summary.mjs).
 */

/** vitest.config.ts의 기준과 같은 묶음 */
export const GROUPS = [
  { name: '전체', match: () => true },
  { name: 'shared/lib', match: (path) => path.startsWith('src/shared/lib/') },
  { name: 'model', match: (path) => path.startsWith('src/') && path.includes('/model/') },
  { name: 'api', match: (path) => path.startsWith('src/') && path.includes('/api/') },
  { name: '다운로더 순수 함수', match: (path) => path === 'scripts/media/run-state.mjs' },
];

const METRICS = ['statements', 'branches', 'functions', 'lines'];

/** 파일별 요약을 묶음별 합계(%)로 모읍니다. root는 절대 경로 앞부분(끝에 / 포함)입니다. */
export function groupCoverage(summary, root) {
  const files = Object.entries(summary)
    .filter(([key]) => key !== 'total')
    .map(([key, value]) => [key.startsWith(root) ? key.slice(root.length) : key, value]);
  return GROUPS.map(({ name, match }) => {
    const picked = files.filter(([path]) => match(path));
    const pct = Object.fromEntries(
      METRICS.map((metric) => {
        const covered = picked.reduce((sum, [, v]) => sum + v[metric].covered, 0);
        const total = picked.reduce((sum, [, v]) => sum + v[metric].total, 0);
        return [metric, total === 0 ? 100 : Math.round((covered / total) * 10_000) / 100];
      }),
    );
    return { name, files: picked.length, ...pct };
  });
}

export function coverageMarkdown(rows) {
  const lines = [
    '### 커버리지',
    '',
    '| 묶음 | 파일 | 문장 | 분기 | 함수 | 줄 |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...rows.map(
      (r) =>
        `| ${r.name} | ${r.files} | ${r.statements}% | ${r.branches}% | ${r.functions}% | ${r.lines}% |`,
    ),
  ];
  return `${lines.join('\n')}\n`;
}
