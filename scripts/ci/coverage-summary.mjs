#!/usr/bin/env node
/**
 * 커버리지 표를 GitHub Actions 요약($GITHUB_STEP_SUMMARY)에 씁니다. 로컬에서는 화면에 찍습니다.
 * pnpm test:coverage 뒤에 돌립니다.
 */
import { appendFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { coverageMarkdown, groupCoverage } from './coverage-table.mjs';

const root = `${process.cwd()}/`;
const summary = JSON.parse(await readFile(join(root, 'coverage', 'coverage-summary.json'), 'utf8'));
const markdown = coverageMarkdown(groupCoverage(summary, root));

if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown);
else console.log(markdown);
