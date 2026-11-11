import { getWorks } from '@/entities/work/index.server';
import type { WorkList } from '@/shared/api';

export async function loader() {
  const items = await getWorks();
  return Response.json({ total: items.length, items } satisfies WorkList);
}
