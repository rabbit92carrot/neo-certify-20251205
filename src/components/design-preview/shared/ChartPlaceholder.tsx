import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

interface ChartPlaceholderProps {
  title?: string;
  height?: string;
  className?: string;
}

/**
 * 차트 플레이스홀더 컴포넌트
 * 실제 차트 대신 시각적 플레이스홀더를 표시합니다.
 */
export function ChartPlaceholder({
  title = '차트',
  height = 'h-48',
  className,
}: ChartPlaceholderProps): React.ReactElement {
  return (
    <div className={cn('daou-bg-card daou-radius-lg daou-shadow-card p-6', className)}>
      {/* 제목 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium daou-text-primary">{title}</h3>
        <BarChart3 className="w-4 h-4 daou-text-muted" />
      </div>

      {/* 플레이스홀더 영역 */}
      <div
        className={cn(
          'rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 flex items-end justify-center gap-2 p-4',
          height
        )}
      >
        {/* 막대 그래프 모양 플레이스홀더 */}
        <div className="w-8 h-[30%] rounded-t-md bg-gradient-to-t from-indigo-300 to-indigo-200" />
        <div className="w-8 h-[50%] rounded-t-md bg-gradient-to-t from-indigo-400 to-indigo-300" />
        <div className="w-8 h-[70%] rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-400" />
        <div className="w-8 h-[45%] rounded-t-md bg-gradient-to-t from-indigo-400 to-indigo-300" />
        <div className="w-8 h-[60%] rounded-t-md bg-gradient-to-t from-indigo-400 to-indigo-300" />
        <div className="w-8 h-[80%] rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-400" />
        <div className="w-8 h-[55%] rounded-t-md bg-gradient-to-t from-indigo-400 to-indigo-300" />
      </div>
    </div>
  );
}
