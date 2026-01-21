/**
 * Manufacturer Products Preview 컴포넌트
 * Design System 페이지 맵에서 제품 관리 페이지 미리보기
 */

import { ProductsView, type ProductsViewProps } from '@/components/views/manufacturer';

export function ManufacturerProductsPreview(
  props: ProductsViewProps
): React.ReactElement {
  return <ProductsView {...props} />;
}
