/**
 * CSV 유틸리티
 */

/**
 * CSV 필드 이스케이프
 * 쉼표, 줄바꿈, 큰따옴표가 포함된 경우 처리
 */
function escapeCsvField(field: string | number | boolean | null | undefined): string {
  if (field === null || field === undefined) {
    return '';
  }
  const stringField = String(field);
  // 쉼표, 줄바꿈, 큰따옴표가 포함된 경우 큰따옴표로 감싸고 내부 큰따옴표는 두 번 반복
  if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
}

/**
 * 객체 배열을 CSV 문자열로 변환
 * @param data 데이터 배열
 * @param headers 헤더 정의 { key: 객체의 키, label: CSV 헤더 표시명 }
 */
export function generateCsvString<T extends Record<string, unknown>>(
  data: T[],
  headers: { key: keyof T; label: string }[]
): string {
  // 헤더 행
  const headerRow = headers.map((h) => escapeCsvField(h.label)).join(',');

  // 데이터 행
  const dataRows = data.map((row) =>
    headers
      .map((h) => {
        const value = row[h.key];
        return escapeCsvField(value as string | number | boolean | null | undefined);
      })
      .join(',')
  );

  // BOM + 헤더 + 데이터 (한글 인코딩을 위해 BOM 추가)
  return '\uFEFF' + [headerRow, ...dataRows].join('\n');
}

/**
 * CSV 문자열을 파일로 다운로드
 * @param csvString CSV 문자열
 * @param filename 파일명 (확장자 포함)
 */
export function downloadCsv(csvString: string, filename: string): void {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
