/**
 * 다운로더가 멈췄다가 다시 시작한 이유와 알림 문구를 정합니다(부수 효과 없는 함수만 둡니다).
 *
 * 실행 기록(.download-run.json): { pid, startedAt, beatAt, ended, detail, restartNotifiedAt }
 * - beatAt: 30초마다 갱신하는 마지막 생존 시각. 멈춘 시간을 잴 때 씁니다.
 * - ended: 'signal'(종료 신호) | 'error'(오류) | 'done'(완료·한도) | null(기록 없이 끝남: 강제 종료·전원 꺼짐)
 */

/** 잠자기로 본다: 30초마다 도는 타이머가 이 시간보다 늦게 돌면 그동안 맥이 잠들었던 것입니다. */
export const SLEEP_GAP_MS = 5 * 60_000;
/** 인터넷이 이 시간보다 오래 끊겨야 알립니다(잠깐 끊기는 정도는 기록만 남김). */
export const OFFLINE_ALERT_MS = 2 * 60_000;
/** 다시 시작 알림을 이 간격 안에 또 보내지 않습니다(오류로 1분마다 다시 시작해도 한 번만). */
export const RESTART_QUIET_MS = 10 * 60_000;

/** 1분 40초 → "약 2분", 75분 → "약 1시간 15분" */
export function formatGap(ms) {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return `약 ${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `약 ${hours}시간 ${rest}분` : `약 ${hours}시간`;
}

/**
 * 지난 실행 기록과 지금 상황으로 다시 시작한 이유를 정합니다.
 * @param prev 지난 실행 기록(없으면 처음 실행)
 * @param opts.now 지금 시각(ms)
 * @param opts.bootAt 맥이 켜진 시각(ms)
 * @param opts.stopRequestedAt 등록 스크립트가 남긴 수동 정지 시각(ms, 없으면 0)
 */
export function restartReason(prev, { now, bootAt, stopRequestedAt = 0 }) {
  if (!prev) return { kind: 'first', downMs: 0 };
  const last = prev.beatAt ?? prev.startedAt ?? now;
  const downMs = Math.max(0, now - last);
  // 마지막 생존 신호 뒤에 맥이 켜졌으면 재부팅(또는 전원 꺼짐) 뒤입니다.
  if (bootAt > last) return { kind: 'reboot', downMs };
  if (prev.ended === 'error') return { kind: 'error', downMs, detail: prev.detail ?? '' };
  // 등록 스크립트(install·uninstall)가 멈춘 경우: 다운로더는 신호를 못 받고 끝났을 수 있습니다.
  if (stopRequestedAt && stopRequestedAt >= last - 60_000) return { kind: 'manual', downMs };
  if (prev.ended === 'signal') return { kind: 'signal', downMs };
  if (prev.ended === 'done') return { kind: 'rerun', downMs };
  return { kind: 'crash', downMs };
}

/** 다시 시작 알림 문구. usedGb는 지금까지 받은 용량입니다. */
export function describeRestart(reason, usedGb) {
  const used = `지금까지 ${usedGb.toFixed(1)}GB`;
  const gap = `${formatGap(reason.downMs)} 멈춰 있었습니다`;
  switch (reason.kind) {
    case 'first':
      return { subtitle: '다운로드를 시작했습니다', body: `${used}를 받아 두었습니다.` };
    case 'reboot':
      return { subtitle: '맥이 다시 켜져 이어 받습니다', body: `${gap}. ${used}.` };
    case 'error':
      return {
        subtitle: '오류로 멈췄다가 다시 시작했습니다',
        body: `${gap}. ${reason.detail ? `원인: ${reason.detail.slice(0, 80)}. ` : ''}${used}.`,
      };
    case 'manual':
      return { subtitle: '다운로더를 다시 등록해 이어 받습니다', body: `${gap}. ${used}.` };
    case 'signal':
      return { subtitle: '종료됐다가 다시 시작했습니다', body: `${gap}. ${used}.` };
    case 'rerun':
      return {
        subtitle: '다운로드를 다시 시작했습니다',
        body: `지난번에 끝까지 받은 뒤입니다. ${used}.`,
      };
    default:
      return {
        subtitle: '예기치 않게 멈췄다가 다시 시작했습니다',
        body: `강제 종료나 전원 문제로 보입니다. ${gap}. ${used}.`,
      };
  }
}

/** 지난 다시 시작 알림 뒤로 충분히 지났는지(오류로 연달아 다시 시작할 때 알림이 쏟아지지 않게) */
export function shouldAnnounceRestart(prev, now) {
  return !prev?.restartNotifiedAt || now - prev.restartNotifiedAt >= RESTART_QUIET_MS;
}

/** 30초 타이머 사이가 이만큼 벌어졌으면 잠자기에서 깬 것으로 보고 그 시간을 돌려줍니다(아니면 0). */
export function sleptFor(lastTick, now) {
  const gap = now - lastTick;
  return gap >= SLEEP_GAP_MS ? gap : 0;
}
