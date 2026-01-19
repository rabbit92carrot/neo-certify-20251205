export { AdminDashboardPreview } from './AdminDashboardPreview';
export { PlaceholderPreview } from './PlaceholderPreview';
export {
  ManufacturerDashboardPreview,
  ManufacturerInventoryPreview,
} from './manufacturer';
export {
  DistributorDashboardPreview,
  DistributorInventoryPreview,
} from './distributor';
export {
  HospitalDashboardPreview,
  HospitalInventoryPreview,
} from './hospital';

import type { RoleType, PageNodeData, FrameNodeData } from '../types';
import { AdminDashboardPreview } from './AdminDashboardPreview';
import {
  ManufacturerDashboardPreview,
  ManufacturerInventoryPreview,
} from './manufacturer';
import {
  DistributorDashboardPreview,
  DistributorInventoryPreview,
} from './distributor';
import {
  HospitalDashboardPreview,
  HospitalInventoryPreview,
} from './hospital';

/**
 * 프리뷰 컴포넌트 레지스트리
 * 역할과 페이지 ID로 해당 프리뷰 컴포넌트를 찾습니다
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PreviewComponent = React.ComponentType<any>;

const PREVIEW_REGISTRY: Record<RoleType, Record<string, PreviewComponent>> = {
  admin: {
    dashboard: AdminDashboardPreview,
  },
  manufacturer: {
    dashboard: ManufacturerDashboardPreview,
    inventory: ManufacturerInventoryPreview,
  },
  distributor: {
    dashboard: DistributorDashboardPreview,
    inventory: DistributorInventoryPreview,
  },
  hospital: {
    dashboard: HospitalDashboardPreview,
    inventory: HospitalInventoryPreview,
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
