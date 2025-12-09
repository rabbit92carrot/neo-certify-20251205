/**
 * 출고 서비스
 * 출고 생성, 조회, 회수 관련 비즈니스 로직
 *
 * 핵심 기능:
 * - FIFO 기반 가상 코드 자동 할당
 * - 제조사 전용 Lot 선택 옵션
 * - 즉시 소유권 이전
 * - 24시간 내 회수 가능
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ApiResponse,
  PaginatedResponse,
  ShipmentBatch,
  Organization,
  OrganizationType,
} from '@/types/api.types';
import type { ShipmentCreateData, ShipmentHistoryQueryData } from '@/lib/validations/shipment';

/**
 * 출고 뭉치 + 요약 정보 타입
 */
export interface ShipmentBatchSummary extends ShipmentBatch {
  fromOrganization: Pick<Organization, 'id' | 'name' | 'type'>;
  toOrganization: Pick<Organization, 'id' | 'name' | 'type'>;
  itemSummary: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
  totalQuantity: number;
}

/**
 * 출고 대상 조직 목록 조회
 *
 * @param organizationType 현재 조직 유형
 * @returns 출고 가능한 조직 목록
 */
export async function getShipmentTargetOrganizations(
  organizationType: OrganizationType
): Promise<ApiResponse<Pick<Organization, 'id' | 'name' | 'type'>[]>> {
  const supabase = await createClient();

  // 출고 가능 대상 유형 결정
  // 제조사: 유통사, 병원
  // 유통사: 유통사, 병원
  // 병원: 없음 (시술만 가능)
  let targetTypes: OrganizationType[] = [];

  if (organizationType === 'MANUFACTURER') {
    targetTypes = ['DISTRIBUTOR', 'HOSPITAL'];
  } else if (organizationType === 'DISTRIBUTOR') {
    targetTypes = ['DISTRIBUTOR', 'HOSPITAL'];
  } else {
    return { success: true, data: [] };
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, type')
    .in('type', targetTypes)
    .eq('status', 'ACTIVE')
    .order('name');

  if (error) {
    console.error('출고 대상 조직 조회 실패:', error);
    return {
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: '출고 대상 조직 조회에 실패했습니다.',
      },
    };
  }

  return { success: true, data: data || [] };
}

/**
 * 출고 생성
 * FIFO 기반으로 가상 코드를 자동 할당하고 소유권을 즉시 이전합니다.
 *
 * @param fromOrganizationId 발송 조직 ID
 * @param data 출고 데이터
 * @returns 생성된 출고 뭉치
 */
