'use client';

/**
 * 회수 이력 테이블 컴포넌트
 * 관리자 회수 모니터링 페이지용
 * 카드 내 상세보기 버튼으로 코드 상세 인라인 확장
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  RotateCcw,
  Package,
  Truck,
  Stethoscope,
  ArrowRight,
  User,
  Factory,
  Building2,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { RecallCodeTable } from './RecallCodeTable';
import type { RecallHistoryItem, OrganizationType } from '@/types/api.types';
import { ORGANIZATION_TYPE_LABELS } from '@/constants/organization';

interface RecallHistoryTableProps {
  recalls: RecallHistoryItem[];
}

/**
 * 조직 타입별 아이콘
 */
function getOwnerIcon(type: OrganizationType | 'PATIENT'): React.ReactNode {
  switch (type) {
    case 'MANUFACTURER':
      return <Factory className="h-4 w-4" />;
    case 'DISTRIBUTOR':
      return <Truck className="h-4 w-4" />;
    case 'HOSPITAL':
      return <Stethoscope className="h-4 w-4" />;
    case 'PATIENT':
      return <User className="h-4 w-4" />;
    default:
      return <Building2 className="h-4 w-4" />;
  }
}

/**
 * 회수 유형 라벨
 */
function getRecallTypeLabel(type: 'shipment' | 'treatment'): string {
  return type === 'shipment' ? '출고 회수' : '시술 회수';
}

interface RecallCardProps {
  recall: RecallHistoryItem;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * 회수 이력 카드
 */
function RecallCard({ recall, isExpanded, onToggle }: RecallCardProps): React.ReactElement {
  const hasCodeIds = recall.codeIds && recall.codeIds.length > 0;

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 회수 아이콘 */}
            <div className="p-2 rounded-full bg-red-100 text-red-600">
              <RotateCcw className="h-4 w-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{getRecallTypeLabel(recall.type)}</Badge>
                <Badge variant="outline" className="text-xs">
                  {recall.quantity}개
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(recall.recallDate), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
              </p>
            </div>
          </div>

          {/* 코드 상세보기 버튼 (코드가 있을 때만 표시) */}
          {hasCodeIds && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggle}
              className="gap-1.5 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">코드 상세</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* 회수 경로 */}
        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border text-sm flex-wrap">
          <div className="flex items-center gap-2">
            {getOwnerIcon(recall.fromOrganization.type)}
            <span className="font-medium">{recall.fromOrganization.name}</span>
            <Badge variant="outline" className="text-xs">
              {ORGANIZATION_TYPE_LABELS[recall.fromOrganization.type]}
            </Badge>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          {recall.toTarget ? (
            <div className="flex items-center gap-2">
              {getOwnerIcon(recall.toTarget.type)}
              <span className="font-medium">{recall.toTarget.name}</span>
              {recall.toTarget.type !== 'PATIENT' && (
                <Badge variant="outline" className="text-xs">
                  {ORGANIZATION_TYPE_LABELS[recall.toTarget.type as OrganizationType]}
                </Badge>
              )}
              {recall.toTarget.type === 'PATIENT' && (
                <Badge variant="secondary" className="text-xs">
                  환자
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>

        {/* 회수 사유 */}
        <div className="p-2 bg-red-100 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>회수 사유:</strong> {recall.recallReason || '사유 없음'}
          </p>
        </div>

        {/* 제품 목록 */}
        <div className="grid gap-2">
          {recall.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 bg-white rounded-lg border"
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{item.productName}</span>
              </div>
              <Badge variant="secondary">{item.quantity}개</Badge>
            </div>
          ))}
        </div>

        {/* 코드 상세 (확장 시) */}
        {isExpanded && hasCodeIds && (
          <div className="border-t pt-3 mt-3">
            <RecallCodeTable codeIds={recall.codeIds!} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 회수 이력 테이블
 */
export function RecallHistoryTable({ recalls }: RecallHistoryTableProps): React.ReactElement {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (recalls.length === 0) {
    return (
      <EmptyState
        icon={RotateCcw}
        title="회수 이력이 없습니다"
        description="조회 조건에 맞는 회수 이력이 없습니다."
      />
    );
  }

  return (
    <div className="space-y-4">
      {recalls.map((recall) => (
        <RecallCard
          key={recall.id}
          recall={recall}
          isExpanded={expandedId === recall.id}
          onToggle={() => setExpandedId(expandedId === recall.id ? null : recall.id)}
        />
      ))}
    </div>
  );
}
