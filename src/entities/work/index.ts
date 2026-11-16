// 소장품 데이터(works)는 빌드할 때만 씁니다. 화면 JS에 실리지 않게 index.server.ts로만 내보냅니다.
export type { WorkRecord } from './model/works';
export { formatCreators } from './model/labels';
export { OriginalTitle, type OriginalTitleProps } from './ui/original-title';
export { WorkCover, type WorkCoverProps } from './ui/work-cover';
