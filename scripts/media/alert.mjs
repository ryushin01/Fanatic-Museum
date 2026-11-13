/**
 * 다운로드 알림: macOS 알림 센터에 띄우고 보관함의 notify.log에 남깁니다.
 * 다운로더(멈춤·다시 시작·잠자기·인터넷 끊김)와 2시간마다 도는 진행 알림이 함께 씁니다.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

const TITLE = 'Fanatic Museum 다운로드';
const quote = (text) => `"${String(text).replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;

/**
 * 알림 하나를 보냅니다. 종료 직전(신호 처리)에도 쓰도록 동기로 동작하고,
 * 알림을 띄우지 못해도 다운로드를 멈추지 않습니다(기록만 남깁니다).
 */
export function notify(mediaDir, { subtitle, body }) {
  try {
    execFileSync('osascript', [
      '-e',
      `display notification ${quote(body)} with title ${quote(TITLE)} subtitle ${quote(subtitle)}`,
    ]);
  } catch {
    // 알림 센터를 쓸 수 없는 환경입니다(로그인 화면, CI 등).
  }
  try {
    const now = new Date().toLocaleString('sv-SE', { hour12: false });
    appendFileSync(join(mediaDir, 'notify.log'), `[${now}] ${subtitle} — ${body}\n`);
  } catch {
    // 보관함에 쓸 수 없으면 기록을 건너뜁니다.
  }
}