export async function createShipment(
  fromOrganizationId: string,
  data: ShipmentCreateData
): Promise<ApiResponse<{ shipmentBatchId: string; totalQuantity: number }>> {
  const supabase = await createClient();

  // 1. 수신 조직 조회
  const { data: toOrg, error: toOrgError } = await supabase
    .from('organizations')
    .select('id, type, status')
    .eq('id', data.toOrganizationId)
    .single();

  if (toOrgError || !toOrg) {
    return {
      success: false,
      error: {
        code: 'ORGANIZATION_NOT_FOUND',
        message: '수신 조직을 찾을 수 없습니다.',
      },
    };
  }

  if (toOrg.status !== 'ACTIVE') {
    return {
      success: false,
      error: {
        code: 'ORGANIZATION_INACTIVE',
        message: '비활성 상태의 조직에는 출고할 수 없습니다.',
      },
    };
  }

  // 자기 자신에게 출고 방지
  if (fromOrganizationId === data.toOrganizationId) {
    return {
      success: false,
      error: {
        code: 'SELF_SHIPMENT',
        message: '자기 자신에게는 출고할 수 없습니다.',
      },
    };
  }

  // 2. 출고 뭉치 생성
  const { data: shipmentBatch, error: batchError } = await supabase
    .from('shipment_batches')
    .insert({
      from_organization_id: fromOrganizationId,
      to_organization_id: data.toOrganizationId,
      to_organization_type: toOrg.type,
    })
    .select()
    .single();

  if (batchError || !shipmentBatch) {
    console.error('출고 뭉치 생성 실패:', batchError);
    return {
      success: false,
      error: {
        code: 'BATCH_CREATE_FAILED',
        message: '출고 뭉치 생성에 실패했습니다.',
      },
    };
  }

  // 3. 각 아이템별로 FIFO 선택 및 소유권 이전
  let totalQuantity = 0;
  const allSelectedCodes: string[] = [];

  for (const item of data.items) {
    // FIFO 선택 (DB 함수 호출)
    const { data: selectedCodes, error: selectError } = await supabase.rpc('select_fifo_codes', {
      p_product_id: item.productId,
      p_owner_id: fromOrganizationId,
      p_quantity: item.quantity,
      p_lot_id: item.lotId ?? undefined,
    });

    if (selectError) {
      console.error('FIFO 선택 실패:', selectError);
      // 롤백: 이미 생성된 출고 뭉치 삭제
      await supabase.from('shipment_batches').delete().eq('id', shipmentBatch.id);
      return {
        success: false,
        error: {
          code: 'FIFO_SELECT_FAILED',
          message: 'FIFO 코드 선택에 실패했습니다.',
        },
      };
    }

    if (!selectedCodes || selectedCodes.length < item.quantity) {
      // 롤백
      await supabase.from('shipment_batches').delete().eq('id', shipmentBatch.id);
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: `재고가 부족합니다. 요청: ${item.quantity}개, 가능: ${selectedCodes?.length || 0}개`,
        },
      };
    }

    const codeIds = selectedCodes.map((c) => c.virtual_code_id);
    allSelectedCodes.push(...codeIds);
    totalQuantity += codeIds.length;

    // 출고 상세 기록
    const detailInserts = codeIds.map((virtualCodeId) => ({
      shipment_batch_id: shipmentBatch.id,
      virtual_code_id: virtualCodeId,
    }));

    const { error: detailError } = await supabase.from('shipment_details').insert(detailInserts);

    if (detailError) {
      console.error('출고 상세 기록 실패:', detailError);
      // 롤백
      await supabase.from('shipment_details').delete().eq('shipment_batch_id', shipmentBatch.id);
      await supabase.from('shipment_batches').delete().eq('id', shipmentBatch.id);
      return {
        success: false,
        error: {
          code: 'DETAIL_CREATE_FAILED',
          message: '출고 상세 기록에 실패했습니다.',
        },
      };
    }

    // 소유권 이전 (가상 코드 업데이트)
    const { error: updateError } = await supabase
      .from('virtual_codes')
      .update({
        owner_id: data.toOrganizationId,
        owner_type: 'ORGANIZATION',
      })
      .in('id', codeIds);

    if (updateError) {
      console.error('소유권 이전 실패:', updateError);
      // 롤백
      await supabase.from('shipment_details').delete().eq('shipment_batch_id', shipmentBatch.id);
      await supabase.from('shipment_batches').delete().eq('id', shipmentBatch.id);
      return {
        success: false,
        error: {
          code: 'OWNERSHIP_TRANSFER_FAILED',
          message: '소유권 이전에 실패했습니다.',
        },
      };
    }

    // 이력 기록
    const historyInserts = codeIds.map((virtualCodeId) => ({
      virtual_code_id: virtualCodeId,
      action_type: 'SHIPPED' as const,
      from_owner_type: 'ORGANIZATION' as const,
      from_owner_id: fromOrganizationId,
      to_owner_type: 'ORGANIZATION' as const,
      to_owner_id: data.toOrganizationId,
      shipment_batch_id: shipmentBatch.id,
      is_recall: false,
    }));

    const { error: historyError } = await supabase.from('histories').insert(historyInserts);

    if (historyError) {
      console.error('이력 기록 실패:', historyError);
      // 이력 기록 실패는 치명적이지 않으므로 계속 진행
    }
  }

  return {
    success: true,
    data: {
      shipmentBatchId: shipmentBatch.id,
      totalQuantity,
    },
  };
}

