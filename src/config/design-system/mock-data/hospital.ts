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
    monthlyTreatments: 320,
    activeProducts: 8,
  },
};

/**
 * Hospital 역할 mock 데이터 매핑
 */
export const hospitalMockData: Record<string, Record<string, unknown>> = {
  dashboard: hospitalDashboardMockData,
  // 다른 페이지 mock 데이터는 추후 추가
};
