'use client';

import Link from 'next/link';
import { Bell, ArrowLeft } from 'lucide-react';

interface PreviewHeaderProps {
  title: string;
  showBack?: boolean;
  backHref?: string;
}

/**
 * 다우오피스 스타일 헤더
 */
export function PreviewHeader({
  title,
  showBack = true,
  backHref = '/design-preview',
}: PreviewHeaderProps): React.ReactElement {
  return (
    <header className="sticky top-0 z-30 h-16 daou-bg-card daou-shadow-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {showBack && (
          <Link
            href={backHref}
            className="flex items-center gap-2 daou-text-secondary hover:daou-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">프리뷰 목록</span>
          </Link>
        )}
        <h1 className="text-lg font-semibold daou-text-primary">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* 알림 버튼 */}
        <button className="relative p-2 daou-radius-md hover:bg-slate-50 transition-colors">
          <Bell className="w-5 h-5 daou-text-secondary" />
          {/* 알림 배지 */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
