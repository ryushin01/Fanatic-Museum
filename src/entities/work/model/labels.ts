import type { Work } from '@/shared/api';

/** "글 마루토 후미아키 · 그림 미사키 쿠레히토" */
export function formatCreators(creators: Work['creators']): string {
  return creators.map((c) => `${c.role} ${c.name}`).join(' · ');
}
