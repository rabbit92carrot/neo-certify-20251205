/**
 * 대시보드 통계 서비스
 * 각 역할별 대시보드에 표시되는 통계 데이터 조회
 *
 * 모든 재고 조회는 getTotalInventoryCount()를 통해 수행하여
 * 단일 진실 원천(Single Source of Truth) 패턴을 적용합니다.
 *
 * 개별 통계 함수: Suspense 스트리밍을 위한 단일 통계 조회
 * - getManufacturerTotalInventory, getManufacturerTodayProduction, etc.
 */

import { createClient } from '@/lib/supabase/server';
import { getKoreaTodayStart, getKoreaTodayEnd } from '@/lib/utils';
import { getTotalInventoryCount } from './inventory.service';
import type {
  ApiResponse,
  ManufacturerDashboardStats,
  DistributorDashboardStats,
  HospitalDashboardStats,
  AdminDashboardStats,
} from '@/types/api.types';
import type { Database } from '@/types/database.types';

// RPC 반환 타입 정의
type ManufacturerStatsRow = Database['public']['Functions']['get_dashboard_stats_manufacturer']['Returns'][number];
type DistributorStatsRow = Database['public']['Functions']['get_dashboard_stats_distributor']['Returns'][number];
type HospitalStatsRow = Database['public']['Functions']['get_dashboard_stats_hospital']['Returns'][number];
type AdminStatsRow = Database['public']['Functions']['get_dashboard_stats_admin']['Returns'][number];

/**
 * 제조사 대시보드 통계 조회
 *
 * @param organizationId 제조사 조직 ID
 * @returns 대시보드 통계 (총 재고량, 오늘 생산량, 오늘 출고량, 활성 제품 수)
 */
export async function getManufacturerDashboardStats(
  organizationId: string
): Promise<ApiResponse<ManufacturerDashboardStats>> {
  const supabase = await createClient();
  const todayStart = getKoreaTodayStart();
  const todayEnd = getKoreaTodayEnd();

  // 병렬로 통계 조회
  // 총 재고량은 getTotalInventoryCount()를 사용하여 데이터 일관성 보장
  const [totalInventory, todayProductionResult, todayShipmentResult, activeProductsResult] =
    await Promise.all([
      // 총 재고량 (공통 함수 사용 - Single Source of Truth)
      getTotalInventoryCount(organizationId),

      // 오늘 생산량 (오늘 생성된 Lot의 총 수량)
      supabase
        .from('lots')
        .select('quantity, product:products!inner(organization_id)')
        .eq('product.organization_id', organizationId)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd),

      // 오늘 출고량 (오늘 출고 뭉치의 상세 개수)
      supabase
        .from('shipment_details')
        .select('id, shipment_batch:shipment_batches!inner(from_organization_id, shipment_date)', {
          count: 'exact',
          head: true,
        })
        .eq('shipment_batch.from_organization_id', organizationId)
        .gte('shipment_batch.shipment_date', todayStart)
        .lte('shipment_batch.shipment_date', todayEnd),

      // 활성 제품 수
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true),
    ]);

  // 오늘 생산량 합계 계산
  const todayProduction =
    todayProductionResult.data?.reduce((sum, lot) => sum + lot.quantity, 0) || 0;

  return {
    success: true,
    data: {
      totalInventory,
      todayProduction,
      todayShipments: todayShipmentResult.count || 0,
      activeProducts: activeProductsResult.count || 0,
    },
  };
}

/**
 * 유통사 대시보드 통계 조회
 *
 * @param organizationId 유통사 조직 ID
 * @returns 대시보드 통계
 */
export async function getDistributorDashboardStats(
  organizationId: string
): Promise<ApiResponse<DistributorDashboardStats>> {
  const supabase = await createClient();
  const todayStart = getKoreaTodayStart();
  const todayEnd = getKoreaTodayEnd();

  const [totalInventory, todayReceivedResult, todayShipmentResult] = await Promise.all([
    // 총 재고량 (공통 함수 사용 - Single Source of Truth)
    getTotalInventoryCount(organizationId),

    // 오늘 입고량
    supabase
      .from('shipment_details')
      .select('id, shipment_batch:shipment_batches!inner(to_organization_id, shipment_date)', {
        count: 'exact',
        head: true,
      })
      .eq('shipment_batch.to_organization_id', organizationId)
      .gte('shipment_batch.shipment_date', todayStart)
      .lte('shipment_batch.shipment_date', todayEnd),

    // 오늘 출고량
    supabase
      .from('shipment_details')
      .select('id, shipment_batch:shipment_batches!inner(from_organization_id, shipment_date)', {
        count: 'exact',
        head: true,
      })
      .eq('shipment_batch.from_organization_id', organizationId)
      .gte('shipment_batch.shipment_date', todayStart)
      .lte('shipment_batch.shipment_date', todayEnd),
  ]);

  return {
    success: true,
    data: {
      totalInventory,
      todayReceived: todayReceivedResult.count || 0,
      todayShipments: todayShipmentResult.count || 0,
    },
  };
}

