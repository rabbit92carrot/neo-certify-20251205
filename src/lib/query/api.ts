/**
 * 클라이언트 사이드 API 함수
 * 브라우저 Supabase 클라이언트를 사용하여 react-query의 queryFn으로 활용
 *
 * Server Actions는 POST 요청이라 GET 캐싱에 부적합하므로,
 * 읽기 작업은 브라우저 Supabase 클라이언트를 직접 사용합니다.
 */

import { createClient } from '@/lib/supabase/client';
import { buildIlikeFilter } from '@/lib/utils/db';
import type {
  Product,
  PaginatedResponse,
  InventorySummary,
  ManufacturerDashboardStats,
  DistributorDashboardStats,
  HospitalDashboardStats,
  AdminDashboardStats,
} from '@/types/api.types';
import type { ProductListQueryData } from '@/lib/validations/product';

// ============================================================================
// 제품 API
// ============================================================================

/**
 * 제품 목록 조회 (클라이언트)
 */
export async function fetchProducts(
  organizationId: string,
  query: ProductListQueryData
): Promise<PaginatedResponse<Product>> {
  const supabase = createClient();
  const { page = 1, pageSize = 20, search, isActive } = query;
  const offset = (page - 1) * pageSize;

  let queryBuilder = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (isActive !== undefined) {
    queryBuilder = queryBuilder.eq('is_active', isActive);
  }

  if (search) {
    queryBuilder = queryBuilder.or(
      buildIlikeFilter(['name', 'model_name', 'udi_di'], search)
    );
  }

  const { data, count, error } = await queryBuilder.range(offset, offset + pageSize - 1);

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;

  return {
    items: data ?? [],
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: offset + pageSize < total,
    },
  };
}

/**
 * 제품 상세 조회 (클라이언트)
 */
export async function fetchProduct(
  organizationId: string,
  productId: string
): Promise<Product> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    throw new Error('제품을 찾을 수 없습니다.');
  }

  return data;
}

// ============================================================================
// 재고 API
// ============================================================================

/**
 * 재고 요약 조회 (클라이언트)
 */
export async function fetchInventorySummary(
  organizationId: string
): Promise<InventorySummary[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_inventory_summary', {
    p_owner_id: organizationId,
  });

  if (error) {
    throw new Error('재고 조회에 실패했습니다.');
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    productId: row.product_id as string,
    productName: row.product_name as string,
    modelName: (row.model_name as string) ?? '',
    udiDi: (row.udi_di as string) ?? '',
    totalQuantity: Number(row.quantity),
  }));
}

// ============================================================================
// 대시보드 API
// ============================================================================

/**
 * 제조사 대시보드 통계 조회 (클라이언트)
 * 최적화된 RPC 함수 사용, 실패 시 개별 쿼리 fallback
 */
export async function fetchManufacturerDashboardStats(
  organizationId: string
): Promise<ManufacturerDashboardStats> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_dashboard_stats_manufacturer', {
    p_organization_id: organizationId,
  });

  if (error) {
    throw new Error('대시보드 통계 조회에 실패했습니다.');
  }

  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;

  return {
    totalInventory: Number(row?.total_inventory) || 0,
    todayProduction: Number(row?.today_production) || 0,
    todayShipments: Number(row?.today_shipments) || 0,
    activeProducts: Number(row?.active_products) || 0,
  };
}

/**
 * 유통사 대시보드 통계 조회 (클라이언트)
 */
export async function fetchDistributorDashboardStats(
  organizationId: string
): Promise<DistributorDashboardStats> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_dashboard_stats_distributor', {
    p_organization_id: organizationId,
  });

  if (error) {
    throw new Error('대시보드 통계 조회에 실패했습니다.');
  }

  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;

  return {
    totalInventory: Number(row?.total_inventory) || 0,
    todayReceived: Number(row?.today_received) || 0,
    todayShipments: Number(row?.today_shipments) || 0,
  };
}

/**
 * 병원 대시보드 통계 조회 (클라이언트)
 */
export async function fetchHospitalDashboardStats(
  organizationId: string
): Promise<HospitalDashboardStats> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_dashboard_stats_hospital', {
    p_organization_id: organizationId,
  });

  if (error) {
    throw new Error('대시보드 통계 조회에 실패했습니다.');
  }

  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;

  return {
    totalInventory: Number(row?.total_inventory) || 0,
    todayShipments: Number(row?.today_shipments) || 0,
    todayTreatments: Number(row?.today_treatments) || 0,
    totalPatients: Number(row?.total_patients) || 0,
  };
}

/**
 * 관리자 대시보드 통계 조회 (클라이언트)
 */
export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_dashboard_stats_admin');

  if (error) {
    throw new Error('대시보드 통계 조회에 실패했습니다.');
  }

  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;

  return {
    totalOrganizations: Number(row?.total_organizations) || 0,
    pendingApprovals: Number(row?.pending_approvals) || 0,
    todayRecalls: Number(row?.today_recalls) || 0,
    totalVirtualCodes: Number(row?.total_virtual_codes) || 0,
  };
}
