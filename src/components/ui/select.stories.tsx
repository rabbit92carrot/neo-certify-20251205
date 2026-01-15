import type { Meta, StoryObj } from '@storybook/react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './select';
import { Label } from './label';

const meta = {
  title: 'UI/Forms/Select',
  component: Select,
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
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="선택하세요" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">옵션 1</SelectItem>
        <SelectItem value="option2">옵션 2</SelectItem>
        <SelectItem value="option3">옵션 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <Label>조직 유형</Label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="유형 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="manufacturer">제조사</SelectItem>
          <SelectItem value="distributor">유통사</SelectItem>
          <SelectItem value="hospital">병원</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="이벤트 유형 선택" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>제조</SelectLabel>
          <SelectItem value="production">생산</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>이동</SelectLabel>
          <SelectItem value="shipment">출고</SelectItem>
          <SelectItem value="receive">입고</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>소비</SelectLabel>
          <SelectItem value="treatment">시술</SelectItem>
          <SelectItem value="disposal">폐기</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const WithDefaultValue: Story = {
  render: () => (
    <Select defaultValue="distributor">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="manufacturer">제조사</SelectItem>
        <SelectItem value="distributor">유통사</SelectItem>
        <SelectItem value="hospital">병원</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger>
        <SelectValue placeholder="선택 불가" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">옵션 1</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const DisposalReason: Story = {
  render: () => (
    <div className="space-y-2">
      <Label>폐기 사유</Label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="사유를 선택하세요" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="expired">유효기한 만료</SelectItem>
          <SelectItem value="damaged">파손/훼손</SelectItem>
          <SelectItem value="quality">품질 문제</SelectItem>
          <SelectItem value="recall">회수</SelectItem>
          <SelectItem value="other">기타</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};
