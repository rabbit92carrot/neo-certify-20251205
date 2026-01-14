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
  { label: '대시보드', href: '/design-preview/style-only', icon: LayoutDashboard },
  { label: '제품 관리', href: '#', icon: Package },
  { label: '생산 등록', href: '#', icon: Factory },
  { label: '출고', href: '#', icon: Truck },
  { label: '재고 조회', href: '#', icon: Warehouse },
  { label: '거래 이력', href: '#', icon: FileText },
  { label: '알림 보관함', href: '#', icon: Mail },
  { label: '환경 설정', href: '#', icon: Settings },
];

/**
 * 스타일만 변경된 사이드바
 * 기존 w-64 구조 유지 + 다우오피스 스타일 적용
 */
export function StyleOnlySidebar(): React.ReactElement {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col daou-bg-card daou-shadow-md">
      {/* 로고 및 조직 정보 */}
      <div className="flex h-16 items-center px-6 border-b border-slate-100">
        <div className="flex flex-col">
          <span className="text-lg font-bold daou-text-gradient">네오인증서</span>
          <span className="text-xs daou-text-muted">제조사</span>
        </div>
      </div>

      {/* 조직명 */}
      <div className="px-6 py-4 border-b border-slate-100">
        <p className="text-sm font-medium daou-text-primary truncate">(주)잼버코리아</p>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto daou-scrollbar">
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 daou-radius-md transition-all duration-200',
                  isActive
                    ? 'daou-gradient-primary text-white'
                    : 'daou-text-secondary hover:bg-slate-50'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 로그아웃 버튼 */}
      <div className="p-4 border-t border-slate-100">
        <button className="flex items-center gap-3 w-full px-4 py-3 daou-radius-md daou-text-secondary hover:bg-rose-50 hover:text-rose-600 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
