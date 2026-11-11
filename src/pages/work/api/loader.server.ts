import { data, type LoaderFunctionArgs } from 'react-router';

import { getWorks } from '@/entities/work/index.server';

export async function loader({ params }: LoaderFunctionArgs) {
  const works = await getWorks();
  const index = works.findIndex((w) => w.slug === params.slug);
  const work = works[index];
  if (!work) throw data('없는 소장품입니다.', { status: 404 });
  const pick = ({ slug, number, title }: (typeof works)[number]) => ({ slug, number, title });
  return {
    work,
    previous: index > 0 ? pick(works[index - 1]!) : null,
    next: index < works.length - 1 ? pick(works[index + 1]!) : null,
    related: works.filter((w) => work.related.includes(w.slug)),
  };
}
