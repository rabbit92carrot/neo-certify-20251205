'use client';

/**
 * Option E: 서브 모달 패턴
 * Lot 클릭 시 별도의 모달이 열리는 방식
 */

import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { VirtualCodeTable } from './VirtualCodeTable';
import {
  MOCK_LOT_SUMMARIES,
  getPaginatedCodes,
  type MockLotSummary,
} from '../_data/mock-data';

interface LotDetailModalProps {
  lot: MockLotSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function LotDetailModal({
  lot,
  open,
  onOpenChange,
}: LotDetailModalProps): React.ReactElement {
  const [page, setPage] = useState(1);

  // lot이 변경되면 페이지 리셋
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPage(1);
    }
    onOpenChange(newOpen);
  };

  if (!lot) {
    return <></>;
  }

  const { codes, totalPages, total } = getPaginatedCodes(lot.lotId, page, 20);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <code className="font-mono bg-gray-100 px-2 py-0.5 rounded">
              {lot.lotNumber}
            </code>
            상세
          </DialogTitle>
          <DialogDescription>
            {lot.productName} ({lot.modelName})
          </DialogDescription>
        </DialogHeader>

        {/* 제품 정보 */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">제품명</span>
              <p className="font-medium">{lot.productName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">모델번호</span>
              <p className="font-mono text-xs">{lot.modelName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">수량</span>
              <p className="font-medium">{lot.quantity}개</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* 가상 코드 테이블 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">고유식별코드</h4>
            <Badge variant="secondary" className="text-xs">
              {page}/{totalPages} 페이지
            </Badge>
          </div>
          <VirtualCodeTable
            codes={codes}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OptionE_SubModal(): React.ReactElement {
  const [selectedLot, setSelectedLot] = useState<MockLotSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleViewDetail = (lot: MockLotSummary) => {
    setSelectedLot(lot);
    setModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Option E: 서브 모달</CardTitle>
          <p className="text-sm text-muted-foreground">
            Lot 행의 &quot;상세&quot; 버튼을 클릭하면 별도의 모달이 열립니다.
            충분한 공간을 확보하지만 모달 위 모달은 UX상 권장되지 않습니다.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {MOCK_LOT_SUMMARIES.map((lot) => (
              <div
                key={lot.lotId}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <code className="text-sm font-mono bg-gray-200 px-2 py-0.5 rounded">
                    {lot.lotNumber}
                  </code>
                  <span className="text-sm font-medium">{lot.productName}</span>
                  <span className="text-xs text-muted-foreground">
                    {lot.modelName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{lot.quantity}개</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetail(lot)}
                    className="h-8"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    상세
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <LotDetailModal
        lot={selectedLot}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
