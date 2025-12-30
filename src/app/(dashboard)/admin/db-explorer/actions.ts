'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createSuccessResponse, createErrorResponse } from '@/services/common.service';
import type { ApiResponse } from '@/types/api.types';

/**
 * DB 구조 정보 타입
 */
export interface DbStructure {
  tables: {
    name: string;
    columns: {
      name: string;
      type: string;
      nullable: boolean;
      defaultValue: string | null;
      description: string;
    }[];
    indexes: string[];
    foreignKeys: {
      column: string;
      references: string;
    }[];
  }[];
  triggers: {
    name: string;
    table: string;
    event: string;
    function: string;
  }[];
  rpcFunctions: {
    name: string;
    description: string;
    parameters: string;
    returns: string;
  }[];
}

/**
 * 샘플 히스토리 레코드 타입
 */
export interface SampleHistory {
  id: string;
  virtualCodeId: string;
  virtualCode: string;
  actionType: string;
  fromOwnerType: string | null;
  fromOwnerId: string | null;
  fromOwnerName: string | null;
  toOwnerType: string | null;
  toOwnerId: string | null;
  toOwnerName: string | null;
  shipmentBatchId: string | null;
  lotId: string | null;
  treatmentId: string | null;
  isRecall: boolean;
  recallReason: string | null;
  createdAt: string;
  productName: string | null;
  lotNumber: string | null;
}

/**
 * DB 구조 정보 조회
 */
