import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

const meta = {
  title: 'UI/Data Display/Tabs',
  component: Tabs,
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
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">탭 1</TabsTrigger>
        <TabsTrigger value="tab2">탭 2</TabsTrigger>
        <TabsTrigger value="tab3">탭 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <p className="p-4">탭 1 내용</p>
      </TabsContent>
      <TabsContent value="tab2">
        <p className="p-4">탭 2 내용</p>
      </TabsContent>
      <TabsContent value="tab3">
        <p className="p-4">탭 3 내용</p>
      </TabsContent>
    </Tabs>
  ),
};

export const WithCards: Story = {
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">개요</TabsTrigger>
        <TabsTrigger value="inventory">재고</TabsTrigger>
        <TabsTrigger value="history">이력</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <CardTitle>제품 개요</CardTitle>
            <CardDescription>제품에 대한 기본 정보입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>제품 정보가 여기에 표시됩니다.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="inventory">
        <Card>
          <CardHeader>
            <CardTitle>재고 현황</CardTitle>
            <CardDescription>현재 재고 수량 정보입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>재고 정보가 여기에 표시됩니다.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle>이동 이력</CardTitle>
            <CardDescription>제품의 이동 이력입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>이력 정보가 여기에 표시됩니다.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const ShipmentTabs: Story = {
  render: () => (
    <Tabs defaultValue="sent">
      <TabsList className="w-full">
        <TabsTrigger value="sent" className="flex-1">발송</TabsTrigger>
        <TabsTrigger value="received" className="flex-1">수신</TabsTrigger>
      </TabsList>
      <TabsContent value="sent">
        <div className="p-4">
          <p className="text-muted-foreground">발송한 출고 목록이 여기에 표시됩니다.</p>
        </div>
      </TabsContent>
      <TabsContent value="received">
        <div className="p-4">
          <p className="text-muted-foreground">수신한 입고 목록이 여기에 표시됩니다.</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

export const DashboardTabs: Story = {
  render: () => (
    <Tabs defaultValue="today">
      <TabsList>
        <TabsTrigger value="today">오늘</TabsTrigger>
        <TabsTrigger value="week">이번 주</TabsTrigger>
        <TabsTrigger value="month">이번 달</TabsTrigger>
        <TabsTrigger value="all">전체</TabsTrigger>
      </TabsList>
      <TabsContent value="today">
        <div className="grid grid-cols-2 gap-4 p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">56</CardTitle>
              <CardDescription>오늘 출고</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">12</CardTitle>
              <CardDescription>오늘 시술</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </TabsContent>
      <TabsContent value="week">
        <div className="p-4">이번 주 통계</div>
      </TabsContent>
      <TabsContent value="month">
        <div className="p-4">이번 달 통계</div>
      </TabsContent>
      <TabsContent value="all">
        <div className="p-4">전체 통계</div>
      </TabsContent>
    </Tabs>
  ),
};
