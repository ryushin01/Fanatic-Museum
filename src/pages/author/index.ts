export { AuthorPage, meta } from './ui/author-page';
// 없는 slug면 이 라우트 자리에서 404 안내를 보여 줍니다(문서 전체를 다시 그리지 않게).
export { NotFoundBoundary as ErrorBoundary } from '@/shared/ui';
