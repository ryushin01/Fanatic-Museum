import { afterEach, describe, expect, it, vi } from 'vitest';

type SentryEvent = {
  exception?: { values?: { mechanism?: unknown }[] };
  extra?: Record<string, unknown>;
  request?: { url?: string };
};
type EventProcessor = (event: SentryEvent) => SentryEvent;

const sentry = vi.hoisted(() => {
  const processors: EventProcessor[] = [];
  return {
    processors,
    init: vi.fn(),
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    withScope: vi.fn((callback: (scope: unknown) => void) =>
      callback({ addEventProcessor: (processor: EventProcessor) => processors.push(processor) }),
    ),
  };
});
vi.mock('./sentry', () => sentry);
vi.mock('web-vitals', () => ({ onCLS() {}, onINP() {}, onLCP() {}, onFCP() {}, onTTFB() {} }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
  sentry.processors.length = 0;
});

const load = async (dsn?: string) => {
  if (dsn) vi.stubEnv('VITE_SENTRY_DSN', dsn);
  return import('./index');
};

describe('monitoring', () => {
  it('DSN이 없으면 Sentry를 받지 않고, 오류를 넘겨도 아무 일도 하지 않는다', async () => {
    const { initMonitoring, reportError } = await load();
    initMonitoring();
    reportError(new Error('x'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(sentry.init).not.toHaveBeenCalled();
  });

  it('받기 전에 난 오류도 준비되면 처리되지 않은 오류로 보내고, 오류 내용이 아닌 것은 지운다', async () => {
    const { initMonitoring } = await load('https://key@o1.ingest.sentry.io/1');
    initMonitoring();
    const error = new Error('첫 화면');
    window.dispatchEvent(new ErrorEvent('error', { error }));

    await vi.waitFor(() => expect(sentry.captureException).toHaveBeenCalledWith(error));
    const event: SentryEvent = {
      exception: { values: [{ mechanism: { type: 'generic', handled: true } }] },
    };
    for (const process of sentry.processors) process(event);
    expect(event.exception?.values?.[0]?.mechanism).toEqual({ type: 'onerror', handled: false });

    const { beforeSend, dataCollection } = sentry.init.mock.calls.at(-1)![0];
    expect(dataCollection).toMatchObject({
      userInfo: false,
      cookies: false,
      urlQueryParams: false,
    });
    expect(
      beforeSend({
        extra: { arguments: ['입력'], other: 1 },
        request: { url: 'https://a.b/works#token' },
      }),
    ).toEqual({ extra: { other: 1 }, request: { url: 'https://a.b/works' } });
  });

  it('받는 동안 화면 오류는 20개까지만 모았다가 보낸다', async () => {
    const { initMonitoring, reportError } = await load('https://key@o1.ingest.sentry.io/1');
    initMonitoring();
    for (let i = 0; i < 30; i += 1) reportError(new Error(`오류 ${i}`));
    await vi.waitFor(() => expect(sentry.captureException).toHaveBeenCalledTimes(20));
    reportError(new Error('준비된 뒤'));
    expect(sentry.captureException).toHaveBeenCalledTimes(21);
  });
});
