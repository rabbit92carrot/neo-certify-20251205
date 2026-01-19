/**
 * Hospital Dashboard mock 데이터
 */
export const hospitalDashboardMockData = {
  organization: {
    name: '테스트 병원',
    email: 'hospital@test.com',
    business_number: '345-67-89012',
    representative_name: '박의사',
  },
  stats: {
    totalInventory: 2500,
    todayTreatments: 15,
    totalPatients: 320,
  },
};

/**
 * Hospital Inventory mock 데이터
 */
export const hospitalInventoryMockData = {
  summaries: [
    {
      productId: 'prod-001',
      productName: 'PDO Thread COG 19G-100mm',
      modelName: 'PT-COG-19G-100',
      udiDi: 'UDI-001-COG-19G',
      totalQuantity: 1000,
    },
    {
      productId: 'prod-002',
      productName: 'PDO Thread MONO 23G-60mm',
      modelName: 'PT-MONO-23G-60',
      udiDi: 'UDI-002-MONO-23G',
      totalQuantity: 800,
    },
    {
      productId: 'prod-003',
      productName: 'PDO Thread SCREW 21G-90mm',
      modelName: 'PT-SCREW-21G-90',
      udiDi: 'UDI-003-SCREW-21G',
      totalQuantity: 700,
    },
  ],
};

/**
 * Hospital History mock 데이터
 */
export const hospitalHistoryMockData = {
  histories: [
    {
      id: 'history-001',
      actionType: 'RECEIVED' as const,
      actionTypeLabel: '입고',
      createdAt: '2024-01-16T10:30:00Z',
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
          ownedQuantity: 20,
          codes: ['NC-12345678'],
        },
      ],
      totalQuantity: 20,
      totalOwnedQuantity: 20,
      shipmentBatchId: 'batch-002',
    },
    {
      id: 'history-002',
      actionType: 'TREATED' as const,
      actionTypeLabel: '시술',
      createdAt: '2024-01-17T14:00:00Z',
      isRecall: false,
      fromOwner: {
        type: 'ORGANIZATION' as const,
        id: 'org-hospital',
        name: '테스트 병원',
      },
      toOwner: {
        type: 'PATIENT' as const,
        id: 'patient-001',
        name: '김*민',
      },
      items: [
        {
          productId: 'prod-001',
          productName: 'PDO Thread COG 19G-100mm',
          modelName: 'PT-COG-19G-100',
          quantity: 5,
          ownedQuantity: 0,
          codes: ['NC-12345678'],
        },
      ],
      totalQuantity: 5,
      totalOwnedQuantity: 0,
    },
    {
      id: 'history-003',
      actionType: 'DISPOSED' as const,
      actionTypeLabel: '폐기',
      createdAt: '2024-01-18T11:00:00Z',
      isRecall: false,
      fromOwner: {
        type: 'ORGANIZATION' as const,
        id: 'org-hospital',
        name: '테스트 병원',
      },
      toOwner: undefined,
      items: [
        {
          productId: 'prod-002',
          productName: 'PDO Thread MONO 23G-60mm',
          modelName: 'PT-MONO-23G-60',
          quantity: 3,
          ownedQuantity: 0,
          codes: ['NC-22345681', 'NC-22345682', 'NC-22345683'],
        },
      ],
      totalQuantity: 3,
      totalOwnedQuantity: 0,
    },
  ],
  currentOrgId: 'org-hospital',
};

/**
 * Hospital 역할 mock 데이터 매핑
 */
export const hospitalMockData: Record<string, Record<string, unknown>> = {
  dashboard: hospitalDashboardMockData,
  inventory: hospitalInventoryMockData,
  history: hospitalHistoryMockData,
};