export async function getDbStructureAction(): Promise<ApiResponse<DbStructure>> {
  try {
    // 하드코딩된 구조 정보 (실제 스키마 기반)
    const dbStructure: DbStructure = {
      tables: [
        {
          name: 'histories',
          columns: [
            { name: 'id', type: 'uuid', nullable: false, defaultValue: 'gen_random_uuid()', description: '고유 식별자' },
            { name: 'virtual_code_id', type: 'uuid', nullable: false, defaultValue: null, description: '가상 코드 참조' },
            { name: 'action_type', type: 'varchar', nullable: false, defaultValue: null, description: 'PRODUCED|SHIPPED|RECEIVED|TREATED|RECALLED|DISPOSED' },
            { name: 'from_owner_type', type: 'varchar', nullable: true, defaultValue: null, description: 'ORGANIZATION|PATIENT' },
            { name: 'from_owner_id', type: 'uuid', nullable: true, defaultValue: null, description: '발신 소유자 ID' },
            { name: 'to_owner_type', type: 'varchar', nullable: true, defaultValue: null, description: 'ORGANIZATION|PATIENT' },
            { name: 'to_owner_id', type: 'uuid', nullable: true, defaultValue: null, description: '수신 소유자 ID' },
            { name: 'shipment_batch_id', type: 'uuid', nullable: true, defaultValue: null, description: '출고 배치 ID (SHIPPED/RECEIVED/RECALLED)' },
            { name: 'lot_id', type: 'uuid', nullable: true, defaultValue: null, description: '로트 ID (PRODUCED)' },
            { name: 'treatment_id', type: 'uuid', nullable: true, defaultValue: null, description: '시술 ID (TREATED/RECALLED)' },
            { name: 'is_recall', type: 'boolean', nullable: false, defaultValue: 'false', description: '회수 여부' },
            { name: 'recall_reason', type: 'text', nullable: true, defaultValue: null, description: '회수 사유' },
            { name: 'created_at', type: 'timestamptz', nullable: false, defaultValue: 'now()', description: '생성 시간' },
          ],
          indexes: [
            'idx_histories_virtual_code_id',
            'idx_histories_action_type',
            'idx_histories_created_at',
            'idx_histories_from_owner',
            'idx_histories_to_owner',
            'idx_histories_shipment_batch_id',
            'idx_histories_lot_id',
            'idx_histories_treatment_id',
          ],
          foreignKeys: [
            { column: 'virtual_code_id', references: 'virtual_codes(id)' },
            { column: 'shipment_batch_id', references: 'shipment_batches(id)' },
            { column: 'lot_id', references: 'lots(id)' },
            { column: 'treatment_id', references: 'treatment_records(id)' },
          ],
        },
        {
          name: 'virtual_codes',
          columns: [
            { name: 'id', type: 'uuid', nullable: false, defaultValue: 'gen_random_uuid()', description: '고유 식별자' },
            { name: 'code', type: 'varchar(12)', nullable: false, defaultValue: null, description: 'NC-XXXXXXXX 형식' },
            { name: 'lot_id', type: 'uuid', nullable: false, defaultValue: null, description: '소속 로트' },
            { name: 'owner_type', type: 'varchar', nullable: false, defaultValue: null, description: 'ORGANIZATION|PATIENT' },
            { name: 'owner_id', type: 'uuid', nullable: false, defaultValue: null, description: '현재 소유자' },
            { name: 'status', type: 'varchar', nullable: false, defaultValue: 'ACTIVE', description: 'ACTIVE|USED|DISPOSED' },
            { name: 'created_at', type: 'timestamptz', nullable: false, defaultValue: 'now()', description: '생성 시간' },
          ],
          indexes: [
            'idx_virtual_codes_code (UNIQUE)',
            'idx_virtual_codes_lot_id',
            'idx_virtual_codes_owner',
            'idx_virtual_codes_status',
          ],
          foreignKeys: [
            { column: 'lot_id', references: 'lots(id)' },
          ],
        },
        {
          name: 'lots',
          columns: [
            { name: 'id', type: 'uuid', nullable: false, defaultValue: 'gen_random_uuid()', description: '고유 식별자' },
            { name: 'lot_number', type: 'varchar', nullable: false, defaultValue: null, description: '로트 번호' },
            { name: 'product_id', type: 'uuid', nullable: false, defaultValue: null, description: '제품 참조' },
            { name: 'manufacturer_id', type: 'uuid', nullable: false, defaultValue: null, description: '제조사' },
            { name: 'quantity', type: 'integer', nullable: false, defaultValue: null, description: '생산 수량' },
            { name: 'manufactured_at', type: 'date', nullable: false, defaultValue: null, description: '제조일' },
            { name: 'expires_at', type: 'date', nullable: false, defaultValue: null, description: '유효기한' },
          ],
          indexes: [
            'idx_lots_lot_number (UNIQUE per manufacturer)',
            'idx_lots_product_id',
            'idx_lots_manufacturer_id',
          ],
          foreignKeys: [
            { column: 'product_id', references: 'products(id)' },
            { column: 'manufacturer_id', references: 'organizations(id)' },
          ],
        },
        {
          name: 'shipment_batches',
          columns: [
            { name: 'id', type: 'uuid', nullable: false, defaultValue: 'gen_random_uuid()', description: '고유 식별자' },
            { name: 'from_org_id', type: 'uuid', nullable: false, defaultValue: null, description: '발송 조직' },
            { name: 'to_org_id', type: 'uuid', nullable: false, defaultValue: null, description: '수신 조직' },
            { name: 'created_at', type: 'timestamptz', nullable: false, defaultValue: 'now()', description: '출고 시간' },
          ],
          indexes: ['idx_shipment_batches_from_org', 'idx_shipment_batches_to_org'],
          foreignKeys: [
            { column: 'from_org_id', references: 'organizations(id)' },
            { column: 'to_org_id', references: 'organizations(id)' },
          ],
        },
        {
          name: 'treatment_records',
          columns: [
            { name: 'id', type: 'uuid', nullable: false, defaultValue: 'gen_random_uuid()', description: '고유 식별자' },
            { name: 'hospital_id', type: 'uuid', nullable: false, defaultValue: null, description: '병원' },
            { name: 'patient_id', type: 'uuid', nullable: false, defaultValue: null, description: '환자' },
            { name: 'treatment_date', type: 'date', nullable: false, defaultValue: null, description: '시술일' },
            { name: 'created_at', type: 'timestamptz', nullable: false, defaultValue: 'now()', description: '생성 시간' },
          ],
          indexes: ['idx_treatment_records_hospital', 'idx_treatment_records_patient'],
          foreignKeys: [
            { column: 'hospital_id', references: 'organizations(id)' },
            { column: 'patient_id', references: 'patients(id)' },
          ],
        },
      ],
      triggers: [
        {
          name: 'create_virtual_codes_for_lot',
          table: 'lots',
          event: 'AFTER INSERT',
          function: 'generate_virtual_codes() → lot.quantity만큼 virtual_codes 생성',
        },
        {
          name: 'record_production_history',
          table: 'virtual_codes',
          event: 'AFTER INSERT',
          function: 'record_production_history() → PRODUCED 이력 생성 (lot_id 포함)',
        },
        {
          name: 'record_virtual_code_history',
          table: 'virtual_codes',
          event: 'AFTER UPDATE',
          function: 'record_virtual_code_history() → 소유권 변경 시 이력 생성',
        },
      ],
      rpcFunctions: [
        {
          name: 'create_shipment_atomic',
          description: '원자적 출고 처리 (FIFO 선택 + 소유권 이전 + 이력 생성)',
          parameters: 'from_org_id, to_org_id, items[{lot_id?, product_id, quantity}]',
          returns: 'shipment_batch_id, shipped_codes[]',
        },
        {
          name: 'recall_shipment_atomic',
          description: '출고 회수 (24시간 이내, 소유권 복원 + RECALLED 이력)',
          parameters: 'batch_id, reason',
          returns: 'void',
        },
        {
          name: 'create_treatment_atomic',
          description: '원자적 시술 처리 (코드 소비 + 환자 이전 + 이력 생성)',
          parameters: 'hospital_id, patient_info, items[{product_id, quantity}]',
          returns: 'treatment_id',
        },
        {
          name: 'recall_treatment_atomic',
          description: '시술 회수 (소유권 복원 + RECALLED 이력)',
          parameters: 'treatment_id, reason',
          returns: 'void',
        },
        {
          name: 'get_history_summary_cursor',
          description: '커서 기반 이력 조회 (배치 ID 그룹핑)',
          parameters: 'org_id, action_types[], start_date, end_date, limit, cursor_time, cursor_key',
          returns: 'group_key, action_type, from/to_owner, product_summaries[], shipment_batch_id, has_more',
        },
        {
          name: 'select_fifo_codes',
          description: 'FIFO 기반 코드 선택 (FOR UPDATE SKIP LOCKED)',
          parameters: 'owner_id, product_id, lot_id?, quantity',
          returns: 'virtual_code_ids[]',
        },
      ],
    };

    return createSuccessResponse(dbStructure);
  } catch (error) {
    console.error('Failed to get DB structure:', error);
    return createErrorResponse('INTERNAL_ERROR', 'DB 구조 조회 실패');
  }
}

