/**
 * 데이터베이스 유틸리티 함수
 * PostgREST 필터 문자열 처리 등
 */

/**
 * PostgREST 필터 문자열용 특수문자 이스케이프
 *
 * PostgREST의 .or() 필터에서 사용되는 특수문자를 이스케이프합니다.
 * 이스케이프가 필요한 문자: \ , ( ) .
 *
 * @param value 이스케이프할 문자열
 * @returns 이스케이프된 문자열
 *
 * @example
 * ```ts
 * escapePostgrestFilter('test,value') // 'test\\,value'
 * escapePostgrestFilter('foo.bar')    // 'foo\\.bar'
 * ```
 */
export function escapePostgrestFilter(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\./g, '\\.');
}

/**
 * 여러 컬럼에 대한 ilike 필터 문자열 생성
 *
 * PostgREST의 .or() 메서드에 전달할 안전한 필터 문자열을 생성합니다.
 *
 * @param columns 검색할 컬럼명 배열
 * @param searchTerm 검색어
 * @returns or() 필터 문자열
 *
 * @example
 * ```ts
 * buildIlikeFilter(['name', 'email'], 'test')
 * // 'name.ilike.%test%,email.ilike.%test%'
 *
 * buildIlikeFilter(['name'], 'foo,bar')
 * // 'name.ilike.%foo\\,bar%'
 * ```
 */
export function buildIlikeFilter(columns: string[], searchTerm: string): string {
  const escaped = escapePostgrestFilter(searchTerm);
  return columns.map((col) => `${col}.ilike.%${escaped}%`).join(',');
}
