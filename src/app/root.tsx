import { useEffect } from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  type LinksFunction,
} from 'react-router';

import { site } from '@/shared/config';
import { themeInitScript, useTheme } from '@/shared/lib';
import { errorTitle, NotFoundNotice, PageHeader } from '@/shared/ui';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';

import { FONT_FACE_CSS, FontLoader } from './fonts/font-loader';
import { reportError } from './monitoring';
import './styles/global.css';

export const links: LinksFunction = () => [
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
  // 한글 클래식체(통파일): 바로 받기 시작하고, 다 받을 때까지 FontLoader가 로딩 화면을 보여 줌
  {
    rel: 'preload',
    href: '/fonts/museum-classic/MuseumClassic-M.woff',
    as: 'font',
    type: 'font/woff',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'preload',
    href: '/fonts/museum-classic/MuseumClassic-B.woff',
    as: 'font',
    type: 'font/woff',
    crossOrigin: 'anonymous',
  },
];

/**
 * 루트에서 그리는 화면(오류 화면, 페이지를 받기 전의 앱 셸)의 제목.
 * 페이지가 그려지면 각 페이지의 meta가 이것을 대신합니다.
 */
export function meta({ error }: { error?: unknown }) {
  return [{ title: error ? errorTitle(error) : `${site.name} — ${site.tagline}` }];
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [theme] = useTheme();
  return (
    // 저장된 테마는 그리기 전에 인라인 스크립트가 data-theme으로 적용하므로 html 속성 차이는 허용합니다.
    // 하이드레이션 뒤에는 React도 같은 값을 그려, 오류 등으로 문서를 다시 그려도 테마가 풀리지 않습니다.
    <html lang="ko" data-theme={theme === 'system' ? undefined : theme} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f1efe9" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0f0f0f" media="(prefers-color-scheme: dark)" />
        <meta property="og:site_name" content={site.name} />
        <Meta />
        <Links />
        <style id="font-faces" dangerouslySetInnerHTML={{ __html: FONT_FACE_CSS }} />
      </head>
      <body>
        <FontLoader />
        <a className="skip-link" href="#main">
          본문 바로가기
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function HydrateFallback() {
  return (
    <p className="container" style={{ paddingBlock: 80 }}>
      불러오는 중…
    </p>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  // 렌더는 여러 번 돌 수 있어, 화면에 나온 뒤 한 번만 보냅니다.
  useEffect(() => {
    if (!notFound) reportError(error);
  }, [error, notFound]);

  if (notFound) return <NotFoundNotice />;
  return (
    <PageHeader
      eyebrow="Error"
      title="문제가 생겼습니다"
      description="잠시 뒤 다시 시도해 주세요. 문제가 이어지면 GitHub 저장소에 알려 주세요."
    >
      <p style={{ marginTop: 24 }}>
        {/* 화면 상태가 망가졌을 수 있어 새로 불러오는 일반 링크로 둡니다. */}
        <a href="/">홈으로 가기</a>
      </p>
    </PageHeader>
  );
}
