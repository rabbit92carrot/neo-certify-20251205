'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Toaster } from './sonner';
import { Button } from './button';
import { toast } from 'sonner';

const meta = {
  title: 'UI/Feedback/Sonner',
  component: Toaster,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Button onClick={() => toast('기본 토스트 메시지입니다.')}>
      토스트 표시
    </Button>
  ),
};

export const Success: Story = {
  render: () => (
    <Button onClick={() => toast.success('성공적으로 저장되었습니다.')}>
      성공 토스트
    </Button>
  ),
};

export const Error: Story = {
  render: () => (
    <Button
      variant="destructive"
      onClick={() => toast.error('오류가 발생했습니다.')}
    >
      에러 토스트
    </Button>
  ),
};

export const Warning: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => toast.warning('주의가 필요합니다.')}
    >
      경고 토스트
    </Button>
  ),
};

export const Info: Story = {
  render: () => (
    <Button variant="secondary" onClick={() => toast.info('참고 정보입니다.')}>
      정보 토스트
    </Button>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast('제품이 등록되었습니다.', {
          description: 'PDO Thread Type A (PDO-A-100)',
        })
      }
    >
      설명 포함 토스트
    </Button>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast('출고가 완료되었습니다.', {
          action: {
            label: '실행취소',
            onClick: () => toast.info('출고가 취소되었습니다.'),
          },
        })
      }
    >
      액션 포함 토스트
    </Button>
  ),
};

export const Promise: Story = {
  render: () => (
    <Button
      onClick={() => {
        const promise = new Promise((resolve) => setTimeout(resolve, 2000));
        toast.promise(promise, {
          loading: '저장 중...',
          success: '저장 완료!',
          error: '저장 실패',
        });
      }}
    >
      Promise 토스트
    </Button>
  ),
};

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => toast('기본 메시지')}>기본</Button>
      <Button onClick={() => toast.success('성공!')}>성공</Button>
      <Button onClick={() => toast.error('에러!')}>에러</Button>
      <Button onClick={() => toast.warning('경고!')}>경고</Button>
      <Button onClick={() => toast.info('정보')}>정보</Button>
    </div>
  ),
};

export const CustomDuration: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button onClick={() => toast('2초 후 사라짐', { duration: 2000 })}>
        2초
      </Button>
      <Button onClick={() => toast('5초 후 사라짐', { duration: 5000 })}>
        5초
      </Button>
      <Button onClick={() => toast('무한', { duration: Infinity })}>
        무한
      </Button>
    </div>
  ),
};

export const BusinessScenarios: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Button onClick={() => toast.success('제품이 성공적으로 등록되었습니다.')}>
        제품 등록 성공
      </Button>
      <Button onClick={() => toast.success('출고가 완료되었습니다.', {
        description: '메디컬 유통에 50개 출고',
      })}>
        출고 완료
      </Button>
      <Button onClick={() => toast.success('시술이 기록되었습니다.', {
        description: '환자: 010-****-1234',
      })}>
        시술 기록
      </Button>
      <Button
        variant="destructive"
        onClick={() => toast.error('회수 기간이 만료되었습니다.', {
          description: '24시간 이후에는 회수할 수 없습니다.',
        })}
      >
        회수 실패
      </Button>
    </div>
  ),
};
