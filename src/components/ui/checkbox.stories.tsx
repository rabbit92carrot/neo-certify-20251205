import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './checkbox';
import { Label } from './label';

const meta = {
  title: 'UI/Forms/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">이용약관에 동의합니다</Label>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
};

export const CheckboxGroup: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Checkbox id="option1" />
        <Label htmlFor="option1">옵션 1</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="option2" defaultChecked />
        <Label htmlFor="option2">옵션 2</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="option3" />
        <Label htmlFor="option3">옵션 3</Label>
      </div>
    </div>
  ),
};

export const FilterCheckboxes: Story = {
  render: () => (
    <div className="space-y-3">
      <p className="text-sm font-medium">이벤트 유형</p>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="production" defaultChecked />
          <Label htmlFor="production">생산</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="shipment" defaultChecked />
          <Label htmlFor="shipment">출고</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="treatment" />
          <Label htmlFor="treatment">시술</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="disposal" />
          <Label htmlFor="disposal">폐기</Label>
        </div>
      </div>
    </div>
  ),
};
