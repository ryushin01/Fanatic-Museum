#!/usr/bin/env node
/**
 * 이미지 다운로드 진행 상황을 macOS 알림 센터로 알립니다(LaunchAgent가 2시간마다 실행).
 * 받은 용량·비율, 지난 알림 이후 늘어난 양, 지금 받는 모음, 멈춤·연결 대기·완료 여부를 보여 줍니다.
 * 문서 폴더 접근 권한이 있는 node로 실행합니다(/bin/zsh는 launchd에서 문서 폴더를 읽지 못합니다).
 *
 * 사용: node scripts/media/notify-progress.mjs [한도GB]
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir, userInfo } from 'node:os';
import { join } from 'node:path';

const MEDIA = process.env.FANATIC_MEDIA_DIR ?? join(homedir(), 'Documents', 'Fanatic-Museum');
const LIMIT = Number(process.argv[2] ?? 200);
const LOG = join(MEDIA, 'download.log');
const STATE = join(MEDIA, '.notify-state');
const LABEL = 'com.ryushin0.fanatic-museum-download';

const read = (file) => {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return '';
  }
};

const lines = read(LOG).trim().split('\n');
const lastLine = lines.at(-1) ?? '';
const lastBody = lastLine.replace(/^\[[^\]]+\]\s*/, '');
const usage = [...lines].reverse().find((l) => /(누적|사용) [\d.]+GB/.test(l));
const used = Number(usage?.match(/(?:누적|사용) ([\d.]+)GB/)?.[1] ?? 0);
const previous = Number(read(STATE) || used);
writeFileSync(STATE, String(used));
const delta = (used - previous).toFixed(2);
const percent = ((used * 100) / LIMIT).toFixed(1);
const current = lastBody.match(/^([a-z0-9/-]+)(?:#|\s)/)?.[1] ?? '확인 중';

let idleMinutes = 0;
try {
  idleMinutes = Math.floor((Date.now() - statSync(LOG).mtimeMs) / 60_000);
} catch {
  // 로그가 아직 없습니다.
}

let running = false;
try {
  const out = execFileSync('launchctl', ['print', `gui/${userInfo().uid}/${LABEL}`], {
    encoding: 'utf8',
  });
  running = /state = running/.test(out);
} catch {
  running = false;
}

const head = `${used}GB / ${LIMIT}GB(${percent}%)`;
let title;
let body;
if (/모든 출처를 받았습니다|용량 한도에 도달해 멈췄습니다/.test(lastLine)) {
  title = '다운로드를 마쳤습니다';
  body = `${head}. ${lastBody}`;
} else if (!running) {
  title = '다운로드가 멈춰 있습니다';
  body = `${head}. 다운로더가 실행 중이 아닙니다. pnpm media:agent install로 다시 시작하세요.`;
} else if (/인터넷 연결이 끊겨/.test(lastLine)) {
  title = '인터넷 연결을 기다리는 중';
  body = `${head}. 연결되면 이어서 받습니다.`;
} else if (idleMinutes >= 60) {
  title = `${idleMinutes}분째 기록이 없습니다`;
  body = `${head}. 큰 파일을 받는 중일 수 있습니다. pnpm media:agent status로 확인하세요.`;
} else {
  title = head;
  body = `지난 알림 이후 +${delta}GB · 지금: ${current}`;
}

const quote = (text) => `"${text.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
execFileSync('osascript', [
  '-e',
  `display notification ${quote(body)} with title "Fanatic Museum 다운로드" subtitle ${quote(title)}`,
]);
const now = new Date().toLocaleString('sv-SE', { hour12: false });
appendFileSync(join(MEDIA, 'notify.log'), `[${now}] ${title} — ${body}\n`);
