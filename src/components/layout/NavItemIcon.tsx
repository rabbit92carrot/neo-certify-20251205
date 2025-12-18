'use client';

/**
 * 네비게이션 아이콘 컴포넌트
 * 아이콘 이름을 받아 해당 lucide-react 아이콘을 렌더링합니다.
 */

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
  Bell,
  Mail,
  type LucideIcon,
} from 'lucide-react';
import type { IconName } from '@/constants/navigation';

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
  Bell,
  Mail,
};

interface NavItemIconProps {
  iconName: IconName;
  className?: string;
}

export function NavItemIcon({
  iconName,
  className,
}: NavItemIconProps): React.ReactElement {
  const Icon = iconMap[iconName] || LayoutDashboard;
  return <Icon className={className} />;
}
