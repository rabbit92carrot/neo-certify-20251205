'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Factory,
  Truck,
  Warehouse,
  FileText,
  Mail,
  Settings,
  LogOut,
} from 'lucide-react';

const navItems = [
  { label: '대시보드', href: '/design-preview/full-redesign', icon: LayoutDashboard },
  { label: '제품 관리', href: '#', icon: Package },
  { label: '생산 등록', href: '#', icon: Factory },
  { label: '출고', href: '#', icon: Truck },
  { label: '재고 조회', href: '#', icon: Warehouse },
  { label: '거래 이력', href: '#', icon: FileText },
  { label: '알림 보관함', href: '#', icon: Mail },
  { label: '환경 설정', href: '#', icon: Settings },
];

/**
 * 아이콘 중심 좁은 사이드바
 * 다우오피스 스타일 (w-16)
 */
export function IconSidebar(): React.ReactElement {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-20 flex-col daou-bg-card daou-shadow-md items-center py-4">
      {/* 로고 */}
      <div className="mb-6">
        <div className="w-10 h-10 daou-gradient-primary daou-radius-md flex items-center justify-center">
          <span className="text-white font-bold text-lg">N</span>
        </div>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 flex flex-col items-center gap-2 overflow-y-auto daou-scrollbar px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'group relative flex items-center justify-center w-12 h-12 daou-radius-md transition-all duration-200',
                isActive ? 'daou-gradient-primary text-white' : 'daou-text-secondary hover:bg-slate-50'
              )}
              title={item.label}
            >
              <Icon className="w-5 h-5" />

              {/* 툴팁 */}
              <span className="absolute left-full ml-3 px-3 py-1.5 daou-bg-card daou-shadow-lg daou-radius-sm text-sm daou-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* 로그아웃 버튼 */}
      <div className="mt-4">
        <button
          className="group relative flex items-center justify-center w-12 h-12 daou-radius-md daou-text-secondary hover:bg-rose-50 hover:text-rose-600 transition-colors"
          title="로그아웃"
        >
          <LogOut className="w-5 h-5" />

          {/* 툴팁 */}
          <span className="absolute left-full ml-3 px-3 py-1.5 daou-bg-card daou-shadow-lg daou-radius-sm text-sm daou-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            로그아웃
          </span>
        </button>
      </div>
    </aside>
  );
}
