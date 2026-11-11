import { data, type LoaderFunctionArgs } from 'react-router';

import { findCategory } from '@/entities/category';
import { getWorks } from '@/entities/work/index.server';

export async function loader({ params }: LoaderFunctionArgs) {
  const category = findCategory(params.slug ?? '');
  if (!category) throw data('없는 카테고리입니다.', { status: 404 });
  const works = (await getWorks()).filter((w) => w.categories.includes(category.slug));
  return { category, works };
}
