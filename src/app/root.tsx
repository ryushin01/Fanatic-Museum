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
import { themeInitScript } from '@/shared/lib';
import { PageHeader } from '@/shared/ui';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';

import { reportError } from './monitoring';
import './styles/global.css';

export const links: LinksFunction = () => [
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    // 저장된 테마를 그리기 전에 data-theme으로 적용하므로 html 속성 차이는 허용합니다.
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f1efe9" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0f0f0f" media="(prefers-color-scheme: dark)" />
        <meta property="og:site_name" content={site.name} />
        <Meta />
        <Links />
      </head>
      <body>
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
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <PageHeader
        eyebrow="404"
        title="전시실을 찾을 수 없습니다"
        description="주소가 바뀌었거나 아직 들어오지 않은 소장품입니다."
      />
    );
  }
  reportError(error);
  return (
    <PageHeader
      eyebrow="Error"
      title="문제가 생겼습니다"
      description="잠시 뒤 다시 시도해 주세요. 문제가 이어지면 GitHub 저장소에 알려 주세요."
    />
  );
}
