import type {
  ComponentShowcaseConfig,
  ComponentInfo,
  RoleType,
} from '@/components/design-system/types';
import { manufacturerComponentCatalog, manufacturerPageComponents } from './manufacturer';
import { distributorComponentCatalog, distributorPageComponents } from './distributor';
import { hospitalComponentCatalog, hospitalPageComponents } from './hospital';
import { adminComponentCatalog, adminPageComponents } from './admin';

/**
 * 역할별 컴포넌트 카탈로그
 */
export const COMPONENT_CATALOGS: Record<
  RoleType,
  Record<string, ComponentShowcaseConfig>
> = {
  manufacturer: manufacturerComponentCatalog,
  distributor: distributorComponentCatalog,
  hospital: hospitalComponentCatalog,
  admin: adminComponentCatalog,
};

/**
 * 페이지별 컴포넌트 매핑
 * 각 페이지에서 사용되는 컴포넌트 ID 목록
 */
export const PAGE_COMPONENTS: Record<RoleType, Record<string, string[]>> = {
  manufacturer: manufacturerPageComponents,
  distributor: distributorPageComponents,
  hospital: hospitalPageComponents,
  admin: adminPageComponents,
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

/**
 * 컴포넌트 이름을 카탈로그 ID로 변환
 * 예: "StatCard" → "stat-card", "DataTable" → "data-table"
 */
export function componentNameToCatalogId(name: string): string {
  return name
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

/**
 * 컴포넌트 이름 목록에서 ComponentInfo 목록 생성
 * DetailPanel에서 사용하기 위해 카탈로그 정보 enrichment
 */
export function getComponentInfoList(
  role: RoleType,
  componentNames: string[]
): ComponentInfo[] {
  const catalog = COMPONENT_CATALOGS[role];

  return componentNames.map((name) => {
    const catalogId = componentNameToCatalogId(name);
    const config = catalog[catalogId];

    return {
      name,
      catalogId,
      storybookPath: config?.storybookPath,
    };
  });
}
