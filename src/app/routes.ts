import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('works', 'routes/works.tsx'),
  route('works/:slug', 'routes/work.tsx'),
  route('categories/:slug', 'routes/category.tsx'),
  route('about', 'routes/about.tsx'),
  // 정적 JSON API(openapi/archive.yaml)
  route('api/works.json', 'routes/api.works.ts'),
  route('api/works/:file', 'routes/api.work.ts'),
  route('api/categories.json', 'routes/api.categories.ts'),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
