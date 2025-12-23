export const metadata = {
  title: '고객센터 문의 | 네오인증서',
  description: '네오인증서 고객센터 문의 안내',
};

/**
 * 고객센터 문의 페이지
 * 회수 알림톡의 "고객센터 문의" 버튼을 통해 접근하는 공개 페이지
 */
export default function InquiryPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-[#FEE500] px-4 py-4">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#3C1E1E]" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.86 5.25 4.64 6.65-.15.55-.82 2.98-.85 3.18 0 0-.02.13.05.18.07.05.16.03.16.03.22-.03 2.54-1.67 3.6-2.35.77.12 1.58.18 2.4.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
            </svg>
            <span className="text-lg font-bold text-[#3C1E1E]">네오인증서</span>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-md px-4 py-6">
        {/* 안내 카드 */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">고객센터 문의</h1>
              <p className="text-sm text-gray-500">도움이 필요하신가요?</p>
            </div>
          </div>

          <p className="mb-4 text-sm text-gray-600">
            인증 회수 관련 문의나 병원과 연락이 어려운 경우 아래 연락처로 문의해주세요.
          </p>

          {/* 중요 안내 */}
          <div className="rounded-xl bg-orange-50 p-4">
            <p className="text-sm text-orange-800">
              <strong>먼저 시술 병원에 연락해주세요.</strong>
              <br />
              대부분의 문의는 시술 병원에서 해결할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 연락처 정보 */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">연락처</h2>

          <div className="space-y-4">
            {/* 전화 문의 */}
            <a
              href="tel:1588-0000"
              className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">전화 문의</p>
                <p className="text-lg font-semibold text-gray-900">1588-0000</p>
              </div>
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>

            {/* 이메일 문의 */}
            <a
              href="mailto:support@neocertify.com"
              className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">이메일 문의</p>
                <p className="text-base font-semibold text-gray-900">support@neocertify.com</p>
              </div>
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        {/* 운영시간 */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">운영시간</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">평일</span>
              <span className="text-sm font-medium text-gray-900">09:00 - 18:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">점심시간</span>
              <span className="text-sm font-medium text-gray-900">12:00 - 13:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">주말/공휴일</span>
              <span className="text-sm font-medium text-gray-500">휴무</span>
            </div>
          </div>
        </div>

        {/* 자주 묻는 질문 */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">자주 묻는 질문</h2>

          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="mb-2 text-sm font-medium text-gray-900">
                Q. 인증 회수란 무엇인가요?
              </p>
              <p className="text-sm text-gray-600">
                시술 병원에서 인증 정보에 오류가 있어 기존 인증을 취소한 것입니다.
                새로운 인증이 발급될 수 있으니 병원에 문의해주세요.
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="mb-2 text-sm font-medium text-gray-900">
                Q. 병원과 연락이 되지 않습니다.
              </p>
              <p className="text-sm text-gray-600">
                병원 운영시간에 다시 연락해보시고, 계속 연결이 어려우시면
                위 고객센터로 문의해주세요.
              </p>
            </div>
          </div>
        </div>

        {/* 하단 안내 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            네오인증서는 정품 의료기기 인증 서비스를 제공합니다.
          </p>
        </div>
      </main>
    </div>
  );
}
