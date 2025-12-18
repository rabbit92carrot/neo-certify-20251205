/**
 * 아이콘 매핑 유틸리티
 * 문자열 아이콘 이름을 lucide-react 컴포넌트로 변환합니다.
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
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import type { IconName } from '@/constants/navigation';

export const iconMap: Record<IconName | 'MoreHorizontal', LucideIcon> = {
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
  MoreHorizontal,
};

export function getIcon(iconName: IconName): LucideIcon {
  return iconMap[iconName] || LayoutDashboard;
}
