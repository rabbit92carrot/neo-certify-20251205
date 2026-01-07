/**
 * RPC 결과 Zod 스키마
 *
 * PostgreSQL RPC 함수 반환 타입에 대한 런타임 검증 스키마입니다.
 * 데이터베이스 스키마 변경 시 런타임 오류를 조기에 감지할 수 있습니다.
 */

import { z } from 'zod';

// ============================================================================
// Dashboard Stats Schemas
// ============================================================================

/**
 * 제조사 대시보드 통계 스키마
 * RPC: get_dashboard_stats_manufacturer
 */
export const ManufacturerStatsRowSchema = z.object({
  total_inventory: z.number(),
  today_production: z.number(),
  today_shipments: z.number(),
  active_products: z.number(),
});

/**
 * 유통사 대시보드 통계 스키마
 * RPC: get_dashboard_stats_distributor
 *
 * DB 함수 반환 구조 (20251214000001_get_dashboard_stats_distributor.sql):
 * - total_inventory, today_received, today_shipments, unique_products
 */
export const DistributorStatsRowSchema = z.object({
  total_inventory: z.number(),
  today_received: z.number(),
  today_shipments: z.number(),
  unique_products: z.number(),
});

/**
 * 병원 대시보드 통계 스키마
 * RPC: get_dashboard_stats_hospital
 *
 * DB 함수 반환 구조 (20251214000002_get_dashboard_stats_hospital.sql):
 * - total_inventory, today_received, today_treatments, unique_patients
 */
export const HospitalStatsRowSchema = z.object({
  total_inventory: z.number(),
  today_received: z.number(),
  today_treatments: z.number(),
  unique_patients: z.number(),
});

/**
 * 관리자 대시보드 통계 스키마
 * RPC: get_dashboard_stats_admin
 *
 * DB 함수 반환 구조 (20251214200000_get_dashboard_stats_admin.sql):
 * - total_organizations, pending_approvals, today_recalls, total_virtual_codes
 */
export const AdminStatsRowSchema = z.object({
  total_organizations: z.number(),
  pending_approvals: z.number(),
  today_recalls: z.number(),
  total_virtual_codes: z.number(),
});

// ============================================================================
// Atomic Operation Schemas
// ============================================================================

/**
 * 출고 생성 결과 스키마
 * RPC: create_shipment_atomic
 */
export const ShipmentAtomicResultSchema = z.object({
  shipment_batch_id: z.string().uuid().nullable(),
  total_quantity: z.number(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
});

/**
 * 출고 회수 결과 스키마
 * RPC: recall_shipment_atomic
 */
export const RecallShipmentResultSchema = z.object({
  success: z.boolean(),
  recalled_count: z.number(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
});

/**
 * 출고 반품 결과 스키마
 * RPC: return_shipment_atomic
 *
 * 반품 시 새로운 반품 배치가 생성됩니다:
 * - new_batch_id: 생성된 반품 배치 ID (후속 반품에 사용)
 * - p_product_quantities 파라미터로 부분 반품 지원
 */
export const ReturnShipmentResultSchema = z.object({
  success: z.boolean(),
  returned_count: z.number(),
  new_batch_id: z.string().uuid().nullable(), // 새로 생성된 반품 배치 ID
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
});

/**
 * 반품 가능 코드 조회 스키마
 * RPC: get_returnable_codes_by_batch
 *
 * 배치별 제품의 원래 수량과 현재 보유 수량을 반환
 * 반품 다이얼로그에서 lazy load로 호출됨
 */
export const ReturnableCodesByBatchRowSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string(),
  model_name: z.string().nullable(),
  original_quantity: z.number(),
  owned_quantity: z.number(),
  codes: z.array(z.string()).nullable(),
});

export type ReturnableCodesByBatchRow = z.infer<typeof ReturnableCodesByBatchRowSchema>;

/**
 * 시술 생성 결과 스키마
 * RPC: create_treatment_atomic
 */
