/**
 * 회수 이력 View 컴포넌트
 * Admin 회수 이력 페이지 뷰 (props 기반)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RotateCcw, Package, Building2 } from 'lucide-react';

export interface RecallItem {
  id: string;
  recallType: 'SHIPMENT' | 'TREATMENT';
  recallerName: string;
  targetName: string;
  productName: string;
  quantity: number;
  reason: string;
  createdAt: string;
}

export interface RecallsViewProps {
  /** 회수 이력 목록 */
  recalls: RecallItem[];
}

const RECALL_TYPE_LABELS = {
  SHIPMENT: '출고 회수',
  TREATMENT: '시술 회수',
};

const RECALL_TYPE_COLORS = {
  SHIPMENT: 'bg-blue-100 text-blue-800',
  TREATMENT: 'bg-purple-100 text-purple-800',
};

export function RecallsView({
  recalls,
}: RecallsViewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader
        title="회수 이력"
        description="출고 및 시술의 회수 이력을 확인합니다. 24시간 이내 등록 오류 시 회수가 가능합니다."
      />

      {/* 회수 통계 */}
      <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <RotateCcw className="h-5 w-5 text-orange-600" />
        <span className="font-medium text-orange-800">
          총 {recalls.length}건의 회수 이력
        </span>
      </div>

      {/* 회수 테이블 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>유형</TableHead>
              <TableHead>회수자</TableHead>
              <TableHead>대상</TableHead>
              <TableHead>제품</TableHead>
              <TableHead className="text-right">수량</TableHead>
              <TableHead>사유</TableHead>
              <TableHead>회수일시</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recalls.map((recall) => (
              <TableRow key={recall.id}>
                <TableCell>
                  <Badge className={RECALL_TYPE_COLORS[recall.recallType]}>
                    {RECALL_TYPE_LABELS[recall.recallType]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {recall.recallerName}
                  </div>
                </TableCell>
                <TableCell>{recall.targetName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    {recall.productName}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {recall.quantity}개
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {recall.reason}
                </TableCell>
                <TableCell>{recall.createdAt}</TableCell>
              </TableRow>
            ))}
            {recalls.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  회수 이력이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
