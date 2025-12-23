/**
 * 커스텀 훅 중앙 export
 * SSOT: 모든 커스텀 훅은 이 파일을 통해 export됩니다.
 */

export { useAuth } from './useAuth';
export { useInfiniteScroll } from './useInfiniteScroll';
export { useCart, type CartItem } from './useCart';
export { useDebounce } from './useDebounce';
export {
  useCursorPagination,
  type CursorPaginationState,
  type CursorPaginationActions,
  type UseCursorPaginationOptions,
} from './useCursorPagination';
export {
  usePatientSearch,
  type UsePatientSearchOptions,
  type UsePatientSearchReturn,
} from './usePatientSearch';
