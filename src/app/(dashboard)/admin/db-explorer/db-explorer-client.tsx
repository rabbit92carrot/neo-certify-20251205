'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Database,
  Table,
  Key,
  Link2,
  Zap,
  Code2,
  ArrowRight,
  Factory,
  Truck,
  Building2,
  Stethoscope,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { DbStructure, SampleHistory } from './actions';

interface DbExplorerClientProps {
  dbStructure: DbStructure | null;
  sampleHistories: SampleHistory[];
}

/**
 * 액션 타입별 아이콘 및 색상
 */
function getActionTypeConfig(actionType: string): { icon: React.ReactNode; color: string; label: string } {
  switch (actionType) {
    case 'PRODUCED':
      return { icon: <Factory className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800', label: '생산' };
    case 'SHIPPED':
      return { icon: <Truck className="h-4 w-4" />, color: 'bg-green-100 text-green-800', label: '출고' };
    case 'RECEIVED':
      return { icon: <Building2 className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800', label: '입고' };
    case 'TREATED':
      return { icon: <Stethoscope className="h-4 w-4" />, color: 'bg-pink-100 text-pink-800', label: '시술' };
    case 'RECALLED':
      return { icon: <RotateCcw className="h-4 w-4" />, color: 'bg-orange-100 text-orange-800', label: '회수' };
    case 'DISPOSED':
      return { icon: <Trash2 className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800', label: '폐기' };
    default:
      return { icon: <Code2 className="h-4 w-4" />, color: 'bg-gray-100 text-gray-600', label: actionType };
  }
}

export function DbExplorerClient({ dbStructure, sampleHistories }: DbExplorerClientProps): React.ReactElement {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set(['histories']));

  const toggleTable = (tableName: string): void => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  };

  return (
    <Tabs defaultValue="structure" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="structure">테이블 구조</TabsTrigger>
        <TabsTrigger value="flow">이력 생성 플로우</TabsTrigger>
        <TabsTrigger value="grouping">그룹핑 로직</TabsTrigger>
        <TabsTrigger value="samples">라이브 샘플</TabsTrigger>
      </TabsList>

      {/* 테이블 구조 탭 */}
      <TabsContent value="structure" className="space-y-4">
        <div className="grid gap-4">
          {dbStructure?.tables.map((table) => (
            <Card key={table.name}>
              <CardHeader
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleTable(table.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Table className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{table.name}</CardTitle>
                    <Badge variant="outline">{table.columns.length} columns</Badge>
                  </div>
                  {expandedTables.has(table.name) ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </CardHeader>

              {expandedTables.has(table.name) && (
                <CardContent className="pt-0">
                  {/* 컬럼 목록 */}
                  <div className="space-y-1 mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Database className="h-4 w-4" /> Columns
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm">
                      {table.columns.map((col) => (
                        <div key={col.name} className="flex items-start gap-2 py-1 border-b border-gray-200 last:border-0">
                          <span className={cn(
                            'font-semibold min-w-[160px]',
                            col.name === 'id' && 'text-yellow-700',
                            col.name.endsWith('_id') && 'text-blue-700',
                          )}>
                            {col.name}
                          </span>
                          <span className="text-purple-600 min-w-[100px]">{col.type}</span>
                          <span className="text-gray-400 min-w-[60px]">
                            {col.nullable ? 'NULL' : 'NOT NULL'}
                          </span>
                          <span className="text-gray-500 flex-1">{col.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 인덱스 */}
                  {table.indexes.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <Key className="h-4 w-4" /> Indexes
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {table.indexes.map((idx) => (
                          <Badge key={idx} variant="secondary" className="font-mono text-xs">
                            {idx}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 외래 키 */}
                  {table.foreignKeys.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <Link2 className="h-4 w-4" /> Foreign Keys
                      </h4>
                      <div className="space-y-1">
                        {table.foreignKeys.map((fk) => (
                          <div key={fk.column} className="flex items-center gap-2 text-sm font-mono">
                            <span className="text-blue-600">{fk.column}</span>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <span className="text-green-600">{fk.references}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* 트리거 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">Triggers</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dbStructure?.triggers.map((trigger) => (
                <div key={trigger.name} className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-yellow-800">{trigger.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {trigger.event}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      on {trigger.table}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{trigger.function}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* RPC 함수 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">RPC Functions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dbStructure?.rpcFunctions.map((func) => (
                <div key={func.name} className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="font-mono text-sm">
                    <span className="text-purple-800 font-semibold">{func.name}</span>
                    <span className="text-gray-500">(</span>
                    <span className="text-blue-600">{func.parameters}</span>
                    <span className="text-gray-500">)</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{func.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">Returns:</span> {func.returns}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 이력 생성 플로우 탭 */}
      <TabsContent value="flow" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>이벤트별 이력 생성 플로우</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* PRODUCED */}
            <FlowDiagram
              title="PRODUCED (생산)"
              color="blue"
              steps={[
                { label: 'lots INSERT', description: '로트 레코드 생성' },
                { label: 'TRIGGER: create_virtual_codes_for_lot', description: 'quantity만큼 virtual_codes 자동 생성' },
                { label: 'TRIGGER: record_production_history', description: 'PRODUCED 이력 생성 (lot_id 포함)' },
              ]}
              result="histories에 PRODUCED 레코드 (lot_id = lots.id)"
            />

            {/* SHIPPED */}
            <FlowDiagram
              title="SHIPPED (출고)"
              color="green"
              steps={[
                { label: 'create_shipment_atomic() 호출', description: 'from_org, to_org, items[] 전달' },
                { label: 'select_fifo_codes()', description: 'FIFO 기반 코드 선택 (FOR UPDATE SKIP LOCKED)' },
                { label: 'shipment_batches INSERT', description: '배치 레코드 생성 → shipment_batch_id' },
                { label: 'virtual_codes UPDATE', description: 'owner_id, owner_type 변경' },
                { label: 'histories INSERT', description: 'SHIPPED 이력 (shipment_batch_id 포함)' },
              ]}
              result="histories에 SHIPPED 레코드 (shipment_batch_id = shipment_batches.id)"
            />

            {/* RECEIVED */}
            <FlowDiagram
              title="RECEIVED (입고)"
              color="purple"
              steps={[
                { label: 'virtual_codes UPDATE 감지', description: '소유권 변경 트리거 발동' },
                { label: 'TRIGGER: record_virtual_code_history', description: 'from/to 소유자 정보 캡처' },
                { label: 'histories INSERT', description: 'RECEIVED 이력 (shipment_batch_id 복사)' },
              ]}
              result="histories에 RECEIVED 레코드 (동일한 shipment_batch_id)"
            />

            {/* TREATED */}
            <FlowDiagram
              title="TREATED (시술)"
              color="pink"
              steps={[
                { label: 'create_treatment_atomic() 호출', description: 'hospital_id, patient_info, items[] 전달' },
                { label: 'patients UPSERT', description: '환자 레코드 생성/조회' },
                { label: 'treatment_records INSERT', description: '시술 레코드 생성 → treatment_id' },
                { label: 'select_fifo_codes()', description: 'FIFO 기반 코드 선택' },
                { label: 'virtual_codes UPDATE', description: 'owner = PATIENT, status = USED' },
                { label: 'histories INSERT', description: 'TREATED 이력 (treatment_id 포함)' },
              ]}
              result="histories에 TREATED 레코드 (treatment_id = treatment_records.id)"
            />

            {/* RECALLED */}
            <FlowDiagram
              title="RECALLED (회수)"
              color="orange"
              steps={[
                { label: 'recall_*_atomic() 호출', description: 'batch_id 또는 treatment_id + reason' },
                { label: 'is_recall_allowed() 검증', description: '24시간 이내 여부 확인' },
                { label: 'virtual_codes UPDATE', description: '원래 소유자로 복원' },
                { label: 'histories INSERT', description: 'RECALLED 이력 (is_recall=true, 원본 batch_id 유지)' },
              ]}
              result="histories에 RECALLED 레코드 (shipment_batch_id 또는 treatment_id)"
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* 그룹핑 로직 탭 */}
      <TabsContent value="grouping" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>SSOT 기반 그룹핑 (get_history_summary_cursor)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`-- 그룹 키 생성 로직 (우선순위)
grp_key = COALESCE(
  h.shipment_batch_id::TEXT,    -- 1순위: 출고 배치 ID
  h.lot_id::TEXT,                -- 2순위: 로트 ID (생산)
  h.treatment_id::TEXT,          -- 3순위: 시술 ID
  -- 4순위 (fallback): 분 단위 그룹핑 (DISPOSED 등)
  DATE_TRUNC('minute', h.created_at)::TEXT || '_' ||
    h.action_type || '_' ||
    COALESCE(h.from_owner_id, '') || '_' ||
    COALESCE(h.to_owner_id, '')
)`}</pre>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">정확한 그룹핑</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><Badge className="bg-blue-100 text-blue-800">PRODUCED</Badge> → lot_id로 그룹핑</li>
                  <li><Badge className="bg-green-100 text-green-800">SHIPPED</Badge> → shipment_batch_id로 그룹핑</li>
                  <li><Badge className="bg-purple-100 text-purple-800">RECEIVED</Badge> → shipment_batch_id로 그룹핑</li>
                  <li><Badge className="bg-pink-100 text-pink-800">TREATED</Badge> → treatment_id로 그룹핑</li>
                  <li><Badge className="bg-orange-100 text-orange-800">RECALLED</Badge> → 원본 batch/treatment ID</li>
                </ul>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">Fallback 그룹핑</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><Badge className="bg-gray-100 text-gray-800">DISPOSED</Badge> → 분 단위 + action_type + from/to</li>
                  <li className="text-gray-500 text-xs mt-2">* 배치 개념이 없는 이벤트용</li>
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold mb-2">product_summaries 집계</h4>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre>{`JSONB_AGG(
  JSONB_BUILD_OBJECT(
    'productId', p.id,
    'productName', p.name,
    'modelName', p.model_name,  -- 모델명 추가
    'quantity', COUNT(*),
    'codes', ARRAY_AGG(vc.code)
  )
) AS product_summaries`}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 라이브 샘플 탭 */}
      <TabsContent value="samples" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>최근 이력 샘플 ({sampleHistories.length}건)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sampleHistories.map((h) => {
                const config = getActionTypeConfig(h.actionType);
                return (
                  <div
                    key={h.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={config.color}>
                          {config.icon}
                          <span className="ml-1">{config.label}</span>
                        </Badge>
                        <span className="font-mono text-sm text-gray-600">{h.virtualCode}</span>
                        {h.isRecall && (
                          <Badge variant="destructive" className="text-xs">회수</Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(h.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">제품:</span>{' '}
                        <span className="font-medium">{h.productName ?? '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">로트:</span>{' '}
                        <span className="font-mono text-xs">{h.lotNumber ?? '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">From:</span>{' '}
                        <span className="font-medium">{h.fromOwnerName ?? '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">To:</span>{' '}
                        <span className="font-medium">{h.toOwnerName ?? '-'}</span>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {h.shipmentBatchId && (
                        <Badge variant="outline" className="font-mono">
                          shipment_batch: {h.shipmentBatchId.slice(0, 8)}...
                        </Badge>
                      )}
                      {h.lotId && (
                        <Badge variant="outline" className="font-mono">
                          lot: {h.lotId.slice(0, 8)}...
                        </Badge>
                      )}
                      {h.treatmentId && (
                        <Badge variant="outline" className="font-mono">
                          treatment: {h.treatmentId.slice(0, 8)}...
                        </Badge>
                      )}
                    </div>

                    {h.recallReason && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-800">
                        <strong>회수 사유:</strong> {h.recallReason}
                      </div>
                    )}
                  </div>
                );
              })}

              {sampleHistories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  이력 데이터가 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

/**
 * 플로우 다이어그램 컴포넌트
 */
function FlowDiagram({
  title,
  color,
  steps,
  result,
}: {
  title: string;
  color: string;
  steps: { label: string; description: string }[];
  result: string;
}): React.ReactElement {
  const colorClasses: Record<string, string> = {
    blue: 'border-blue-300 bg-blue-50',
    green: 'border-green-300 bg-green-50',
    purple: 'border-purple-300 bg-purple-50',
    pink: 'border-pink-300 bg-pink-50',
    orange: 'border-orange-300 bg-orange-50',
  };

  const dotColorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className={cn('rounded-lg border-2 p-4', colorClasses[color])}>
      <h4 className="font-semibold mb-3">{title}</h4>
      <div className="relative">
        {/* 세로선 */}
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-300" />

        {/* 스텝들 */}
        <div className="space-y-3 ml-6">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              {/* 점 */}
              <div className={cn(
                'absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border-2 border-white',
                dotColorClasses[color]
              )} />
              <div>
                <span className="font-mono text-sm font-medium">{step.label}</span>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 결과 */}
      <div className="mt-4 p-2 bg-white rounded border border-gray-200">
        <span className="text-xs text-gray-500">Result:</span>
        <p className="text-sm font-medium">{result}</p>
      </div>
    </div>
  );
}
