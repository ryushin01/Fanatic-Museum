import { authors } from '@/entities/author';
import { getWorks } from '@/entities/work/index.server';

export async function loader() {
  const works = await getWorks();
  return {
    authors: authors.map((author) => ({
      ...author,
      works: works
        .filter((w) => w.creators.some((c) => c.author === author.slug))
        .map(({ slug, title }) => ({ slug, title })),
    })),
  };
}
