import type { PageMapConfig, RoleType } from '@/components/design-system/types';
import { manufacturerPageMap } from './manufacturer';
import { distributorPageMap } from './distributor';
import { hospitalPageMap } from './hospital';
import { adminPageMap } from './admin';

export { manufacturerPageMap } from './manufacturer';
export { distributorPageMap } from './distributor';
export { hospitalPageMap } from './hospital';
export { adminPageMap } from './admin';

/**
 * 역할별 페이지 맵 매핑
 */
export const PAGE_MAPS: Record<RoleType, PageMapConfig> = {
  manufacturer: manufacturerPageMap,
  distributor: distributorPageMap,
  hospital: hospitalPageMap,
  admin: adminPageMap,
};

/**
 * 역할별 페이지 맵 가져오기
 */
export function getPageMap(role: RoleType): PageMapConfig {
  return PAGE_MAPS[role];
}
