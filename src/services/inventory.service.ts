/**
 * 재고 서비스
 * 재고 조회 관련 비즈니스 로직
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import type {
  ApiResponse,
  InventorySummary,
  HospitalInventorySummary,
  ProductInventoryDetail,
  InventoryByLot,
  Product,
  ShipmentProductSummary,
  PaginatedResponse,
} from '@/types/api.types';
import { createErrorResponse, createSuccessResponse, parseRpcArray } from './common.service';
import {
  InventorySummaryRowSchema,
  HospitalInventorySummaryRowSchema,
  InventoryByLotRowSchema,
  InventoryByLotsBulkRowSchema,
} from '@/lib/validations/rpc-schemas';

const logger = createLogger('inventory.service');

/**
 * 제품별 재고 요약 조회
 * DB 함수를 사용하여 Supabase API limit 제한을 우회
 *
 * @param organizationId 조직 ID
 * @returns 제품별 재고 요약 목록
 */
export async function getInventorySummary(
  organizationId: string
): Promise<ApiResponse<InventorySummary[]>> {
  const supabase = await createClient();

  // DB 함수를 사용하여 제품별 재고 집계 (API limit 우회)
  const { data, error } = await supabase.rpc('get_inventory_summary', {
    p_owner_id: organizationId,
  });

  if (error) {
    logger.error('재고 요약 조회 실패', error);
    return createErrorResponse('QUERY_ERROR', '재고 조회에 실패했습니다.');
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcArray(InventorySummaryRowSchema, data, 'get_inventory_summary');
  if (!parsed.success) {
    logger.error('get_inventory_summary 검증 실패', { error: parsed.error });
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  const summaries: InventorySummary[] = parsed.data.map((row) => ({
    productId: row.product_id,
    productName: row.product_name,
    modelName: row.model_name,
    udiDi: row.udi_di,
    totalQuantity: Number(row.quantity),
  }));

  return createSuccessResponse(summaries);
}

/**
 * 병원 전용 재고 요약 조회
 * 제품 활성화 상태, HKP 상태, 별칭을 포함하여 단일 RPC로 조회
 *
 * @param hospitalId 병원 조직 ID
 * @returns 병원 재고 요약 목록 (활성화 상태 + 별칭 포함)
 */
export async function getHospitalInventorySummary(
  hospitalId: string
): Promise<ApiResponse<HospitalInventorySummary[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_hospital_inventory_summary', {
    p_hospital_id: hospitalId,
  });

  if (error) {
    logger.error('병원 재고 요약 조회 실패', error);
    return createErrorResponse('QUERY_ERROR', '재고 조회에 실패했습니다.');
  }

  const parsed = parseRpcArray(
    HospitalInventorySummaryRowSchema,
    data,
    'get_hospital_inventory_summary'
  );
  if (!parsed.success) {
    logger.error('get_hospital_inventory_summary 검증 실패', { error: parsed.error });
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  const summaries: HospitalInventorySummary[] = parsed.data.map((row) => ({
    productId: row.product_id,
    productName: row.product_name,
    modelName: row.model_name,
    udiDi: row.udi_di,
    totalQuantity: Number(row.quantity),
    productIsActive: row.product_is_active,
    hkpIsActive: row.hkp_is_active,
    alias: row.alias,
  }));

  return createSuccessResponse(summaries);
}

/**
 * 특정 제품의 Lot별 재고 상세 조회
 * 최적화: 제품 조회와 Lot 조회를 Promise.all로 병렬 실행
 *
 * @param organizationId 조직 ID
 * @param productId 제품 ID
 * @returns 제품 재고 상세 (Lot별)
 */
export async function getProductInventoryDetail(
  organizationId: string,
  productId: string
): Promise<ApiResponse<ProductInventoryDetail>> {
  const supabase = await createClient();

  // 병렬로 제품 정보와 Lot별 재고 조회 (Phase 13.1 최적화)
  const [productResult, lotResult] = await Promise.all([
    // 제품 정보 조회
    supabase.from('products').select('*').eq('id', productId).single(),
    // DB 함수를 사용하여 Lot별 재고 조회
    supabase.rpc('get_inventory_by_lot', {
      p_owner_id: organizationId,
      p_product_id: productId,
    }),
  ]);

  const { data: product, error: productError } = productResult;
  const { data: lotData, error: lotError } = lotResult;

  if (productError || !product) {
    return createErrorResponse('PRODUCT_NOT_FOUND', '제품을 찾을 수 없습니다.');
  }

  if (lotError) {
    logger.error('Lot별 재고 조회 실패', lotError);
    return createErrorResponse('QUERY_ERROR', '재고 상세 조회에 실패했습니다.');
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcArray(InventoryByLotRowSchema, lotData, 'get_inventory_by_lot');
  if (!parsed.success) {
    logger.error('get_inventory_by_lot 검증 실패', { error: parsed.error });
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  const byLot: InventoryByLot[] = parsed.data.map((lot) => ({
    lotId: lot.lot_id,
    lotNumber: lot.lot_number,
    manufactureDate: lot.manufacture_date,
    expiryDate: lot.expiry_date ?? '',
    quantity: lot.quantity,
  }));

  const totalQuantity = byLot.reduce((sum, lot) => sum + lot.quantity, 0);

  return createSuccessResponse({
    product: product as Product,
    totalQuantity,
    byLot,
  });
}

/**
 * 특정 제품의 총 재고 수량 조회
 *
 * @param organizationId 조직 ID
 * @param productId 제품 ID
 * @returns 재고 수량
 */
export async function getInventoryCount(
  organizationId: string,
  productId: string
): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_inventory_count', {
    p_owner_id: organizationId,
    p_product_id: productId,
  });

  if (error) {
    logger.error('재고 수량 조회 실패', error);
    return 0;
  }

  return data ?? 0;
}

