import { getWorks } from '@/entities/work/index.server';

export async function loader() {
  return { works: await getWorks() };
}
