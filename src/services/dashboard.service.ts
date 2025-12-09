/**
 * 대시보드 통계 서비스
 * 각 역할별 대시보드에 표시되는 통계 데이터 조회
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ApiResponse,
  ManufacturerDashboardStats,
  DistributorDashboardStats,
  HospitalDashboardStats,
  AdminDashboardStats,
} from '@/types/api.types';

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
  const today = new Date().toISOString().split('T')[0];

  // 병렬로 통계 조회
  const [inventoryResult, todayProductionResult, todayShipmentResult, activeProductsResult] =
    await Promise.all([
      // 총 재고량 (IN_STOCK 상태, 현재 소유자가 제조사인 가상 코드 수)
      supabase
        .from('virtual_codes')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', organizationId)
        .eq('status', 'IN_STOCK'),

      // 오늘 생산량 (오늘 생성된 Lot의 총 수량)
      supabase
        .from('lots')
        .select('quantity, product:products!inner(organization_id)')
        .eq('product.organization_id', organizationId)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`),

      // 오늘 출고량 (오늘 출고 뭉치의 상세 개수)
      supabase
        .from('shipment_details')
        .select('id, shipment_batch:shipment_batches!inner(from_organization_id, shipment_date)', {
          count: 'exact',
          head: true,
        })
        .eq('shipment_batch.from_organization_id', organizationId)
        .gte('shipment_batch.shipment_date', `${today}T00:00:00`)
        .lte('shipment_batch.shipment_date', `${today}T23:59:59`),

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
      totalInventory: inventoryResult.count || 0,
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
  const today = new Date().toISOString().split('T')[0];

  const [inventoryResult, todayReceivedResult, todayShipmentResult] = await Promise.all([
    // 총 재고량
    supabase
      .from('virtual_codes')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', organizationId)
      .eq('status', 'IN_STOCK'),

    // 오늘 입고량
    supabase
      .from('shipment_details')
      .select('id, shipment_batch:shipment_batches!inner(to_organization_id, shipment_date)', {
        count: 'exact',
        head: true,
      })
      .eq('shipment_batch.to_organization_id', organizationId)
      .gte('shipment_batch.shipment_date', `${today}T00:00:00`)
      .lte('shipment_batch.shipment_date', `${today}T23:59:59`),

    // 오늘 출고량
    supabase
      .from('shipment_details')
      .select('id, shipment_batch:shipment_batches!inner(from_organization_id, shipment_date)', {
        count: 'exact',
        head: true,
      })
      .eq('shipment_batch.from_organization_id', organizationId)
      .gte('shipment_batch.shipment_date', `${today}T00:00:00`)
      .lte('shipment_batch.shipment_date', `${today}T23:59:59`),
  ]);

  return {
    success: true,
    data: {
      totalInventory: inventoryResult.count || 0,
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
  const today = new Date().toISOString().split('T')[0];

  const [inventoryResult, todayTreatmentsResult, totalPatientsResult, todayShipmentResult] =
    await Promise.all([
      // 총 재고량
      supabase
        .from('virtual_codes')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', organizationId)
        .eq('status', 'IN_STOCK'),

      // 오늘 시술 건수
      supabase
        .from('treatment_records')
        .select('id', { count: 'exact', head: true })
        .eq('hospital_id', organizationId)
        .gte('treatment_date', `${today}T00:00:00`)
        .lte('treatment_date', `${today}T23:59:59`),

      // 전체 환자 수 (고유 전화번호)
      supabase
        .from('treatment_records')
        .select('patient_phone')
        .eq('hospital_id', organizationId),

      // 오늘 입고량 (출고받은 것)
      supabase
        .from('shipment_details')
        .select('id, shipment_batch:shipment_batches!inner(to_organization_id, shipment_date)', {
          count: 'exact',
          head: true,
        })
        .eq('shipment_batch.to_organization_id', organizationId)
        .gte('shipment_batch.shipment_date', `${today}T00:00:00`)
        .lte('shipment_batch.shipment_date', `${today}T23:59:59`),
    ]);

  // 고유 환자 수 계산
  const uniquePatients = new Set(totalPatientsResult.data?.map((r) => r.patient_phone) || []);

  return {
    success: true,
    data: {
      totalInventory: inventoryResult.count || 0,
      todayTreatments: todayTreatmentsResult.count || 0,
      totalPatients: uniquePatients.size,
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
  const today = new Date().toISOString().split('T')[0];

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
        .gte('recall_date', `${today}T00:00:00`)
        .lte('recall_date', `${today}T23:59:59`),

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
