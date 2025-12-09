/**
 * 폼 데이터 타입 정의
 * Zod 스키마에서 추론된 타입 및 폼 관련 타입을 정의합니다.
 */

import type { z } from 'zod';
import type {
  // 인증
  loginSchema,
  registerCredentialsSchema,
  changePasswordSchema,
  // 조직
  organizationRegisterSchema,
  organizationRegisterWithFileSchema,
  organizationUpdateSchema,
  manufacturerSettingsSchema,
  manufacturerSettingsUpdateSchema,
  // 제품/Lot
  productCreateSchema,
  productUpdateSchema,
  lotCreateSchema,
  lotCreateFormSchema,
  // 출고
  shipmentCreateSchema,
  shipmentCreateFormSchema,
  recallSchema,
  cartItemSchema,
  addToCartSchema,
  // 시술
  treatmentCreateSchema,
  treatmentCreateFormSchema,
  treatmentRecallSchema,
} from '@/lib/validations';

// ============================================================================
// 인증 폼 타입
// ============================================================================

/**
 * 로그인 폼 데이터
 */
export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * 회원가입 인증 정보 폼 데이터
 */
export type RegisterCredentialsFormData = z.infer<typeof registerCredentialsSchema>;

/**
 * 비밀번호 변경 폼 데이터
 */
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ============================================================================
// 조직 폼 타입
// ============================================================================

/**
 * 조직 회원가입 폼 데이터 (파일 제외)
 */
export type OrganizationRegisterFormData = z.infer<typeof organizationRegisterSchema>;

/**
 * 조직 회원가입 폼 데이터 (파일 포함)
 */
export type OrganizationRegisterWithFileFormData = z.infer<typeof organizationRegisterWithFileSchema>;

/**
 * 조직 정보 수정 폼 데이터
 */
export type OrganizationUpdateFormData = z.infer<typeof organizationUpdateSchema>;

/**
 * 제조사 설정 폼 데이터
 */
export type ManufacturerSettingsFormData = z.infer<typeof manufacturerSettingsSchema>;

/**
 * 제조사 설정 수정 폼 데이터
 */
export type ManufacturerSettingsUpdateFormData = z.infer<typeof manufacturerSettingsUpdateSchema>;

// ============================================================================
// 제품/Lot 폼 타입
// ============================================================================

/**
 * 제품 생성 폼 데이터
 */
export type ProductCreateFormData = z.infer<typeof productCreateSchema>;

/**
 * 제품 수정 폼 데이터
 */
export type ProductUpdateFormData = z.infer<typeof productUpdateSchema>;

/**
 * Lot 생성 폼 데이터 (서버용)
 */
export type LotCreateData = z.infer<typeof lotCreateSchema>;

/**
 * Lot 생성 폼 데이터 (클라이언트 폼용)
 */
export type LotCreateFormData = z.infer<typeof lotCreateFormSchema>;

// ============================================================================
// 출고 폼 타입
// ============================================================================

/**
 * 출고 생성 데이터 (서버용)
 */
export type ShipmentCreateData = z.infer<typeof shipmentCreateSchema>;

/**
 * 출고 생성 폼 데이터 (클라이언트 폼용)
 */
export type ShipmentCreateFormData = z.infer<typeof shipmentCreateFormSchema>;

/**
 * 회수 폼 데이터
 */
export type RecallFormData = z.infer<typeof recallSchema>;

/**
 * 장바구니 아이템 데이터
 */
export type CartItemData = z.infer<typeof cartItemSchema>;

/**
 * 장바구니 추가 폼 데이터
 */
export type AddToCartFormData = z.infer<typeof addToCartSchema>;

// ============================================================================
// 시술 폼 타입
// ============================================================================

/**
 * 시술 등록 데이터 (서버용)
 */
export type TreatmentCreateData = z.infer<typeof treatmentCreateSchema>;

/**
 * 시술 등록 폼 데이터 (클라이언트 폼용)
 */
export type TreatmentCreateFormData = z.infer<typeof treatmentCreateFormSchema>;

/**
 * 시술 회수 폼 데이터
 */
export type TreatmentRecallFormData = z.infer<typeof treatmentRecallSchema>;

// ============================================================================
// 폼 상태 타입
// ============================================================================

/**
 * 폼 필드 에러
 */
export interface FormFieldError {
  message: string;
}

/**
 * 폼 에러 (필드별)
 */
export type FormErrors<T> = Partial<Record<keyof T, FormFieldError>>;

/**
 * 폼 상태
 */
export interface FormState<T> {
  data: T;
  errors: FormErrors<T>;
  isSubmitting: boolean;
  isValid: boolean;
}

/**
 * 폼 제출 결과
 */
export interface FormSubmitResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: FormErrors<unknown>;
  message?: string;
}

// ============================================================================
// 장바구니 상태 타입
// ============================================================================

/**
 * 장바구니 아이템 (UI 상태)
 */
export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  lotId?: string;
  lotNumber?: string;
  availableQuantity: number;
  unitPrice?: number; // 향후 확장용
}

/**
 * 장바구니 상태
 */
export interface CartState {
  items: CartItem[];
  totalItems: number;
  isEmpty: boolean;
}

// ============================================================================
// 선택 옵션 타입
// ============================================================================

/**
 * 셀렉트 옵션
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

/**
 * 조직 선택 옵션
 */
export interface OrganizationOption {
  value: string;
  label: string;
  type: string;
}

/**
 * 제품 선택 옵션
 */
export interface ProductOption {
  value: string;
  label: string;
  modelName: string;
  availableQuantity: number;
}

/**
 * Lot 선택 옵션
 */
export interface LotOption {
  value: string;
  label: string;
  lotNumber: string;
  manufactureDate: string;
  expiryDate: string;
  availableQuantity: number;
}
