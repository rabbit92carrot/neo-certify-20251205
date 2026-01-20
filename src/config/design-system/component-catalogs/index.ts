import type {
  ComponentShowcaseConfig,
  RoleType,
} from '@/components/design-system/types';
import { manufacturerComponentCatalog, manufacturerPageComponents } from './manufacturer';

/**
 * 역할별 컴포넌트 카탈로그
 */
export const COMPONENT_CATALOGS: Record<
  RoleType,
  Record<string, ComponentShowcaseConfig>
> = {
  manufacturer: manufacturerComponentCatalog,
  distributor: {}, // TODO: 구현 예정
  hospital: {}, // TODO: 구현 예정
  admin: {}, // TODO: 구현 예정
};

/**
 * 페이지별 컴포넌트 매핑
 * 각 페이지에서 사용되는 컴포넌트 ID 목록
 */
export const PAGE_COMPONENTS: Record<RoleType, Record<string, string[]>> = {
  manufacturer: manufacturerPageComponents,
  distributor: {}, // TODO: 구현 예정
  hospital: {}, // TODO: 구현 예정
  admin: {}, // TODO: 구현 예정
};

/**
 * 특정 페이지에서 사용되는 컴포넌트 설정 목록 반환
 */
export function getPageComponents(
  role: RoleType,
  pageId: string
): ComponentShowcaseConfig[] {
  const componentIds = PAGE_COMPONENTS[role]?.[pageId] ?? [];
  const catalog = COMPONENT_CATALOGS[role];

  return componentIds
    .map((id) => catalog[id])
    .filter(
      (config): config is ComponentShowcaseConfig => config !== undefined
    );
}

/**
 * 특정 컴포넌트 설정 반환
 */
export function getComponentConfig(
  role: RoleType,
  componentId: string
): ComponentShowcaseConfig | undefined {
  return COMPONENT_CATALOGS[role]?.[componentId];
}
