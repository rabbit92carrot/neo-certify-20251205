'use client';

/**
 * 제품 설정 패널
 * 선택된 제품의 별칭과 활성화 상태 설정
 */

import React, { memo } from 'react';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import type { ProductSettingsPanelProps } from './types';

function ProductSettingsPanelComponent({
  selectedProduct,
  alias,
  onAliasChange,
  aliasError,
  isActive,
  onActiveChange,
  isSaving,
  onSave,
  onDeleteAlias,
}: ProductSettingsPanelProps): React.ReactElement {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          제품 설정
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedProduct ? (
          <div className="space-y-6">
            {/* 선택된 제품 정보 */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">{selectedProduct.productName}</h4>
              {selectedProduct.modelName && (
                <p className="text-sm text-muted-foreground">
                  모델: {selectedProduct.modelName}
                </p>
              )}
              {selectedProduct.udiDi && (
                <p className="text-xs text-muted-foreground mt-1">
                  UDI: {selectedProduct.udiDi}
                </p>
              )}
            </div>

            {/* 별칭 설정 */}
            <div className="space-y-2">
              <Label htmlFor="alias">별칭</Label>
              <div className="relative">
                <Input
                  id="alias"
                  placeholder="예: 볼, 이마, 코"
                  value={alias}
                  onChange={(e) => onAliasChange(e.target.value)}
                  maxLength={100}
                  className={cn(aliasError && 'border-destructive')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {alias.length}/100
                </span>
              </div>
              {aliasError && (
                <p className="text-sm text-destructive">{aliasError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                시술 등록 시 이 별칭으로 표시됩니다.
              </p>
            </div>

            {/* 활성화 설정 */}
            <div className="flex items-center justify-between">
              <div>
                <Label>시술 등록 활성화</Label>
                <p className="text-xs text-muted-foreground">
                  비활성화 시 시술 등록에서 숨겨집니다.
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={onActiveChange} />
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <Button
                onClick={onSave}
                disabled={isSaving || !!aliasError}
                className="flex-1"
              >
                {isSaving ? '저장 중...' : '설정 저장'}
              </Button>
              {selectedProduct.alias && (
                <Button
                  variant="outline"
                  onClick={onDeleteAlias}
                  disabled={isSaving}
                >
                  별칭 삭제
                </Button>
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Settings}
            title="제품을 선택하세요"
            description="왼쪽 목록에서 설정할 제품을 선택하세요."
          />
        )}
      </CardContent>
    </Card>
  );
}

export const ProductSettingsPanel = memo(ProductSettingsPanelComponent);
