/**
 * 관리자 이력 상세 샘플 페이지용 더미 데이터
 */

export interface MockLotSummary {
  lotId: string;
  lotNumber: string;
  productId: string;
  productName: string;
  modelName: string;
  quantity: number;
}

export interface MockVirtualCode {
  id: string;
  code: string;
  currentStatus: 'IN_STOCK' | 'USED' | 'DISPOSED';
  currentOwnerName: string;
  lotNumber: string;
  productName: string;
  modelName: string;
}

export interface MockEventSummary {
  id: string;
  eventTime: string;
  actionType: 'PRODUCED' | 'SHIPPED' | 'RECEIVED' | 'TREATED' | 'RECALLED';
  actionTypeLabel: string;
  fromOwner: { type: 'ORGANIZATION'; id: string; name: string } | null;
  toOwner: { type: 'ORGANIZATION' | 'PATIENT'; id: string; name: string } | null;
  isRecall: boolean;
  recallReason?: string;
  totalQuantity: number;
  lotSummaries: MockLotSummary[];
}

// Lot별 가상 코드 생성 함수
function generateVirtualCodes(
  lot: MockLotSummary,
  count: number
): MockVirtualCode[] {
  const codes: MockVirtualCode[] = [];
  const statuses: ('IN_STOCK' | 'USED' | 'DISPOSED')[] = ['IN_STOCK', 'USED', 'DISPOSED'];
  const owners = ['테스트병원', '환자 ***-****-9829', '테스트유통사', '환자 ***-****-1234'];

  for (let i = 0; i < count; i++) {
    const statusIndex = i % 3;
    const ownerIndex = i % 4;
    codes.push({
      id: `code-${lot.lotId}-${i}`,
      code: `NC-${String(parseInt(lot.lotId.slice(-4), 16) * 1000 + i).padStart(8, '0')}`,
      currentStatus: statuses[statusIndex] ?? 'IN_STOCK',
      currentOwnerName: owners[ownerIndex] ?? '테스트병원',
      lotNumber: lot.lotNumber,
      productName: lot.productName,
      modelName: lot.modelName,
    });
  }

  return codes;
}

// 샘플 Lot 데이터
export const MOCK_LOT_SUMMARIES: MockLotSummary[] = [
  {
    lotId: 'lot-001',
    lotNumber: 'ND23060251106',
    productId: 'prod-001',
    productName: 'JAMBER Classic',
    modelName: 'CL23060T30JT-35',
    quantity: 45,
  },
  {
    lotId: 'lot-002',
    lotNumber: 'ND23060251107',
    productId: 'prod-002',
    productName: 'JAMBER AI',
    modelName: 'AI23070T25JT-40',
    quantity: 30,
  },
  {
    lotId: 'lot-003',
    lotNumber: 'ND23060251108',
    productId: 'prod-003',
    productName: 'JAMBER Pro',
    modelName: 'PR23080T20JT-30',
    quantity: 25,
  },
];

// 샘플 이벤트 데이터
export const MOCK_EVENT_SUMMARY: MockEventSummary = {
  id: 'event-001',
  eventTime: new Date().toISOString(),
  actionType: 'SHIPPED',
  actionTypeLabel: '출고',
  fromOwner: { type: 'ORGANIZATION', id: 'org-001', name: '테스트제조사' },
  toOwner: { type: 'ORGANIZATION', id: 'org-002', name: '테스트병원' },
  isRecall: false,
  totalQuantity: 100,
  lotSummaries: MOCK_LOT_SUMMARIES,
};

// Lot별 가상 코드 맵 (미리 생성)
export const MOCK_VIRTUAL_CODES_BY_LOT: Record<string, MockVirtualCode[]> = {
  'lot-001': generateVirtualCodes(MOCK_LOT_SUMMARIES[0]!, 45),
  'lot-002': generateVirtualCodes(MOCK_LOT_SUMMARIES[1]!, 30),
  'lot-003': generateVirtualCodes(MOCK_LOT_SUMMARIES[2]!, 25),
};

// 페이지네이션 헬퍼
export function getPaginatedCodes(
  lotId: string,
  page: number,
  pageSize: number = 20
): { codes: MockVirtualCode[]; totalPages: number; total: number } {
  const allCodes = MOCK_VIRTUAL_CODES_BY_LOT[lotId] || [];
  const total = allCodes.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const codes = allCodes.slice(start, start + pageSize);

  return { codes, totalPages, total };
}
