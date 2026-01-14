import { cn } from '@/lib/utils';
import { Factory, Truck, Package } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Activity {
  id: string;
  type: 'production' | 'shipment' | 'inventory';
  title: string;
  description: string;
  time: string;
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'production',
    title: '생산 등록',
    description: 'PDO-19G-100 100개 생산 완료',
    time: '10분 전',
  },
  {
    id: '2',
    type: 'shipment',
    title: '출고 완료',
    description: '서울메디클리닉으로 50개 출고',
    time: '1시간 전',
  },
  {
    id: '3',
    type: 'inventory',
    title: '재고 알림',
    description: 'PDO-21G-60 재고 100개 이하',
    time: '2시간 전',
  },
  {
    id: '4',
    type: 'shipment',
    title: '출고 완료',
    description: '강남피부과으로 30개 출고',
    time: '3시간 전',
  },
];

const typeConfig: Record<Activity['type'], { icon: LucideIcon; bg: string; iconColor: string }> = {
  production: { icon: Factory, bg: 'daou-accent-mint', iconColor: 'daou-icon-mint' },
  shipment: { icon: Truck, bg: 'daou-accent-lavender', iconColor: 'daou-icon-lavender' },
  inventory: { icon: Package, bg: 'daou-accent-peach', iconColor: 'daou-icon-peach' },
};

/**
 * 최근 활동 위젯
 */
export function ActivityWidget(): React.ReactElement {
  return (
    <div className="daou-bg-card daou-radius-lg daou-shadow-card p-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold daou-text-primary">최근 활동</h3>
        <button className="text-xs daou-text-secondary hover:daou-text-primary transition-colors">
          전체보기
        </button>
      </div>

      {/* 활동 리스트 */}
      <div className="space-y-3">
        {mockActivities.map((activity) => {
          const config = typeConfig[activity.type];
          const Icon = config.icon;

          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={cn('p-2 daou-radius-md shrink-0', config.bg)}>
                <Icon className={cn('w-4 h-4', config.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium daou-text-primary truncate">{activity.title}</p>
                <p className="text-xs daou-text-muted truncate">{activity.description}</p>
              </div>
              <span className="text-xs daou-text-muted whitespace-nowrap">{activity.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
