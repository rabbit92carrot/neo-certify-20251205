/**
 * 비동기 통계 카드 컴포넌트
 * Suspense와 함께 사용하여 개별 통계를 독립적으로 로딩
 */

import { StatCard } from './StatCard';
import type { LucideIcon } from 'lucide-react';

interface AsyncStatCardProps {
  /** 통계 제목 */
  title: string;
  /** 통계 값을 반환하는 Promise */
  getValue: () => Promise<number>;
  /** 아이콘 */
  icon?: LucideIcon;
  /** 설명 (선택) */
  description?: string;
  /** 링크 URL (선택) */
  href?: string;
}

/**
 * 비동기 통계 카드
 * Server Component로 값을 비동기로 가져와서 표시
 */
export async function AsyncStatCard({
  title,
  getValue,
  icon,
  description,
}: AsyncStatCardProps): Promise<React.ReactElement> {
  const value = await getValue();

  return (
    <StatCard
      title={title}
      value={value.toLocaleString()}
      icon={icon}
      description={description}
    />
  );
}
