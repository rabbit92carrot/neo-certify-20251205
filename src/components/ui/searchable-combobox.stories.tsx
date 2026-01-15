'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  SearchableCombobox,
  type SearchableComboboxOption,
} from './searchable-combobox';

const meta = {
  title: 'UI/Selection/SearchableCombobox',
  component: SearchableCombobox,
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
} satisfies Meta<typeof SearchableCombobox>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock 검색 함수
const mockSearchOrganizations = async (
  query: string
): Promise<SearchableComboboxOption[]> => {
  // 서버 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 500));

  const allOptions: SearchableComboboxOption[] = [
    { value: 'org-1', label: '메디컬 유통', description: '유통사' },
    { value: 'org-2', label: '헬스케어 유통', description: '유통사' },
    { value: 'org-3', label: '서울미래의원', description: '병원' },
    { value: 'org-4', label: '강남클리닉', description: '병원' },
    { value: 'org-5', label: '부산의료원', description: '병원' },
    { value: 'org-6', label: '대구메디컬센터', description: '병원' },
    { value: 'org-7', label: '인천종합병원', description: '병원' },
  ];

  return allOptions.filter((opt) =>
    opt.label.toLowerCase().includes(query.toLowerCase())
  );
};

const mockSearchProducts = async (
  query: string
): Promise<SearchableComboboxOption[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const allProducts: SearchableComboboxOption[] = [
    { value: 'prod-1', label: 'PDO Thread Type A', description: 'PDO-A-100' },
    { value: 'prod-2', label: 'PDO Thread Type B', description: 'PDO-B-200' },
    { value: 'prod-3', label: 'PDO Thread Premium', description: 'PDO-P-500' },
    { value: 'prod-4', label: 'PDO Thread Lite', description: 'PDO-L-50' },
  ];

  return allProducts.filter((p) =>
    p.label.toLowerCase().includes(query.toLowerCase())
  );
};

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <SearchableCombobox
        value={value}
        onValueChange={setValue}
        onSearch={mockSearchOrganizations}
        placeholder="조직 선택..."
        searchPlaceholder="2글자 이상 입력..."
        emptyMessage="검색 결과가 없습니다."
      />
    );
  },
};

export const WithSelectedValue: Story = {
  render: () => {
    const [value, setValue] = useState('org-1');
    return (
      <SearchableCombobox
        value={value}
        onValueChange={setValue}
        onSearch={mockSearchOrganizations}
        placeholder="조직 선택..."
        selectedLabel="메디컬 유통"
      />
    );
  },
};

export const ProductSearch: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <SearchableCombobox
        value={value}
        onValueChange={setValue}
        onSearch={mockSearchProducts}
        placeholder="제품 검색..."
        searchPlaceholder="제품명 입력..."
        emptyMessage="해당 제품을 찾을 수 없습니다."
        minSearchLength={1}
      />
    );
  },
};

export const WithMinSearchLength: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <SearchableCombobox
        value={value}
        onValueChange={setValue}
        onSearch={mockSearchOrganizations}
        placeholder="조직 선택..."
        searchPlaceholder="3글자 이상 입력..."
        minSearchLength={3}
      />
    );
  },
};

export const WithDebounce: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <SearchableCombobox
        value={value}
        onValueChange={setValue}
        onSearch={mockSearchOrganizations}
        placeholder="조직 선택..."
        searchPlaceholder="검색어 입력 (500ms 딜레이)..."
        debounceMs={500}
      />
    );
  },
};

export const Disabled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <SearchableCombobox
        value={value}
        onValueChange={setValue}
        onSearch={mockSearchOrganizations}
        placeholder="선택 불가"
        disabled
      />
    );
  },
};

export const ShipmentTarget: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">출고 대상</label>
        <SearchableCombobox
          value={value}
          onValueChange={setValue}
          onSearch={mockSearchOrganizations}
          placeholder="수신 조직 선택..."
          searchPlaceholder="조직명으로 검색..."
          emptyMessage="일치하는 조직이 없습니다."
        />
        <p className="text-xs text-muted-foreground">
          2글자 이상 입력하면 검색됩니다.
        </p>
      </div>
    );
  },
};