/**
 * 샘플 히스토리 레코드 조회 (최근 20건)
 *
 * NOTE: lot_id, treatment_id 컬럼은 마이그레이션 적용 후 추가됩니다.
 * 현재는 기존 스키마 기준으로 조회합니다.
 */
export async function getSampleHistoriesAction(): Promise<ApiResponse<SampleHistory[]>> {
  try {
    const supabase = createAdminClient();

    // 현재 DB 스키마 기준 쿼리 (lot_id, treatment_id는 마이그레이션 후 추가)
    const { data, error } = await supabase
      .from('histories')
      .select(`
        id,
        virtual_code_id,
        action_type,
        from_owner_type,
        from_owner_id,
        to_owner_type,
        to_owner_id,
        shipment_batch_id,
        is_recall,
        recall_reason,
        created_at,
        virtual_codes!inner (
          code,
          lot_id,
          lots!inner (
            lot_number,
            products!inner (
              name
            )
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to fetch sample histories:', error);
      return createErrorResponse('INTERNAL_ERROR', '샘플 이력 조회 실패');
    }

    // 조직명 조회를 위한 ID 수집
    const orgIds = new Set<string>();
    data?.forEach((h) => {
      if (h.from_owner_id && h.from_owner_type === 'ORGANIZATION') orgIds.add(h.from_owner_id);
      if (h.to_owner_id && h.to_owner_type === 'ORGANIZATION') orgIds.add(h.to_owner_id);
    });

    // 조직명 조회
    const orgNames: Record<string, string> = {};
    if (orgIds.size > 0) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', Array.from(orgIds));
      orgs?.forEach((org) => {
        orgNames[org.id] = org.name;
      });
    }

    // 타입 캐스팅을 위한 인터페이스
    interface HistoryRow {
      id: string;
      virtual_code_id: string;
      action_type: string;
      from_owner_type: string | null;
      from_owner_id: string | null;
      to_owner_type: string | null;
      to_owner_id: string | null;
      shipment_batch_id: string | null;
      is_recall: boolean;
      recall_reason: string | null;
      created_at: string;
      virtual_codes: {
        code: string;
        lot_id: string;
        lots: {
          lot_number: string;
          products: { name: string };
        };
      };
    }

    const samples: SampleHistory[] = ((data ?? []) as unknown as HistoryRow[]).map((h) => ({
      id: h.id,
      virtualCodeId: h.virtual_code_id,
      virtualCode: h.virtual_codes?.code ?? '',
      actionType: h.action_type,
      fromOwnerType: h.from_owner_type,
      fromOwnerId: h.from_owner_id,
      fromOwnerName: h.from_owner_id && h.from_owner_type === 'ORGANIZATION'
        ? orgNames[h.from_owner_id] ?? null
        : h.from_owner_type === 'PATIENT' ? '(환자)' : null,
      toOwnerType: h.to_owner_type,
      toOwnerId: h.to_owner_id,
      toOwnerName: h.to_owner_id && h.to_owner_type === 'ORGANIZATION'
        ? orgNames[h.to_owner_id] ?? null
        : h.to_owner_type === 'PATIENT' ? '(환자)' : null,
      shipmentBatchId: h.shipment_batch_id,
      // lot_id는 virtual_codes에서 가져옴 (histories 테이블에 직접 추가 전)
      lotId: h.virtual_codes?.lot_id ?? null,
      // treatment_id는 마이그레이션 후 사용 가능
      treatmentId: null,
      isRecall: h.is_recall,
      recallReason: h.recall_reason,
      createdAt: h.created_at,
      productName: h.virtual_codes?.lots?.products?.name ?? null,
      lotNumber: h.virtual_codes?.lots?.lot_number ?? null,
    }));

    return createSuccessResponse(samples);
  } catch (error) {
    console.error('Failed to fetch sample histories:', error);
    return createErrorResponse('INTERNAL_ERROR', '샘플 이력 조회 실패');
  }
}
