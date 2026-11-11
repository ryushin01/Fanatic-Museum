import { data, type LoaderFunctionArgs } from 'react-router';

import { findAuthor } from '@/entities/author';
import { getWorks } from '@/entities/work/index.server';

export async function loader({ params }: LoaderFunctionArgs) {
  const author = findAuthor(params.slug ?? '');
  if (!author) throw data('없는 작가입니다.', { status: 404 });
  const works = (await getWorks())
    .filter((w) => w.creators.some((c) => c.author === author.slug))
    .sort(
      (a, b) =>
        (a.firstReleased ?? Number.MAX_SAFE_INTEGER) -
          (b.firstReleased ?? Number.MAX_SAFE_INTEGER) || a.number - b.number,
    );
  return { author, works };
}
