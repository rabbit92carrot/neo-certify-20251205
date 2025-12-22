/**
 * API 요청/응답 타입 정의
 * 모든 API 통신에 사용되는 표준 타입을 정의합니다.
 */

import type { Tables, Enums } from './database.types';

// ============================================================================
// 표준 API 응답 타입
// ============================================================================

/**
 * API 에러 타입
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>; // 필드별 에러 메시지 (유효성 검사)
}

/**
 * 표준 API 응답 타입
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * 페이지네이션 메타 정보
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * 페이지네이션된 API 응답 타입
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * 페이지네이션된 API 전체 응답 타입
 */
export type ApiPaginatedResponse<T> = ApiResponse<PaginatedResponse<T>>;

// ============================================================================
// 공통 요청 타입
// ============================================================================

/**
 * 페이지네이션 요청 파라미터
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * 커서 기반 페이지네이션 파라미터
 * OFFSET 기반 대비 대용량 데이터에서 일관된 성능 제공
 */
export interface CursorPaginationParams {
  limit?: number;
  cursorTime?: string;  // ISO 8601 형식
  cursorKey?: string;   // 그룹 키
}

/**
 * 커서 기반 페이지네이션 메타 정보
 */
export interface CursorPaginationMeta {
  limit: number;
  hasMore: boolean;
  nextCursorTime?: string;
  nextCursorKey?: string;
}

/**
 * 커서 기반 페이지네이션 응답 타입
 */
export interface CursorPaginatedResponse<T> {
  items: T[];
  meta: CursorPaginationMeta;
}

/**
 * 기간 필터 파라미터
 */
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

/**
 * ID 파라미터
 */
export interface IdParam {
  id: string;
}

// ============================================================================
// 엔티티 타입 별칭 (database.types.ts에서 가져옴)
// ============================================================================

export type Organization = Tables<'organizations'>;
export type ManufacturerSettings = Tables<'manufacturer_settings'>;
export type Product = Tables<'products'>;
export type Lot = Tables<'lots'>;
export type Patient = Tables<'patients'>;
export type VirtualCode = Tables<'virtual_codes'>;
export type ShipmentBatch = Tables<'shipment_batches'>;
export type ShipmentDetail = Tables<'shipment_details'>;
export type TreatmentRecord = Tables<'treatment_records'>;
export type TreatmentDetail = Tables<'treatment_details'>;
export type History = Tables<'histories'>;
export type NotificationMessage = Tables<'notification_messages'>;
export type HospitalKnownProductTable = Tables<'hospital_known_products'>;

// ============================================================================
// Enum 타입 별칭
// ============================================================================

export type OrganizationType = Enums<'organization_type'>;
export type OrganizationStatus = Enums<'organization_status'>;
export type VirtualCodeStatus = Enums<'virtual_code_status'>;
export type OwnerType = Enums<'owner_type'>;
export type HistoryActionType = Enums<'history_action_type'>;
export type NotificationType = Enums<'notification_type'>;
export type ProductDeactivationReason = 'DISCONTINUED' | 'SAFETY_ISSUE' | 'QUALITY_ISSUE' | 'OTHER';
export type OrganizationAlertType = 'INACTIVE_PRODUCT_USAGE' | 'SYSTEM_NOTICE' | 'CUSTOM_MESSAGE';

// ============================================================================
// 조인된 엔티티 타입 (API 응답용)
// ============================================================================

/**
 * 제품 + Lot 정보
 */
export interface ProductWithLots extends Product {
  lots: Lot[];
}

/**
 * Lot + 제품 정보
 */
export interface LotWithProduct extends Lot {
  product: Product;
}

/**
 * 가상 코드 + Lot + 제품 정보
 */
export interface VirtualCodeWithDetails extends VirtualCode {
  lot: LotWithProduct;
}

/**
 * 출고 뭉치 + 상세 정보
 */
export interface ShipmentBatchWithDetails extends ShipmentBatch {
  fromOrganization: Organization;
  toOrganization: Organization;
  details: ShipmentDetailWithCode[];
  itemSummary: ShipmentItemSummary[];
}

/**
 * 출고 상세 + 가상 코드 정보
 */
export interface ShipmentDetailWithCode extends ShipmentDetail {
  virtualCode: VirtualCodeWithDetails;
}

/**
 * 출고 아이템 요약 (제품별)
 */
export interface ShipmentItemSummary {
  productId: string;
  productName: string;
  quantity: number;
  lots: {
    lotId: string;
    lotNumber: string;
    quantity: number;
  }[];
}

/**
 * 시술 기록 + 상세 정보
 */
export interface TreatmentRecordWithDetails extends TreatmentRecord {
  hospital: Organization;
  details: TreatmentDetailWithCode[];
  itemSummary: TreatmentItemSummary[];
}

