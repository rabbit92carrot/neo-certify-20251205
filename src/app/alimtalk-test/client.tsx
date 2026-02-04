'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Minus,
  Send,
  RotateCcw,
  Phone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  ALIMTALK_TEMPLATES,
  replaceTemplateVariables,
  type AlimtalkTemplate,
} from '@/constants/alimtalk-templates';
import { formatPhoneNumber } from '@/lib/validations/common';
import { sendBulkAlimtalkAction, verifyTestPasswordAction } from './actions';

const SESSION_KEY = 'alimtalk-test-auth';

interface AlimtalkTestSendClientProps {
  initialTemplate?: string;
  initialPhone?: string;
}

interface RecipientEntry {
  id: string;
  phone: string;
}

interface SendResultItem {
  phone: string;
  success: boolean;
  error?: string;
}

// 승인된 템플릿만 필터링 (SAMPLE_ 접두사 제외)
const APPROVED_TEMPLATES = Object.entries(ALIMTALK_TEMPLATES)
  .filter(([code]) => !code.startsWith('SAMPLE_'))
  .reduce(
    (acc, [code, template]) => {
      acc[code] = template;
      return acc;
    },
    {} as Record<string, AlimtalkTemplate>
  );

export function AlimtalkTestSendClient({
  initialTemplate = 'CERT_COMPLETE',
  initialPhone = '',
}: AlimtalkTestSendClientProps): React.ReactElement {
  // 인증 상태
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 세션 스토리지에서 인증 상태 확인
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    setIsAuthenticated(stored === 'true');
  }, []);

  // 비밀번호 검증
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setAuthError(null);

    try {
      const result = await verifyTestPasswordAction(passwordInput);
      if (result.success) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        setIsAuthenticated(true);
        toast.success('인증되었습니다.');
      } else {
        setAuthError(result.error || '인증에 실패했습니다.');
      }
    } catch {
      setAuthError('인증 중 오류가 발생했습니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  // 템플릿 선택
  const [selectedTemplateCode, setSelectedTemplateCode] = useState(
    initialTemplate in APPROVED_TEMPLATES ? initialTemplate : 'CERT_COMPLETE'
  );
  const selectedTemplate = APPROVED_TEMPLATES[selectedTemplateCode];

  // 변수 값 (실시간 편집)
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      if (selectedTemplate) {
        for (const v of selectedTemplate.variables) {
          initial[v.name] = v.defaultValue;
        }
      }
      return initial;
    }
  );

  // 수신자 목록 (동적, min 1, max 10)
  const [recipients, setRecipients] = useState<RecipientEntry[]>([
    { id: crypto.randomUUID(), phone: initialPhone },
  ]);

  // 발송 상태
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState<SendResultItem[] | null>(null);
  const [isTestMode, setIsTestMode] = useState<boolean | null>(null);
  const [forceRealSend, setForceRealSend] = useState(false);

  // 버튼 URL 베이스 도메인 (기본값: 카카오 승인된 도메인)
  const [baseUrl, setBaseUrl] = useState('https://neo-certify.com');

  // 실시간 렌더링된 메시지
  const renderedMessage = useMemo(() => {
    if (!selectedTemplate) return '';
    return replaceTemplateVariables(selectedTemplate.content, variableValues);
  }, [selectedTemplate, variableValues]);

  // 렌더링된 버튼 URL (완전한 URL로 변환)
  const renderedButtons = useMemo(() => {
    if (!selectedTemplate) return [];
    return selectedTemplate.buttons
      .filter((b) => b.urlTemplate)
      .map((b) => {
        const path = replaceTemplateVariables(b.urlTemplate!, variableValues);
        // 상대 경로인 경우 baseUrl을 붙여 완전한 URL로 변환
        const fullUrl = path.startsWith('http') ? path : `${baseUrl}${path}`;
        return {
          name: b.name,
          type: b.type,
          url: fullUrl,
        };
      });
  }, [selectedTemplate, variableValues, baseUrl]);

  // 템플릿 변경 시 변수 초기화
  const handleTemplateChange = useCallback((code: string) => {
    setSelectedTemplateCode(code);
    const template = APPROVED_TEMPLATES[code];
    if (template) {
      const newValues: Record<string, string> = {};
      for (const v of template.variables) {
        newValues[v.name] = v.defaultValue;
      }
      setVariableValues(newValues);
    }
    setSendResults(null);
  }, []);

  // 변수 값 변경
  const handleVariableChange = useCallback((name: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // 변수 기본값으로 초기화
  const handleResetVariables = useCallback(() => {
    if (!selectedTemplate) return;
    const newValues: Record<string, string> = {};
    for (const v of selectedTemplate.variables) {
      newValues[v.name] = v.defaultValue;
    }
    setVariableValues(newValues);
  }, [selectedTemplate]);

  // 수신자 추가
  const handleAddRecipient = useCallback(() => {
    if (recipients.length >= 10) {
      toast.error('최대 10명까지 추가할 수 있습니다.');
      return;
    }
    setRecipients((prev) => [...prev, { id: crypto.randomUUID(), phone: '' }]);
  }, [recipients.length]);

  // 수신자 제거
  const handleRemoveRecipient = useCallback(
    (id: string) => {
      if (recipients.length <= 1) {
        toast.error('최소 1명의 수신자가 필요합니다.');
        return;
      }
      setRecipients((prev) => prev.filter((r) => r.id !== id));
    },
    [recipients.length]
  );

  // 수신자 전화번호 변경
  const handleUpdateRecipient = useCallback((id: string, phone: string) => {
    setRecipients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, phone } : r))
    );
  }, []);

  // 발송 실행
  const handleSend = async () => {
    const validRecipients = recipients.filter(
      (r) => r.phone.replace(/[^0-9]/g, '').length >= 10
    );

    if (validRecipients.length === 0) {
      toast.error('유효한 전화번호를 입력해주세요. (10자리 이상)');
      return;
    }

    if (!selectedTemplate) {
      toast.error('템플릿을 선택해주세요.');
      return;
    }

    setIsSending(true);
    setSendResults(null);
    setIsTestMode(null);

    try {
      const result = await sendBulkAlimtalkAction({
        templateCode: selectedTemplateCode,
        message: renderedMessage,
        recipients: validRecipients.map((r) => ({
          phone: r.phone.replace(/[^0-9]/g, ''),
        })),
        buttons: selectedTemplate.buttons
          .filter((b) => b.urlTemplate && b.type !== 'BT')
          .map((b) => {
            const path = replaceTemplateVariables(b.urlTemplate!, variableValues);
            // 상대 경로인 경우 baseUrl을 붙여 완전한 URL로 변환
            const fullUrl = path.startsWith('http') ? path : `${baseUrl}${path}`;
            return {
              name: b.name,
              linkType: b.type as 'WL' | 'AL' | 'DS' | 'BK' | 'BC',
              linkM: fullUrl,
              linkP: fullUrl,
            };
          }),
        forceRealSend,
      });

      setSendResults(result.results);
      setIsTestMode(result.testMode);

      if (result.successCount === validRecipients.length) {
        toast.success(
          `${result.successCount}건 발송 ${result.testMode ? '시뮬레이션' : ''} 완료`
        );
      } else if (result.successCount > 0) {
        toast.warning(
          `성공 ${result.successCount}건 / 실패 ${result.failCount}건`
        );
      } else {
        toast.error('발송에 실패했습니다.');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '발송 중 오류가 발생했습니다.';
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  // 창 닫기
  const handleClose = () => {
    window.close();
  };

  // 로딩 중
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="text-sm text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 비밀번호 입력 화면
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <Lock className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-xl">알림톡 발송 테스트</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              이 페이지는 비밀번호로 보호되어 있습니다.
              <br />
              실제 API 호출로 요금이 발생할 수 있습니다.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="mt-1.5"
                  autoFocus
                />
              </div>
              {authError && (
                <p className="text-sm text-red-600">{authError}</p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={isVerifying || !passwordInput}
              >
                {isVerifying ? '확인 중...' : '확인'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-[#3C1E1E]"
                fill="currentColor"
              >
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.86 5.25 4.64 6.65-.15.55-.82 2.98-.85 3.18 0 0-.02.13.05.18.07.05.16.03.16.03.22-.03 2.54-1.67 3.6-2.35.77.12 1.58.18 2.4.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold">알림톡 발송 테스트</h1>
              <p className="text-xs text-muted-foreground">
                실제 API를 통한 발송 테스트
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="px-6 py-4">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
          {/* 왼쪽: 템플릿 선택 및 변수 편집 */}
          <div className="min-w-0 space-y-4">
            {/* 템플릿 선택 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">템플릿 선택</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={selectedTemplateCode}
                  onValueChange={handleTemplateChange}
                >
                  <TabsList className="w-full">
                    {Object.entries(APPROVED_TEMPLATES).map(
                      ([code, template]) => (
                        <TabsTrigger
                          key={code}
                          value={code}
                          className="flex-1 text-xs"
                        >
                          {template.name}
                        </TabsTrigger>
                      )
                    )}
                  </TabsList>
                </Tabs>
                {selectedTemplate && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline">
                      유형: {selectedTemplate.messageType}
                    </Badge>
                    <Badge variant="outline">
                      강조: {selectedTemplate.emphasizeType}
                    </Badge>
                    <Badge variant="outline">
                      변수: {selectedTemplate.variables.length}개
                    </Badge>
                    <Badge variant="outline">
                      버튼: {selectedTemplate.buttons.length}개
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 변수 편집 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">변수 편집</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetVariables}
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    초기화
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTemplate?.variables.map((variable) => (
                  <div key={variable.name}>
                    <Label
                      htmlFor={variable.name}
                      className="mb-1.5 block text-sm"
                    >
                      <code className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                        #{`{${variable.name}}`}
                      </code>
                      <span className="ml-2 font-normal text-gray-500">
                        {variable.description}
                      </span>
                    </Label>
                    {variable.name === '제품목록' ? (
                      <textarea
                        id={variable.name}
                        value={variableValues[variable.name] ?? ''}
                        onChange={(e) =>
                          handleVariableChange(variable.name, e.target.value)
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={variable.name}
                        value={variableValues[variable.name] ?? ''}
                        onChange={(e) =>
                          handleVariableChange(variable.name, e.target.value)
                        }
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 수신자 목록 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    수신자 목록 ({recipients.length}/10)
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddRecipient}
                    disabled={recipients.length >= 10}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {recipients.map((recipient, index) => (
                  <div key={recipient.id} className="flex items-center gap-2">
                    <span className="w-6 flex-shrink-0 text-center text-sm text-muted-foreground">
                      {index + 1}.
                    </span>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="010-0000-0000"
                        value={formatPhoneNumber(recipient.phone)}
                        onChange={(e) =>
                          handleUpdateRecipient(recipient.id, e.target.value)
                        }
                        className="pl-9"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRecipient(recipient.id)}
                      disabled={recipients.length <= 1}
                      className="flex-shrink-0 text-red-500 hover:text-red-600"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 메시지 미리보기 및 발송 */}
          <div className="space-y-4">
            {/* 메시지 미리보기 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">메시지 미리보기</CardTitle>
              </CardHeader>
              <CardContent>
                {/* 카카오톡 스타일 미리보기 */}
                <div className="rounded-2xl bg-[#B2C7D9] p-4">
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    {/* 강조 헤더 */}
                    {selectedTemplate?.emphasizeType === 'TEXT' && (
                      <div className="mb-3 border-b pb-3">
                        <p className="text-lg font-bold text-gray-900">
                          {selectedTemplate.emphasizeTitle}
                        </p>
                        {selectedTemplate.emphasizeSubtitle && (
                          <p className="text-sm text-gray-500">
                            {selectedTemplate.emphasizeSubtitle}
                          </p>
                        )}
                      </div>
                    )}

                    {/* 메시지 본문 */}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                      {renderedMessage}
                    </p>

                    {/* 버튼 */}
                    {renderedButtons.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {renderedButtons.map((button, index) => (
                          <div
                            key={index}
                            className="block w-full rounded-lg bg-[#FEE500] py-2.5 text-center text-sm font-medium text-[#3C1E1E]"
                          >
                            {button.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 버튼 URL 베이스 도메인 설정 */}
                {renderedButtons.length > 0 && (
                  <div className="mt-3 rounded-lg bg-blue-50 p-3">
                    <Label htmlFor="baseUrl" className="mb-1.5 block text-xs font-medium text-blue-700">
                      버튼 URL 베이스 도메인
                    </Label>
                    <Input
                      id="baseUrl"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="h-8 text-sm"
                    />
                  </div>
                )}

                {/* 버튼 URL 정보 */}
                {renderedButtons.length > 0 && (
                  <div className="mt-3 rounded-lg bg-gray-50 p-3">
                    <p className="mb-2 text-xs font-medium text-gray-600">
                      버튼 URL (발송 시 전달)
                    </p>
                    {renderedButtons.map((button, index) => (
                      <div key={index} className="text-xs text-gray-500">
                        <span className="font-medium">{button.name}:</span>{' '}
                        <code className="break-all text-blue-600">{button.url}</code>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 발송 버튼 */}
            <Card
              className={
                forceRealSend
                  ? 'border-red-300 bg-red-50'
                  : 'border-orange-200 bg-orange-50'
              }
            >
              <CardContent className="pt-4">
                {/* 실제 발송 토글 */}
                <div className="mb-4 flex items-center justify-between rounded-lg border bg-white p-3">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="force-real-send"
                      className={`text-sm font-medium ${forceRealSend ? 'text-red-700' : 'text-gray-700'}`}
                    >
                      실제 발송 모드
                    </Label>
                    {forceRealSend && (
                      <Badge variant="destructive" className="text-xs">
                        API 호출
                      </Badge>
                    )}
                  </div>
                  <Switch
                    id="force-real-send"
                    checked={forceRealSend}
                    onCheckedChange={setForceRealSend}
                  />
                </div>

                <div
                  className={`mb-3 flex items-start gap-2 ${forceRealSend ? 'text-red-700' : 'text-orange-700'}`}
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p className="text-xs">
                    {forceRealSend ? (
                      <>
                        <strong>경고:</strong> 실제 카카오 알림톡이
                        발송됩니다. 수신자 번호를 다시 확인하세요!
                      </>
                    ) : (
                      <>
                        <strong>Mock 모드:</strong> 실제 발송 없이 시뮬레이션만
                        진행됩니다.
                      </>
                    )}
                  </p>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSend}
                  disabled={isSending}
                  variant={forceRealSend ? 'destructive' : 'default'}
                >
                  {isSending ? (
                    <>발송 중...</>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {forceRealSend
                        ? `실제 발송 (${recipients.length}명)`
                        : `발송 테스트 (${recipients.length}명)`}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 발송 결과 */}
            {sendResults && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    발송 결과
                    {isTestMode && (
                      <Badge variant="secondary" className="text-xs">
                        Mock 모드
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sendResults.map((result, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 rounded-lg p-2 ${
                          result.success ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        {result.success ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">
                          {formatPhoneNumber(result.phone)}
                        </span>
                        <span
                          className={`ml-auto text-xs ${
                            result.success ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {result.success
                            ? '발송 성공'
                            : result.error || '발송 실패'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
