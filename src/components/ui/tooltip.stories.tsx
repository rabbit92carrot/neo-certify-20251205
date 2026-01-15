import type { Meta, StoryObj } from '@storybook/react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import { Button } from './button';
import { Info, HelpCircle } from 'lucide-react';

const meta = {
  title: 'UI/Overlays/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">호버하세요</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>툴팁 내용입니다</p>
      </TooltipContent>
    </Tooltip>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon">
          <Info className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>추가 정보가 여기에 표시됩니다</p>
      </TooltipContent>
    </Tooltip>
  ),
};

export const Positions: Story = {
  render: () => (
    <div className="flex gap-8">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">위</Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>위쪽 툴팁</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">아래</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>아래쪽 툴팁</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">왼쪽</Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>왼쪽 툴팁</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">오른쪽</Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>오른쪽 툴팁</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const HelpTooltip: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">UDI-DI</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>
            UDI-DI(Unique Device Identification - Device Identifier)는
            의료기기의 고유 식별자입니다. 제조사에서 부여합니다.
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const ActionTooltip: Story = {
  render: () => (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="sm">수정</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>제품 정보를 수정합니다</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="sm" variant="destructive">삭제</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>이 작업은 되돌릴 수 없습니다</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};
