import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getVerificationData } from '@/services/verification.service';

// 공개 페이지 - 동적 렌더링
export const dynamic = 'force-dynamic';

export const metadata = {
  title: '정품 인증코드 확인 | 네오인증서',
  description: '시술받은 제품의 정품 인증코드를 확인하세요',
};

interface VerifyPageProps {
  params: Promise<{ treatmentId: string }>;
}

/**
 * 정품 인증코드 확인 페이지
 * 환자가 알림톡 버튼을 통해 접근하여 인증코드를 확인하는 공개 페이지
 * 회수된 시술의 경우 회수 안내 페이지를 표시
 */
export default async function VerifyPage({
  params,
}: VerifyPageProps): Promise<React.ReactElement> {
  const { treatmentId } = await params;

  const result = await getVerificationData(treatmentId);

  if (!result.success || !result.data) {
    notFound();
  }

  const { treatmentDate, hospitalName, codes, productSummary, isRecalled, recallInfo } = result.data;

  // 회수된 경우 회수 안내 페이지 표시
  if (isRecalled && recallInfo) {
    const formattedRecallDate = new Date(recallInfo.recalledAt).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-gray-600 px-4 py-4">
          <div className="mx-auto max-w-md">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.86 5.25 4.64 6.65-.15.55-.82 2.98-.85 3.18 0 0-.02.13.05.18.07.05.16.03.16.03.22-.03 2.54-1.67 3.6-2.35.77.12 1.58.18 2.4.18 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
              </svg>
              <span className="text-lg font-bold text-white">네오인증서</span>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="mx-auto max-w-md px-4 py-6">
          {/* 회수 안내 카드 */}
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">인증이 회수되었습니다</h1>
                <p className="text-sm text-gray-500">해당 시술의 정품 인증이 취소되었습니다</p>
              </div>
            </div>

            {/* 회수 정보 */}
            <div className="space-y-2 rounded-xl bg-orange-50 p-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">회수일시</span>
                <span className="text-sm font-medium text-gray-900">{formattedRecallDate}</span>
              </div>
              {recallInfo.hospitalName && recallInfo.hospitalName !== '(삭제됨)' && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">병원</span>
                  <span className="text-sm font-medium text-gray-900">{recallInfo.hospitalName}</span>
                </div>
              )}
              {recallInfo.hospitalContact && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">병원 연락처</span>
                  <a
                    href={`tel:${recallInfo.hospitalContact}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {recallInfo.hospitalContact}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* 안내 문구 */}
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-gray-900">안내</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>시술 병원에서 해당 인증을 회수하였습니다.</p>
              <p>자세한 사항은 시술 병원으로 문의해주세요.</p>
              <p>병원과 연락이 어려운 경우 고객센터로 문의해주세요.</p>
            </div>
          </div>

          {/* 고객센터 문의 버튼 */}
          <Link
            href="/inquiry"
            className="block w-full rounded-xl bg-[#FEE500] py-4 text-center text-base font-semibold text-[#3C1E1E] transition-colors hover:bg-[#FDD835]"
          >
            고객센터 문의
          </Link>

          {/* 안내 문구 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              이 페이지는 정품 인증 정보를 제공합니다.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // 날짜 포맷 (정상 인증 케이스)
  const formattedDate = new Date(treatmentDate).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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
        {/* 인증 완료 카드 */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">정품 인증 완료</h1>
              <p className="text-sm text-gray-500">본 제품은 정품임이 확인되었습니다</p>
            </div>
          </div>

          {/* 시술 정보 */}
          <div className="space-y-2 rounded-xl bg-gray-50 p-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">시술일</span>
              <span className="text-sm font-medium text-gray-900">{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">시술 병원</span>
              <span className="text-sm font-medium text-gray-900">{hospitalName}</span>
            </div>
          </div>
        </div>

        {/* 제품별 요약 */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">시술 제품</h2>
          <div className="space-y-3">
            {productSummary.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-sm font-medium text-gray-900">{product.productName}</span>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  {product.quantity}개
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 인증코드 목록 */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            인증코드 목록
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({codes.length}개)
            </span>
          </h2>
          <div className="space-y-2">
            {codes.map((code, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-gray-900">{code.code}</p>
                  <p className="text-xs text-gray-500">{code.productName}</p>
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 안내 문구 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            이 페이지는 정품 인증을 위한 정보를 제공합니다.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            문의사항은 시술 병원으로 연락해주세요.
          </p>
        </div>
      </main>
    </div>
  );
}
