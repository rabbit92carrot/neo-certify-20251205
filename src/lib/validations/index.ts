/**
 * Zod 유효성 검사 스키마 중앙 export
 * SSOT 원칙에 따라 모든 스키마를 이 파일을 통해 export합니다.
 */

// ============================================================================
// 공통 스키마
// ============================================================================
export {
  // 기본 스키마
  uuidSchema,
  emailSchema,
  passwordSchema,
  phoneNumberSchema,
  phoneNumberInputSchema,
  businessNumberSchema,
  businessNumberInputSchema,
  // 수량 스키마
  quantitySchema,
  productionQuantitySchema,
  quantityInputSchema,
  // 날짜 스키마
  dateStringSchema,
  dateSchema,
  dateInputSchema,
  // 파일 스키마
  fileSizeSchema,
  fileTypeSchema,
  fileUploadSchema,
  optionalFileUploadSchema,
  // 문자열 스키마
  requiredStringSchema,
  trimmedRequiredStringSchema,
  maxLengthStringSchema,
  // 유틸리티 함수
  normalizePhoneNumber,
  normalizeBusinessNumber,
  formatBusinessNumber,
  formatPhoneNumber,
} from './common';

// ============================================================================
// 인증 스키마
// ============================================================================
export {
  loginSchema,
  registerCredentialsSchema,
  changePasswordSchema,
  // 타입
  type LoginFormData,
  type RegisterCredentialsData,
  type ChangePasswordData,
} from './auth';

// ============================================================================
// 조직 스키마
// ============================================================================
export {
  // 조직 유형
  organizationTypeSchema,
  allOrganizationTypeSchema,
  // 조직 정보
  organizationInfoSchema,
  organizationRegisterSchema,
  organizationRegisterWithFileSchema,
  organizationUpdateSchema,
  // 제조사 설정
  expiryMonthsSchema,
  manufacturerSettingsSchema,
  manufacturerSettingsUpdateSchema,
  // 조직 관리
  organizationApprovalSchema,
  organizationStatusChangeSchema,
  // 타입
  type OrganizationTypeValue,
  type OrganizationInfoData,
  type OrganizationRegisterData,
  type OrganizationRegisterWithFileData,
  type OrganizationUpdateData,
  type ManufacturerSettingsData,
  type ManufacturerSettingsUpdateData,
  type OrganizationApprovalData,
  type OrganizationStatusChangeData,
} from './organization';

// ============================================================================
// 제품/Lot 스키마
// ============================================================================
export {
  // 제품
  productCreateSchema,
  productUpdateSchema,
  productDeactivateSchema,
  productIdSchema,
  productListQuerySchema,
  // Lot
  lotCreateSchema,
  lotCreateWithAutoFieldsSchema,
  lotCreateFormSchema,
  lotQuerySchema,
  lotListQuerySchema,
  // 타입
  type ProductCreateData,
  type ProductUpdateData,
  type ProductDeactivateData,
  type LotCreateData,
  type LotCreateFormData,
  type ProductListQueryData,
  type LotListQueryData,
} from './product';

// ============================================================================
// 출고/회수 스키마
// ============================================================================
export {
  // 출고 항목
  shipmentItemSchema,
  shipmentItemsSchema,
  // 출고
  shipmentCreateSchema,
  shipmentCreateFormSchema,
  // 회수
  recallSchema,
  recallCheckSchema,
  // 조회
  shipmentHistoryQuerySchema,
  shipmentDetailQuerySchema,
  // 장바구니
  cartItemSchema,
  addToCartSchema,
  updateCartItemSchema,
  removeFromCartSchema,
  // 타입
  type ShipmentItemData,
  type ShipmentCreateData,
  type ShipmentCreateFormData,
  type RecallData,
  type RecallCheckData,
  type ShipmentHistoryQueryData,
  type ShipmentDetailQueryData,
  type CartItemData,
  type AddToCartData,
  type UpdateCartItemData,
  type RemoveFromCartData,
} from './shipment';

// ============================================================================
// 시술 스키마
// ============================================================================
export {
  // 시술 항목
  treatmentItemSchema,
  treatmentItemsSchema,
  // 시술
  treatmentCreateSchema,
  treatmentCreateFormSchema,
  // 조회
  treatmentHistoryQuerySchema,
  treatmentDetailQuerySchema,
  patientTreatmentQuerySchema,
  // 시술 회수
  treatmentRecallSchema,
  // 타입
  type TreatmentItemData,
  type TreatmentCreateData,
  type TreatmentCreateFormData,
  type TreatmentHistoryQueryData,
  type TreatmentDetailQueryData,
  type PatientTreatmentQueryData,
  type TreatmentRecallData,
} from './treatment';

// ============================================================================
// 거래이력 스키마
// ============================================================================
export {
  // 스키마
  historyActionTypeSchema,
  transactionHistoryQuerySchema,
  transactionHistoryQueryFormSchema,
  // 타입
  type HistoryActionTypeValue,
  type TransactionHistoryQueryData,
  type TransactionHistoryQueryFormData,
} from './history';

// ============================================================================
// 관리자 스키마
// ============================================================================
export {
  // 조직 관리
  adminOrganizationQuerySchema,
  adminOrganizationStatusUpdateSchema,
  adminOrganizationRejectSchema,
  // 전체 이력
  adminHistoryQuerySchema,
  adminHistoryQueryFormSchema,
  // 회수 모니터링
  adminRecallQuerySchema,
  adminRecallQueryFormSchema,
  // 타입
  type AdminOrganizationQueryData,
  type AdminOrganizationStatusUpdateData,
  type AdminOrganizationRejectData,
  type AdminHistoryQueryData,
  type AdminHistoryQueryFormData,
  type AdminRecallQueryData,
  type AdminRecallQueryFormData,
} from './admin';

// ============================================================================
// 폐기 스키마
// ============================================================================
export {
  // 폐기 사유
  disposalReasonTypeSchema,
  // 폐기 항목
  disposalItemSchema,
  disposalItemsSchema,
  // 폐기 등록
  disposalCreateSchema,
  disposalCreateFormSchema,
  // 폐기 조회
  disposalHistoryQuerySchema,
  // 타입
  type DisposalReasonTypeValue,
  type DisposalItemData,
  type DisposalCreateData,
  type DisposalCreateFormData,
  type DisposalHistoryQueryData,
} from './disposal';