/**
 * 병원 대시보드 통계 조회
 *
 * @param organizationId 병원 조직 ID
 * @returns 대시보드 통계
 */
export async function getHospitalDashboardStats(
  organizationId: string
): Promise<ApiResponse<HospitalDashboardStats>> {
  const supabase = await createClient();
  const todayStart = getKoreaTodayStart();
  const todayEnd = getKoreaTodayEnd();

  const [totalInventory, todayTreatmentsResult, uniquePatientsResult, todayShipmentResult] =
    await Promise.all([
      // 총 재고량 (공통 함수 사용 - Single Source of Truth)
      getTotalInventoryCount(organizationId),

      // 오늘 시술 건수
      supabase
        .from('treatment_records')
        .select('id', { count: 'exact', head: true })
        .eq('hospital_id', organizationId)
        .gte('treatment_date', todayStart)
        .lte('treatment_date', todayEnd),

      // 전체 환자 수 (고유 전화번호) - DB 함수 사용으로 Supabase 1000 row limit 우회
      supabase.rpc('count_unique_patients', { p_hospital_id: organizationId }),

      // 오늘 입고량 (출고받은 것)
      supabase
        .from('shipment_details')
        .select('id, shipment_batch:shipment_batches!inner(to_organization_id, shipment_date)', {
          count: 'exact',
          head: true,
        })
        .eq('shipment_batch.to_organization_id', organizationId)
        .gte('shipment_batch.shipment_date', todayStart)
        .lte('shipment_batch.shipment_date', todayEnd),
    ]);

  return {
    success: true,
    data: {
      totalInventory,
      todayTreatments: todayTreatmentsResult.count || 0,
      totalPatients: uniquePatientsResult.data || 0,
      todayShipments: todayShipmentResult.count || 0,
    },
  };
}

/**
 * 관리자 대시보드 통계 조회
 *
 * @returns 대시보드 통계
 */
export async function getAdminDashboardStats(): Promise<ApiResponse<AdminDashboardStats>> {
  const supabase = await createClient();
  const todayStart = getKoreaTodayStart();
  const todayEnd = getKoreaTodayEnd();

  const [totalOrgsResult, pendingApprovalsResult, todayRecallsResult, totalCodesResult] =
    await Promise.all([
      // 전체 조직 수
      supabase.from('organizations').select('id', { count: 'exact', head: true }),

      // 승인 대기 조직 수
      supabase
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'PENDING_APPROVAL'),

      // 오늘 회수 건수
      supabase
        .from('shipment_batches')
        .select('id', { count: 'exact', head: true })
        .eq('is_recalled', true)
        .gte('recall_date', todayStart)
        .lte('recall_date', todayEnd),

      // 전체 가상 코드 수
      supabase.from('virtual_codes').select('id', { count: 'exact', head: true }),
    ]);

  return {
    success: true,
    data: {
      totalOrganizations: totalOrgsResult.count || 0,
      pendingApprovals: pendingApprovalsResult.count || 0,
      todayRecalls: todayRecallsResult.count || 0,
      totalVirtualCodes: totalCodesResult.count || 0,
    },
  };
}

// ============================================================================
// 개별 통계 함수 (Suspense 스트리밍용)
// ============================================================================

/**
 * 제조사 총 재고량 조회
 */
export async function getManufacturerTotalInventory(organizationId: string): Promise<number> {
  return getTotalInventoryCount(organizationId);
}

/**
 * 제조사 오늘 생산량 조회
 */
