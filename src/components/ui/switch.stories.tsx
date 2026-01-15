import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './switch';
import { Label } from './label';

const meta = {
  title: 'UI/Forms/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Switch>;

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
      <Switch id="airplane" />
      <Label htmlFor="airplane">비행기 모드</Label>
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

export const SettingsList: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div className="flex items-center justify-between">
        <Label htmlFor="notifications">알림</Label>
        <Switch id="notifications" defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="darkmode">다크 모드</Label>
        <Switch id="darkmode" />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="autoplay">자동 재생</Label>
        <Switch id="autoplay" defaultChecked />
      </div>
    </div>
  ),
};

export const ProductActive: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="active" defaultChecked />
      <Label htmlFor="active">제품 활성화</Label>
    </div>
  ),
};
