'use client';

import type { Meta, StoryObj } from '@storybook/react';
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
  Trash2,
  type LucideIcon,
} from 'lucide-react';

/**
 * NavItemIcon은 아이콘 이름을 받아 해당 lucide-react 아이콘을 렌더링합니다.
 */

type IconName =
  | 'LayoutDashboard'
  | 'Package'
  | 'Factory'
  | 'Truck'
  | 'History'
  | 'Warehouse'
  | 'FileText'
  | 'Settings'
  | 'Stethoscope'
  | 'Building2'
  | 'UserCheck'
  | 'AlertCircle'
  | 'Bell'
  | 'Mail'
  | 'Trash2';

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
  Trash2,
};

interface MockNavItemIconProps {
  iconName?: IconName;
  className?: string;
}

function MockNavItemIcon({
  iconName = 'LayoutDashboard',
  className = 'h-5 w-5',
}: MockNavItemIconProps) {
  const Icon = iconMap[iconName] || LayoutDashboard;
  return <Icon className={className} />;
}

const meta = {
  title: 'Layout/NavItemIcon',
  component: MockNavItemIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    iconName: {
      control: 'select',
      options: Object.keys(iconMap),
    },
  },
} satisfies Meta<typeof MockNavItemIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dashboard: Story = {
  args: {
    iconName: 'LayoutDashboard',
    className: 'h-5 w-5',
  },
};

export const Package_: Story = {
  name: 'Package',
  args: {
    iconName: 'Package',
    className: 'h-5 w-5',
  },
};

export const Factory_: Story = {
  name: 'Factory',
  args: {
    iconName: 'Factory',
    className: 'h-5 w-5',
  },
};

export const Truck_: Story = {
  name: 'Truck',
  args: {
    iconName: 'Truck',
    className: 'h-5 w-5',
  },
};

export const History_: Story = {
  name: 'History',
  args: {
    iconName: 'History',
    className: 'h-5 w-5',
  },
};

export const Warehouse_: Story = {
  name: 'Warehouse',
  args: {
    iconName: 'Warehouse',
    className: 'h-5 w-5',
  },
};

export const Stethoscope_: Story = {
  name: 'Stethoscope',
  args: {
    iconName: 'Stethoscope',
    className: 'h-5 w-5',
  },
};

export const Building: Story = {
  args: {
    iconName: 'Building2',
    className: 'h-5 w-5',
  },
};

export const UserCheck_: Story = {
  name: 'UserCheck',
  args: {
    iconName: 'UserCheck',
    className: 'h-5 w-5',
  },
};

export const Alert: Story = {
  args: {
    iconName: 'AlertCircle',
    className: 'h-5 w-5',
  },
};

export const Bell_: Story = {
  name: 'Bell',
  args: {
    iconName: 'Bell',
    className: 'h-5 w-5',
  },
};

export const Mail_: Story = {
  name: 'Mail',
  args: {
    iconName: 'Mail',
    className: 'h-5 w-5',
  },
};

export const Trash: Story = {
  args: {
    iconName: 'Trash2',
    className: 'h-5 w-5',
  },
};

export const LargeSize: Story = {
  args: {
    iconName: 'LayoutDashboard',
    className: 'h-8 w-8',
  },
};

export const SmallSize: Story = {
  args: {
    iconName: 'LayoutDashboard',
    className: 'h-4 w-4',
  },
};

export const WithColor: Story = {
  args: {
    iconName: 'LayoutDashboard',
    className: 'h-5 w-5 text-blue-600',
  },
};

export const AllIcons: Story = {
  render: () => (
    <div className="grid grid-cols-5 gap-4 p-4">
      {(Object.keys(iconMap) as IconName[]).map((name) => (
        <div key={name} className="flex flex-col items-center gap-2 p-2">
          <MockNavItemIcon iconName={name} className="h-6 w-6" />
          <span className="text-xs text-muted-foreground">{name}</span>
        </div>
      ))}
    </div>
  ),
};