export async function getManufacturerTodayProduction(organizationId: string): Promise<number> {
  const supabase = await createClient();
  const todayStart = getKoreaTodayStart();
  const todayEnd = getKoreaTodayEnd();

  const { data } = await supabase
    .from('lots')
    .select('quantity, product:products!inner(organization_id)')
    .eq('product.organization_id', organizationId)
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd);

  return data?.reduce((sum, lot) => sum + lot.quantity, 0) || 0;
}

/**
 * 제조사 오늘 출고량 조회
 */
export async function getManufacturerTodayShipments(organizationId: string): Promise<number> {
  const supabase = await createClient();
  const todayStart = getKoreaTodayStart();
  const todayEnd = getKoreaTodayEnd();

  const { count } = await supabase
    .from('shipment_details')
    .select('id, shipment_batch:shipment_batches!inner(from_organization_id, shipment_date)', {
      count: 'exact',
      head: true,
    })
    .eq('shipment_batch.from_organization_id', organizationId)
    .gte('shipment_batch.shipment_date', todayStart)
    .lte('shipment_batch.shipment_date', todayEnd);

  return count || 0;
}

/**
 * 제조사 활성 제품 수 조회
 */
export async function getManufacturerActiveProducts(organizationId: string): Promise<number> {
  const supabase = await createClient();

  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  return count || 0;
}

/**
 * 유통사 오늘 입고량 조회
 */
export async function getDistributorTodayReceived(organizationId: string): Promise<number> {
  const supabase = await createClient();
  const todayStart = getKoreaTodayStart();
  const todayEnd = getKoreaTodayEnd();

  const { count } = await supabase
    .from('shipment_details')
    .select('id, shipment_batch:shipment_batches!inner(to_organization_id, shipment_date)', {
      count: 'exact',
      head: true,
    })
    .eq('shipment_batch.to_organization_id', organizationId)
    .gte('shipment_batch.shipment_date', todayStart)
    .lte('shipment_batch.shipment_date', todayEnd);

  return count || 0;
}

/**
 * 유통사 오늘 출고량 조회
 */
export async function getDistributorTodayShipments(organizationId: string): Promise<number> {
  const supabase = await createClient();
  const todayStart = getKoreaTodayStart();
  const todayEnd = getKoreaTodayEnd();

  const { count } = await supabase
    .from('shipment_details')
    .select('id, shipment_batch:shipment_batches!inner(from_organization_id, shipment_date)', {
      count: 'exact',
      head: true,
    })
    .eq('shipment_batch.from_organization_id', organizationId)
    .gte('shipment_batch.shipment_date', todayStart)
    .lte('shipment_batch.shipment_date', todayEnd);

  return count || 0;
}

/**
 * 병원 오늘 시술 건수 조회
 */
export async function getHospitalTodayTreatments(organizationId: string): Promise<number> {
  const supabase = await createClient();
  const todayStart = getKoreaTodayStart();
  const todayEnd = getKoreaTodayEnd();

  const { count } = await supabase
    .from('treatment_records')
    .select('id', { count: 'exact', head: true })
    .eq('hospital_id', organizationId)
    .gte('treatment_date', todayStart)
    .lte('treatment_date', todayEnd);

  return count || 0;
}

/**
 * 병원 총 환자 수 조회
 */
export async function getHospitalTotalPatients(organizationId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('count_unique_patients', { p_hospital_id: organizationId });
  return data || 0;
}

/**
 * 관리자 총 조직 수 조회
 */
export async function getAdminTotalOrganizations(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from('organizations').select('id', { count: 'exact', head: true });
  return count || 0;
}

/**
 * 관리자 승인 대기 수 조회
 */
export async function getAdminPendingApprovals(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'PENDING_APPROVAL');
  return count || 0;
}

/**
 * 관리자 오늘 회수 건수 조회
 */
export async function getAdminTodayRecalls(): Promise<number> {
  const supabase = await createClient();
  const todayStart = getKoreaTodayStart();
  const todayEnd = getKoreaTodayEnd();

  const { count } = await supabase
    .from('shipment_batches')
    .select('id', { count: 'exact', head: true })
    .eq('is_recalled', true)
    .gte('recall_date', todayStart)
    .lte('recall_date', todayEnd);

  return count || 0;
}

/**
 * 관리자 총 가상 코드 수 조회
 */
export async function getAdminTotalVirtualCodes(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from('virtual_codes').select('id', { count: 'exact', head: true });
  return count || 0;
}

