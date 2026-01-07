'use client';

/**
 * 거래이력 테이블 컴포넌트
 * 모든 역할에서 공유하는 거래 이력 테이블
 *
 * 기능:
 * - 제품 행 클릭 시 확장하여 고유식별코드(NC-XXXXXXXX) 목록 표시
 * - 코드 클릭 시 클립보드 복사
 * - 반응형 그리드 및 페이지네이션
 * - 출고 반품 기능 (수신자 주도, 시간 제한 없음)
 */

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Package,
  ArrowRight,
  AlertTriangle,
  Factory,
  Truck,
  Building2,
  Stethoscope,
  RotateCcw,
  User,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { CodeListDisplay } from '@/components/shared/CodeListDisplay';
import { cn } from '@/lib/utils';
import { RETURN_REASONS, RETURN_REASON_OPTIONS, type ReturnReasonType } from '@/constants/messages';
import type { TransactionHistorySummary } from '@/services/history.service';
import type { HistoryActionType } from '@/types/api.types';
import type { ProductAliasMap } from '@/components/shared/HistoryPageWrapper';
import type { ApiResponse } from '@/types/api.types';

/**
 * 부분 반품 시 제품별 수량 지정
 */
export interface ReturnProductQuantity {
  productId: string;
  quantity: number;
}

/**
 * 반품 결과 타입
 */
export interface ReturnResult {
  newBatchId: string | null;
  returnedCount: number;
}

/**
 * 반품 가능 제품 정보
 * 다이얼로그에서 현재 보유 수량 표시에 사용
 */
export interface ReturnableProductInfo {
  productId: string;
  productName: string;
  modelName: string | null;
  originalQuantity: number;
  ownedQuantity: number;
  codes: string[];
}

interface TransactionHistoryTableProps {
  /** 거래이력 목록 */
  histories: TransactionHistorySummary[];
  /** 현재 조직 ID (방향 표시용) */
  currentOrgId: string;
  /** 제품 별칭 맵 (병원용 - 별칭 및 모델명 표시) */
  productAliasMap?: ProductAliasMap;
  /** 반품 액션 (입고/반품 이력에서 사용 - 소유권 기반 검증, 부분 반품 지원) */
  onReturn?: (
    shipmentBatchId: string,
    reason: string,
    productQuantities?: ReturnProductQuantity[]
  ) => Promise<ApiResponse<ReturnResult>>;
  /** 반품 버튼 표시 여부 */
  showReturnButton?: boolean;
  /** 반품 가능 수량 조회 액션 (다이얼로그 오픈 시 lazy load) */
  onGetReturnableInfo?: (shipmentBatchId: string) => Promise<ApiResponse<ReturnableProductInfo[]>>;
  /** 반품 성공 시 콜백 (부모 컴포넌트에서 새로고침 처리) */
  onReturnSuccess?: () => void;
}

/**
 * 액션 타입별 아이콘
 */
