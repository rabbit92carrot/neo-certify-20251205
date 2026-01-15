'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Hospital, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * ShipmentFormWrapper는 Server Action을 SearchableCombobox 호환 형태로 변환하는 래퍼입니다.
 * Storybook에서는 간단한 UI 시뮬레이션으로 표시합니다.
 */

type OrganizationType = 'MANUFACTURER' | 'DISTRIBUTOR' | 'HOSPITAL';

interface MockOrganization {
  id: string;
  name: string;
  type: OrganizationType;
}

interface MockShipmentFormWrapperProps {
  organizationType?: OrganizationType;
  targetOrganizations?: MockOrganization[];
}

const mockTargetOrganizations: MockOrganization[] = [
  { id: 'org-001', name: '메디플러스 유통', type: 'DISTRIBUTOR' },
  { id: 'org-002', name: '헬스케어 유통', type: 'DISTRIBUTOR' },
  { id: 'org-003', name: '강남뷰티클리닉', type: 'HOSPITAL' },
  { id: 'org-004', name: '청담스킨클리닉', type: 'HOSPITAL' },
];

function MockShipmentFormWrapper({
  organizationType = 'MANUFACTURER',
  targetOrganizations = mockTargetOrganizations,
}: MockShipmentFormWrapperProps) {
  const getIcon = (type: OrganizationType) => {
    return type === 'HOSPITAL' ? (
      <Hospital className="h-4 w-4" />
    ) : (
      <Building2 className="h-4 w-4" />
    );
  };

  const getDescription = (type: OrganizationType) => {
    return type === 'HOSPITAL' ? '병원' : '유통사';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">ShipmentFormWrapper 시뮬레이션</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium">조직 유형</p>
          <p className="text-xs text-muted-foreground">{organizationType}</p>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">검색 가능한 대상 조직</p>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {targetOrganizations.map((org) => (
              <div
                key={org.id}
                className="flex items-center gap-3 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer"
              >
                {getIcon(org.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{org.name}</p>
                  <p className="text-xs text-muted-foreground">{getDescription(org.type)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            실제 ShipmentFormWrapper는 searchTargetsAction Server Action을 호출하여
            SearchableComboboxOption 형태로 변환합니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const meta = {
  title: 'Forms/Shipment/ShipmentFormWrapper',
  component: MockShipmentFormWrapper,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MockShipmentFormWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Manufacturer: Story = {
  args: {
    organizationType: 'MANUFACTURER',
    targetOrganizations: mockTargetOrganizations,
  },
};

export const Distributor: Story = {
  args: {
    organizationType: 'DISTRIBUTOR',
    targetOrganizations: mockTargetOrganizations.filter((o) => o.type === 'HOSPITAL'),
  },
};

export const HospitalsOnly: Story = {
  args: {
    organizationType: 'MANUFACTURER',
    targetOrganizations: mockTargetOrganizations.filter((o) => o.type === 'HOSPITAL'),
  },
};

export const DistributorsOnly: Story = {
  args: {
    organizationType: 'MANUFACTURER',
    targetOrganizations: mockTargetOrganizations.filter((o) => o.type === 'DISTRIBUTOR'),
  },
};

export const Empty: Story = {
  args: {
    organizationType: 'MANUFACTURER',
    targetOrganizations: [],
  },
};
