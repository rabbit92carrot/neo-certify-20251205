export { AdminDashboardPreview } from './AdminDashboardPreview';
export { PlaceholderPreview } from './PlaceholderPreview';
export {
  ManufacturerDashboardPreview,
  ManufacturerInventoryPreview,
  ManufacturerHistoryPreview,
} from './manufacturer';
export {
  DistributorDashboardPreview,
  DistributorInventoryPreview,
  DistributorHistoryPreview,
} from './distributor';
export {
  HospitalDashboardPreview,
  HospitalInventoryPreview,
  HospitalHistoryPreview,
} from './hospital';
export { AdminHistoryPreview } from './admin';

import type { RoleType, PageNodeData, FrameNodeData } from '../types';
import { AdminDashboardPreview } from './AdminDashboardPreview';
import { AdminHistoryPreview } from './admin';
import {
  ManufacturerDashboardPreview,
  ManufacturerInventoryPreview,
  ManufacturerHistoryPreview,
} from './manufacturer';
import {
  DistributorDashboardPreview,
  DistributorInventoryPreview,
  DistributorHistoryPreview,
} from './distributor';
import {
  HospitalDashboardPreview,
  HospitalInventoryPreview,
  HospitalHistoryPreview,
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
    history: AdminHistoryPreview,
  },
  manufacturer: {
    dashboard: ManufacturerDashboardPreview,
    inventory: ManufacturerInventoryPreview,
    history: ManufacturerHistoryPreview,
  },
  distributor: {
    dashboard: DistributorDashboardPreview,
    inventory: DistributorInventoryPreview,
    history: DistributorHistoryPreview,
  },
  hospital: {
    dashboard: HospitalDashboardPreview,
    inventory: HospitalInventoryPreview,
    history: HospitalHistoryPreview,
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
