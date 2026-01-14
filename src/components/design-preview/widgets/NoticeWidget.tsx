import { cn } from '@/lib/utils';
import { Megaphone, ChevronRight } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  date: string;
  isNew?: boolean;
}

const mockNotices: Notice[] = [
  {
    id: '1',
    title: '2025년 1월 정기 점검 안내',
    date: '2025-01-10',
    isNew: true,
  },
  {
    id: '2',
    title: '신규 제품 등록 가이드 업데이트',
    date: '2025-01-08',
    isNew: true,
  },
  {
    id: '3',
    title: '시스템 업데이트 완료 안내',
    date: '2025-01-05',
  },
  {
    id: '4',
    title: '연말 재고 정산 관련 안내',
    date: '2024-12-28',
  },
];

/**
 * 공지사항 위젯
 */
export function NoticeWidget(): React.ReactElement {
  return (
    <div className="daou-bg-card daou-radius-lg daou-shadow-card p-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 daou-text-secondary" />
          <h3 className="text-sm font-semibold daou-text-primary">공지사항</h3>
        </div>
        <button className="text-xs daou-text-secondary hover:daou-text-primary transition-colors">
          전체보기
        </button>
      </div>

      {/* 공지 리스트 */}
      <div className="space-y-2">
        {mockNotices.map((notice) => (
          <div
            key={notice.id}
            className="flex items-center gap-3 p-2 -mx-2 daou-radius-sm hover:bg-slate-50 cursor-pointer transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {notice.isNew && (
                  <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-rose-100 text-rose-600 rounded">
                    NEW
                  </span>
                )}
                <p className={cn('text-sm truncate', notice.isNew ? 'daou-text-primary font-medium' : 'daou-text-secondary')}>
                  {notice.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs daou-text-muted">{notice.date}</span>
              <ChevronRight className="w-4 h-4 daou-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
