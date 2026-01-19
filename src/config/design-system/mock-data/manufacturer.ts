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
 * Manufacturer Production mock 데이터
 */
export const manufacturerProductionMockData = {
  products: [
    {
      id: 'prod-001',
      manufacturer_id: 'org-manufacturer',
      name: 'PDO Thread COG 19G-100mm',
      model_name: 'PT-COG-19G-100',
      udi_di: 'UDI-001-COG-19G',
      description: '리프팅용 COG 타입 PDO 실',
    },
    {
      id: 'prod-002',
      manufacturer_id: 'org-manufacturer',
      name: 'PDO Thread MONO 23G-60mm',
      model_name: 'PT-MONO-23G-60',
      udi_di: 'UDI-002-MONO-23G',
      description: '피부 탄력용 MONO 타입 PDO 실',
    },
    {
      id: 'prod-003',
      manufacturer_id: 'org-manufacturer',
      name: 'PDO Thread SCREW 21G-90mm',
      model_name: 'PT-SCREW-21G-90',
      udi_di: 'UDI-003-SCREW-21G',
      description: '볼륨 리프팅용 SCREW 타입 PDO 실',
    },
  ],
  settings: {
    organization_id: 'org-manufacturer',
    lot_prefix: 'LOT',
    lot_date_format: 'YYYYMMDD',
    lot_sequence_digits: 3,
    lot_separator: '-',
  },
};

/**
 * Manufacturer Shipment mock 데이터
 */
export const manufacturerShipmentMockData = {
  organizationType: 'MANUFACTURER' as const,
  products: [
    {
      id: 'prod-001',
      name: 'PDO Thread COG 19G-100mm',
      modelName: 'PT-COG-19G-100',
      availableQuantity: 5000,
    },
    {
      id: 'prod-002',
      name: 'PDO Thread MONO 23G-60mm',
      modelName: 'PT-MONO-23G-60',
      availableQuantity: 3500,
    },
    {
      id: 'prod-003',
      name: 'PDO Thread SCREW 21G-90mm',
      modelName: 'PT-SCREW-21G-90',
      availableQuantity: 2500,
    },
  ],
  canSelectLot: true,
};

/**
 * Manufacturer Products mock 데이터
 */
export const manufacturerProductsMockData = {
  products: [
    {
      id: 'prod-001',
      name: 'PDO Thread COG 19G-100mm',
      modelName: 'PT-COG-19G-100',
      udiDi: 'UDI-001-COG-19G',
      description: '리프팅용 COG 타입 PDO 실',
      isActive: true,
      createdAt: '2024-01-05',
    },
    {
      id: 'prod-002',
      name: 'PDO Thread MONO 23G-60mm',
      modelName: 'PT-MONO-23G-60',
      udiDi: 'UDI-002-MONO-23G',
      description: '피부 탄력용 MONO 타입 PDO 실',
      isActive: true,
      createdAt: '2024-01-06',
    },
    {
      id: 'prod-003',
      name: 'PDO Thread SCREW 21G-90mm',
      modelName: 'PT-SCREW-21G-90',
      udiDi: 'UDI-003-SCREW-21G',
      description: '볼륨 리프팅용 SCREW 타입 PDO 실',
      isActive: true,
      createdAt: '2024-01-07',
    },
    {
      id: 'prod-004',
      name: 'PDO Thread BARB 19G-150mm (단종)',
      modelName: 'PT-BARB-19G-150',
      udiDi: 'UDI-004-BARB-19G',
      description: '단종된 BARB 타입 제품',
      isActive: false,
      createdAt: '2023-12-01',
    },
  ],
  stats: {
    total: 15,
    active: 12,
  },
};

/**
 * Manufacturer Settings mock 데이터
 */
export const manufacturerSettingsMockData = {
  settings: {
    lotPrefix: 'LOT',
    lotDateFormat: 'YYYYMMDD',
    lotSequenceDigits: 3,
    lotSeparator: '-',
  },
  previewLotNumber: 'LOT-20240119-001',
};

/**
 * Manufacturer Inbox mock 데이터
 */
export const manufacturerInboxMockData = {
  messages: [
    {
      id: 'msg-001',
      subject: '입고 확인 알림',
      content: '테스트 유통사에서 50개 제품을 입고 처리했습니다.',
      senderName: '시스템',
      senderType: 'SYSTEM' as const,
      isRead: false,
      createdAt: '2024-01-18 14:30',
    },
    {
      id: 'msg-002',
      subject: '출고 회수 알림',
      content: '테스트 병원에서 출고된 제품 10개가 회수되었습니다.',
      senderName: '시스템',
      senderType: 'SYSTEM' as const,
      isRead: true,
      createdAt: '2024-01-17 10:00',
    },
    {
      id: 'msg-003',
      subject: '관리자 공지',
      content: '시스템 점검이 예정되어 있습니다.',
      senderName: '관리자',
      senderType: 'ADMIN' as const,
      isRead: true,
      createdAt: '2024-01-16 09:00',
    },
  ],
  unreadCount: 1,
};

/**
 * Manufacturer 역할 mock 데이터 매핑
 */
export const manufacturerMockData: Record<string, Record<string, unknown>> = {
  dashboard: manufacturerDashboardMockData,
  products: manufacturerProductsMockData,
  production: manufacturerProductionMockData,
  shipment: manufacturerShipmentMockData,
  inventory: manufacturerInventoryMockData,
  history: manufacturerHistoryMockData,
  inbox: manufacturerInboxMockData,
  settings: manufacturerSettingsMockData,
};
