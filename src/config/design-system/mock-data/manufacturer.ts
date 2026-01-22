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
  actionTypeOptions: [
    { value: 'PRODUCED', label: '생산' },
    { value: 'SHIPPED', label: '출고' },
    { value: 'RETURN_RECEIVED', label: '반품 입고' },
  ],
  defaultActionType: 'SHIPPED',
  showReturnButton: false,
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
      manufacturer: '테스트 제조사',
      availableQuantity: 5000,
      lots: [
        { lotId: 'lot-001', lotNumber: 'LOT-20240115-001', availableQuantity: 3000 },
        { lotId: 'lot-002', lotNumber: 'LOT-20240116-001', availableQuantity: 2000 },
      ],
    },
    {
      id: 'prod-002',
      name: 'PDO Thread MONO 23G-60mm',
      modelName: 'PT-MONO-23G-60',
      manufacturer: '테스트 제조사',
      availableQuantity: 3500,
      lots: [
        { lotId: 'lot-003', lotNumber: 'LOT-20240115-002', availableQuantity: 3500 },
      ],
    },
    {
      id: 'prod-003',
      name: 'PDO Thread SCREW 21G-90mm',
      modelName: 'PT-SCREW-21G-90',
      manufacturer: '테스트 제조사',
      availableQuantity: 2500,
      lots: [
        { lotId: 'lot-004', lotNumber: 'LOT-20240116-002', availableQuantity: 2500 },
      ],
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
      manufacturer_id: 'org-manufacturer',
      name: 'PDO Thread COG 19G-100mm',
      model_name: 'PT-COG-19G-100',
      udi_di: 'UDI-001-COG-19G',
      description: '리프팅용 COG 타입 PDO 실',
      is_active: true,
      created_at: '2024-01-05T00:00:00Z',
      updated_at: '2024-01-05T00:00:00Z',
      deactivation_reason: null,
      deactivated_at: null,
    },
    {
      id: 'prod-002',
      manufacturer_id: 'org-manufacturer',
      name: 'PDO Thread MONO 23G-60mm',
      model_name: 'PT-MONO-23G-60',
      udi_di: 'UDI-002-MONO-23G',
      description: '피부 탄력용 MONO 타입 PDO 실',
      is_active: true,
      created_at: '2024-01-06T00:00:00Z',
      updated_at: '2024-01-06T00:00:00Z',
      deactivation_reason: null,
      deactivated_at: null,
    },
    {
      id: 'prod-003',
      manufacturer_id: 'org-manufacturer',
      name: 'PDO Thread SCREW 21G-90mm',
      model_name: 'PT-SCREW-21G-90',
      udi_di: 'UDI-003-SCREW-21G',
      description: '볼륨 리프팅용 SCREW 타입 PDO 실',
      is_active: true,
      created_at: '2024-01-07T00:00:00Z',
      updated_at: '2024-01-07T00:00:00Z',
      deactivation_reason: null,
      deactivated_at: null,
    },
    {
      id: 'prod-004',
      manufacturer_id: 'org-manufacturer',
      name: 'PDO Thread BARB 19G-150mm (단종)',
      model_name: 'PT-BARB-19G-150',
      udi_di: 'UDI-004-BARB-19G',
      description: '단종된 BARB 타입 제품',
      is_active: false,
      created_at: '2023-12-01T00:00:00Z',
      updated_at: '2024-01-10T00:00:00Z',
      deactivation_reason: 'discontinued',
      deactivated_at: '2024-01-10T00:00:00Z',
    },
  ],
};

/**
 * Manufacturer Settings mock 데이터
 * ManufacturerSettings 타입에 맞춤
 */
export const manufacturerSettingsMockData = {
  settings: {
    id: 'settings-001',
    organization_id: 'org-manufacturer',
    lot_prefix: 'ND',
    lot_model_digits: 5,
    lot_date_format: 'yymmdd',
    expiry_months: 24,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

/**
 * Manufacturer Inbox mock 데이터
 * OrganizationAlert 타입에 맞춤
 */
export const manufacturerInboxMockData = {
  alerts: [
    {
      id: 'alert-001',
      alertType: 'INACTIVE_PRODUCT_USAGE' as const,
      recipientOrgId: 'org-manufacturer',
      title: '비활성 제품 사용 알림',
      content: '테스트 병원에서 비활성화된 제품 "PDO Thread BARB 19G-150mm"을 시술에 사용했습니다.',
      metadata: {
        productId: 'prod-004',
        productName: 'PDO Thread BARB 19G-150mm',
        usageType: 'TREATMENT' as const,
        quantity: 5,
        organizationId: 'org-hospital',
        organizationName: '테스트 병원',
      },
      isRead: false,
      readAt: null,
      createdAt: '2024-01-18T14:30:00Z',
    },
    {
      id: 'alert-002',
      alertType: 'SYSTEM_NOTICE' as const,
      recipientOrgId: 'org-manufacturer',
      title: '시스템 점검 예정 안내',
      content: '2024년 1월 20일 02:00 ~ 04:00 시스템 점검이 예정되어 있습니다.',
      metadata: {},
      isRead: true,
      readAt: '2024-01-17T10:30:00Z',
      createdAt: '2024-01-17T09:00:00Z',
    },
    {
      id: 'alert-003',
      alertType: 'CUSTOM_MESSAGE' as const,
      recipientOrgId: 'org-manufacturer',
      title: '관리자 공지',
      content: '새로운 기능이 추가되었습니다. 확인해 보세요.',
      metadata: {},
      isRead: true,
      readAt: '2024-01-16T10:00:00Z',
      createdAt: '2024-01-16T09:00:00Z',
    },
  ],
  title: '알림 보관함',
  description: '비활성 제품 사용 알림 및 시스템 메시지를 확인합니다.',
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
