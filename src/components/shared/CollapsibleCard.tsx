'use client';

/**
 * 접기/펼치기 카드 컴포넌트
 * 이관 이력 등에서 뭉치 단위로 접기/펼치기를 지원합니다.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface CollapsibleCardProps {
  /** 제목 */
  title: string;
  /** 부제목 (선택) */
  subtitle?: string;
  /** 뱃지 목록 (선택) */
  badges?: Array<{
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  }>;
  /** 접힌 상태에서 표시할 요약 정보 */
  summary?: React.ReactNode;
  /** 펼친 상태에서 표시할 상세 정보 */
  children: React.ReactNode;
  /** 초기 펼침 상태 */
  defaultOpen?: boolean;
  /** 회수 여부 (빨간색 표시) */
  isRecalled?: boolean;
  /** 회수 사유 */
  recallReason?: string;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 접기/펼치기 카드 컴포넌트
 */
export function CollapsibleCard({
  title,
  subtitle,
  badges,
  summary,
  children,
  defaultOpen = false,
  isRecalled = false,
  recallReason,
  className,
}: CollapsibleCardProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn(isRecalled && 'border-red-200 bg-red-50/30', className)}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
            <div className="flex items-start gap-3">
              {/* 펼침 아이콘 */}
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 mt-0.5">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>

              {/* 제목 및 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base">{title}</CardTitle>
                  {badges?.map((badge, index) => (
                    <Badge key={index} variant={badge.variant ?? 'secondary'}>
                      {badge.text}
                    </Badge>
                  ))}
                  {isRecalled && (
                    <Badge variant="destructive">회수됨</Badge>
                  )}
                </div>
                {subtitle && (
                  <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                )}
                {isRecalled && recallReason && (
                  <p className="text-sm text-red-600 mt-1">회수 사유: {recallReason}</p>
                )}

                {/* 접힌 상태 요약 정보 */}
                {!isOpen && summary && (
                  <div className="mt-2 text-sm text-gray-600">{summary}</div>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pl-11">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
