import { getWorks } from '@/entities/work/index.server';

export async function loader() {
  const works = await getWorks();
  const dated = works
    .filter((w) => w.firstReleased !== undefined)
    .sort((a, b) => a.firstReleased! - b.firstReleased! || a.number - b.number);
  const undated = works.filter((w) => w.firstReleased === undefined);
  return { dated, undated };
}
