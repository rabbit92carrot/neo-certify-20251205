/**
 * 병원 제품 설정 폼 타입 정의
 */

import type { HospitalKnownProduct } from '@/types/api.types';

// 필터 타입
export type AliasFilter = 'all' | 'with_alias' | 'without_alias';
export type ActiveFilter = 'all' | 'active' | 'inactive';

// SearchAndFilterSection props
export interface SearchAndFilterSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  aliasFilter: AliasFilter;
  onAliasFilterChange: (filter: AliasFilter) => void;
  activeFilter: ActiveFilter;
  onActiveFilterChange: (filter: ActiveFilter) => void;
  productCount: number;
}

// ProductListPanel props
export interface ProductListPanelProps {
  products: HospitalKnownProduct[];
  selectedProduct: HospitalKnownProduct | null;
  onProductSelect: (product: HospitalKnownProduct) => void;
  onToggleActive: (product: HospitalKnownProduct, e: React.MouseEvent) => void;
  isLoading: boolean;
  getDisplayName: (product: HospitalKnownProduct) => string;
}

// ProductSettingsPanel props
export interface ProductSettingsPanelProps {
  selectedProduct: HospitalKnownProduct | null;
  alias: string;
  onAliasChange: (value: string) => void;
  aliasError: string | null;
  isActive: boolean;
  onActiveChange: (value: boolean) => void;
  isSaving: boolean;
  onSave: () => void;
  onDeleteAlias: () => void;
}
