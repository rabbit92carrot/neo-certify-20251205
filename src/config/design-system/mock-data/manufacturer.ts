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
 * Manufacturer 역할 mock 데이터 매핑
 */
export const manufacturerMockData: Record<string, Record<string, unknown>> = {
  dashboard: manufacturerDashboardMockData,
  inventory: manufacturerInventoryMockData,
};
