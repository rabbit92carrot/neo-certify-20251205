'use client';

/**
 * 대시보드 목업 컨텐츠
 * 샘플 페이지에서 실제 대시보드처럼 보이는 콘텐츠를 표시합니다.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Factory, Truck, Boxes } from 'lucide-react';

interface MockDashboardProps {
  selectedItem?: string;
}

export function MockDashboard({ selectedItem }: MockDashboardProps): React.ReactElement {
  const stats = [
    { title: '총 재고량', value: '1,234', icon: Package },
    { title: '오늘 생산', value: '56', icon: Factory },
    { title: '오늘 출고', value: '23', icon: Truck },
    { title: '활성 제품', value: '8', icon: Boxes },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-gray-500">
                {stat.title}
              </CardTitle>
              <div className="rounded-md bg-gray-100 p-1.5">
                <stat.icon className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 선택된 메뉴 표시 */}
      {selectedItem && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <p className="text-sm text-blue-700">
              선택된 메뉴: <strong>{selectedItem}</strong>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              실제 앱에서는 해당 페이지 콘텐츠가 표시됩니다.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 추가 목업 콘텐츠 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">최근 활동</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div>
                <p className="text-sm font-medium">생산 입고 #{100 + i}</p>
                <p className="text-xs text-gray-500">10분 전</p>
              </div>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                완료
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
