import { RouterContextProvider, type LoaderFunctionArgs } from 'react-router';

/** 로더 테스트용 인자. 주소와 경로 변수만 정하고 나머지는 빈 값으로 채웁니다. */
export function loaderArgs(
  path: string,
  pattern: string,
  params: Record<string, string> = {},
): LoaderFunctionArgs {
  const url = new URL(path, 'http://localhost');
  return { request: new Request(url), url, pattern, params, context: new RouterContextProvider() };
}
