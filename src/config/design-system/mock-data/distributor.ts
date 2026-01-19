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
 * Distributor 역할 mock 데이터 매핑
 */
export const distributorMockData: Record<string, Record<string, unknown>> = {
  dashboard: distributorDashboardMockData,
  inventory: distributorInventoryMockData,
};
