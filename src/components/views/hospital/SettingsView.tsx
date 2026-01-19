/**
 * 설정 View 컴포넌트
 * Hospital 설정 페이지 뷰 (props 기반)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Settings, Package, Edit, Trash2 } from 'lucide-react';

export interface ProductAlias {
  productId: string;
  productName: string;
  modelName: string;
  alias: string;
}

export interface HospitalSettingsViewProps {
  /** 제품 별칭 목록 */
  productAliases: ProductAlias[];
}

export function HospitalSettingsView({
  productAliases,
}: HospitalSettingsViewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader
        title="설정"
        description="병원 전용 설정을 관리합니다."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>제품 별칭 관리</CardTitle>
          </div>
          <CardDescription>
            시술 등록 시 사용할 제품 별칭을 설정합니다. 별칭은 병원 내부에서만 사용됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 별칭 추가 폼 */}
          <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 space-y-2">
              <Label>제품 선택</Label>
              <Input placeholder="제품을 선택하세요" disabled />
            </div>
            <div className="flex-1 space-y-2">
              <Label>별칭</Label>
              <Input placeholder="예: COG 100" disabled />
            </div>
            <div className="self-end">
              <Button disabled>추가</Button>
            </div>
          </div>

          {/* 별칭 목록 */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제품명</TableHead>
                  <TableHead>모델명</TableHead>
                  <TableHead>별칭</TableHead>
                  <TableHead className="w-[100px]">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productAliases.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.productName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.modelName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.alias}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" disabled>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" disabled>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {productAliases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      등록된 제품 별칭이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
