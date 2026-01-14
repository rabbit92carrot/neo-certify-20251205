'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * 캘린더 위젯
 * 다우오피스 스타일 미니 캘린더
 */
export function CalendarWidget(): React.ReactElement {
  const [currentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = currentDate.getDate();

  // 해당 월의 첫째 날과 마지막 날
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  // 이전 달의 마지막 날짜들
  const prevLastDate = new Date(year, month, 0).getDate();

  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월',
  ];

  // 캘린더 날짜 생성
  const calendarDays: { date: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

  // 이전 달
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ date: prevLastDate - i, isCurrentMonth: false, isToday: false });
  }

  // 현재 달
  for (let i = 1; i <= lastDate; i++) {
    calendarDays.push({ date: i, isCurrentMonth: true, isToday: i === today });
  }

  // 다음 달 (6주 채우기)
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ date: i, isCurrentMonth: false, isToday: false });
  }

  return (
    <div className="daou-bg-card daou-radius-lg daou-shadow-card p-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold daou-text-primary">
          {year}. {monthNames[month]}
        </h3>
        <div className="flex items-center gap-1">
          <button className="p-1 daou-radius-sm hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-4 h-4 daou-text-secondary" />
          </button>
          <button className="p-1 daou-radius-sm hover:bg-slate-100 transition-colors">
            <ChevronRight className="w-4 h-4 daou-text-secondary" />
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((day, index) => (
          <div
            key={day}
            className={cn(
              'text-center text-xs font-medium py-1',
              index === 0 ? 'text-rose-400' : index === 6 ? 'text-blue-400' : 'daou-text-muted'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={cn(
              'text-center text-xs py-1.5 daou-radius-sm cursor-pointer transition-colors',
              day.isToday
                ? 'daou-gradient-primary text-white font-semibold'
                : day.isCurrentMonth
                  ? 'daou-text-primary hover:bg-slate-100'
                  : 'daou-text-muted'
            )}
          >
            {day.date}
          </div>
        ))}
      </div>
    </div>
  );
}
