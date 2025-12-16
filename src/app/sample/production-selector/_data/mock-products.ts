/**
 * 생산 등록 UI 샘플용 목업 제품 데이터
 * 스크린샷 기반 실제 제품 데이터와 유사하게 구성
 */

export interface MockProduct {
  id: string;
  name: string;
  model_name: string;
  udi_di: string;
}

// 제품명별로 그룹화된 모델들
export const MOCK_PRODUCTS: MockProduct[] = [
  // epiticon JAMBER (6개)
  { id: '1', name: 'epiticon JAMBER', model_name: 'CL23060T30JT-35', udi_di: '08800028505363' },
  { id: '2', name: 'epiticon JAMBER', model_name: 'CB21060T30JF-30', udi_di: '08800028505349' },
  { id: '3', name: 'epiticon JAMBER', model_name: 'CB23060T40JF-30', udi_di: '08800028505356' },
  { id: '4', name: 'epiticon JAMBER', model_name: 'CB27050T50JI-20', udi_di: '08800028505370' },
  { id: '5', name: 'epiticon JAMBER', model_name: 'CB25050T50JF-20', udi_di: '08800028506117' },
  { id: '6', name: 'epiticon JAMBER', model_name: 'CB23070T40JD-25', udi_di: '08800028506124' },

  // FILLUP (4개)
  { id: '7', name: 'FILLUP', model_name: 'CB23060T40JF-30', udi_di: '08800028506155' },
  { id: '8', name: 'FILLUP', model_name: 'CB27050T50JI-20', udi_di: '08800028506148' },
  { id: '9', name: 'FILLUP', model_name: 'CL23060T30JT-35', udi_di: '08800028506193' },
  { id: '10', name: 'FILLUP', model_name: 'CL21060T20JT-35', udi_di: '08800028506186' },

  // JAMBER AI (5개)
  { id: '11', name: 'JAMBER AI', model_name: 'CB25050T50JF-20', udi_di: '0880956341018' },
  { id: '12', name: 'JAMBER AI', model_name: 'CB21060T30JF-30', udi_di: '08809563410101' },
  { id: '13', name: 'JAMBER AI', model_name: 'CB23070T30JRI-40', udi_di: '08800028506414' },
  { id: '14', name: 'JAMBER AI', model_name: 'CB23060T30JTP-13', udi_di: '08800028506100' },
  { id: '15', name: 'JAMBER AI', model_name: 'YCB23070T1Y30JM-35', udi_di: '08800028506377' },
  { id: '16', name: 'JAMBER AI', model_name: 'YCW21090T1Y40JX-65', udi_di: '08800028506384' },
  { id: '17', name: 'JAMBER AI', model_name: 'YCB23070T1Y40JX-46', udi_di: '08800028506391' },

  // JAMBER Classic (5개)
  { id: '18', name: 'JAMBER Classic', model_name: 'CB23070T40JD-40', udi_di: '08800028506353' },
  { id: '19', name: 'JAMBER Classic', model_name: 'CB27050T50JI-20', udi_di: '08800028505172' },
  { id: '20', name: 'JAMBER Classic', model_name: 'CB25050T50JF-20', udi_di: '08800028505165' },
  { id: '21', name: 'JAMBER Classic', model_name: 'CB23060T40JF-30', udi_di: '08800028505141' },
  { id: '22', name: 'JAMBER Classic', model_name: 'CB21060T30JF-30', udi_di: '08800028505158' },
  { id: '23', name: 'JAMBER Classic', model_name: 'CL23060T30JT-35', udi_di: '08800028505196' },
  { id: '24', name: 'JAMBER Classic', model_name: 'CL21060T20JT-35', udi_di: '08800028505189' },

  // LIPOLIF-T (4개)
  { id: '25', name: 'LIPOLIF-T', model_name: 'CB21060T30JF-30', udi_di: '08800028506063' },
  { id: '26', name: 'LIPOLIF-T', model_name: 'CB23070T40JD-40', udi_di: '08800028506360' },
  { id: '27', name: 'LIPOLIF-T', model_name: 'CB25050T50JF-20', udi_di: '08800028506087' },
  { id: '28', name: 'LIPOLIF-T', model_name: 'CB27050T50JI-20', udi_di: '08800028506094' },
  { id: '29', name: 'LIPOLIF-T', model_name: 'CB23060T40JF-30', udi_di: '08800028506070' },

  // Medistream Standard (4개)
  { id: '30', name: 'Medistream Standard', model_name: 'CB23060T40JF-30', udi_di: '08800028506308' },
  { id: '31', name: 'Medistream Standard', model_name: 'CB25050T50JF-20', udi_di: '08800028506322' },
  { id: '32', name: 'Medistream Standard', model_name: 'CB27050T50JI-20', udi_di: '08800028506339' },
  { id: '33', name: 'Medistream Standard', model_name: 'CB23070T40JD-40', udi_di: '08800028506346' },
  { id: '34', name: 'Medistream Standard', model_name: 'CB21060T30JF-30', udi_di: '08800028506315' },
];

// 제품명으로 그룹화하는 유틸리티 함수
export function groupProductsByName(products: MockProduct[]): Map<string, MockProduct[]> {
  const grouped = new Map<string, MockProduct[]>();

  products.forEach(product => {
    const existing = grouped.get(product.name) || [];
    existing.push(product);
    grouped.set(product.name, existing);
  });

  return grouped;
}

// 고유 제품명 목록 반환
export function getUniqueProductNames(products: MockProduct[]): string[] {
  return [...new Set(products.map(p => p.name))];
}

// 제품명으로 모델 필터링
export function getModelsByProductName(products: MockProduct[], productName: string): MockProduct[] {
  return products.filter(p => p.name === productName);
}
