'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Calendar } from './calendar';

const meta = {
  title: 'UI/Selection/Calendar',
  component: Calendar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return <Calendar mode="single" selected={date} onSelect={setDate} />;
  },
};

export const WithSelectedDate: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(
      new Date('2024-06-15')
    );
    return <Calendar mode="single" selected={date} onSelect={setDate} />;
  },
};

export const DisabledDates: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        disabled={(date) => date < new Date()}
      />
    );
  },
};

export const DateRange: Story = {
  render: () => {
    const [range, setRange] = useState<{
      from: Date | undefined;
      to: Date | undefined;
    }>({
      from: new Date(),
      to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return (
      <Calendar
        mode="range"
        selected={range}
        onSelect={(newRange) =>
          setRange(newRange as { from: Date | undefined; to: Date | undefined })
        }
        numberOfMonths={2}
      />
    );
  },
};

export const Multiple: Story = {
  render: () => {
    const [dates, setDates] = useState<Date[]>([
      new Date(),
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    ]);
    return (
      <Calendar
        mode="multiple"
        selected={dates}
        onSelect={(newDates) => setDates(newDates as Date[])}
      />
    );
  },
};

export const WithFooter: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <div className="space-y-4">
        <Calendar mode="single" selected={date} onSelect={setDate} />
        <p className="text-center text-sm text-muted-foreground">
          선택된 날짜: {date?.toLocaleDateString('ko-KR')}
        </p>
      </div>
    );
  },
};
