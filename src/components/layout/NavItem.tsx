'use client';

/**
 * 네비게이션 항목 컴포넌트
 * 사이드바에서 각 메뉴 아이템을 렌더링합니다.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Factory,
  Truck,
  History,
  Warehouse,
  FileText,
  Settings,
  Stethoscope,
  Building2,
  UserCheck,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IconName, NavigationItem } from '@/constants/navigation';

/**
 * 아이콘 이름과 컴포넌트 매핑
 */
const iconMap: Record<IconName, LucideIcon> = {
  LayoutDashboard,
  Package,
  Factory,
  Truck,
  History,
  Warehouse,
  FileText,
  Settings,
  Stethoscope,
  Building2,
  UserCheck,
  AlertCircle,
};

interface NavItemProps {
  item: NavigationItem;
}

/**
 * 네비게이션 항목 컴포넌트
 */
export function NavItem({ item }: NavItemProps): React.ReactElement {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = iconMap[item.icon];

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition-colors',
        'hover:bg-gray-100',
        isActive && 'bg-blue-50 text-blue-700 hover:bg-blue-50'
      )}
    >
      <Icon className={cn('h-5 w-5', isActive ? 'text-blue-700' : 'text-gray-500')} />
      <span className={isActive ? 'text-blue-700' : 'text-gray-700'}>{item.label}</span>
    </Link>
  );
}
