import { categories } from '../src/entities/category/model/categories';
import { works } from '../src/entities/work/model/works';

export const pages = [
  '/',
  '/works',
  '/about',
  ...categories.map((c) => `/categories/${c.slug}`),
  ...works.map((w) => `/works/${w.slug}`),
];
