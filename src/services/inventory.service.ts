/**
 * 재고 서비스
 * 재고 조회 관련 비즈니스 로직
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ApiResponse,
  InventorySummary,
  ProductInventoryDetail,
  InventoryByLot,
  Product,
} from '@/types/api.types';

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
    console.error('재고 요약 조회 실패:', error);
    return {
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: '재고 조회에 실패했습니다.',
      },
    };
  }

  const summaries: InventorySummary[] = (data || []).map(
    (row: { product_id: string; product_name: string; quantity: number }) => ({
      productId: row.product_id,
      productName: row.product_name,
      totalQuantity: Number(row.quantity),
    })
  );

  return { success: true, data: summaries };
}

/**
 * 특정 제품의 Lot별 재고 상세 조회
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

  // 제품 정보 조회
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (productError || !product) {
    return {
      success: false,
      error: {
        code: 'PRODUCT_NOT_FOUND',
        message: '제품을 찾을 수 없습니다.',
      },
    };
  }

  // DB 함수를 사용하여 Lot별 재고 조회
  const { data: lotData, error: lotError } = await supabase.rpc('get_inventory_by_lot', {
    p_owner_id: organizationId,
    p_product_id: productId,
  });

  if (lotError) {
    console.error('Lot별 재고 조회 실패:', lotError);
    return {
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: '재고 상세 조회에 실패했습니다.',
      },
    };
  }

  const byLot: InventoryByLot[] = (lotData || []).map((lot) => ({
    lotId: lot.lot_id,
    lotNumber: lot.lot_number,
    manufactureDate: lot.manufacture_date,
    expiryDate: lot.expiry_date,
    quantity: lot.quantity,
  }));

  const totalQuantity = byLot.reduce((sum, lot) => sum + lot.quantity, 0);

  return {
    success: true,
    data: {
      product: product as Product,
      totalQuantity,
      byLot,
    },
  };
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
    console.error('재고 수량 조회 실패:', error);
    return 0;
  }

  return data || 0;
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
    return {
      success: false,
      error: summaryResult.error,
    };
  }

  const summaries = summaryResult.data || [];
  if (summaries.length === 0) {
    return { success: true, data: [] };
  }

  // 재고가 있는 제품들의 상세 정보 조회
  const productIds = summaries.map((s) => s.productId);

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('is_active', true);

  if (error) {
    console.error('제품 조회 실패:', error);
    return {
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: '제품 조회에 실패했습니다.',
      },
    };
  }

  // 재고 수량 매핑
  const quantityMap = new Map(summaries.map((s) => [s.productId, s.totalQuantity]));

  const result = (products || [])
    .map((product) => ({
      ...product,
      availableQuantity: quantityMap.get(product.id) || 0,
    }))
    .filter((p) => p.availableQuantity > 0);

  return { success: true, data: result };
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
    return { success: true, data: [] };
  }

  // 2. 모든 제품의 Lot 정보를 한 번에 조회 (N+1 방지)
  const productIds = products.map((p) => p.id);

  // 모든 제품의 Lot별 재고를 한 번에 조회하는 DB 함수 호출
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allLotsData, error: lotsError } = await (supabase.rpc as any)(
    'get_inventory_by_lots_bulk',
    {
      p_owner_id: organizationId,
      p_product_ids: productIds,
    }
  );

  if (lotsError) {
    // DB 함수가 없으면 기존 방식으로 fallback (Promise.all)
    console.warn('Bulk lots 조회 실패, fallback 사용:', lotsError.message);

    const productsWithLots = await Promise.all(
      products.map(async (product) => {
        const detailResult = await getProductInventoryDetail(organizationId, product.id);
        return {
          ...product,
          lots: detailResult.success ? detailResult.data!.byLot : [],
        };
      })
    );

    return { success: true, data: productsWithLots };
  }

  // 3. Lot 데이터를 제품별로 그룹화
  const lotsByProduct = new Map<string, InventoryByLot[]>();

  type LotData = {
    product_id: string;
    lot_id: string;
    lot_number: string;
    manufacture_date: string;
    expiry_date: string;
    quantity: number;
  };

  for (const lot of (allLotsData || []) as LotData[]) {
    const productId = lot.product_id;
    if (!lotsByProduct.has(productId)) {
      lotsByProduct.set(productId, []);
    }
    lotsByProduct.get(productId)!.push({
      lotId: lot.lot_id,
      lotNumber: lot.lot_number,
      manufactureDate: lot.manufacture_date,
      expiryDate: lot.expiry_date,
      quantity: lot.quantity,
    });
  }

  // 4. 제품에 Lot 정보 결합
  const productsWithLots = products.map((product) => ({
    ...product,
    lots: lotsByProduct.get(product.id) || [],
  }));

  return { success: true, data: productsWithLots };
}
