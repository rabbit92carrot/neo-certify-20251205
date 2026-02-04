'use client';

/**
 * 사업자등록증 미리보기 컴포넌트
 *
 * PDF와 이미지 파일을 브라우저 내에서 미리보기합니다.
 * - PDF: iframe을 사용한 브라우저 내장 뷰어
 * - 이미지(JPG/PNG): img 태그로 직접 표시
 */

import { Download, FileText, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ============================================================================
// 타입
// ============================================================================

interface BusinessLicensePreviewProps {
  /** Signed URL (null이면 파일 없음 상태 표시) */
  signedUrl: string | null;
  /** 파일명 (확장자 판별용, 예: "business_license.pdf") */
  fileName: string;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 추가 클래스명 */
  className?: string;
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 파일 확장자 추출
 */
const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

/**
 * PDF 파일인지 확인
 */
const isPdf = (fileName: string): boolean => {
  return getFileExtension(fileName) === 'pdf';
};

/**
 * 이미지 파일인지 확인
 */
const isImage = (fileName: string): boolean => {
  const ext = getFileExtension(fileName);
  return ['jpg', 'jpeg', 'png'].includes(ext);
};

// ============================================================================
// 컴포넌트
// ============================================================================

export function BusinessLicensePreview({
  signedUrl,
  fileName,
  isLoading = false,
  className,
}: BusinessLicensePreviewProps): React.ReactElement {
  // 로딩 상태
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-[350px] w-full rounded-lg" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  // URL 없음 (파일 없거나 로드 실패)
  if (!signedUrl) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8',
          'min-h-[200px]',
          className
        )}
      >
        <FileText className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">
          사업자등록증 파일이 없습니다
        </p>
      </div>
    );
  }

  const fileIsPdf = isPdf(fileName);
  const fileIsImage = isImage(fileName);

  return (
    <div className={cn('space-y-3', className)}>
      {/* 미리보기 영역 */}
      <div className="relative overflow-hidden rounded-lg border bg-white">
        {fileIsPdf ? (
          // PDF 미리보기 (브라우저 내장 뷰어)
          <iframe
            src={signedUrl}
            className="h-[350px] w-full"
            title="사업자등록증"
          />
        ) : fileIsImage ? (
          // 이미지 미리보기
          <div className="flex items-center justify-center bg-gray-50 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signedUrl}
              alt="사업자등록증"
              className="max-h-[350px] w-auto object-contain"
            />
          </div>
        ) : (
          // 지원하지 않는 형식
          <div className="flex h-[200px] flex-col items-center justify-center">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              미리보기를 지원하지 않는 파일 형식입니다
            </p>
          </div>
        )}
      </div>

      {/* 다운로드 버튼 */}
      <Button variant="outline" asChild className="w-full">
        <a href={signedUrl} download={fileName} target="_blank" rel="noopener noreferrer">
          <Download className="mr-2 h-4 w-4" />
          다운로드
        </a>
      </Button>

      {/* 파일 정보 */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        {fileIsPdf ? (
          <FileText className="h-3 w-3" />
        ) : fileIsImage ? (
          <ImageIcon className="h-3 w-3" />
        ) : null}
        <span>{fileName}</span>
      </div>
    </div>
  );
}
