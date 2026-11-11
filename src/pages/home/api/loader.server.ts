import { categories } from '@/entities/category';
import { getWorks } from '@/entities/work/index.server';

export async function loader() {
  const works = await getWorks();
  return {
    works,
    categories: categories.map((c) => ({
      ...c,
      count: works.filter((w) => w.categories.includes(c.slug)).length,
    })),
  };
}
