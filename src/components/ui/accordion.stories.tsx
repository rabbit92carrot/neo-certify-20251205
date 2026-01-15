import type { Meta, StoryObj } from '@storybook/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './accordion';

const meta = {
  title: 'UI/Data Display/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>아코디언 1</AccordionTrigger>
        <AccordionContent>
          첫 번째 아코디언 내용입니다.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>아코디언 2</AccordionTrigger>
        <AccordionContent>
          두 번째 아코디언 내용입니다.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>아코디언 3</AccordionTrigger>
        <AccordionContent>
          세 번째 아코디언 내용입니다.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple">
      <AccordionItem value="item-1">
        <AccordionTrigger>여러 개 열기 가능 1</AccordionTrigger>
        <AccordionContent>
          여러 아코디언을 동시에 열 수 있습니다.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>여러 개 열기 가능 2</AccordionTrigger>
        <AccordionContent>
          두 번째 아코디언입니다.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const ProductInventory: Story = {
  render: () => (
    <Accordion type="single" collapsible>
      <AccordionItem value="prod-1">
        <AccordionTrigger>
          <div className="flex justify-between w-full pr-4">
            <span>PDO Thread Type A</span>
            <span className="text-muted-foreground">150개</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span>LOT-2024-001</span>
              <span>100개</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>LOT-2024-002</span>
              <span>50개</span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="prod-2">
        <AccordionTrigger>
          <div className="flex justify-between w-full pr-4">
            <span>PDO Thread Type B</span>
            <span className="text-muted-foreground">80개</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span>LOT-2024-003</span>
              <span>80개</span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const FAQ: Story = {
  render: () => (
    <Accordion type="single" collapsible>
      <AccordionItem value="q1">
        <AccordionTrigger>출고 후 회수는 언제까지 가능한가요?</AccordionTrigger>
        <AccordionContent>
          출고 후 24시간 이내에만 회수가 가능합니다. 24시간이 지난 출고 건은 회수할 수 없으며, 수신 조직에서 다시 발송해야 합니다.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="q2">
        <AccordionTrigger>가상 코드란 무엇인가요?</AccordionTrigger>
        <AccordionContent>
          가상 코드는 제품의 통계적 추적을 위한 고유 식별 코드입니다. 각 제품 단위에 부여되며, 생산부터 소비까지의 이력을 추적할 수 있습니다.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="q3">
        <AccordionTrigger>FIFO란 무엇인가요?</AccordionTrigger>
        <AccordionContent>
          FIFO(First In, First Out)는 먼저 입고된 제품을 먼저 출고하는 재고 관리 방식입니다. 유효기한 관리와 재고 회전율 최적화를 위해 사용됩니다.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