function getActionIcon(actionType: HistoryActionType): React.ReactNode {
  switch (actionType) {
    case 'PRODUCED':
      return <Factory className="h-4 w-4" />;
    case 'SHIPPED':
      return <Truck className="h-4 w-4" />;
    case 'RECEIVED':
      return <Building2 className="h-4 w-4" />;
    case 'TREATED':
      return <Stethoscope className="h-4 w-4" />;
    case 'RECALLED':
      return <RotateCcw className="h-4 w-4" />;
    case 'RETURN_SENT':
    case 'RETURN_RECEIVED':
      return <RotateCcw className="h-4 w-4" />;
    case 'DISPOSED':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
}

/**
 * 액션 타입별 배지 스타일
 */
function getActionBadgeVariant(
  actionType: HistoryActionType,
  isRecall: boolean
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (isRecall) {return 'destructive';}

  switch (actionType) {
    case 'PRODUCED':
      return 'default';
    case 'SHIPPED':
      return 'secondary';
    case 'RECEIVED':
      return 'outline';
    case 'TREATED':
      return 'default';
    case 'RECALLED':
      return 'destructive';
    case 'RETURN_SENT':
    case 'RETURN_RECEIVED':
      return 'destructive';
    case 'DISPOSED':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * 제품 아이템 행 (확장 가능)
 * - 클릭하면 확장되어 코드 목록 표시
 */
function ProductItemRow({
  item,
  aliasInfo,
}: {
  item: {
    productId: string;
    productName: string;
    modelName?: string;
    quantity: number;
    codes: string[];
  };
  aliasInfo?: { alias: string | null; modelName: string };
}): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasCodes = item.codes && item.codes.length > 0;

  // 별칭이 있으면 별칭 사용, 없으면 제품명 사용
  const displayName = aliasInfo?.alias ?? item.productName;
  // aliasInfo의 modelName 우선, 없으면 item의 modelName 사용
  const modelName = aliasInfo?.modelName ?? item.modelName;

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      {/* 제품 헤더 (클릭하여 확장) */}
      <button
        onClick={() => hasCodes && setIsExpanded(!isExpanded)}
        disabled={!hasCodes}
        className={cn(
          'w-full flex items-center justify-between p-3',
          'transition-colors',
          hasCodes && 'hover:bg-gray-50 cursor-pointer',
          !hasCodes && 'cursor-default',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
          isExpanded && 'bg-gray-50'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {hasCodes && (
            <span className="text-gray-400">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
          )}
          <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div className="min-w-0 text-left">
            <span className="text-sm font-medium">{displayName}</span>
            {modelName && (
              <div className="text-xs text-muted-foreground truncate">
                {modelName}
              </div>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="flex-shrink-0">
          {item.quantity}개
        </Badge>
      </button>

      {/* 확장 영역: 코드 목록 */}
      {isExpanded && hasCodes && (
        <div className="border-t px-3 py-2 bg-gray-50/50">
          <CodeListDisplay codes={item.codes} pageSize={20} />
        </div>
      )}
    </div>
  );
}

/**
 * 거래이력 카드
 */
function TransactionHistoryCard({
  history,
  currentOrgId,
  productAliasMap,
  onReturn,
  showReturnButton,
  onGetReturnableInfo,
  onReturnSuccess,
}: {
  history: TransactionHistorySummary;
  currentOrgId: string;
  productAliasMap?: ProductAliasMap;
  onReturn?: (
    shipmentBatchId: string,
    reason: string,
    productQuantities?: ReturnProductQuantity[]
  ) => Promise<ApiResponse<ReturnResult>>;
  showReturnButton?: boolean;
  onGetReturnableInfo?: (shipmentBatchId: string) => Promise<ApiResponse<ReturnableProductInfo[]>>;
  onReturnSuccess?: () => void;
}): React.ReactElement {
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnReasonType, setReturnReasonType] = useState<ReturnReasonType | ''>('');
  const [returnReasonText, setReturnReasonText] = useState('');
  const [isPartialReturn, setIsPartialReturn] = useState(false);
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [isPending, startTransition] = useTransition();
  // 반품 가능 정보 (lazy load)
  const [returnableInfo, setReturnableInfo] = useState<ReturnableProductInfo[] | null>(null);
  const [isLoadingReturnableInfo, setIsLoadingReturnableInfo] = useState(false);

  // 내가 보낸 것인지, 받은 것인지
  const isOutgoing = history.fromOwner?.id === currentOrgId;
  // 내가 받은 것인지 (수신자)
  const isIncoming = history.toOwner?.id === currentOrgId;

  // 코드가 있는 아이템이 있는지 확인
  const hasAnyCodes = history.items.some((item) => item.codes && item.codes.length > 0);

  // 반품 가능 여부 확인
  // - RECEIVED 이벤트 (내가 입고받은 건): 발송자에게 반품 가능
  // - RETURN_RECEIVED 이벤트 (내가 반품받은 건): 상위 조직에게 다시 반품 가능
  // - 현재 보유 수량이 0이면 반품 불가
  const canReturn = (): boolean => {
    if (!showReturnButton || !onReturn) {return false;}
    if (!history.shipmentBatchId) {return false;} // 배치 ID 필요
    // RECALLED는 24시간 내 강제 회수 (병원 → 환자)이므로 재반품 불가
    // RETURN_RECEIVED는 정상 반품 입고이므로 상위 조직에 재반품 가능
    if (history.actionType === 'RECALLED') {return false;}
    // 보유 수량이 0이면 반품 불가 (RPC 통합으로 미리 확인 가능)
    if ((history.totalOwnedQuantity ?? 0) === 0) {return false;}

    // RECEIVED 이벤트 (내가 입고받은 건): 발송자에게 반품 가능
    if (history.actionType === 'RECEIVED' && isIncoming) {
      return true;
    }

    // RETURN_RECEIVED 이벤트 (내가 반품받은 건): 상위 조직에게 다시 반품 가능
    // 예: 병원이 유통사에게 반품 → 유통사가 제조사에게 다시 반품
    if (history.actionType === 'RETURN_RECEIVED' && isIncoming) {
      return true;
    }

    return false;
  };

  // 부분 반품 시 총 선택 수량 계산
  const getTotalSelectedQuantity = (): number => {
    return Object.values(productQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  // 부분 반품 수량 업데이트 (보유 수량 기준으로 max 제한)
  const updateQuantity = (productId: string, value: string): void => {
    const numValue = parseInt(value) || 0;
    // returnableInfo가 있으면 보유 수량, 없으면 원래 수량 사용
    const info = returnableInfo?.find((r) => r.productId === productId);
    const maxQty = info?.ownedQuantity ?? history.items.find((item) => item.productId === productId)?.quantity ?? 0;
    const clampedValue = Math.max(0, Math.min(numValue, maxQty));
    setProductQuantities((prev) => ({
      ...prev,
      [productId]: clampedValue,
    }));
  };

  // 현재 보유 중인 총 수량 계산
  const getTotalOwnedQuantity = (): number => {
    if (!returnableInfo) { return history.totalQuantity; }
    return returnableInfo.reduce((sum, p) => sum + p.ownedQuantity, 0);
  };

  // 반품 다이얼로그 오픈 시 보유 정보 조회
  const handleOpenReturnDialog = async (): Promise<void> => {
    setShowReturnDialog(true);

    // onGetReturnableInfo가 있으면 현재 보유 정보 조회
    if (onGetReturnableInfo && history.shipmentBatchId) {
      setIsLoadingReturnableInfo(true);
      try {
        const result = await onGetReturnableInfo(history.shipmentBatchId);
        if (result.success && result.data) {
          setReturnableInfo(result.data);

          // 보유 코드가 0이면 안내 메시지 표시 후 다이얼로그 닫기
          const totalOwned = result.data.reduce((sum, p) => sum + p.ownedQuantity, 0);
          if (totalOwned === 0) {
            toast.info('반품 가능한 제품이 없습니다. 모든 제품이 이미 반품/출고/시술되었습니다.');
            setShowReturnDialog(false);
          }
        } else {
          // RPC 호출 실패 시 에러 표시
          toast.error(result.error?.message ?? '보유 수량을 조회할 수 없습니다.');
        }
      } finally {
        setIsLoadingReturnableInfo(false);
      }
    }
  };

  const handleReturn = (): void => {
    if (!returnReasonType) {
      toast.error('반품 사유를 선택해주세요.');
      return;
    }

    // "기타" 선택 시 텍스트 입력 필수
    if (returnReasonType === 'OTHER' && !returnReasonText.trim()) {
      toast.error('기타 사유를 입력해주세요.');
      return;
    }

    if (!history.shipmentBatchId) {
      toast.error('반품할 수 없는 건입니다.');
      return;
    }

    // 부분 반품 시 수량 검증
    if (isPartialReturn && getTotalSelectedQuantity() === 0) {
      toast.error('반품할 수량을 선택해주세요.');
      return;
    }

    // 최종 사유 생성: 드롭다운 선택값 또는 기타 입력값
    const finalReason = returnReasonType === 'OTHER'
      ? returnReasonText.trim()
      : RETURN_REASONS[returnReasonType];

    // 부분 반품 시 productQuantities 배열 생성
    const returnQuantities: ReturnProductQuantity[] | undefined = isPartialReturn
      ? Object.entries(productQuantities)
          .filter(([, qty]) => qty > 0)
          .map(([productId, quantity]) => ({ productId, quantity }))
      : undefined;

    startTransition(async () => {
      const result = await onReturn!(history.shipmentBatchId!, finalReason, returnQuantities);
      if (result.success) {
        const count = result.data?.returnedCount ?? history.totalQuantity;
        toast.success(`반품이 완료되었습니다. (${count}개)`);
        setShowReturnDialog(false);
        setReturnReasonType('');
        setReturnReasonText('');
        setIsPartialReturn(false);
        setProductQuantities({});
        // 부모 컴포넌트에 성공 알림 (새로고침 트리거)
        onReturnSuccess?.();
      } else {
        toast.error(result.error?.message ?? '반품에 실패했습니다.');
      }
    });
  };

  // 방향 라벨
  const getDirectionLabel = (): string => {
    switch (history.actionType) {
      case 'PRODUCED':
        return '생산';
      case 'SHIPPED':
        return isOutgoing ? '출고' : '입고';
      case 'RECEIVED':
        return '입고';
      case 'TREATED':
        return '시술';
      case 'RECALLED':
        return isOutgoing ? '회수 복귀' : '회수됨';
      case 'RETURN_SENT':
        return '반품 출고';
      case 'RETURN_RECEIVED':
        return '반품 입고';
      case 'DISPOSED':
        return '폐기';
      default:
        return history.actionTypeLabel;
    }
  };

  return (
    <Card className={cn(history.isRecall && 'border-red-200 bg-red-50')}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 액션 아이콘 */}
            <div
              className={cn(
                'p-2 rounded-full',
                history.isRecall
                  ? 'bg-red-100 text-red-600'
                  : history.actionType === 'PRODUCED'
                  ? 'bg-blue-100 text-blue-600'
                  : history.actionType === 'SHIPPED'
                  ? 'bg-green-100 text-green-600'
                  : history.actionType === 'RECEIVED'
                  ? 'bg-purple-100 text-purple-600'
                  : history.actionType === 'TREATED'
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {getActionIcon(history.actionType)}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Badge variant={getActionBadgeVariant(history.actionType, history.isRecall)}>
                  {getDirectionLabel()}
                </Badge>
                {history.isRecall && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {(history.actionType === 'RETURN_SENT' || history.actionType === 'RETURN_RECEIVED') ? '반품' : '회수'}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(history.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
              </p>
            </div>
          </div>

          {/* 수량 및 반품 버튼 */}
          <div className="flex items-center gap-3">
            {/* 입고/반품받은 이벤트: 보유 0이면 "재고 없음" 배지 표시 */}
            {showReturnButton &&
              (history.actionType === 'RECEIVED' || history.actionType === 'RETURN_RECEIVED') &&
              isIncoming &&
              !history.isRecall &&
              history.shipmentBatchId &&
              (history.totalOwnedQuantity ?? 0) === 0 && (
                <Badge variant="secondary" className="text-gray-500">
                  재고 없음
                </Badge>
              )}
            {canReturn() && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleOpenReturnDialog}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                반품
              </Button>
            )}
            <div className="text-right">
              <p className="font-semibold text-lg">{history.totalQuantity}개</p>
              <p className="text-xs text-muted-foreground">
                {history.items.length}종
                {/* 입고/반품받은 이벤트: 보유 수량 표시 */}
                {(history.actionType === 'RECEIVED' || history.actionType === 'RETURN_RECEIVED') &&
                  isIncoming &&
                  typeof history.totalOwnedQuantity === 'number' && (
                    <span className="ml-1">
                      (보유: {history.totalOwnedQuantity})
                    </span>
                  )}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* 거래 당사자 표시 */}
        {(history.fromOwner || history.toOwner) && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg text-sm">
            {history.fromOwner && (
              <div className="flex items-center gap-1">
                {history.fromOwner.type === 'PATIENT' ? (
                  <User className="h-3 w-3 text-gray-400" />
                ) : (
                  <Building2 className="h-3 w-3 text-gray-400" />
                )}
                <span
                  className={cn(
                    history.fromOwner.id === currentOrgId
                      ? 'font-medium text-blue-600'
                      : 'text-gray-600'
                  )}
                >
                  {history.fromOwner.id === currentOrgId ? '내 조직' : history.fromOwner.name}
                </span>
              </div>
            )}
            {history.fromOwner && history.toOwner && (
              <ArrowRight className="h-4 w-4 text-gray-400" />
            )}
            {history.toOwner && (
              <div className="flex items-center gap-1">
                {history.toOwner.type === 'PATIENT' ? (
                  <User className="h-3 w-3 text-gray-400" />
                ) : (
                  <Building2 className="h-3 w-3 text-gray-400" />
                )}
                <span
                  className={cn(
                    history.toOwner.id === currentOrgId
                      ? 'font-medium text-blue-600'
                      : 'text-gray-600'
                  )}
                >
                  {history.toOwner.id === currentOrgId ? '내 조직' : history.toOwner.name}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 제품 목록 - 클릭하여 코드 확장 */}
        <div className="space-y-2">
          {hasAnyCodes && (
            <p className="text-xs text-muted-foreground mb-1">
              제품을 클릭하여 고유식별코드를 확인하세요
            </p>
          )}
          {history.items.map((item) => (
            <ProductItemRow
              key={item.productId}
              item={item}
              aliasInfo={productAliasMap?.[item.productId]}
            />
          ))}
        </div>

        {/* 회수/반품 사유 */}
        {history.isRecall && history.recallReason && (
          <div className="mt-3 p-2 bg-red-100 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>{(history.actionType === 'RETURN_SENT' || history.actionType === 'RETURN_RECEIVED') ? '반품' : '회수'} 사유:</strong> {history.recallReason}
            </p>
          </div>
        )}
      </CardContent>

      {/* 반품 다이얼로그 */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>반품 요청</DialogTitle>
            <DialogDescription>
              이 건을 발송 조직에게 반품하시겠습니까? 반품 사유를 선택해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 로딩 상태 */}
            {isLoadingReturnableInfo && (
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">보유 수량 확인 중...</p>
              </div>
            )}

            {/* 발송 조직 및 수량 정보 */}
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>발송 조직:</strong> {history.fromOwner?.name ?? '알 수 없음'}
              </p>
              <p className="text-sm text-yellow-800">
                <strong>원래 수량:</strong> {history.totalQuantity}개 ({history.items.length}종)
              </p>
              {returnableInfo && (
                <p className="text-sm text-yellow-800 font-medium">
                  <strong>현재 보유:</strong> {getTotalOwnedQuantity()}개
                </p>
              )}
            </div>

            {/* 반품 유형 선택 (전량/부분) */}
            <div className="space-y-2">
              <Label>반품 수량</Label>
              <RadioGroup
                value={isPartialReturn ? 'partial' : 'full'}
                onValueChange={(v: string) => {
                  setIsPartialReturn(v === 'partial');
                  if (v === 'full') {
                    setProductQuantities({});
                  }
                }}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="return-full" />
                  <Label htmlFor="return-full" className="font-normal cursor-pointer">
                    전량 반품 ({returnableInfo ? getTotalOwnedQuantity() : history.totalQuantity}개)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="partial" id="return-partial" />
                  <Label htmlFor="return-partial" className="font-normal cursor-pointer">
                    수량 선택 (부분 반품)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 부분 반품: 제품별 수량 입력 */}
            {isPartialReturn && (
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                <Label className="text-sm text-gray-600">제품별 반품 수량</Label>
                <p className="text-xs text-muted-foreground">
                  현재 보유 중인 수량만 반품 가능합니다.
                </p>
                {history.items.map((item) => {
                  const aliasInfo = productAliasMap?.[item.productId];
                  const displayName = aliasInfo?.alias || item.productName;
                  const currentQty = productQuantities[item.productId] ?? 0;
                  // returnableInfo에서 보유 수량 가져오기
                  const info = returnableInfo?.find((r) => r.productId === item.productId);
                  const ownedQty = info?.ownedQuantity ?? item.quantity;
                  const originalQty = info?.originalQuantity ?? item.quantity;

                  return (
                    <div key={item.productId} className="flex items-center gap-3">
                      <span className="flex-1 text-sm truncate" title={displayName}>
                        {displayName}
                      </span>
                      <Input
                        type="number"
                        min={0}
                        max={ownedQty}
                        className="w-20 text-center"
                        value={currentQty}
                        onChange={(e) => updateQuantity(item.productId, e.target.value)}
                        disabled={ownedQty === 0}
                      />
                      <span className="text-sm text-muted-foreground w-24">
                        / {ownedQty} (보유)
                        {returnableInfo && <span className="text-xs ml-1">| 원래: {originalQty}</span>}
                      </span>
                    </div>
                  );
                })}
                {getTotalSelectedQuantity() > 0 && (
                  <p className="text-sm text-blue-600 mt-2">
                    총 {getTotalSelectedQuantity()}개 선택됨
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="return-reason-type">반품 사유 (필수)</Label>
              <Select
                value={returnReasonType}
                onValueChange={(value) => setReturnReasonType(value as ReturnReasonType)}
              >
                <SelectTrigger id="return-reason-type">
                  <SelectValue placeholder="반품 사유를 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {RETURN_REASON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* "기타" 선택 시 텍스트 입력 */}
            {returnReasonType === 'OTHER' && (
              <div className="space-y-2">
                <Label htmlFor="return-reason-text">기타 사유 (필수)</Label>
                <Textarea
                  id="return-reason-text"
                  value={returnReasonText}
                  onChange={(e) => setReturnReasonText(e.target.value)}
                  placeholder="기타 사유를 입력해주세요..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReturnDialog(false);
                setReturnReasonType('');
                setReturnReasonText('');
                setIsPartialReturn(false);
                setProductQuantities({});
                setReturnableInfo(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReturn}
              disabled={
                isPending ||
                !returnReasonType ||
                (returnReasonType === 'OTHER' && !returnReasonText.trim()) ||
                (isPartialReturn && getTotalSelectedQuantity() === 0)
              }
            >
              {isPending ? '처리 중...' : '반품하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/**
 * 거래이력 테이블
 */
export function TransactionHistoryTable({
  histories,
  currentOrgId,
  productAliasMap,
  onReturn,
  showReturnButton,
  onGetReturnableInfo,
  onReturnSuccess,
}: TransactionHistoryTableProps): React.ReactElement {
  if (histories.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="거래 이력이 없습니다"
        description="아직 거래 이력이 없습니다."
      />
    );
  }

  return (
    <div className="space-y-4">
      {histories.map((history) => (
        <TransactionHistoryCard
          key={`${history.id}_${history.actionType}`}
          history={history}
          currentOrgId={currentOrgId}
          productAliasMap={productAliasMap}
          onReturn={onReturn}
          showReturnButton={showReturnButton}
          onGetReturnableInfo={onGetReturnableInfo}
          onReturnSuccess={onReturnSuccess}
        />
      ))}
    </div>
  );
}
