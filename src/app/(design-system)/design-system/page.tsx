import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Factory, Truck, Stethoscope, Shield } from 'lucide-react';

const roles = [
  {
    id: 'manufacturer',
    label: '제조사',
    description: '제품 생산, 출고, 재고 관리',
    icon: Factory,
    pageCount: 8,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'distributor',
    label: '유통사',
    description: '입고, 출고, 재고 관리',
    icon: Truck,
    pageCount: 4,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 'hospital',
    label: '병원',
    description: '시술 등록, 폐기, 재고 관리',
    icon: Stethoscope,
    pageCount: 7,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'admin',
    label: '관리자',
    description: '조직 관리, 승인, 이력 조회',
    icon: Shield,
    pageCount: 7,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
];

/**
 * Design System 메인 페이지 - 역할 선택
 */
export default function DesignSystemPage(): React.ReactElement {
  return (
    <div className="container mx-auto py-8 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">화면설계서</h1>
        <p className="text-gray-600">
          역할을 선택하여 해당 역할의 페이지 맵과 컴포넌트 프리뷰를 확인하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <Link key={role.id} href={`/design-system/${role.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`p-3 rounded-lg ${role.bgColor}`}>
                  <role.icon className={`h-6 w-6 ${role.color}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{role.label}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  {role.pageCount}개 페이지
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-6 bg-white rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">사용 방법</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>1. 위 카드에서 확인하고 싶은 역할을 선택합니다.</li>
          <li>2. 캔버스에서 페이지 노드를 클릭하면 우측 패널에 프리뷰가 표시됩니다.</li>
          <li>3. 캔버스는 줌/팬/미니맵을 지원합니다.</li>
          <li>4. 각 프리뷰에서 Storybook 링크를 통해 더 자세한 컴포넌트 문서를 확인할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );
}
