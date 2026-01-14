import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type AccentColor = 'mint' | 'lavender' | 'peach' | 'sky' | 'lemon';

interface DaouStatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  accentColor?: AccentColor;
  description?: string;
  trend?: number;
  className?: string;
  onClick?: () => void;
}

const accentBgMap: Record<AccentColor, string> = {
  mint: 'daou-accent-mint',
  lavender: 'daou-accent-lavender',
  peach: 'daou-accent-peach',
  sky: 'daou-accent-sky',
  lemon: 'daou-accent-lemon',
};

const accentIconMap: Record<AccentColor, string> = {
  mint: 'daou-icon-mint',
  lavender: 'daou-icon-lavender',
  peach: 'daou-icon-peach',
  sky: 'daou-icon-sky',
  lemon: 'daou-icon-lemon',
};

/**
 * 다우오피스 스타일 통계 카드 컴포넌트
 * 파스텔 톤 아이콘 배경, 둥근 모서리, 부드러운 그림자
 */
export function DaouStatCard({
  title,
  value,
  icon: Icon,
  accentColor = 'sky',
  description,
  trend,
  className,
  onClick,
}: DaouStatCardProps): React.ReactElement {
  return (
    <div
      className={cn(
        'daou-bg-card daou-radius-lg daou-shadow-card p-6',
        onClick && 'daou-card-hover cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* 헤더: 제목 + 아이콘 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium daou-text-secondary">{title}</span>
        {Icon && (
          <div className={cn('daou-radius-md p-2.5', accentBgMap[accentColor])}>
            <Icon className={cn('w-5 h-5', accentIconMap[accentColor])} />
          </div>
        )}
      </div>

      {/* 값 */}
      <div className="text-2xl font-bold daou-text-primary mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      {/* 설명 및 트렌드 */}
      {(description || trend !== undefined) && (
        <p className="text-xs daou-text-muted">
          {trend !== undefined && (
            <span className={cn('mr-1 font-medium', trend >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
              {trend >= 0 ? '+' : ''}
              {trend}%
            </span>
          )}
          {description}
        </p>
      )}
    </div>
  );
}
