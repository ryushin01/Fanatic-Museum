import type { Work, WorkImage } from '@/shared/api';
import { loadMediaIndex, type MediaEntry } from '@/shared/api/index.server';

import { works, type WorkRecord } from '../model/works';

function toImage(record: WorkRecord, entry: MediaEntry, index: number): WorkImage {
  const origin = entry.origin ?? record.title;
  const alt =
    entry.kind === 'screenshot'
      ? `${origin} 게임 화면 ${index + 1}`
      : entry.kind === 'cover'
        ? `${origin} 표지`
        : `${record.title} 일러스트 ${index + 1}`;
  return {
    src: entry.src,
    srcSet: entry.srcSet,
    width: entry.width,
    height: entry.height,
    alt,
    sourcePage: entry.sourcePage,
  };
}

/** 소장품 전체를 번호순으로, 로컬 이미지를 붙여 돌려줍니다. */
export async function getWorks(): Promise<Work[]> {
  const media = await loadMediaIndex();
  return [...works]
    .sort((a, b) => a.number - b.number)
    .map((record) => ({
      ...record,
      creators: [...record.creators],
      categories: [...record.categories],
      related: [...record.related],
      notes: 'notes' in record ? [...record.notes] : undefined,
      images: (media[record.slug] ?? []).map((entry, i) => toImage(record, entry, i)),
    }));
}

export async function getWork(slug: string): Promise<Work | undefined> {
  return (await getWorks()).find((w) => w.slug === slug);
}
