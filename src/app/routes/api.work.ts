import type { LoaderFunctionArgs } from 'react-router';

import { getWork } from '@/entities/work/index.server';
import type { Work } from '@/shared/api';

export async function loader({ params }: LoaderFunctionArgs) {
  const slug = params.file?.replace(/\.json$/, '') ?? '';
  const work = await getWork(slug);
  if (!work || !params.file?.endsWith('.json')) {
    return Response.json({ message: '없는 소장품입니다.' }, { status: 404 });
  }
  return Response.json(work satisfies Work);
}