/**
 * 출고 이력 조회 (뭉치 단위)
 *
 * @param organizationId 조직 ID
 * @param query 조회 옵션
 * @returns 페이지네이션된 출고 뭉치 목록
 */
export async function getShipmentHistory(
  organizationId: string,
  query: ShipmentHistoryQueryData
): Promise<ApiResponse<PaginatedResponse<ShipmentBatchSummary>>> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, startDate, endDate, toOrganizationId, isRecalled } = query;
  const offset = (page - 1) * pageSize;

  // 기본 쿼리: 발송한 출고 뭉치
  let queryBuilder = supabase
    .from('shipment_batches')
    .select(
      `
      *,
      fromOrganization:organizations!shipment_batches_from_organization_id_fkey(id, name, type),
      toOrganization:organizations!shipment_batches_to_organization_id_fkey(id, name, type)
    `,
      { count: 'exact' }
    )
    .eq('from_organization_id', organizationId)
    .order('shipment_date', { ascending: false });

  // 필터 적용
  if (startDate) {
    queryBuilder = queryBuilder.gte('shipment_date', `${startDate}T00:00:00`);
  }
  if (endDate) {
    queryBuilder = queryBuilder.lte('shipment_date', `${endDate}T23:59:59`);
  }
  if (toOrganizationId) {
    queryBuilder = queryBuilder.eq('to_organization_id', toOrganizationId);
  }
  if (typeof isRecalled === 'boolean') {
    queryBuilder = queryBuilder.eq('is_recalled', isRecalled);
  }

  const { data: batches, count, error } = await queryBuilder.range(offset, offset + pageSize - 1);

  if (error) {
    console.error('출고 이력 조회 실패:', error);
    return {
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message,
      },
    };
  }

  // 각 뭉치별 아이템 요약 조회
  const batchSummaries: ShipmentBatchSummary[] = [];

  for (const batch of batches || []) {
    const summary = await getShipmentBatchSummary(batch.id);
    batchSummaries.push({
      ...batch,
      fromOrganization: batch.fromOrganization as Pick<Organization, 'id' | 'name' | 'type'>,
      toOrganization: batch.toOrganization as Pick<Organization, 'id' | 'name' | 'type'>,
      itemSummary: summary.itemSummary,
      totalQuantity: summary.totalQuantity,
    });
  }

  const total = count || 0;

  return {
    success: true,
    data: {
      items: batchSummaries,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: offset + pageSize < total,
      },
    },
  };
}

/**
 * 수신 출고 이력 조회 (입고 이력)
 *
 * @param organizationId 조직 ID
 * @param query 조회 옵션
 * @returns 페이지네이션된 수신 출고 뭉치 목록
 */
export async function getReceivedShipmentHistory(
  organizationId: string,
  query: ShipmentHistoryQueryData
): Promise<ApiResponse<PaginatedResponse<ShipmentBatchSummary>>> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, startDate, endDate, isRecalled } = query;
  const offset = (page - 1) * pageSize;

  // 수신한 출고 뭉치
  let queryBuilder = supabase
    .from('shipment_batches')
    .select(
      `
      *,
      fromOrganization:organizations!shipment_batches_from_organization_id_fkey(id, name, type),
      toOrganization:organizations!shipment_batches_to_organization_id_fkey(id, name, type)
    `,
      { count: 'exact' }
    )
    .eq('to_organization_id', organizationId)
    .order('shipment_date', { ascending: false });

  if (startDate) {
    queryBuilder = queryBuilder.gte('shipment_date', `${startDate}T00:00:00`);
  }
  if (endDate) {
    queryBuilder = queryBuilder.lte('shipment_date', `${endDate}T23:59:59`);
  }
  if (typeof isRecalled === 'boolean') {
    queryBuilder = queryBuilder.eq('is_recalled', isRecalled);
  }

  const { data: batches, count, error } = await queryBuilder.range(offset, offset + pageSize - 1);

  if (error) {
    console.error('수신 출고 이력 조회 실패:', error);
    return {
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error.message,
      },
    };
  }

  const batchSummaries: ShipmentBatchSummary[] = [];

  for (const batch of batches || []) {
    const summary = await getShipmentBatchSummary(batch.id);
    batchSummaries.push({
      ...batch,
      fromOrganization: batch.fromOrganization as Pick<Organization, 'id' | 'name' | 'type'>,
      toOrganization: batch.toOrganization as Pick<Organization, 'id' | 'name' | 'type'>,
      itemSummary: summary.itemSummary,
      totalQuantity: summary.totalQuantity,
    });
  }

  const total = count || 0;

  return {
    success: true,
    data: {
      items: batchSummaries,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: offset + pageSize < total,
      },
    },
  };
}

