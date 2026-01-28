/**
 * 카카오 알림톡 템플릿 정의 (SSOT)
 *
 * 이 파일이 템플릿의 단일 소스입니다.
 * - mock 미리보기 (AlimtalkTemplatePreview)
 * - production 메시지 생성 (treatment.service.ts)
 * - 알리고 API 발송 (alimtalk.service.ts)
 * 모두 이 정의를 참조합니다.
 *
 * 템플릿 본문은 docs/kakao-alimtalk/TEMPLATES.md 기준입니다.
 */

// ============================================================================
// 타입 정의
// ============================================================================

export interface AlimtalkTemplateVariable {
  /** 변수명 (#{변수명} 형태로 본문에서 사용) */
  name: string;
  /** 변수 설명 */
  description: string;
  /** 미리보기용 기본값 */
  defaultValue: string;
}

export interface AlimtalkTemplateButton {
  /** 버튼 타입 */
  type: 'WL' | 'AL' | 'DS' | 'BK' | 'BC' | 'BT';
  /** 버튼명 (변수 사용 불가) */
  name: string;
  /** URL 템플릿 (#{변수} 사용 가능) */
  urlTemplate?: string;
}

export interface AlimtalkTemplate {
  /** 내부 관리 코드 (CERT_COMPLETE 등) */
  code: string;
  /** 템플릿명 */
  name: string;
  /** 메시지 유형: BA(기본형), EX(부가정보), AD(채널추가), MI(복합) */
  messageType: 'BA' | 'EX' | 'AD' | 'MI';
  /** 강조 유형 */
  emphasizeType: 'NONE' | 'TEXT' | 'IMAGE' | 'ITEM_LIST';
  /** 강조 제목 (TEXT 유형 시) */
  emphasizeTitle?: string;
  /** 강조 부제목 (TEXT 유형 시) */
  emphasizeSubtitle?: string;
  /** 템플릿 본문 (#{변수} 포함) */
  content: string;
  /** 변수 목록 */
  variables: AlimtalkTemplateVariable[];
  /** 버튼 목록 */
  buttons: AlimtalkTemplateButton[];
}

// ============================================================================
// 템플릿 정의
// ============================================================================

export const ALIMTALK_TEMPLATES: Record<string, AlimtalkTemplate> = {
  CERT_COMPLETE: {
    code: 'CERT_COMPLETE',
    name: '정품 인증 완료',
    messageType: 'BA',
    emphasizeType: 'TEXT',
    emphasizeTitle: '정품 인증 완료',
    emphasizeSubtitle: '의료기기 정품이 확인되었습니다',
    content: `#{고객명}님, 안녕하세요.

#{시술일}에 #{병원명}에서 시술받으신 제품의 정품 인증이 완료되었습니다.

■ 시술 정보
#{제품목록}
- 시술일: #{시술일}
- 시술 병원: #{병원명}

본 제품은 정식 유통 경로를 통해 공급된 정품임이 확인되었습니다.

아래 버튼을 눌러 개별 인증코드를 확인하세요.`,
    variables: [
      { name: '고객명', description: '고객 호칭 (마스킹)', defaultValue: '010****5678 고객' },
      { name: '시술일', description: '시술 날짜', defaultValue: '2026-01-23' },
      { name: '병원명', description: '시술 병원명', defaultValue: '강남성형외과' },
      { name: '제품목록', description: '제품 목록 (줄바꿈)', defaultValue: '- 쥬비덤 볼류마 2개\n- 레스틸렌 1개' },
      { name: '시술ID', description: '시술 기록 ID (버튼 URL용)', defaultValue: 'abc123' },
    ],
    buttons: [
      { type: 'WL', name: '인증코드 확인하기', urlTemplate: '/verify/#{시술ID}' },
    ],
  },
  CERT_RECALL: {
    code: 'CERT_RECALL',
    name: '정품 인증 회수',
    messageType: 'BA',
    emphasizeType: 'TEXT',
    emphasizeTitle: '정품 인증 회수 안내',
    emphasizeSubtitle: '발급된 인증이 회수되었습니다',
    content: `#{고객명}님, 안녕하세요.

#{병원명}에서 발급한 정품 인증이 회수되었음을 안내드립니다.

■ 회수 정보
- 병원: #{병원명}
- 병원 연락처: #{병원연락처}
- 회수 사유: #{회수사유}
#{제품목록}

문의사항은 해당 병원으로 연락해주세요.
병원과 연락이 어려운 경우 아래 버튼을 통해 고객센터로 문의해주세요.`,
    variables: [
      { name: '고객명', description: '고객 호칭 (마스킹)', defaultValue: '010****5678 고객' },
      { name: '병원명', description: '시술 병원명', defaultValue: '강남성형외과' },
      { name: '병원연락처', description: '병원 대표 연락처', defaultValue: '02-1234-5678' },
      { name: '회수사유', description: '회수 사유', defaultValue: '고객 요청에 의한 취소' },
      { name: '제품목록', description: '회수 제품 목록', defaultValue: '- 회수 제품: 쥬비덤 볼류마 2개' },
    ],
    buttons: [
      { type: 'WL', name: '고객센터 문의', urlTemplate: '/inquiry' },
    ],
  },
};

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 템플릿 본문의 #{변수} 를 실제 값으로 치환
 */
export const replaceTemplateVariables = (
  content: string,
  variables: Record<string, string>
): string => {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`#\\{${key}\\}`, 'g'), value);
  }
  return result;
};

/**
 * 템플릿 코드로 템플릿 조회 + 변수 치환된 메시지 및 버튼 반환
 */
export const renderTemplate = (
  code: string,
  variables: Record<string, string>
): { message: string; buttons: { name: string; url: string }[] } | null => {
  const template = ALIMTALK_TEMPLATES[code];
  if (!template) return null;

  const message = replaceTemplateVariables(template.content, variables);
  const buttons = template.buttons
    .filter((b) => b.urlTemplate)
    .map((b) => ({
      name: b.name,
      url: replaceTemplateVariables(b.urlTemplate!, variables),
    }));

  return { message, buttons };
};
