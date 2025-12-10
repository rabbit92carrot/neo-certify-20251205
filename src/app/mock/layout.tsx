import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mock 페이지 | 네오인증서',
  description: '알림톡 미리보기 및 테스트용 Mock 페이지',
};

/**
 * Mock 페이지 레이아웃
 * 인증 불필요 - 공개 라우트
 */
export default function MockLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-[#FEE500] shadow-sm">
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="flex items-center gap-2">
            {/* 카카오톡 스타일 아이콘 */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3C1E1E]">
              <svg
                className="h-5 w-5 text-[#FEE500]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.88 1.89 5.42 4.72 6.83-.17.6-.62 2.18-.71 2.52-.12.43.16.43.33.31.14-.09 2.17-1.47 3.05-2.07.51.07 1.03.11 1.56.11h.1c5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#3C1E1E]">네오인증서</h1>
              <p className="text-xs text-[#3C1E1E]/70">알림톡 Mock</p>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-lg">{children}</main>
    </div>
  );
}
