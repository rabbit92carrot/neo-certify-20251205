'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Combobox, type ComboboxOption } from './combobox';
import { Building2, Hospital, Factory } from 'lucide-react';

const meta = {
  title: 'UI/Selection/Combobox',
  component: Combobox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const organizationOptions: ComboboxOption[] = [
  { value: 'org-1', label: '메디컬 유통', description: '유통사' },
  { value: 'org-2', label: '헬스케어 유통', description: '유통사' },
  { value: 'org-3', label: '서울미래의원', description: '병원' },
  { value: 'org-4', label: '강남클리닉', description: '병원' },
  { value: 'org-5', label: '부산의료원', description: '병원' },
];

const productOptions: ComboboxOption[] = [
  { value: 'prod-1', label: 'PDO Thread Type A', description: 'PDO-A-100' },
  { value: 'prod-2', label: 'PDO Thread Type B', description: 'PDO-B-200' },
  { value: 'prod-3', label: 'PDO Thread Premium', description: 'PDO-P-500' },
];

const organizationWithIconOptions: ComboboxOption[] = [
  {
    value: 'org-1',
    label: '(주)잼버코리아',
    icon: <Factory className="h-4 w-4" />,
    description: '제조사',
  },
  {
    value: 'org-2',
    label: '메디컬 유통',
    icon: <Building2 className="h-4 w-4" />,
    description: '유통사',
  },
  {
    value: 'org-3',
    label: '서울미래의원',
    icon: <Hospital className="h-4 w-4" />,
    description: '병원',
  },
];

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Combobox
        options={organizationOptions}
        value={value}
        onValueChange={setValue}
        placeholder="조직 선택..."
        searchPlaceholder="조직 검색..."
      />
    );
  },
};

export const WithSelectedValue: Story = {
  render: () => {
    const [value, setValue] = useState('org-1');
    return (
      <Combobox
        options={organizationOptions}
        value={value}
        onValueChange={setValue}
        placeholder="조직 선택..."
      />
    );
  },
};

export const WithIcons: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Combobox
        options={organizationWithIconOptions}
        value={value}
        onValueChange={setValue}
        placeholder="조직 선택..."
        searchPlaceholder="조직 검색..."
      />
    );
  },
};

export const ProductSelect: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Combobox
        options={productOptions}
        value={value}
        onValueChange={setValue}
        placeholder="제품 선택..."
        searchPlaceholder="제품 검색..."
        emptyMessage="제품을 찾을 수 없습니다."
      />
    );
  },
};

export const Disabled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Combobox
        options={organizationOptions}
        value={value}
        onValueChange={setValue}
        placeholder="선택 불가"
        disabled
      />
    );
  },
};

export const LotSelect: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const lotOptions: ComboboxOption[] = [
      { value: 'lot-1', label: 'LOT-2024-001', description: '100개' },
      { value: 'lot-2', label: 'LOT-2024-002', description: '50개' },
      { value: 'lot-3', label: 'LOT-2024-003', description: '20개' },
    ];
    return (
      <Combobox
        options={lotOptions}
        value={value}
        onValueChange={setValue}
        placeholder="Lot 선택..."
        searchPlaceholder="Lot 번호 검색..."
        emptyMessage="해당 Lot이 없습니다."
      />
    );
  },
};
