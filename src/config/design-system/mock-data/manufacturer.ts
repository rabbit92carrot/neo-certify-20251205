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
 * Manufacturer 역할 mock 데이터 매핑
 */
export const manufacturerMockData: Record<string, Record<string, unknown>> = {
  dashboard: manufacturerDashboardMockData,
  // 다른 페이지 mock 데이터는 추후 추가
};
