/**
 * Distributor Dashboard mock 데이터
 */
export const distributorDashboardMockData = {
  organization: {
    name: '테스트 유통사',
    email: 'distributor@test.com',
    business_number: '234-56-78901',
    representative_name: '김철수',
  },
  stats: {
    totalInventory: 8000,
    todayReceived: 300,
    todayShipments: 150,
  },
};

/**
 * Distributor Inventory mock 데이터
 */
export const distributorInventoryMockData = {
  summaries: [
    {
      productId: 'prod-001',
      productName: 'PDO Thread COG 19G-100mm',
      modelName: 'PT-COG-19G-100',
      udiDi: 'UDI-001-COG-19G',
      totalQuantity: 3000,
    },
    {
      productId: 'prod-002',
      productName: 'PDO Thread MONO 23G-60mm',
      modelName: 'PT-MONO-23G-60',
      udiDi: 'UDI-002-MONO-23G',
      totalQuantity: 2500,
    },
    {
      productId: 'prod-003',
      productName: 'PDO Thread SCREW 21G-90mm',
      modelName: 'PT-SCREW-21G-90',
      udiDi: 'UDI-003-SCREW-21G',
      totalQuantity: 2500,
    },
  ],
};

/**
 * Distributor History mock 데이터
 */
export const distributorHistoryMockData = {
  histories: [
    {
      id: 'history-001',
      actionType: 'RECEIVED' as const,
      actionTypeLabel: '입고',
      createdAt: '2024-01-15T15:00:00Z',
      isRecall: false,
      fromOwner: {
        type: 'ORGANIZATION' as const,
        id: 'org-manufacturer',
        name: '테스트 제조사',
      },
      toOwner: {
        type: 'ORGANIZATION' as const,
        id: 'org-distributor',
        name: '테스트 유통사',
      },
      items: [
        {
          productId: 'prod-001',
          productName: 'PDO Thread COG 19G-100mm',
          modelName: 'PT-COG-19G-100',
          quantity: 50,
          ownedQuantity: 50,
          codes: ['NC-12345678', 'NC-12345679'],
        },
      ],
      totalQuantity: 50,
      totalOwnedQuantity: 50,
      shipmentBatchId: 'batch-001',
    },
    {
      id: 'history-002',
      actionType: 'SHIPPED' as const,
      actionTypeLabel: '출고',
      createdAt: '2024-01-16T10:00:00Z',
      isRecall: false,
      fromOwner: {
        type: 'ORGANIZATION' as const,
        id: 'org-distributor',
        name: '테스트 유통사',
      },
      toOwner: {
        type: 'ORGANIZATION' as const,
        id: 'org-hospital',
        name: '테스트 병원',
      },
      items: [
        {
          productId: 'prod-001',
          productName: 'PDO Thread COG 19G-100mm',
          modelName: 'PT-COG-19G-100',
          quantity: 20,
          ownedQuantity: 0,
          codes: ['NC-12345678'],
        },
      ],
      totalQuantity: 20,
      totalOwnedQuantity: 0,
      shipmentBatchId: 'batch-002',
    },
    {
      id: 'history-003',
      actionType: 'RECEIVED' as const,
      actionTypeLabel: '입고',
      createdAt: '2024-01-17T09:00:00Z',
      isRecall: false,
      fromOwner: {
        type: 'ORGANIZATION' as const,
        id: 'org-manufacturer',
        name: '테스트 제조사',
      },
      toOwner: {
        type: 'ORGANIZATION' as const,
        id: 'org-distributor',
        name: '테스트 유통사',
      },
      items: [
        {
          productId: 'prod-002',
          productName: 'PDO Thread MONO 23G-60mm',
          modelName: 'PT-MONO-23G-60',
          quantity: 100,
          ownedQuantity: 100,
          codes: ['NC-22345678', 'NC-22345679', 'NC-22345680'],
        },
      ],
      totalQuantity: 100,
      totalOwnedQuantity: 100,
      shipmentBatchId: 'batch-003',
    },
  ],
  currentOrgId: 'org-distributor',
};

/**
 * Distributor Shipment mock 데이터
 */
export const distributorShipmentMockData = {
  organizationType: 'DISTRIBUTOR' as const,
  products: [
    {
      id: 'prod-001',
      name: 'PDO Thread COG 19G-100mm',
      modelName: 'PT-COG-19G-100',
      availableQuantity: 3000,
    },
    {
      id: 'prod-002',
      name: 'PDO Thread MONO 23G-60mm',
      modelName: 'PT-MONO-23G-60',
      availableQuantity: 2500,
    },
    {
      id: 'prod-003',
      name: 'PDO Thread SCREW 21G-90mm',
      modelName: 'PT-SCREW-21G-90',
      availableQuantity: 2500,
    },
  ],
  canSelectLot: false,
};

/**
 * Distributor 역할 mock 데이터 매핑
 */
export const distributorMockData: Record<string, Record<string, unknown>> = {
  dashboard: distributorDashboardMockData,
  inventory: distributorInventoryMockData,
  history: distributorHistoryMockData,
  shipment: distributorShipmentMockData,
};
