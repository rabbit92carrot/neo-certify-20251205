export { AdminDashboardPreview } from './AdminDashboardPreview';
export { PlaceholderPreview } from './PlaceholderPreview';
export {
  ManufacturerDashboardPreview,
  ManufacturerInventoryPreview,
  ManufacturerHistoryPreview,
  ManufacturerProductionPreview,
  ManufacturerShipmentPreview,
  ManufacturerProductsPreview,
  ManufacturerSettingsPreview,
  ManufacturerInboxPreview,
} from './manufacturer';
export {
  DistributorDashboardPreview,
  DistributorInventoryPreview,
  DistributorHistoryPreview,
  DistributorShipmentPreview,
} from './distributor';
export {
  HospitalDashboardPreview,
  HospitalInventoryPreview,
  HospitalHistoryPreview,
  HospitalTreatmentPreview,
  HospitalDisposalPreview,
  HospitalTreatmentHistoryPreview,
  HospitalSettingsPreview,
} from './hospital';
export {
  AdminHistoryPreview,
  AdminOrganizationsPreview,
  AdminApprovalsPreview,
  AdminRecallsPreview,
  AdminAlertsPreview,
  AdminInboxPreview,
} from './admin';

import type { RoleType, PageNodeData, FrameNodeData } from '../types';
import { AdminDashboardPreview } from './AdminDashboardPreview';
import {
  AdminHistoryPreview,
  AdminOrganizationsPreview,
  AdminApprovalsPreview,
  AdminRecallsPreview,
  AdminAlertsPreview,
  AdminInboxPreview,
} from './admin';
import {
  ManufacturerDashboardPreview,
  ManufacturerInventoryPreview,
  ManufacturerHistoryPreview,
  ManufacturerProductionPreview,
  ManufacturerShipmentPreview,
  ManufacturerProductsPreview,
  ManufacturerSettingsPreview,
  ManufacturerInboxPreview,
} from './manufacturer';
import {
  DistributorDashboardPreview,
  DistributorInventoryPreview,
  DistributorHistoryPreview,
  DistributorShipmentPreview,
} from './distributor';
import {
  HospitalDashboardPreview,
  HospitalInventoryPreview,
  HospitalHistoryPreview,
  HospitalTreatmentPreview,
  HospitalDisposalPreview,
  HospitalTreatmentHistoryPreview,
  HospitalSettingsPreview,
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
    organizations: AdminOrganizationsPreview,
    approvals: AdminApprovalsPreview,
    history: AdminHistoryPreview,
    recalls: AdminRecallsPreview,
    alerts: AdminAlertsPreview,
    inbox: AdminInboxPreview,
  },
  manufacturer: {
    dashboard: ManufacturerDashboardPreview,
    products: ManufacturerProductsPreview,
    production: ManufacturerProductionPreview,
    shipment: ManufacturerShipmentPreview,
    inventory: ManufacturerInventoryPreview,
    history: ManufacturerHistoryPreview,
    inbox: ManufacturerInboxPreview,
    settings: ManufacturerSettingsPreview,
  },
  distributor: {
    dashboard: DistributorDashboardPreview,
    shipment: DistributorShipmentPreview,
    inventory: DistributorInventoryPreview,
    history: DistributorHistoryPreview,
  },
  hospital: {
    dashboard: HospitalDashboardPreview,
    treatment: HospitalTreatmentPreview,
    'treatment-history': HospitalTreatmentHistoryPreview,
    disposal: HospitalDisposalPreview,
    inventory: HospitalInventoryPreview,
    history: HospitalHistoryPreview,
    settings: HospitalSettingsPreview,
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