export const TreatmentAtomicResultSchema = z.object({
  treatment_id: z.string().uuid().nullable(),
  total_quantity: z.number(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
});

/**
 * 시술 회수 결과 스키마
 * RPC: recall_treatment_atomic
 */
export const RecallTreatmentResultSchema = z.object({
  success: z.boolean(),
  recalled_count: z.number(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
});

/**
 * 폐기 생성 결과 스키마
 * RPC: create_disposal_atomic
 */
export const DisposalAtomicResultSchema = z.object({
  disposal_id: z.string().uuid().nullable(),
  total_quantity: z.number(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
});

// ============================================================================
// Inventory Schemas
// ============================================================================

/**
 * 재고 요약 스키마
 * RPC: get_inventory_summary
 *
 * DB 함수 반환 구조 (20251216150000_update_inventory_summary_with_model.sql):
 * - product_id, product_name, model_name, udi_di, quantity
 */
export const InventorySummaryRowSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string(),
  model_name: z.string(),
  udi_di: z.string(),
  quantity: z.number(),
});

/**
 * Lot별 재고 스키마
 * RPC: get_inventory_by_lot
 */
export const InventoryByLotRowSchema = z.object({
  lot_id: z.string().uuid(),
  lot_number: z.string(),
  manufacture_date: z.string(),
  expiry_date: z.string().nullable(),
  quantity: z.number(),
});

/**
 * Lot별 재고 Bulk 스키마
 * RPC: get_inventory_by_lots_bulk
 */
export const InventoryByLotsBulkRowSchema = z.object({
  lot_id: z.string().uuid(),
  lot_number: z.string(),
  product_id: z.string().uuid(),
  manufacture_date: z.string(),
  expiry_date: z.string().nullable(),
  quantity: z.number(),
});

// ============================================================================
// History Schemas
// ============================================================================

/**
 * 이력 요약 스키마
 * RPC: get_history_summary
 *
 * DB 함수 반환 구조 (20251226000005_update_legacy_functions_ssot.sql):
 * - SSOT 기반 그룹핑 (shipment_batch_id, lot_id, treatment_id 우선)
 * - product_summaries에 modelName 추가
 * - shipment_batch_id 반환 (회수 기능용)
 */
export const HistorySummaryRowSchema = z.object({
  group_key: z.string(),
  action_type: z.string(),
  event_time: z.string(), // 이벤트 시간 (최신 이력 기준)
  from_owner_type: z.string().nullable(),
  from_owner_id: z.string().nullable(),
  from_owner_name: z.string().nullable(),
  to_owner_type: z.string().nullable(),
  to_owner_id: z.string().nullable(),
  to_owner_name: z.string().nullable(),
  is_recall: z.boolean(),
  recall_reason: z.string().nullable(),
  total_quantity: z.number(),
  // product_summaries는 JSONB로 반환 (camelCase - DB에서 직접 빌드)
  product_summaries: z.array(z.object({
    productId: z.string().uuid(),
    productName: z.string(),
    modelName: z.string().nullable(), // 제품 모델명 추가
    quantity: z.number(),
    codes: z.array(z.string()).optional(), // NC-XXXXXXXX 형식의 가상 코드 목록
  })).nullable(),
  shipment_batch_id: z.string().uuid().nullable(), // 회수 기능용 배치 ID
});

// ============================================================================
// Admin Schemas
// ============================================================================

/**
 * 조직 상태 통계 스키마
 * RPC: get_organization_status_counts
 */
export const OrgStatusCountRowSchema = z.object({
  status: z.string(),
  count: z.number(),
});

/**
 * 조직 코드 카운트 스키마
 * RPC: get_organization_code_counts
 */
export const OrgCodeCountRowSchema = z.object({
  org_id: z.string().uuid(),
  code_count: z.number(),
});

/**
 * 관리자 이벤트 요약 스키마
 * RPC: get_admin_event_summary
 *
 * DB 함수 반환 구조 (20251226000005_update_legacy_functions_ssot.sql):
 * - SSOT 기반 그룹핑 (shipment_batch_id, lot_id, treatment_id 우선)
 * - lot_summaries에 modelName 추가
 */
export const AdminEventSummaryRowSchema = z.object({
  group_key: z.string(),
  event_time: z.string(),
  action_type: z.string(),
  from_owner_type: z.string().nullable(),
  from_owner_id: z.string().nullable(),
  to_owner_type: z.string().nullable(),
  to_owner_id: z.string().nullable(),
  is_recall: z.boolean(),
  recall_reason: z.string().nullable(),
  total_quantity: z.number(),
  // lot_summaries는 JSONB로 반환 (camelCase - DB에서 직접 빌드)
  lot_summaries: z.array(z.object({
    lotId: z.string().uuid(),
    lotNumber: z.string(),
    productId: z.string().uuid(),
    productName: z.string(),
    modelName: z.string().nullable(), // 제품 모델명 추가
    quantity: z.number(),
    codeIds: z.array(z.string().uuid()).optional(), // Lot별 코드 ID 배열
  })).nullable(),
  // sample_code_ids는 UUID[] 배열 (최대 10개)
  sample_code_ids: z.array(z.string().uuid()).nullable(),
});

/**
 * 전체 회수 조회 스키마 (단일 행)
 * RPC: get_all_recalls
 * DB 함수가 반환하는 개별 행 구조
 */
export const AllRecallsRowSchema = z.object({
  recall_id: z.string().uuid(),
  recall_type: z.string(),
  recall_date: z.string(),
  recall_reason: z.string().nullable(),
  quantity: z.number(),
  from_org_id: z.string().uuid(),
  from_org_name: z.string(),
  from_org_type: z.string(),
  to_id: z.string().nullable(),
  to_name: z.string().nullable(),
  to_type: z.string().nullable(),
  product_summary: z.array(z.object({
    productName: z.string(),
    quantity: z.number(),
  })).nullable(),
});

// ============================================================================
// Lot Schemas
// ============================================================================

/**
 * Lot 번호 생성 결과 (문자열)
 * RPC: generate_lot_number
 */
export const LotNumberResultSchema = z.string();

/**
 * Lot upsert 결과 스키마
 * RPC: upsert_lot
 */
export const UpsertLotResultSchema = z.object({
  lot_id: z.string().uuid(),
  lot_number: z.string(),
  is_new: z.boolean(),
  total_quantity: z.number(),
});

// ============================================================================
// Treatment Schemas
// ============================================================================

/**
 * 시술 요약 조회 스키마 (단일 행)
 * RPC: get_treatment_summaries
 * DB 함수가 반환하는 개별 행 구조
 */
export const TreatmentSummaryRowSchema = z.object({
  treatment_id: z.string().uuid(),
  product_id: z.string().uuid(),
  product_name: z.string(),
  lot_id: z.string().uuid(),
  lot_number: z.string(),
  quantity: z.number(),
});

/**
 * 병원 환자 목록 스키마 (단일 행)
 * RPC: get_hospital_patients
 */
export const HospitalPatientRowSchema = z.object({
  phone_number: z.string(),
});

// ============================================================================
// Shipment Schemas
// ============================================================================

/**
 * 출고 뭉치 요약 조회 스키마 (단일 행)
 * RPC: get_shipment_batch_summaries
 * DB 함수가 반환하는 개별 행 구조
 */
export const ShipmentBatchSummaryRowSchema = z.object({
  batch_id: z.string().uuid(),
  product_id: z.string().uuid(),
  product_name: z.string(),
  lot_id: z.string().uuid(),
  lot_number: z.string(),
  quantity: z.number(),
});

// ============================================================================
// Type exports
// ============================================================================

export type ManufacturerStatsRow = z.infer<typeof ManufacturerStatsRowSchema>;
export type DistributorStatsRow = z.infer<typeof DistributorStatsRowSchema>;
export type HospitalStatsRow = z.infer<typeof HospitalStatsRowSchema>;
export type AdminStatsRow = z.infer<typeof AdminStatsRowSchema>;
export type ShipmentAtomicResult = z.infer<typeof ShipmentAtomicResultSchema>;
export type RecallShipmentResult = z.infer<typeof RecallShipmentResultSchema>;
export type ReturnShipmentResult = z.infer<typeof ReturnShipmentResultSchema>;
export type TreatmentAtomicResult = z.infer<typeof TreatmentAtomicResultSchema>;
export type RecallTreatmentResult = z.infer<typeof RecallTreatmentResultSchema>;
export type DisposalAtomicResult = z.infer<typeof DisposalAtomicResultSchema>;
export type InventorySummaryRow = z.infer<typeof InventorySummaryRowSchema>;
export type InventoryByLotRow = z.infer<typeof InventoryByLotRowSchema>;
export type HistorySummaryRow = z.infer<typeof HistorySummaryRowSchema>;
export type OrgStatusCountRow = z.infer<typeof OrgStatusCountRowSchema>;
export type OrgCodeCountRow = z.infer<typeof OrgCodeCountRowSchema>;
export type AdminEventSummaryRow = z.infer<typeof AdminEventSummaryRowSchema>;
export type AllRecallsRow = z.infer<typeof AllRecallsRowSchema>;
export type UpsertLotResult = z.infer<typeof UpsertLotResultSchema>;
export type TreatmentSummaryRow = z.infer<typeof TreatmentSummaryRowSchema>;
export type HospitalPatientRow = z.infer<typeof HospitalPatientRowSchema>;
export type ShipmentBatchSummaryRow = z.infer<typeof ShipmentBatchSummaryRowSchema>;

// ============================================================================
// Cursor Pagination Schemas
// ============================================================================

/**
 * 관리자 이벤트 요약 커서 기반 스키마
 * RPC: get_admin_event_summary_cursor
 *
 * DB 함수 반환 구조 (20251226000004_update_admin_event_summary_cursor.sql):
 * - SSOT 기반 그룹핑 (shipment_batch_id, lot_id, treatment_id 우선)
 * - lot_summaries에 modelName 추가
 * - batch_id 필드 추가 (디버깅/추적용)
 */
export const AdminEventSummaryCursorRowSchema = z.object({
  group_key: z.string(),
  event_time: z.string(),
  action_type: z.string(),
  from_owner_type: z.string().nullable(),
  from_owner_id: z.string().nullable(),
  to_owner_type: z.string().nullable(),
  to_owner_id: z.string().nullable(),
  is_recall: z.boolean(),
  recall_reason: z.string().nullable(),
  total_quantity: z.number(),
  lot_summaries: z.array(z.object({
    lotId: z.string().uuid(),
    lotNumber: z.string(),
    productId: z.string().uuid(),
    productName: z.string(),
    modelName: z.string().nullable(), // 제품 모델명 추가
    quantity: z.number(),
    codeIds: z.array(z.string().uuid()).optional(), // Lot별 코드 ID 배열
  })).nullable(),
  sample_code_ids: z.array(z.string().uuid()).nullable(),
  batch_id: z.string().uuid().nullable(), // 통합 배치 ID (SSOT 추적용)
  has_more: z.boolean(),
});

export type AdminEventSummaryCursorRow = z.infer<typeof AdminEventSummaryCursorRowSchema>;

/**
 * 이력 요약 커서 기반 스키마
 * RPC: get_history_summary_cursor
 *
 * DB 함수 반환 구조 (20260107000008_add_owned_quantity_to_history.sql):
 * - HistorySummaryRowSchema 필드 + modelName + shipment_batch_id + owned_quantity + has_more (BOOLEAN)
 * - product_summaries에 ownedQuantity 추가 (제품별 보유 수량)
 */
export const HistorySummaryCursorRowSchema = z.object({
  group_key: z.string(),
  action_type: z.string(),
  from_owner_type: z.string().nullable(),
  from_owner_id: z.string().nullable(),
  from_owner_name: z.string().nullable(),
  to_owner_type: z.string().nullable(),
  to_owner_id: z.string().nullable(),
  to_owner_name: z.string().nullable(),
  is_recall: z.boolean(),
  recall_reason: z.string().nullable(),
  created_at: z.string(),
  total_quantity: z.number(),
  product_summaries: z.array(z.object({
    productId: z.string().uuid(),
    productName: z.string(),
    modelName: z.string().nullable(), // 제품 모델명 추가
    quantity: z.number(),
    ownedQuantity: z.number(), // 제품별 현재 보유 수량
    codes: z.array(z.string()).optional(), // 제품별 가상 코드 (NC-XXXXXXXX 형식)
  })).nullable(),
  shipment_batch_id: z.string().uuid().nullable(), // 회수 기능용 배치 ID
  owned_quantity: z.number(), // 총 보유 수량 (반품 버튼 표시용)
  has_more: z.boolean(),
});

export type HistorySummaryCursorRow = z.infer<typeof HistorySummaryCursorRowSchema>;

/**
 * 전체 회수 조회 커서 기반 스키마
 * RPC: get_all_recalls_cursor
 *
 * DB 함수 반환 구조 (20251219500006_add_get_all_recalls_cursor.sql):
 * - AllRecallsRowSchema 필드 + code_ids (TEXT[]) + has_more (BOOLEAN)
 */
export const AllRecallsCursorRowSchema = z.object({
  recall_id: z.string(),
  recall_type: z.string(),
  recall_date: z.string(),
  recall_reason: z.string().nullable(),
  quantity: z.number(),
  from_org_id: z.string(),
  from_org_name: z.string(),
  from_org_type: z.string(),
  to_id: z.string().nullable(),
  to_name: z.string().nullable(),
  to_type: z.string().nullable(),
  product_summary: z.array(z.object({
    productName: z.string(),
    quantity: z.number(),
  })).nullable(),
  code_ids: z.array(z.string()).nullable(),
  has_more: z.boolean(),
});

export type AllRecallsCursorRow = z.infer<typeof AllRecallsCursorRowSchema>;

// ============================================================================
// Hospital Known Products Schemas
// ============================================================================

/**
 * 병원 Known Products 조회 결과 스키마
 * RPC: get_hospital_known_products
 */
export const HospitalKnownProductRowSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  product_name: z.string(),
  model_name: z.string().nullable(),
  udi_di: z.string().nullable(),
  alias: z.string().nullable(),
  is_active: z.boolean(),
  first_received_at: z.string(),
  current_inventory: z.number(),
});

export type HospitalKnownProductRow = z.infer<typeof HospitalKnownProductRowSchema>;

/**
 * 제품 설정 업데이트 결과 스키마
 * RPC: update_hospital_product_settings
 */
export const UpdateHospitalProductSettingsResultSchema = z.object({
  success: z.boolean(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
});

export type UpdateHospitalProductSettingsResult = z.infer<typeof UpdateHospitalProductSettingsResultSchema>;

/**
 * 시술 등록용 활성 제품 조회 결과 스키마
 * RPC: get_active_products_for_treatment
 */
export const ActiveProductForTreatmentRowSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string(),
  model_name: z.string().nullable(),
  udi_di: z.string().nullable(),
  alias: z.string().nullable(),
  available_quantity: z.number(),
});

export type ActiveProductForTreatmentRow = z.infer<typeof ActiveProductForTreatmentRowSchema>;