/**
 * 출고 뭉치 아이템 요약 조회 (내부용)
 */
async function getShipmentBatchSummary(
  shipmentBatchId: string
): Promise<{ itemSummary: { productId: string; productName: string; quantity: number }[]; totalQuantity: number }> {
  const supabase = await createClient();

  const { data: details } = await supabase
    .from('shipment_details')
    .select(
      `
      virtual_code:virtual_codes!inner(
        lot:lots!inner(
          product:products!inner(
            id,
            name
          )
        )
      )
    `
    )
    .eq('shipment_batch_id', shipmentBatchId);

  if (!details || details.length === 0) {
    return { itemSummary: [], totalQuantity: 0 };
  }

  // 제품별 그룹화
  const productMap = new Map<string, { name: string; quantity: number }>();

  for (const detail of details) {
    const product = (detail.virtual_code as { lot: { product: { id: string; name: string } } }).lot.product;
    const existing = productMap.get(product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      productMap.set(product.id, { name: product.name, quantity: 1 });
    }
  }

  const itemSummary = Array.from(productMap.entries()).map(([productId, { name, quantity }]) => ({
    productId,
    productName: name,
    quantity,
  }));

  return {
    itemSummary,
    totalQuantity: details.length,
  };
}

/**
 * 출고 회수
 * 발송자만 24시간 이내 회수 가능
 *
 * @param organizationId 현재 조직 ID (발송자여야 함)
 * @param shipmentBatchId 출고 뭉치 ID
 * @param reason 회수 사유
 * @returns 회수 결과
 */
