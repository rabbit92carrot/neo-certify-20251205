/**
 * Manufacturer Dashboard mock 데이터
 */
export const manufacturerDashboardMockData = {
  organization: {
    name: '테스트 제조사',
    email: 'manufacturer@test.com',
    business_number: '123-45-67890',
    representative_name: '홍길동',
  },
  stats: {
    totalInventory: 12500,
    todayProduction: 500,
    todayShipments: 200,
    activeProducts: 15,
  },
};

/**
 * Manufacturer Inventory mock 데이터
 */
export const manufacturerInventoryMockData = {
  summaries: [
    {
      productId: 'prod-001',
      productName: 'PDO Thread COG 19G-100mm',
      modelName: 'PT-COG-19G-100',
      udiDi: 'UDI-001-COG-19G',
      totalQuantity: 5000,
    },
    {
      productId: 'prod-002',
      productName: 'PDO Thread MONO 23G-60mm',
      modelName: 'PT-MONO-23G-60',
      udiDi: 'UDI-002-MONO-23G',
      totalQuantity: 3500,
    },
    {
      productId: 'prod-003',
      productName: 'PDO Thread SCREW 21G-90mm',
      modelName: 'PT-SCREW-21G-90',
      udiDi: 'UDI-003-SCREW-21G',
      totalQuantity: 2500,
    },
    {
      productId: 'prod-004',
      productName: 'PDO Thread BARB 19G-150mm',
      modelName: 'PT-BARB-19G-150',
      udiDi: 'UDI-004-BARB-19G',
      totalQuantity: 1500,
    },
  ],
};

/**
 * Manufacturer History mock 데이터
 */
export const manufacturerHistoryMockData = {
  histories: [
    {
      id: 'history-001',
      actionType: 'PRODUCED' as const,
      actionTypeLabel: '생산',
      createdAt: '2024-01-15T09:00:00Z',
      isRecall: false,
      fromOwner: {
        type: 'ORGANIZATION' as const,
        id: 'org-manufacturer',
        name: '테스트 제조사',
      },
      toOwner: undefined,
      items: [
        {
          productId: 'prod-001',
          productName: 'PDO Thread COG 19G-100mm',
          modelName: 'PT-COG-19G-100',
          quantity: 100,
          ownedQuantity: 100,
          codes: ['NC-12345678', 'NC-12345679', 'NC-12345680'],
        },
      ],
      totalQuantity: 100,
      totalOwnedQuantity: 100,
    },
    {
      id: 'history-002',
      actionType: 'SHIPPED' as const,
      actionTypeLabel: '출고',
      createdAt: '2024-01-15T14:30:00Z',
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
          ownedQuantity: 0,
          codes: ['NC-12345678', 'NC-12345679'],
        },
      ],
      totalQuantity: 50,
      totalOwnedQuantity: 0,
      shipmentBatchId: 'batch-001',
    },
    {
      id: 'history-003',
      actionType: 'PRODUCED' as const,
      actionTypeLabel: '생산',
      createdAt: '2024-01-16T10:00:00Z',
      isRecall: false,
      fromOwner: {
        type: 'ORGANIZATION' as const,
        id: 'org-manufacturer',
        name: '테스트 제조사',
      },
      toOwner: undefined,
      items: [
        {
          productId: 'prod-002',
          productName: 'PDO Thread MONO 23G-60mm',
          modelName: 'PT-MONO-23G-60',
          quantity: 200,
          ownedQuantity: 200,
          codes: ['NC-22345678', 'NC-22345679', 'NC-22345680'],
        },
      ],
      totalQuantity: 200,
      totalOwnedQuantity: 200,
    },
  ],
  currentOrgId: 'org-manufacturer',
};

/**
 * Manufacturer 역할 mock 데이터 매핑
 */
export const manufacturerMockData: Record<string, Record<string, unknown>> = {
  dashboard: manufacturerDashboardMockData,
  inventory: manufacturerInventoryMockData,
  history: manufacturerHistoryMockData,
};
