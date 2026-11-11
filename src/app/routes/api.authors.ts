import { authors } from '@/entities/author';
import type { Author } from '@/shared/api';

export function loader() {
  return Response.json(authors satisfies readonly Author[]);
}
