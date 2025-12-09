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
 *
 * @param organizationId 조직 ID
 * @returns 제품별 재고 요약 목록
 */
export async function getInventorySummary(
  organizationId: string
): Promise<ApiResponse<InventorySummary[]>> {
  const supabase = await createClient();

  // 자신이 소유한 IN_STOCK 가상 코드를 제품별로 그룹화
  const { data, error } = await supabase
    .from('virtual_codes')
    .select(
      `
      lot:lots!inner(
        product:products!inner(
          id,
          name
        )
      )
    `
    )
    .eq('owner_id', organizationId)
    .eq('owner_type', 'ORGANIZATION')
    .eq('status', 'IN_STOCK');

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

  // 제품별로 그룹화
  const productMap = new Map<string, { name: string; quantity: number }>();

  for (const item of data || []) {
    const product = (item.lot as { product: { id: string; name: string } }).product;
    const existing = productMap.get(product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      productMap.set(product.id, { name: product.name, quantity: 1 });
    }
  }

  const summaries: InventorySummary[] = Array.from(productMap.entries()).map(
    ([productId, { name, quantity }]) => ({
      productId,
      productName: name,
      totalQuantity: quantity,
    })
  );

  // 제품명 순 정렬
  summaries.sort((a, b) => a.productName.localeCompare(b.productName, 'ko'));

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
