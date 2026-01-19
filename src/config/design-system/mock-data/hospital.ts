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
 * Hospital 역할 mock 데이터 매핑
 */
export const hospitalMockData: Record<string, Record<string, unknown>> = {
  dashboard: hospitalDashboardMockData,
  inventory: hospitalInventoryMockData,
};
