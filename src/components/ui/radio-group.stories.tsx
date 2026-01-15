import type { Meta, StoryObj } from '@storybook/react';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Label } from './label';

const meta = {
  title: 'UI/Forms/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option1">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option1" id="option1" />
        <Label htmlFor="option1">옵션 1</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option2" id="option2" />
        <Label htmlFor="option2">옵션 2</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option3" id="option3" />
        <Label htmlFor="option3">옵션 3</Label>
      </div>
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="option1" className="flex space-x-4">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option1" id="h-option1" />
        <Label htmlFor="h-option1">옵션 1</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option2" id="h-option2" />
        <Label htmlFor="h-option2">옵션 2</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option3" id="h-option3" />
        <Label htmlFor="h-option3">옵션 3</Label>
      </div>
    </RadioGroup>
  ),
};

export const DisposalReasons: Story = {
  render: () => (
    <div className="space-y-3">
      <p className="text-sm font-medium">폐기 사유</p>
      <RadioGroup defaultValue="expired">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="expired" id="expired" />
          <Label htmlFor="expired">유효기한 만료</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="damaged" id="damaged" />
          <Label htmlFor="damaged">파손/훼손</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="quality" id="quality" />
          <Label htmlFor="quality">품질 문제</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="other" id="other" />
          <Label htmlFor="other">기타</Label>
        </div>
      </RadioGroup>
    </div>
  ),
};

export const OrganizationType: Story = {
  render: () => (
    <div className="space-y-3">
      <p className="text-sm font-medium">조직 유형</p>
      <RadioGroup defaultValue="manufacturer">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="manufacturer" id="manufacturer" />
          <Label htmlFor="manufacturer">제조사</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="distributor" id="distributor" />
          <Label htmlFor="distributor">유통사</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="hospital" id="hospital" />
          <Label htmlFor="hospital">병원</Label>
        </div>
      </RadioGroup>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="option1" disabled>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option1" id="d-option1" />
        <Label htmlFor="d-option1">옵션 1 (선택됨)</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option2" id="d-option2" />
        <Label htmlFor="d-option2">옵션 2</Label>
      </div>
    </RadioGroup>
  ),
};
