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
    activePartners: 25,
  },
};

/**
 * Distributor 역할 mock 데이터 매핑
 */
export const distributorMockData: Record<string, Record<string, unknown>> = {
  dashboard: distributorDashboardMockData,
  // 다른 페이지 mock 데이터는 추후 추가
};