/**
 * 전체 재고 수량 조회 (대시보드용)
 * getInventorySummary()를 내부적으로 사용하여 데이터 일관성 보장
 * 모든 재고 조회는 이 함수 또는 getInventorySummary()를 통해 수행해야 합니다.
 *
 * @param organizationId 조직 ID
 * @returns 전체 재고 수량
 */
export async function getTotalInventoryCount(
  organizationId: string
): Promise<number> {
  const result = await getInventorySummary(organizationId);
  if (!result.success || !result.data) {
    return 0;
  }
  return result.data.reduce((sum, s) => sum + s.totalQuantity, 0);
}

/**
 * 출고 가능한 제품 목록 조회 (재고가 있는 제품만)
 *
 * @param organizationId 조직 ID
 * @returns 재고가 있는 제품 목록과 수량
 */
export async function getAvailableProductsForShipment(
  organizationId: string
): Promise<ApiResponse<(Product & { availableQuantity: number })[]>> {
  const supabase = await createClient();

  // 재고 요약 조회
  const summaryResult = await getInventorySummary(organizationId);
  if (!summaryResult.success) {
    return createErrorResponse(summaryResult.error!.code, summaryResult.error!.message);
  }

  const summaries = summaryResult.data ?? [];
  if (summaries.length === 0) {
    return createSuccessResponse([]);
  }

  // 재고가 있는 제품들의 상세 정보 조회
  const productIds = summaries.map((s) => s.productId);

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('is_active', true);

  if (error) {
    logger.error('제품 조회 실패', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return createErrorResponse('QUERY_ERROR', '제품 조회에 실패했습니다.');
  }

  // 재고 수량 매핑
  const quantityMap = new Map(summaries.map((s) => [s.productId, s.totalQuantity]));

  const result = (products ?? [])
    .map((product) => ({
      ...product,
      availableQuantity: quantityMap.get(product.id) ?? 0,
    }))
    .filter((p) => p.availableQuantity > 0);

  return createSuccessResponse(result);
}

/**
 * 출고용 제품 목록과 Lot 정보를 한 번에 조회 (N+1 쿼리 방지)
 * 제조사 출고 페이지에서 Lot 선택이 필요할 때 사용
 *
 * @param organizationId 조직 ID
 * @returns 제품 목록과 각 제품의 Lot별 재고 정보
 */
export async function getProductsWithLotsForShipment(
  organizationId: string
): Promise<ApiResponse<(Product & { availableQuantity: number; lots: InventoryByLot[] })[]>> {
  const supabase = await createClient();

  // 1. 재고 있는 제품 목록 조회
  const productsResult = await getAvailableProductsForShipment(organizationId);
  if (!productsResult.success || !productsResult.data) {
    return productsResult as ApiResponse<(Product & { availableQuantity: number; lots: InventoryByLot[] })[]>;
  }

  const products = productsResult.data;
  if (products.length === 0) {
    return createSuccessResponse([]);
  }

  // 2. 모든 제품의 Lot 정보를 한 번에 조회 (N+1 방지)
  const productIds = products.map((p) => p.id);

  // 모든 제품의 Lot별 재고를 한 번에 조회하는 DB 함수 호출
  const { data: allLotsData, error: lotsError } = await supabase.rpc(
    'get_inventory_by_lots_bulk',
    {
      p_owner_id: organizationId,
      p_product_ids: productIds,
    }
  );

  if (lotsError) {
    // DB 함수가 없으면 기존 방식으로 fallback (Promise.all)
    logger.warn('Bulk lots 조회 실패, fallback 사용', { message: lotsError.message });

    const productsWithLots = await Promise.all(
      products.map(async (product) => {
        const detailResult = await getProductInventoryDetail(organizationId, product.id);
        return {
          ...product,
          lots: detailResult.success ? detailResult.data!.byLot : [],
        };
      })
    );

    return createSuccessResponse(productsWithLots);
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcArray(InventoryByLotsBulkRowSchema, allLotsData, 'get_inventory_by_lots_bulk');
  if (!parsed.success) {
    logger.error('get_inventory_by_lots_bulk 검증 실패', { error: parsed.error });
    // 검증 실패 시 fallback
    const productsWithLots = await Promise.all(
      products.map(async (product) => {
        const detailResult = await getProductInventoryDetail(organizationId, product.id);
        return {
          ...product,
          lots: detailResult.success ? detailResult.data!.byLot : [],
        };
      })
    );
    return createSuccessResponse(productsWithLots);
  }

  // 3. Lot 데이터를 제품별로 그룹화
  const lotsByProduct = new Map<string, InventoryByLot[]>();

  for (const lot of parsed.data) {
    const productId = lot.product_id;
    if (!lotsByProduct.has(productId)) {
      lotsByProduct.set(productId, []);
    }
    lotsByProduct.get(productId)!.push({
      lotId: lot.lot_id,
      lotNumber: lot.lot_number,
      manufactureDate: lot.manufacture_date,
      expiryDate: lot.expiry_date ?? '',
      quantity: lot.quantity,
    });
  }

  // 4. 제품에 Lot 정보 결합
  const productsWithLots = products.map((product) => ({
    ...product,
    lots: lotsByProduct.get(product.id) ?? [],
  }));

  return createSuccessResponse(productsWithLots);
}

// ============================================================================
// 출고 페이지 최적화 함수 (Lot lazy loading 지원)
// ============================================================================

/**
 * 출고용 상위 제품 목록 조회 (Lot 제외)
 * 초기 로딩 최적화를 위해 재고 수량 내림차순으로 상위 N개만 반환
 *
 * @param organizationId 조직 ID
 * @param query 조회 옵션
 * @returns 상위 제품 목록 (Lot 정보 미포함)
 */
export async function getTopProductsForShipment(
  organizationId: string,
  query: { limit?: number; search?: string; favoriteIds?: string[] }
): Promise<ApiResponse<ShipmentProductSummary[]>> {
  const { limit = 12, search, favoriteIds = [] } = query;

  // 재고 요약 조회
  const summaryResult = await getInventorySummary(organizationId);
  if (!summaryResult.success || !summaryResult.data) {
    return createErrorResponse(
      summaryResult.error?.code ?? 'QUERY_ERROR',
      summaryResult.error?.message ?? '재고 조회에 실패했습니다.'
    );
  }

  let summaries = summaryResult.data.filter((s) => s.totalQuantity > 0);

  // 검색 필터
  if (search) {
    const searchLower = search.toLowerCase();
    summaries = summaries.filter(
      (s) =>
        s.productName.toLowerCase().includes(searchLower) ||
        s.modelName.toLowerCase().includes(searchLower) ||
        s.udiDi.toLowerCase().includes(searchLower)
    );
  }

  // 즐겨찾기 우선 정렬 후 재고 내림차순
  const favoriteSet = new Set(favoriteIds);
  summaries.sort((a, b) => {
    const aFav = favoriteSet.has(a.productId) ? 1 : 0;
    const bFav = favoriteSet.has(b.productId) ? 1 : 0;
    if (aFav !== bFav) {
      return bFav - aFav;
    }
    return b.totalQuantity - a.totalQuantity;
  });

  // 상위 N개만 반환
  const topSummaries = summaries.slice(0, limit);

  const result: ShipmentProductSummary[] = topSummaries.map((s) => ({
    productId: s.productId,
    productName: s.productName,
    modelName: s.modelName,
    udiDi: s.udiDi,
    totalQuantity: s.totalQuantity,
  }));

  return createSuccessResponse(result);
}

/**
 * 전체 제품 목록 조회 (팝업용, 페이지네이션)
 * 전체 팝업에서 사용되며 페이지네이션과 검색을 지원
 *
 * @param organizationId 조직 ID
 * @param query 조회 옵션
 * @returns 페이지네이션된 제품 목록
 */
export async function getAllProductsForShipmentDialog(
  organizationId: string,
  query: { page?: number; pageSize?: number; search?: string }
): Promise<ApiResponse<PaginatedResponse<ShipmentProductSummary>>> {
  const { page = 1, pageSize = 30, search } = query;

  // 재고 요약 조회
  const summaryResult = await getInventorySummary(organizationId);
  if (!summaryResult.success || !summaryResult.data) {
    return createErrorResponse(
      summaryResult.error?.code ?? 'QUERY_ERROR',
      summaryResult.error?.message ?? '재고 조회에 실패했습니다.'
    );
  }

  let summaries = summaryResult.data.filter((s) => s.totalQuantity > 0);

  // 검색 필터
  if (search) {
    const searchLower = search.toLowerCase();
    summaries = summaries.filter(
      (s) =>
        s.productName.toLowerCase().includes(searchLower) ||
        s.modelName.toLowerCase().includes(searchLower) ||
        s.udiDi.toLowerCase().includes(searchLower)
    );
  }

  // 재고 내림차순 정렬
  summaries.sort((a, b) => b.totalQuantity - a.totalQuantity);

  // 페이지네이션 계산
  const total = summaries.length;
  const totalPages = Math.ceil(total / pageSize);
  const offset = (page - 1) * pageSize;
  const paginatedSummaries = summaries.slice(offset, offset + pageSize);

  const items: ShipmentProductSummary[] = paginatedSummaries.map((s) => ({
    productId: s.productId,
    productName: s.productName,
    modelName: s.modelName,
    udiDi: s.udiDi,
    totalQuantity: s.totalQuantity,
  }));

  return createSuccessResponse({
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore: offset + pageSize < total,
    },
  });
}

/**
 * 단일 제품의 Lot 목록 조회 (lazy load)
 * 제품 선택 시 Lot 정보를 지연 로딩하기 위해 사용
 *
 * @param organizationId 조직 ID
 * @param productId 제품 ID
 * @returns Lot별 재고 정보
 */
export async function getProductLotsOnDemand(
  organizationId: string,
  productId: string
): Promise<ApiResponse<InventoryByLot[]>> {
  const supabase = await createClient();

  // DB 함수를 사용하여 Lot별 재고 조회
  const { data: lotData, error } = await supabase.rpc('get_inventory_by_lot', {
    p_owner_id: organizationId,
    p_product_id: productId,
  });

  if (error) {
    logger.error('Lot 조회 실패', error);
    return createErrorResponse('QUERY_ERROR', 'Lot 조회에 실패했습니다.');
  }

  // Zod 검증으로 결과 파싱
  const parsed = parseRpcArray(InventoryByLotRowSchema, lotData, 'get_inventory_by_lot');
  if (!parsed.success) {
    logger.error('get_inventory_by_lot 검증 실패', { error: parsed.error });
    return createErrorResponse('VALIDATION_ERROR', parsed.error);
  }

  const lots: InventoryByLot[] = parsed.data.map((lot) => ({
    lotId: lot.lot_id,
    lotNumber: lot.lot_number,
    manufactureDate: lot.manufacture_date,
    expiryDate: lot.expiry_date ?? '',
    quantity: lot.quantity,
  }));

  return createSuccessResponse(lots);
}
