/**
 * 조직별 거래이력 상세보기 샘플 데이터
 * - 다양한 코드 수량으로 UI 테스트
 * - 네트워크 지연 시뮬레이션 포함
 */

import type { HistoryActionType } from '@/types/api.types';

// 코드 생성 헬퍼
function generateCodes(count: number, prefix: string = 'NC'): string[] {
  return Array.from({ length: count }, (_, i) =>
    `${prefix}-${String(i + 1).padStart(8, '0')}`
  );
}

// 거래이력 아이템 타입 (codes 포함)
export interface MockTransactionItem {
  productId: string;
  productName: string;
  modelName?: string;
  quantity: number;
  codes: string[];
}

// 거래이력 요약 타입
export interface MockTransactionSummary {
  id: string;
  actionType: HistoryActionType;
  actionTypeLabel: string;
  createdAt: string;
  isRecall: boolean;
  recallReason?: string;
  fromOwner?: {
    type: 'ORGANIZATION' | 'PATIENT';
    id: string;
    name: string;
  };
  toOwner?: {
    type: 'ORGANIZATION' | 'PATIENT';
    id: string;
    name: string;
  };
  items: MockTransactionItem[];
  totalQuantity: number;
}

// 샘플 거래이력 데이터
export const mockTransactions: MockTransactionSummary[] = [
  // 시나리오 1: 소량 코드 (10개)
  {
    id: 'tx-001',
    actionType: 'PRODUCED',
    actionTypeLabel: '생산',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isRecall: false,
    fromOwner: {
      type: 'ORGANIZATION',
      id: 'org-001',
      name: '(주)네오메디컬',
    },
    toOwner: undefined,
    items: [
      {
        productId: 'prod-001',
        productName: 'PDO 리프팅 실',
        modelName: 'NEO-COG-19G',
        quantity: 10,
        codes: generateCodes(10),
      },
    ],
    totalQuantity: 10,
  },

  // 시나리오 2: 중간 코드 (50개) - 여러 제품
  {
    id: 'tx-002',
    actionType: 'SHIPPED',
    actionTypeLabel: '출고',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isRecall: false,
    fromOwner: {
      type: 'ORGANIZATION',
      id: 'org-001',
      name: '(주)네오메디컬',
    },
    toOwner: {
      type: 'ORGANIZATION',
      id: 'org-002',
      name: '서울의료기기유통',
    },
    items: [
      {
        productId: 'prod-001',
        productName: 'PDO 리프팅 실',
        modelName: 'NEO-COG-19G',
        quantity: 30,
        codes: generateCodes(30, 'NC'),
      },
      {
        productId: 'prod-002',
        productName: 'PCL 리프팅 실',
        modelName: 'NEO-PCL-21G',
        quantity: 20,
        codes: generateCodes(20, 'PC'),
      },
    ],
    totalQuantity: 50,
  },

  // 시나리오 3: 대량 코드 (200개)
  {
    id: 'tx-003',
    actionType: 'RECEIVED',
    actionTypeLabel: '입고',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isRecall: false,
    fromOwner: {
      type: 'ORGANIZATION',
      id: 'org-001',
      name: '(주)네오메디컬',
    },
    toOwner: {
      type: 'ORGANIZATION',
      id: 'org-003',
      name: '강남뷰티클리닉',
    },
    items: [
      {
        productId: 'prod-001',
        productName: 'PDO 리프팅 실',
        modelName: 'NEO-COG-19G',
        quantity: 200,
        codes: generateCodes(200),
      },
    ],
    totalQuantity: 200,
  },

  // 시나리오 4: 회수 거래
  {
    id: 'tx-004',
    actionType: 'RECALLED',
    actionTypeLabel: '회수',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    isRecall: true,
    recallReason: '배송 오류로 인한 제품 회수',
    fromOwner: {
      type: 'ORGANIZATION',
      id: 'org-002',
      name: '서울의료기기유통',
    },
    toOwner: {
      type: 'ORGANIZATION',
      id: 'org-001',
      name: '(주)네오메디컬',
    },
    items: [
      {
        productId: 'prod-001',
        productName: 'PDO 리프팅 실',
        modelName: 'NEO-COG-19G',
        quantity: 5,
        codes: generateCodes(5, 'REC'),
      },
    ],
    totalQuantity: 5,
  },

  // 시나리오 5: 시술 (환자에게)
  {
    id: 'tx-005',
    actionType: 'TREATED',
    actionTypeLabel: '시술',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    isRecall: false,
    fromOwner: {
      type: 'ORGANIZATION',
      id: 'org-003',
      name: '강남뷰티클리닉',
    },
    toOwner: {
      type: 'PATIENT',
      id: '010-1234-5678',
      name: '010-****-5678',
    },
    items: [
      {
        productId: 'prod-001',
        productName: 'PDO 리프팅 실',
        modelName: 'NEO-COG-19G',
        quantity: 3,
        codes: ['NC-00000101', 'NC-00000102', 'NC-00000103'],
      },
    ],
    totalQuantity: 3,
  },

  // 시나리오 6: 초대량 코드 (500개) - 성능 테스트
  {
    id: 'tx-006',
    actionType: 'SHIPPED',
    actionTypeLabel: '출고',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    isRecall: false,
    fromOwner: {
      type: 'ORGANIZATION',
      id: 'org-001',
      name: '(주)네오메디컬',
    },
    toOwner: {
      type: 'ORGANIZATION',
      id: 'org-004',
      name: '부산의료유통센터',
    },
    items: [
      {
        productId: 'prod-001',
        productName: 'PDO 리프팅 실',
        modelName: 'NEO-COG-19G',
        quantity: 300,
        codes: generateCodes(300, 'BIG'),
      },
      {
        productId: 'prod-002',
        productName: 'PCL 리프팅 실',
        modelName: 'NEO-PCL-21G',
        quantity: 200,
        codes: generateCodes(200, 'LRG'),
      },
    ],
    totalQuantity: 500,
  },
];

/**
 * 네트워크 지연 시뮬레이션
 * @param ms 지연 시간 (밀리초)
 */
export function simulateNetworkDelay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 코드 배열을 청크로 분할
 * 대량 코드 처리 시 메모리 효율을 위해 사용
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