// ============================================================================
// 통합 대시보드 함수 (DB 함수 사용 - Phase 12 최적화)
// 4개 쿼리를 1개 RPC 호출로 통합하여 DB 왕복 75% 감소
// ============================================================================

/**
 * 제조사 대시보드 통계 통합 조회 (최적화)
 * DB 함수로 4개 쿼리를 1회 왕복으로 처리
 */
export async function getManufacturerDashboardStatsOptimized(
  organizationId: string
): Promise<ApiResponse<ManufacturerDashboardStats>> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_dashboard_stats_manufacturer', {
    p_organization_id: organizationId,
  });

  if (error) {
    console.error('제조사 대시보드 통계 조회 실패:', error);
    // 폴백: 기존 함수 사용
    return getManufacturerDashboardStats(organizationId);
  }

  const typedData = data as ManufacturerStatsRow[] | null;
  const row = typedData?.[0];

  return {
    success: true,
    data: {
      totalInventory: Number(row?.total_inventory) || 0,
      todayProduction: Number(row?.today_production) || 0,
      todayShipments: Number(row?.today_shipments) || 0,
      activeProducts: Number(row?.active_products) || 0,
    },
  };
}

/**
 * 유통사 대시보드 통계 통합 조회 (최적화)
 * DB 함수로 4개 쿼리를 1회 왕복으로 처리
 */
export async function getDistributorDashboardStatsOptimized(
  organizationId: string
): Promise<ApiResponse<DistributorDashboardStats>> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_dashboard_stats_distributor', {
    p_organization_id: organizationId,
  });

  if (error) {
    console.error('유통사 대시보드 통계 조회 실패:', error);
    // 폴백: 기존 함수 사용
    return getDistributorDashboardStats(organizationId);
  }

  const typedData = data as DistributorStatsRow[] | null;
  const row = typedData?.[0];

  return {
    success: true,
    data: {
      totalInventory: Number(row?.total_inventory) || 0,
      todayReceived: Number(row?.today_received) || 0,
      todayShipments: Number(row?.today_shipments) || 0,
    },
  };
}

/**
 * 병원 대시보드 통계 통합 조회 (최적화)
 * DB 함수로 4개 쿼리를 1회 왕복으로 처리
 */
export async function getHospitalDashboardStatsOptimized(
  organizationId: string
): Promise<ApiResponse<HospitalDashboardStats>> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_dashboard_stats_hospital', {
    p_organization_id: organizationId,
  });

  if (error) {
    console.error('병원 대시보드 통계 조회 실패:', error);
    // 폴백: 기존 함수 사용
    return getHospitalDashboardStats(organizationId);
  }

  const typedData = data as HospitalStatsRow[] | null;
  const row = typedData?.[0];

  return {
    success: true,
    data: {
      totalInventory: Number(row?.total_inventory) || 0,
      todayTreatments: Number(row?.today_treatments) || 0,
      totalPatients: Number(row?.unique_patients) || 0,
      todayShipments: Number(row?.today_received) || 0,
    },
  };
}

/**
 * Admin 대시보드 통계 통합 조회 (최적화)
 * DB 함수로 4개 쿼리를 1회 왕복으로 처리
 */
export async function getAdminDashboardStatsOptimized(): Promise<
  ApiResponse<AdminDashboardStats>
> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_dashboard_stats_admin');

  if (error) {
    console.error('Admin 대시보드 통계 조회 실패:', error);
    // 폴백: 개별 쿼리 사용
    const [totalOrgs, pending, recalls, codes] = await Promise.all([
      getAdminTotalOrganizations(),
      getAdminPendingApprovals(),
      getAdminTodayRecalls(),
      getAdminTotalVirtualCodes(),
    ]);
    return {
      success: true,
      data: {
        totalOrganizations: totalOrgs,
        pendingApprovals: pending,
        todayRecalls: recalls,
        totalVirtualCodes: codes,
      },
    };
  }

  const typedData = data as AdminStatsRow[] | null;
  const row = typedData?.[0];

  return {
    success: true,
    data: {
      totalOrganizations: Number(row?.total_organizations) || 0,
      pendingApprovals: Number(row?.pending_approvals) || 0,
      todayRecalls: Number(row?.today_recalls) || 0,
      totalVirtualCodes: Number(row?.total_virtual_codes) || 0,
    },
  };
}
