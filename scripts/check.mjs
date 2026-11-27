#!/usr/bin/env node
/**
 * CI와 같은 검사를 같은 순서로 돌립니다. CI(.github/workflows/ci.yml)도 이 스크립트를 단계별로 부릅니다.
 *
 *   pnpm check                     # 모든 단계
 *   pnpm check static build        # 고른 단계만
 *   pnpm check e2e -- --shard=1/2  # -- 뒤는 그 단계의 명령에 그대로 넘김
 *
 * 로컬에서는 시각 회귀를 Linux Docker 이미지에서(pnpm test:visual:docker), Lighthouse 결과는 파일로만 남깁니다.
 */
import { spawnSync } from 'node:child_process';

const ci = Boolean(process.env.CI);

/** 단계 이름 → 차례로 돌릴 pnpm 스크립트 */
const STEPS = {
  static: ['format:check', 'lint', 'lint:fsd', 'api:check', 'typecheck', 'test:coverage'],
  build: ['build:all', 'size'],
  storybook: ['test:storybook'],
  e2e: ['test:e2e'],
  visual: [ci ? 'test:visual' : 'test:visual:docker'],
  lhci: [ci ? 'lhci' : 'lhci --upload.target=filesystem'],
};

const argv = process.argv.slice(2);
const split = argv.indexOf('--');
const names = split === -1 ? argv : argv.slice(0, split);
const extra = split === -1 ? [] : argv.slice(split + 1);
const chosen = names.length > 0 ? names : Object.keys(STEPS);

const unknown = chosen.filter((name) => !(name in STEPS));
if (unknown.length > 0) {
  console.error(`없는 단계: ${unknown.join(', ')} (가능: ${Object.keys(STEPS).join(', ')})`);
  process.exit(2);
}

const started = Date.now();
for (const name of chosen) {
  const scripts = STEPS[name];
  for (const [i, script] of scripts.entries()) {
    const [command, ...args] = script.split(' ');
    // -- 뒤 인자는 그 단계의 마지막 명령에만 붙입니다.
    const all = i === scripts.length - 1 ? [...args, ...extra] : args;
    console.log(`\n▶ [${name}] pnpm ${[command, ...all].join(' ')}`);
    const t = Date.now();
    const result = spawnSync('pnpm', [command, ...all], { stdio: 'inherit' });
    if (result.status !== 0) {
      console.error(`✖ [${name}] ${script} 실패(${Math.round((Date.now() - t) / 1000)}초)`);
      process.exit(result.status ?? 1);
    }
    console.log(`✔ [${name}] ${script} (${Math.round((Date.now() - t) / 1000)}초)`);
  }
}
console.log(
  `\n모든 검사 통과: ${chosen.join(', ')} (${Math.round((Date.now() - started) / 1000)}초)`,
);
