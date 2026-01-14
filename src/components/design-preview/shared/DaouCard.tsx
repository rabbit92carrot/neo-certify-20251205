import { cn } from '@/lib/utils';

interface DaouCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

/**
 * 다우오피스 스타일 카드 컴포넌트
 * 둥근 모서리, 부드러운 그림자, 테두리 없음
 */
export function DaouCard({
  children,
  className,
  hover = false,
  onClick,
}: DaouCardProps): React.ReactElement {
  return (
    <div
      className={cn(
        'daou-bg-card daou-radius-lg daou-shadow-card',
        hover && 'daou-card-hover cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface DaouCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function DaouCardHeader({ children, className }: DaouCardHeaderProps): React.ReactElement {
  return <div className={cn('p-6 pb-2', className)}>{children}</div>;
}

interface DaouCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DaouCardContent({ children, className }: DaouCardContentProps): React.ReactElement {
  return <div className={cn('p-6 pt-0', className)}>{children}</div>;
}

interface DaouCardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function DaouCardTitle({ children, className }: DaouCardTitleProps): React.ReactElement {
  return <h3 className={cn('text-lg font-semibold daou-text-primary', className)}>{children}</h3>;
}
