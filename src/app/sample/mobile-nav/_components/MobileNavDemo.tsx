'use client';

/**
 * 모바일 뷰포트 시뮬레이션 래퍼
 * 데스크톱에서 모바일 화면을 시뮬레이션하여 보여줍니다.
 */

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileNavDemoProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export function MobileNavDemo({
  children,
  title,
  description,
}: MobileNavDemoProps): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-200 py-4 px-4">
      {/* 상단 설명 영역 */}
      <div className="max-w-[430px] mx-auto mb-4">
        <Link href="/sample/mobile-nav">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>

      {/* 모바일 프레임 */}
      <div className="max-w-[430px] mx-auto">
        <div className="relative bg-white rounded-[2.5rem] shadow-2xl border-8 border-gray-800 overflow-hidden">
          {/* 노치 영역 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-50" />

          {/* 컨텐츠 영역 */}
          <div className="min-h-[700px] max-h-[800px] overflow-y-auto pt-8 relative">
            {children}
          </div>

          {/* 하단 홈 인디케이터 */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-800 rounded-full" />
        </div>
      </div>
    </div>
  );
}
