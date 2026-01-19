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
 * Hospital Treatment mock 데이터
 */
export const hospitalTreatmentMockData = {
  products: [
    {
      id: 'prod-001',
      name: 'PDO Thread COG 19G-100mm',
      modelName: 'PT-COG-19G-100',
      alias: 'COG 100',
      availableQuantity: 1000,
    },
    {
      id: 'prod-002',
      name: 'PDO Thread MONO 23G-60mm',
      modelName: 'PT-MONO-23G-60',
      alias: 'MONO 60',
      availableQuantity: 800,
    },
    {
      id: 'prod-003',
      name: 'PDO Thread SCREW 21G-90mm',
      modelName: 'PT-SCREW-21G-90',
      alias: 'SCREW 90',
      availableQuantity: 700,
    },
  ],
};

/**
 * Hospital Treatment History mock 데이터
 * TreatmentRecordSummary 형태와 일치하도록 구성
 */
export const hospitalTreatmentHistoryMockData = {
  treatments: [
    {
      id: 'treatment-001',
      hospital_id: 'org-hospital',
      patient_phone: '01012341234',
      treatment_date: '2024-01-17',
      created_at: '2024-01-17T14:00:00Z',
      updated_at: null,
      hospital: { id: 'org-hospital', name: '테스트 병원', type: 'HOSPITAL' as const },
      itemSummary: [
        {
          productId: 'prod-001',
          productName: 'PDO Thread COG 19G-100mm',
          modelName: 'PT-COG-19G-100',
          alias: 'COG 100',
          quantity: 5,
        },
      ],
      totalQuantity: 5,
      isRecallable: true,
    },
    {
      id: 'treatment-002',
      hospital_id: 'org-hospital',
      patient_phone: '01056785678',
      treatment_date: '2024-01-17',
      created_at: '2024-01-17T15:30:00Z',
      updated_at: null,
      hospital: { id: 'org-hospital', name: '테스트 병원', type: 'HOSPITAL' as const },
      itemSummary: [
        {
          productId: 'prod-002',
          productName: 'PDO Thread MONO 23G-60mm',
          modelName: 'PT-MONO-23G-60',
          alias: 'MONO 60',
          quantity: 10,
        },
      ],
      totalQuantity: 10,
      isRecallable: true,
    },
    {
      id: 'treatment-003',
      hospital_id: 'org-hospital',
      patient_phone: '01090129012',
      treatment_date: '2024-01-16',
      created_at: '2024-01-16T10:00:00Z',
      updated_at: null,
      hospital: { id: 'org-hospital', name: '테스트 병원', type: 'HOSPITAL' as const },
      itemSummary: [
        {
          productId: 'prod-003',
          productName: 'PDO Thread SCREW 21G-90mm',
          modelName: 'PT-SCREW-21G-90',
          alias: 'SCREW 90',
          quantity: 3,
        },
      ],
      totalQuantity: 3,
      isRecallable: false,
    },
    {
      id: 'treatment-004',
      hospital_id: 'org-hospital',
      patient_phone: '01034563456',
      treatment_date: '2024-01-15',
      created_at: '2024-01-15T11:00:00Z',
      updated_at: null,
      hospital: { id: 'org-hospital', name: '테스트 병원', type: 'HOSPITAL' as const },
      itemSummary: [
        {
          productId: 'prod-001',
          productName: 'PDO Thread COG 19G-100mm',
          modelName: 'PT-COG-19G-100',
          alias: 'COG 100',
          quantity: 8,
        },
      ],
      totalQuantity: 8,
      isRecallable: false,
    },
  ],
};

/**
 * Hospital Disposal mock 데이터
 */
export const hospitalDisposalMockData = {
  products: [
    {
      id: 'prod-001',
      name: 'PDO Thread COG 19G-100mm',
      modelName: 'PT-COG-19G-100',
      alias: 'COG 100',
      availableQuantity: 1000,
    },
    {
      id: 'prod-002',
      name: 'PDO Thread MONO 23G-60mm',
      modelName: 'PT-MONO-23G-60',
      alias: 'MONO 60',
      availableQuantity: 800,
    },
    {
      id: 'prod-003',
      name: 'PDO Thread SCREW 21G-90mm',
      modelName: 'PT-SCREW-21G-90',
      alias: 'SCREW 90',
      availableQuantity: 700,
    },
  ],
};

/**
 * Hospital Settings mock 데이터
 */
export const hospitalSettingsMockData = {
  productAliases: [
    {
      productId: 'prod-001',
      productName: 'PDO Thread COG 19G-100mm',
      modelName: 'PT-COG-19G-100',
      alias: 'COG 100',
    },
    {
      productId: 'prod-002',
      productName: 'PDO Thread MONO 23G-60mm',
      modelName: 'PT-MONO-23G-60',
      alias: 'MONO 60',
    },
    {
      productId: 'prod-003',
      productName: 'PDO Thread SCREW 21G-90mm',
      modelName: 'PT-SCREW-21G-90',
      alias: 'SCREW 90',
    },
  ],
};

/**
 * Hospital 역할 mock 데이터 매핑
 */
export const hospitalMockData: Record<string, Record<string, unknown>> = {
  dashboard: hospitalDashboardMockData,
  treatment: hospitalTreatmentMockData,
  'treatment-history': hospitalTreatmentHistoryMockData,
  disposal: hospitalDisposalMockData,
  inventory: hospitalInventoryMockData,
  history: hospitalHistoryMockData,
  settings: hospitalSettingsMockData,
};
