'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ALIMTALK_TEMPLATES,
  replaceTemplateVariables,
  type AlimtalkTemplate,
} from '@/constants/alimtalk-templates';

/**
 * 공유 템플릿을 배열로 변환 (UI 인덱스 접근용)
 */
const TEMPLATES: AlimtalkTemplate[] = Object.values(ALIMTALK_TEMPLATES);

/**
 * 알림톡 메시지 카드 (카카오톡 실제 스타일 기반)
 *
 * 카카오톡 알림톡 실제 렌더링 특성:
 * - 강조표기형: 말풍선 상단에 연한 배경의 강조 영역
 * - 본문: 흰색 배경에 검정 텍스트
 * - 버튼: 말풍선 내부 하단에 노란색(#FEE500) 버튼
 * - 줄바꿈: \n으로 처리 (API 발송 시)
 */
function AlimtalkMessageCard({
  template,
  variableValues,
}: {
  template: AlimtalkTemplate;
  variableValues: Record<string, string>;
}): React.ReactElement {
  const content = replaceTemplateVariables(template.content, variableValues);
  const isCertification = template.code === 'CERT_COMPLETE';

  return (
    <div className="flex gap-2 px-4 py-2">
      {/* 프로필 이미지 - 카카오톡 채널 프로필 스타일 */}
      <div className="flex-shrink-0">
        <div className="h-10 w-10 overflow-hidden rounded-[12px] bg-[#FEE500]">
          <div className="flex h-full w-full items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#3C1E1E]" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.86 5.25 4.64 6.65-.15.55-.82 2.98-.85 3.18 0 0-.02.13.05.18.07.05.16.03.16.03.22-.03 2.54-1.67 3.6-2.35.77.12 1.58.18 2.4.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="min-w-0 flex-1" style={{ maxWidth: '380px' }}>
        <div className="mb-1 text-xs font-medium text-gray-800">네오인증서</div>

        {/* 말풍선 - 카카오톡 알림톡 스타일 */}
        <div className="overflow-hidden rounded-[18px] rounded-tl-[4px] border border-gray-200 bg-white shadow-sm">
          {/* 강조 표기 영역 (TEXT 타입) - 카카오톡 실제 스타일 */}
          {template.emphasizeType === 'TEXT' && template.emphasizeTitle && (
            <div
              className={cn(
                'border-b border-gray-100 px-4 py-4',
                isCertification ? 'bg-blue-50' : 'bg-orange-50'
              )}
            >
              <div className="flex items-start gap-3">
                {/* 체크/경고 아이콘 */}
                <div
                  className={cn(
                    'mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full',
                    isCertification ? 'bg-blue-500' : 'bg-orange-500'
                  )}
                >
                  {isCertification ? (
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-bold leading-tight text-gray-900">
                    {template.emphasizeTitle}
                  </div>
                  {template.emphasizeSubtitle && (
                    <div className="mt-1 text-[13px] leading-tight text-gray-500">
                      {template.emphasizeSubtitle}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 메시지 본문 */}
          <div className="px-4 py-3">
            <pre className="whitespace-pre-wrap break-words font-sans text-[14px] leading-[1.6] text-gray-900">
              {content}
            </pre>
          </div>

          {/* 버튼 영역 - 말풍선 내부 하단 */}
          {template.buttons.length > 0 && (
            <div className="border-t border-gray-100 px-3 pb-3 pt-2">
              {template.buttons.map((button, idx) => (
                <button
                  key={idx}
                  className="mt-1 block w-full rounded-md bg-[#FEE500] py-2.5 text-center text-[14px] font-medium text-[#191919] transition-colors hover:bg-[#FDD835]"
                >
                  {button.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 타임스탬프 */}
        <div className="mt-1 text-right text-[10px] text-gray-400">오후 2:30</div>
      </div>
    </div>
  );
}

/**
 * 템플릿 정보 패널
 */
function TemplateInfoPanel({ template }: { template: AlimtalkTemplate }): React.ReactElement {
  const messageTypeLabels: Record<string, string> = {
    BA: '기본형',
    EX: '부가정보형',
    AD: '채널추가형',
    MI: '복합형',
  };

  const emphasizeTypeLabels: Record<string, string> = {
    NONE: '없음',
    TEXT: '강조표기형',
    IMAGE: '이미지형',
    ITEM_LIST: '아이템리스트형',
  };

  const charCount = template.content.length;

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-800">템플릿 정보</h3>

      {/* 기본 정보 그리드 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="text-xs text-gray-500">템플릿 코드</div>
          <div className="mt-1 font-mono font-semibold text-gray-900">{template.code}</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="text-xs text-gray-500">메시지 유형</div>
          <div className="mt-1 font-semibold text-gray-900">{messageTypeLabels[template.messageType]}</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="text-xs text-gray-500">강조 유형</div>
          <div className="mt-1 font-semibold text-gray-900">{emphasizeTypeLabels[template.emphasizeType]}</div>
        </div>
      </div>

      {/* 제한사항 체크 */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="text-sm text-gray-600">본문</span>
          <span className={cn('text-sm font-semibold', charCount > 1000 ? 'text-red-500' : 'text-green-600')}>
            {charCount} / 1,000자
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="text-sm text-gray-600">버튼</span>
          <span className="text-sm font-semibold text-green-600">
            {template.buttons.length} / 5개
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="text-sm text-gray-600">변수</span>
          <span className="text-sm font-semibold text-green-600">
            {template.variables.length} / 40개
          </span>
        </div>
      </div>

      {/* 카카오톡 렌더링 참고사항 */}
      <div className="mt-5 rounded-lg bg-amber-50 p-4">
        <h4 className="mb-2 text-sm font-semibold text-amber-800">카카오톡 렌더링 참고</h4>
        <ul className="space-y-1.5 text-xs text-amber-700">
          <li>• 줄바꿈: API 발송 시 <code className="rounded bg-amber-100 px-1.5 py-0.5">\n</code> 사용</li>
          <li>• 특수문자: ■●▶ 등 유니코드 문자만 지원</li>
          <li>• 이모지: 사용 불가 (텍스트 명령어로 대체)</li>
          <li>• 강조표기형: 카카오톡 8.4.0 이상 필요</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * 발송 시뮬레이션 결과
 */
interface SimulationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * 알림톡 템플릿 미리보기 컴포넌트
 */
export function AlimtalkTemplatePreview({
  onSimulateSend,
}: {
  onSimulateSend?: (params: {
    templateCode: string;
    recipientPhone: string;
    message: string;
    type: 'CERTIFICATION' | 'RECALL';
    buttons?: { name: string; url: string }[];
  }) => Promise<{ success: boolean; notificationId?: string; error?: string }>;
}): React.ReactElement {
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const v of TEMPLATES[0]?.variables ?? []) {
      initial[v.name] = v.defaultValue;
    }
    return initial;
  });

  const selectedTemplate = TEMPLATES[selectedTemplateIndex];

  // 템플릿 변경 시 변수값 초기화
  const handleTemplateChange = (index: number) => {
    setSelectedTemplateIndex(index);
    const template = TEMPLATES[index];
    if (template) {
      const newValues: Record<string, string> = {};
      for (const v of template.variables) {
        newValues[v.name] = v.defaultValue;
      }
      setVariableValues(newValues);
    }
  };

  const handleVariableChange = (name: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSimulateSend = async () => {
    if (!onSimulateSend || !selectedTemplate) return;

    setIsSimulating(true);
    setSimulationResult(null);

    const renderedMessage = replaceTemplateVariables(selectedTemplate.content, variableValues);
    const renderedButtons = selectedTemplate.buttons
      .filter((b) => b.urlTemplate)
      .map((b) => ({
        name: b.name,
        url: replaceTemplateVariables(b.urlTemplate ?? '', variableValues),
      }));

    const type = selectedTemplate.code === 'CERT_COMPLETE' ? 'CERTIFICATION' as const : 'RECALL' as const;

    try {
      const result = await onSimulateSend({
        templateCode: selectedTemplate.code,
        recipientPhone: '01000005678', // 시뮬레이션용 기본 번호
        message: renderedMessage,
        type,
        buttons: renderedButtons,
      });
      setSimulationResult(result);
    } catch {
      setSimulationResult({ success: false, error: '시뮬레이션 중 오류가 발생했습니다.' });
    } finally {
      setIsSimulating(false);
    }
  };

  if (!selectedTemplate) {
    return <div>템플릿을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-[#FEE500]">
        <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#3C1E1E]" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.86 5.25 4.64 6.65-.15.55-.82 2.98-.85 3.18 0 0-.02.13.05.18.07.05.16.03.16.03.22-.03 2.54-1.67 3.6-2.35.77.12 1.58.18 2.4.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
            </svg>
            <div>
              <span className="text-lg font-bold text-[#3C1E1E]">알림톡 템플릿</span>
              <span className="ml-1.5 text-xs text-[#5C4033]">미리보기</span>
            </div>
          </div>
          <div className="rounded-full bg-[#3C1E1E]/10 px-3 py-1">
            <span className="text-xs font-medium text-[#3C1E1E]">테스트용</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* 템플릿 선택 탭 */}
        <div className="mb-6 flex gap-3">
          {TEMPLATES.map((template, index) => (
            <Button
              key={template.code}
              variant={selectedTemplateIndex === index ? 'default' : 'outline'}
              size="default"
              onClick={() => handleTemplateChange(index)}
              className={cn(
                'px-6',
                selectedTemplateIndex === index && 'bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FDD835]'
              )}
            >
              {template.code}: {template.name}
            </Button>
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[auto_1fr]">
          {/* 좌측: 모바일 디바이스 미리보기 */}
          <div className="flex flex-col items-center">
            <h2 className="mb-3 text-base font-semibold text-gray-800">카카오톡 미리보기</h2>

            {/* 모바일 디바이스 프레임 (430x930) */}
            <div className="relative">
              {/* 디바이스 외부 프레임 */}
              <div
                className="relative overflow-hidden rounded-[50px] bg-gray-900 p-3 shadow-2xl"
                style={{ width: '460px' }}
              >
                {/* 노치 영역 */}
                <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
                  <div className="h-8 w-36 rounded-b-3xl bg-gray-900" />
                </div>

                {/* 스크린 영역 */}
                <div
                  className="relative overflow-hidden rounded-[38px] bg-white"
                  style={{ width: '430px', height: '930px' }}
                >
                  {/* 상태 바 */}
                  <div className="flex h-12 items-center justify-between bg-[#B2C7D9] px-8">
                    <span className="text-sm font-medium text-gray-800">14:30</span>
                    <div className="flex items-center gap-1.5">
                      <svg className="h-4 w-4 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 20.5c4.14 0 7.5-1.68 7.5-3.75V7.25c0-2.07-3.36-3.75-7.5-3.75S4.5 5.18 4.5 7.25v9.5c0 2.07 3.36 3.75 7.5 3.75z" opacity="0.3"/>
                        <path d="M2 17.5v2C2 21.99 6.48 24 12 24s10-2.01 10-4.5v-2c0 2.49-4.48 4.5-10 4.5S2 19.99 2 17.5z"/>
                      </svg>
                      <svg className="h-4 w-4 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                      </svg>
                      <div className="ml-1 h-3.5 w-6 rounded-sm border border-gray-800 p-0.5">
                        <div className="h-full w-3/4 rounded-sm bg-gray-800" />
                      </div>
                    </div>
                  </div>

                  {/* 카카오톡 네비게이션 바 */}
                  <div className="flex h-14 items-center justify-between bg-[#B2C7D9] px-4">
                    <button className="flex h-10 w-10 items-center justify-center">
                      <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 overflow-hidden rounded-full bg-[#FEE500]">
                        <div className="flex h-full w-full items-center justify-center">
                          <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#3C1E1E]" fill="currentColor">
                            <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.86 5.25 4.64 6.65-.15.55-.82 2.98-.85 3.18 0 0-.02.13.05.18.07.05.16.03.16.03.22-.03 2.54-1.67 3.6-2.35.77.12 1.58.18 2.4.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                          </svg>
                        </div>
                      </div>
                      <span className="text-base font-semibold text-gray-900">네오인증서</span>
                    </div>
                    <button className="flex h-10 w-10 items-center justify-center">
                      <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>

                  {/* 채팅 영역 (스크롤 가능) */}
                  <div
                    className="overflow-y-auto bg-[#B2C7D9]"
                    style={{ height: 'calc(930px - 48px - 56px - 56px)' }}
                  >
                    {/* 날짜 구분선 */}
                    <div className="flex items-center justify-center py-4">
                      <div className="rounded-full bg-gray-500/20 px-4 py-1.5">
                        <span className="text-sm text-gray-600">2026년 1월 23일 목요일</span>
                      </div>
                    </div>

                    <AlimtalkMessageCard
                      template={selectedTemplate}
                      variableValues={variableValues}
                    />

                    {/* 하단 여백 */}
                    <div className="h-20" />
                  </div>

                  {/* 하단 입력 영역 */}
                  <div className="absolute bottom-0 left-0 right-0 flex h-14 items-center gap-2 border-t border-gray-200 bg-white px-4">
                    <button className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <div className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-400">
                      메시지를 입력하세요
                    </div>
                    <button className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* 디바이스 크기 표시 */}
              <div className="mt-3 text-center text-xs text-gray-500">
                430 × 930 px (모바일 기준)
              </div>
            </div>
          </div>

          {/* 우측: 템플릿 정보 + 변수 편집 + 버튼 정보 */}
          <div className="space-y-6">
            {/* 템플릿 정보 */}
            <TemplateInfoPanel template={selectedTemplate} />

            {/* 변수 편집 */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-800">변수 편집</h2>
              <div className="space-y-5">
                {selectedTemplate.variables.map((variable) => (
                  <div key={variable.name}>
                    <Label htmlFor={variable.name} className="mb-1.5 block text-sm">
                      <span className="font-mono font-medium text-blue-600">#{`{${variable.name}}`}</span>
                      <span className="ml-2 font-normal text-gray-500">{variable.description}</span>
                    </Label>
                    {variable.name === '제품목록' ? (
                      <textarea
                        id={variable.name}
                        value={variableValues[variable.name] ?? ''}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={variable.name}
                        value={variableValues[variable.name] ?? ''}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                        className="h-10"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* 초기화 버튼 */}
              <Button
                variant="outline"
                className="mt-5 w-full"
                onClick={() => handleTemplateChange(selectedTemplateIndex)}
              >
                기본값으로 초기화
              </Button>

              {/* 발송 시뮬레이션 */}
              {onSimulateSend && (
                <div className="mt-4 border-t pt-4">
                  <Button
                    className="w-full bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FDD835]"
                    onClick={handleSimulateSend}
                    disabled={isSimulating}
                  >
                    {isSimulating ? '발송 중...' : '발송 시뮬레이션'}
                  </Button>
                  <p className="mt-2 text-center text-xs text-gray-500">
                    현재 변수값으로 mock 메시지를 저장합니다
                  </p>

                  {simulationResult && (
                    <div
                      className={cn(
                        'mt-3 rounded-lg p-3 text-sm',
                        simulationResult.success
                          ? 'bg-green-50 text-green-800'
                          : 'bg-red-50 text-red-800'
                      )}
                    >
                      {simulationResult.success ? (
                        <>
                          <div className="font-medium">저장 완료</div>
                          <div className="mt-1 text-xs">
                            ID: {simulationResult.notificationId}
                          </div>
                          <a
                            href="/mock/kakao"
                            className="mt-2 inline-block text-xs font-medium text-blue-600 underline"
                          >
                            메시지 목록에서 확인 →
                          </a>
                        </>
                      ) : (
                        <div>{simulationResult.error}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 버튼 정보 */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-gray-800">버튼 정보</h3>
              <div className="space-y-3">
                {selectedTemplate.buttons.map((button, idx) => (
                  <div key={idx} className="rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-blue-100 px-2 py-1 font-mono text-xs font-medium text-blue-700">
                        {button.type}
                      </span>
                      <span className="font-medium text-gray-900">{button.name}</span>
                    </div>
                    {button.urlTemplate && (
                      <div className="mt-2 truncate text-sm text-gray-500">
                        {replaceTemplateVariables(button.urlTemplate, variableValues)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
