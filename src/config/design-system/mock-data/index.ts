import type { RoleType } from '@/components/design-system/types';
import { adminMockData } from './admin';
import { manufacturerMockData } from './manufacturer';
import { distributorMockData } from './distributor';
import { hospitalMockData } from './hospital';

export { adminMockData } from './admin';
export { manufacturerMockData } from './manufacturer';
export { distributorMockData } from './distributor';
export { hospitalMockData } from './hospital';

/**
 * 역할별 mock 데이터 매핑
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MOCK_DATA: Record<RoleType, Record<string, any>> = {
  admin: adminMockData,
  manufacturer: manufacturerMockData,
  distributor: distributorMockData,
  hospital: hospitalMockData,
};

/**
 * 역할과 페이지 ID로 mock 데이터 가져오기
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMockData(role: RoleType, pageId: string): any | null {
  return MOCK_DATA[role]?.[pageId] ?? null;
}
