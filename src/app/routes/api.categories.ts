import { categories } from '@/entities/category';
import { getWorks } from '@/entities/work/index.server';
import type { CategorySummary } from '@/shared/api';

export async function loader() {
  const works = await getWorks();
  const body: CategorySummary[] = categories.map((c) => ({
    ...c,
    count: works.filter((w) => w.categories.includes(c.slug)).length,
  }));
  return Response.json(body);
}