export async function recallShipment(
  organizationId: string,
  shipmentBatchId: string,
  reason: string
): Promise<ApiResponse<void>> {
  const supabase = await createClient();

  // 1. 출고 뭉치 조회 및 권한 확인
  const { data: batch, error: batchError } = await supabase
    .from('shipment_batches')
    .select('*')
    .eq('id', shipmentBatchId)
    .single();

  if (batchError || !batch) {
    return {
      success: false,
      error: {
        code: 'BATCH_NOT_FOUND',
        message: '출고 뭉치를 찾을 수 없습니다.',
      },
    };
  }

  // 발송자 권한 확인
  if (batch.from_organization_id !== organizationId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '발송자만 회수할 수 있습니다.',
      },
    };
  }

  // 이미 회수됨
  if (batch.is_recalled) {
    return {
      success: false,
      error: {
        code: 'ALREADY_RECALLED',
        message: '이미 회수된 출고 뭉치입니다.',
      },
    };
  }

  // 2. 24시간 제한 확인 (DB 함수)
  const { data: isAllowed, error: checkError } = await supabase.rpc('is_recall_allowed', {
    p_shipment_batch_id: shipmentBatchId,
  });

  if (checkError || !isAllowed) {
    return {
      success: false,
      error: {
        code: 'RECALL_TIME_EXCEEDED',
        message: '24시간 경과하여 처리할 수 없습니다. 관리자에게 연락해주세요.',
      },
    };
  }

  // 3. 출고 상세에서 가상 코드 ID 조회
  const { data: details, error: detailError } = await supabase
    .from('shipment_details')
    .select('virtual_code_id')
    .eq('shipment_batch_id', shipmentBatchId);

  if (detailError || !details || details.length === 0) {
    return {
      success: false,
      error: {
        code: 'NO_DETAILS',
        message: '회수할 제품이 없습니다.',
      },
    };
  }

  const codeIds = details.map((d) => d.virtual_code_id);

  // 4. 소유권 복귀 (발송자에게)
  const { error: updateError } = await supabase
    .from('virtual_codes')
    .update({
      owner_id: organizationId,
      owner_type: 'ORGANIZATION',
    })
    .in('id', codeIds);

  if (updateError) {
    console.error('소유권 복귀 실패:', updateError);
    return {
      success: false,
      error: {
        code: 'OWNERSHIP_REVERT_FAILED',
        message: '소유권 복귀에 실패했습니다.',
      },
    };
  }

  // 5. 출고 뭉치 회수 처리
  const { error: batchUpdateError } = await supabase
    .from('shipment_batches')
    .update({
      is_recalled: true,
      recall_reason: reason,
      recall_date: new Date().toISOString(),
    })
    .eq('id', shipmentBatchId);

  if (batchUpdateError) {
    console.error('출고 뭉치 회수 처리 실패:', batchUpdateError);
    // 롤백: 소유권 다시 이전
    await supabase
      .from('virtual_codes')
      .update({
        owner_id: batch.to_organization_id,
        owner_type: 'ORGANIZATION',
      })
      .in('id', codeIds);

    return {
      success: false,
      error: {
        code: 'BATCH_UPDATE_FAILED',
        message: '출고 뭉치 회수 처리에 실패했습니다.',
      },
    };
  }

  // 6. 회수 이력 기록
  const historyInserts = codeIds.map((virtualCodeId) => ({
    virtual_code_id: virtualCodeId,
    action_type: 'RECALLED' as const,
    from_owner_type: 'ORGANIZATION' as const,
    from_owner_id: batch.to_organization_id,
    to_owner_type: 'ORGANIZATION' as const,
    to_owner_id: organizationId,
    shipment_batch_id: shipmentBatchId,
    is_recall: true,
    recall_reason: reason,
  }));

  const { error: historyError } = await supabase.from('histories').insert(historyInserts);

  if (historyError) {
    console.error('회수 이력 기록 실패:', historyError);
    // 이력 기록 실패는 치명적이지 않으므로 계속 진행
  }

  return { success: true };
}

/**
 * 회수 가능 여부 확인
 *
 * @param organizationId 현재 조직 ID
 * @param shipmentBatchId 출고 뭉치 ID
 * @returns 회수 가능 여부
 */
export async function checkRecallAllowed(
  organizationId: string,
  shipmentBatchId: string
): Promise<ApiResponse<{ allowed: boolean; reason?: string }>> {
  const supabase = await createClient();

  const { data: batch, error: batchError } = await supabase
    .from('shipment_batches')
    .select('from_organization_id, is_recalled')
    .eq('id', shipmentBatchId)
    .single();

  if (batchError || !batch) {
    return {
      success: false,
      error: {
        code: 'BATCH_NOT_FOUND',
        message: '출고 뭉치를 찾을 수 없습니다.',
      },
    };
  }

  if (batch.from_organization_id !== organizationId) {
    return {
      success: true,
      data: { allowed: false, reason: '발송자만 회수할 수 있습니다.' },
    };
  }

  if (batch.is_recalled) {
    return {
      success: true,
      data: { allowed: false, reason: '이미 회수된 출고 뭉치입니다.' },
    };
  }

  const { data: isAllowed, error: checkError } = await supabase.rpc('is_recall_allowed', {
    p_shipment_batch_id: shipmentBatchId,
  });

  if (checkError) {
    return {
      success: false,
      error: {
        code: 'CHECK_ERROR',
        message: '회수 가능 여부 확인에 실패했습니다.',
      },
    };
  }

  if (!isAllowed) {
    return {
      success: true,
      data: { allowed: false, reason: '24시간 경과하여 처리할 수 없습니다.' },
    };
  }

  return { success: true, data: { allowed: true } };
}
