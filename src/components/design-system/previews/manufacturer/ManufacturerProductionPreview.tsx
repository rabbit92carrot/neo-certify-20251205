/**
 * Manufacturer Production Preview 컴포넌트
 * Design System 페이지 맵에서 생산 등록 페이지 미리보기
 */

import { ProductionView, type ProductionViewProps } from '@/components/views/manufacturer';

export function ManufacturerProductionPreview(
  props: ProductionViewProps
): React.ReactElement {
  return <ProductionView {...props} />;
}
