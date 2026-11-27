import { describe, expect, it } from 'vitest';
import {
  describeRestart,
  formatGap,
  restartReason,
  shouldAnnounceRestart,
  sleptFor,
} from './run-state.mjs';

const MIN = 60_000;
const NOW = Date.UTC(2026, 10, 13, 6, 0);

describe('restartReason', () => {
  it('생존 신호가 없으면 시작 시각, 그것도 없으면 지금을 마지막으로 보고, 원인 없는 오류도 error', () => {
    const opts = { now: NOW, bootAt: NOW - 60 * MIN };
    expect(restartReason({ startedAt: NOW - 3 * MIN, ended: 'signal' }, opts)).toEqual({
      kind: 'signal',
      downMs: 3 * MIN,
    });
    expect(restartReason({ ended: 'error' }, opts)).toEqual({
      kind: 'error',
      downMs: 0,
      detail: '',
    });
  });

  it('처음 실행이면 first', () => {
    expect(restartReason(null, { now: NOW, bootAt: NOW - 60 * MIN })).toEqual({
      kind: 'first',
      downMs: 0,
    });
  });

  it('마지막 생존 신호 뒤에 맥이 켜졌으면 재부팅으로 보고 멈춘 시간을 잰다', () => {
    const prev = { beatAt: NOW - 30 * MIN, ended: null };
    expect(restartReason(prev, { now: NOW, bootAt: NOW - 3 * MIN })).toEqual({
      kind: 'reboot',
      downMs: 30 * MIN,
    });
  });

  it('오류로 끝났으면 원인과 함께 error', () => {
    const prev = { beatAt: NOW - MIN, ended: 'error', detail: 'ENOSPC' };
    expect(restartReason(prev, { now: NOW, bootAt: NOW - 600 * MIN })).toMatchObject({
      kind: 'error',
      detail: 'ENOSPC',
    });
  });

  it('등록 스크립트가 멈춘 직후면 신호 기록이 없어도 manual', () => {
    const prev = { beatAt: NOW - 2 * MIN, ended: null };
    expect(
      restartReason(prev, { now: NOW, bootAt: NOW - 600 * MIN, stopRequestedAt: NOW - 1.5 * MIN }),
    ).toMatchObject({ kind: 'manual' });
  });

  it('오래된 수동 정지 기록은 무시한다', () => {
    const prev = { beatAt: NOW - 2 * MIN, ended: null };
    expect(
      restartReason(prev, { now: NOW, bootAt: NOW - 600 * MIN, stopRequestedAt: NOW - 120 * MIN }),
    ).toMatchObject({ kind: 'crash' });
  });

  it('종료 신호 기록이면 signal, 완료 뒤면 rerun, 기록 없이 끝났으면 crash', () => {
    const base = { beatAt: NOW - 5 * MIN };
    const opts = { now: NOW, bootAt: NOW - 600 * MIN };
    expect(restartReason({ ...base, ended: 'signal' }, opts).kind).toBe('signal');
    expect(restartReason({ ...base, ended: 'done' }, opts).kind).toBe('rerun');
    expect(restartReason({ ...base, ended: null }, opts).kind).toBe('crash');
  });
});

describe('describeRestart', () => {
  it('이유마다 멈춘 시간과 받은 용량을 알린다', () => {
    expect(describeRestart({ kind: 'reboot', downMs: 75 * MIN }, 70.94)).toEqual({
      subtitle: '맥이 다시 켜져 이어 받습니다',
      body: '약 1시간 15분 멈춰 있었습니다. 지금까지 70.9GB.',
    });
    expect(describeRestart({ kind: 'crash', downMs: 2 * MIN }, 10).subtitle).toBe(
      '예기치 않게 멈췄다가 다시 시작했습니다',
    );
  });

  it('처음·오류(원인 있음·없음)·수동·신호·완료 뒤 문구를 고른다', () => {
    expect(describeRestart({ kind: 'first', downMs: 0 }, 1).body).toBe(
      '지금까지 1.0GB를 받아 두었습니다.',
    );
    expect(describeRestart({ kind: 'error', downMs: MIN, detail: 'ECONNRESET' }, 2).body).toBe(
      '약 1분 멈춰 있었습니다. 원인: ECONNRESET. 지금까지 2.0GB.',
    );
    expect(describeRestart({ kind: 'error', downMs: MIN, detail: '' }, 2).body).toBe(
      '약 1분 멈춰 있었습니다. 지금까지 2.0GB.',
    );
    expect(describeRestart({ kind: 'manual', downMs: MIN }, 2).subtitle).toBe(
      '멈췄던 다운로더를 다시 켜 이어 받습니다',
    );
    expect(describeRestart({ kind: 'signal', downMs: MIN }, 2).subtitle).toBe(
      '종료됐다가 다시 시작했습니다',
    );
    expect(describeRestart({ kind: 'rerun', downMs: MIN }, 2).body).toBe(
      '지난번에 끝까지 받은 뒤입니다. 지금까지 2.0GB.',
    );
  });
});

describe('formatGap', () => {
  it('1분 미만은 1분, 60분부터는 시간으로', () => {
    expect(formatGap(20_000)).toBe('약 1분');
    expect(formatGap(42 * MIN)).toBe('약 42분');
    expect(formatGap(120 * MIN)).toBe('약 2시간');
  });
});

describe('shouldAnnounceRestart', () => {
  it('오류·강제 종료로 10분 안에 다시 시작하면 한 번만 알린다', () => {
    expect(shouldAnnounceRestart(null, NOW, 'error')).toBe(true);
    expect(shouldAnnounceRestart({ restartNotifiedAt: NOW - 3 * MIN }, NOW, 'error')).toBe(false);
    expect(shouldAnnounceRestart({ restartNotifiedAt: NOW - 3 * MIN }, NOW, 'crash')).toBe(false);
    expect(shouldAnnounceRestart({ restartNotifiedAt: NOW - 11 * MIN }, NOW, 'error')).toBe(true);
  });

  it('재부팅·다시 등록·종료 신호는 방금 알렸어도 늘 알린다', () => {
    for (const kind of ['reboot', 'manual', 'signal', 'rerun', 'first']) {
      expect(shouldAnnounceRestart({ restartNotifiedAt: NOW - MIN }, NOW, kind)).toBe(true);
    }
  });
});

describe('sleptFor', () => {
  it('30초 타이머 사이가 5분 이상 벌어졌을 때만 잠자기로 본다', () => {
    expect(sleptFor(NOW - 30_000, NOW)).toBe(0);
    expect(sleptFor(NOW - 4 * MIN, NOW)).toBe(0);
    expect(sleptFor(NOW - 40 * MIN, NOW)).toBe(40 * MIN);
  });
});
