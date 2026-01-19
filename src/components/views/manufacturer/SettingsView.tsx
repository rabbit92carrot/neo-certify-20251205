/**
 * 설정 View 컴포넌트
 * Manufacturer 설정 페이지 뷰 (props 기반)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Hash, Calendar, Tag } from 'lucide-react';

export interface ManufacturerSettingsData {
  lotPrefix: string;
  lotDateFormat: string;
  lotSequenceDigits: number;
  lotSeparator: string;
}

export interface ManufacturerSettingsViewProps {
  /** 현재 설정 값 */
  settings: ManufacturerSettingsData;
  /** 미리보기 Lot 번호 */
  previewLotNumber?: string;
}

export function ManufacturerSettingsView({
  settings,
  previewLotNumber = 'LOT-20240119-001',
}: ManufacturerSettingsViewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader
        title="설정"
        description="Lot 번호 생성 규칙을 설정합니다."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Lot 번호 설정</CardTitle>
          </div>
          <CardDescription>
            생산 등록 시 자동 생성되는 Lot 번호의 형식을 설정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 미리보기 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Lot 번호 미리보기</p>
            <p className="text-xl font-mono font-bold">{previewLotNumber}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* 접두사 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                접두사
              </Label>
              <Input
                value={settings.lotPrefix}
                placeholder="예: LOT"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Lot 번호 앞에 붙는 고정 문자열
              </p>
            </div>

            {/* 구분자 */}
            <div className="space-y-2">
              <Label>구분자</Label>
              <Select value={settings.lotSeparator} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">하이픈 (-)</SelectItem>
                  <SelectItem value="_">언더스코어 (_)</SelectItem>
                  <SelectItem value="none">없음</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                각 부분을 구분하는 문자
              </p>
            </div>

            {/* 날짜 형식 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                날짜 형식
              </Label>
              <Select value={settings.lotDateFormat} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYYMMDD">YYYYMMDD (20240119)</SelectItem>
                  <SelectItem value="YYMMDD">YYMMDD (240119)</SelectItem>
                  <SelectItem value="YYDDD">YYDDD (24019)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                날짜 부분의 형식
              </p>
            </div>

            {/* 일련번호 자릿수 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                일련번호 자릿수
              </Label>
              <Select value={String(settings.lotSequenceDigits)} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2자리 (01-99)</SelectItem>
                  <SelectItem value="3">3자리 (001-999)</SelectItem>
                  <SelectItem value="4">4자리 (0001-9999)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                일일 일련번호의 자릿수
              </p>
            </div>
          </div>

          <Button className="w-full" disabled>
            설정 저장
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
