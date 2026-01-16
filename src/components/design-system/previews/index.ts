export { AdminDashboardPreview } from './AdminDashboardPreview';
export { PlaceholderPreview } from './PlaceholderPreview';

import type { RoleType, PageNodeData, FrameNodeData } from '../types';
import { AdminDashboardPreview } from './AdminDashboardPreview';

/**
 * 프리뷰 컴포넌트 레지스트리
 * 역할과 페이지 ID로 해당 프리뷰 컴포넌트를 찾습니다
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PreviewComponent = React.ComponentType<any>;

const PREVIEW_REGISTRY: Record<RoleType, Record<string, PreviewComponent>> = {
  admin: {
    dashboard: AdminDashboardPreview,
    // 다른 페이지 프리뷰는 추후 추가
  },
  manufacturer: {
    // 프리뷰 컴포넌트 추후 추가
  },
  distributor: {
    // 프리뷰 컴포넌트 추후 추가
  },
  hospital: {
    // 프리뷰 컴포넌트 추후 추가
  },
};

/**
 * 역할과 페이지 노드 데이터로 프리뷰 컴포넌트 가져오기
 * PageNodeData 또는 FrameNodeData 모두 지원
 */
export function getPreviewComponent(
  role: RoleType,
  nodeData: PageNodeData | FrameNodeData
): PreviewComponent | null {
  // 노드 라우트에서 페이지 ID 추출 (예: '/admin/dashboard' → 'dashboard')
  const pageId = nodeData.route.split('/').pop() ?? '';
  return PREVIEW_REGISTRY[role]?.[pageId] ?? null;
}