/**
 * 시술 상세 + 가상 코드 정보
 */
export interface TreatmentDetailWithCode extends TreatmentDetail {
  virtualCode: VirtualCodeWithDetails;
}

/**
 * 시술 아이템 요약 (제품별)
 */
export interface TreatmentItemSummary {
  productId: string;
  productName: string;
  modelName?: string;
  alias?: string | null;
  quantity: number;
}

/**
 * 이력 + 상세 정보
 */
export interface HistoryWithDetails extends History {
  virtualCode: VirtualCodeWithDetails;
  shipmentBatch?: ShipmentBatch;
}

// ============================================================================
// 재고 관련 타입
// ============================================================================

/**
 * 제품별 재고 요약
 */
export interface InventorySummary {
  productId: string;
  productName: string;
  modelName: string;
  udiDi: string;
  totalQuantity: number;
}

/**
 * 제품별 재고 요약 (별칭 포함)
 */
export interface InventorySummaryWithAlias extends InventorySummary {
  alias: string | null;
}

/**
 * Lot별 재고 상세
 */
export interface InventoryByLot {
  lotId: string;
  lotNumber: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
}

/**
 * 제품 재고 상세 (Lot별)
 */
export interface ProductInventoryDetail {
  product: Product;
  totalQuantity: number;
  byLot: InventoryByLot[];
}

// ============================================================================
// 병원 제품 관리 타입
// ============================================================================

/**
 * 병원의 Known Product (별칭, 활성화 상태 포함)
 */
export interface HospitalKnownProduct {
  id: string;
  productId: string;
  productName: string;
  modelName: string;
  udiDi: string;
  alias: string | null;
  isActive: boolean;
  firstReceivedAt: string;
  currentInventory: number;
}

/**
 * 시술 등록용 제품 (별칭 포함)
 */
export interface ProductForTreatment {
  productId: string;
  productName: string;
  modelName: string;
  udiDi: string;
  alias: string | null;
  availableQuantity: number;
}

// ============================================================================
// 대시보드 통계 타입
// ============================================================================

/**
 * 대시보드 통계 (공통)
 */
export interface DashboardStats {
  totalInventory: number;
  todayShipments: number;
}

/**
 * 제조사 대시보드 통계
 */
export interface ManufacturerDashboardStats extends DashboardStats {
  todayProduction: number;
  activeProducts: number;
}

/**
 * 유통사 대시보드 통계
 */
export interface DistributorDashboardStats extends DashboardStats {
  todayReceived: number;
}

/**
 * 병원 대시보드 통계
 */
export interface HospitalDashboardStats extends DashboardStats {
  todayTreatments: number;
  totalPatients: number;
}

/**
 * 관리자 대시보드 통계
 */
export interface AdminDashboardStats {
  totalOrganizations: number;
  pendingApprovals: number;
  todayRecalls: number;
  totalVirtualCodes: number;
}

// ============================================================================
// 인증 관련 타입
// ============================================================================

/**
 * 로그인 응답
 */
export interface LoginResponse {
  user: {
    id: string;
    email: string;
  };
  organization: Organization;
}

/**
 * 현재 사용자 정보
 */
export interface CurrentUser {
  id: string;
  email: string;
  organization: Organization;
  manufacturerSettings?: ManufacturerSettings;
}

// ============================================================================
// 조직 조회 관련 타입
// ============================================================================

/**
 * 조직 목록 아이템 (선택용)
 */
export interface OrganizationSelectItem {
  id: string;
  name: string;
  type: OrganizationType;
}

/**
 * 조직 상세 (관리자용)
 */
export interface OrganizationDetail extends Organization {
  manufacturerSettings?: ManufacturerSettings;
}

// ============================================================================
// 관리자 전용 타입
// ============================================================================

/**
 * 조직 + 통계 정보 (관리자용)
 */
export interface OrganizationWithStats extends Organization {
  virtualCodeCount: number;
  lastActivityAt?: string;
}

/**
 * 관리자 이력 아이템 - 가상 코드별 이력 요약
 */
export interface AdminHistoryItem {
  id: string;
  virtualCode: string;
  productionDate: string;
  currentStatus: VirtualCodeStatus;
  currentOwner: {
    id: string;
    name: string;
    type: OrganizationType | 'PATIENT';
  } | null;
  originalProducer: {
    id: string;
    name: string;
  };
  productName: string;
  lotNumber: string;
  expiryDate: string;
  historyCount: number;
  isRecalled: boolean;
  histories: AdminHistoryDetail[];
}

/**
 * 관리자 이력 상세 - 이동 이력
 */
