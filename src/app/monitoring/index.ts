import type * as SentryModule from '@sentry/react-router';
import type { Metric } from 'web-vitals';

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

let sentry: Promise<typeof SentryModule> | undefined;

/**
 * 오류·성능 모니터링을 켭니다. 첫 화면을 무겁게 하지 않도록 Sentry와 web-vitals는 나중에 불러옵니다.
 * - VITE_SENTRY_DSN이 있으면 Sentry로 오류를 보내고, 나쁜(poor) Web Vitals를 경고로 남깁니다.
 * - 없으면 개발 모드에서만 콘솔에 Web Vitals를 찍습니다.
 */
export function initMonitoring() {
  if (typeof window === 'undefined') return;

  if (dsn) {
    sentry = import('@sentry/react-router').then((Sentry) => {
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        release: import.meta.env.VITE_RELEASE as string | undefined,
      });
      return Sentry;
    });
  }

  void import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
    for (const subscribe of [onCLS, onINP, onLCP, onFCP, onTTFB]) subscribe(reportMetric);
  });
}

function reportMetric(metric: Metric) {
  if (import.meta.env.DEV) {
    console.debug(`[web-vitals] ${metric.name} ${metric.value.toFixed(1)} (${metric.rating})`);
  }
  if (!sentry || metric.rating !== 'poor') return;
  void sentry.then((Sentry) =>
    Sentry.captureMessage(`Web Vitals 나쁨: ${metric.name}`, {
      level: 'warning',
      tags: { metric: metric.name, rating: metric.rating, path: location.pathname },
      extra: { value: metric.value, id: metric.id, navigationType: metric.navigationType },
    }),
  );
}

/** 화면 오류 경계에서 잡은 오류를 보냅니다. */
export function reportError(error: unknown) {
  if (!sentry) return;
  void sentry.then((Sentry) => Sentry.captureException(error));
}