export interface AdminHistoryDetail {
  id: string;
  actionType: HistoryActionType;
  fromOwner: string;
  toOwner: string;
  createdAt: string;
  isRecall: boolean;
  recallReason?: string;
}

/**
 * 회수 이력 아이템
 */
export interface RecallHistoryItem {
  id: string;
  type: 'shipment' | 'treatment';
  recallDate: string;
  recallReason: string;
  quantity: number;
  fromOrganization: {
    id: string;
    name: string;
    type: OrganizationType;
  };
  toTarget: {
    id: string;
    name: string;
    type: OrganizationType | 'PATIENT';
  } | null;
  items: {
    productName: string;
    quantity: number;
  }[];
  /** 회수된 코드 ID 배열 (코드 상세 조회용) */
  codeIds?: string[];
}

// ============================================================================
// Admin Event Summary Types (이벤트 단위 요약 뷰)
// ============================================================================

/**
 * Lot 요약 정보 - 이벤트 내 Lot별 수량 및 해당 이벤트의 코드 ID들
 */
export interface AdminEventLotSummary {
  lotId: string;
  lotNumber: string;
  productId: string;
  productName: string;
  modelName: string;
  quantity: number;
  codeIds: string[]; // 해당 이벤트에서 처리된 코드 ID 배열
}

/**
 * Lot 코드 정보 - 페이지네이션된 고유식별코드
 */
export interface LotCodeItem {
  id: string;
  code: string;
  currentStatus: VirtualCodeStatus;
  currentOwnerName: string;
  currentOwnerType: 'ORGANIZATION' | 'PATIENT';
}

/**
 * Lot 코드 페이지네이션 응답
 */
export interface LotCodesPaginatedResponse {
  codes: LotCodeItem[];
  total: number;
  totalPages: number;
  page: number;
}

/**
 * 관리자 이벤트 요약 - 시간+액션+출발지+도착지로 그룹화
 */
export interface AdminEventSummary {
  id: string; // group_key
  eventTime: string;
  actionType: HistoryActionType;
  actionTypeLabel: string;
  fromOwner: {
    type: 'ORGANIZATION' | 'PATIENT';
    id: string;
    name: string;
  } | null;
  toOwner: {
    type: 'ORGANIZATION' | 'PATIENT';
    id: string;
    name: string;
  } | null;
  isRecall: boolean;
  recallReason?: string;
  totalQuantity: number;
  lotSummaries: AdminEventLotSummary[];
  sampleCodeIds: string[];
}

/**
 * 샘플 코드 상세 - 이벤트 상세 모달용
 */
export interface AdminEventSampleCode {
  id: string;
  code: string;
  productionDate: string;
  currentStatus: VirtualCodeStatus;
  currentOwnerName: string;
  lotNumber: string;
  productName: string;
}

/**
 * 이벤트 요약 CSV 항목
 */
export interface AdminEventCsvItem {
  eventTime: string;
  actionType: string;
  totalQuantity: number;
  fromOwner: string;
  toOwner: string;
  lotNumbers: string;
  productNames: string;
  isRecall: string;
}

// ============================================================================
// 조직 알림 타입
// ============================================================================

/**
 * 조직 알림 (보관함용)
 */
export interface OrganizationAlert {
  id: string;
  alertType: OrganizationAlertType;
  recipientOrgId: string;
  title: string;
  content: string;
  metadata?: {
    productId?: string;
    productName?: string;
    usageType?: 'SHIPMENT' | 'TREATMENT';
    usageId?: string;
    quantity?: number;
    organizationId?: string;
    organizationName?: string;
    deactivationReason?: ProductDeactivationReason;
    [key: string]: unknown;
  };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

/**
 * 비활성 제품 사용 로그
 */
export interface InactiveProductUsageLog {
  id: string;
  usageType: 'SHIPMENT' | 'TREATMENT';
  usageId: string;
  productId: string;
  productName: string;
  deactivationReason: ProductDeactivationReason;
  organizationId: string;
  organizationName: string;
  manufacturerOrgId: string;
  quantity: number;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

/**
 * 비활성화 사유 라벨
 */
export const DEACTIVATION_REASON_LABELS: Record<ProductDeactivationReason, string> = {
  DISCONTINUED: '단종',
  SAFETY_ISSUE: '안전 문제',
  QUALITY_ISSUE: '품질 문제',
  OTHER: '기타',
};

/**
 * 알림 유형 라벨
 */
export const ALERT_TYPE_LABELS: Record<OrganizationAlertType, string> = {
  INACTIVE_PRODUCT_USAGE: '비활성 제품 사용',
  SYSTEM_NOTICE: '시스템 공지',
  CUSTOM_MESSAGE: '메시지',
};
