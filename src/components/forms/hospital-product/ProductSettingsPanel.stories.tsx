'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

/**
 * ProductSettingsPanel은 선택된 제품의 별칭과 활성화 상태를 설정합니다.
 */

interface MockSelectedProduct {
  id: string;
  productName: string;
  modelName: string;
  udiDi: string;
  alias?: string;
}

interface MockProductSettingsPanelProps {
  selectedProduct?: MockSelectedProduct | null;
  isSaving?: boolean;
}

const defaultSelectedProduct: MockSelectedProduct = {
  id: 'hp-001',
  productName: 'PDO Thread Type A',
  modelName: 'PDO-A-100',
  udiDi: '04012345678901',
  alias: '볼',
};

function MockProductSettingsPanel({
  selectedProduct = defaultSelectedProduct,
  isSaving: initialSaving = false,
}: MockProductSettingsPanelProps) {
  const [alias, setAlias] = useState(selectedProduct?.alias || '');
  const [aliasError, setAliasError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(initialSaving);

  const handleAliasChange = (value: string) => {
    setAlias(value);
    if (value.length > 100) {
      setAliasError('별칭은 100자 이내여야 합니다.');
    } else {
      setAliasError(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success('설정이 저장되었습니다.');
  };

  const handleDeleteAlias = () => {
    setAlias('');
    toast.success('별칭이 삭제되었습니다.');
  };

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
                  onChange={(e) => handleAliasChange(e.target.value)}
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
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving || !!aliasError}
                className="flex-1"
              >
                {isSaving ? '저장 중...' : '설정 저장'}
              </Button>
              {selectedProduct.alias && (
                <Button
                  variant="outline"
                  onClick={handleDeleteAlias}
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

const meta = {
  title: 'Forms/HospitalProduct/ProductSettingsPanel',
  component: MockProductSettingsPanel,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
        <Toaster />
      </div>
    ),
  ],
} satisfies Meta<typeof MockProductSettingsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    selectedProduct: defaultSelectedProduct,
  },
};

export const NoProductSelected: Story = {
  args: {
    selectedProduct: null,
  },
};

export const WithoutAlias: Story = {
  args: {
    selectedProduct: {
      ...defaultSelectedProduct,
      alias: undefined,
    },
  },
};

export const Saving: Story = {
  args: {
    selectedProduct: defaultSelectedProduct,
    isSaving: true,
  },
};

export const LongProductName: Story = {
  args: {
    selectedProduct: {
      id: 'hp-002',
      productName: 'PDO Thread Premium Extra Long Version Special Edition',
      modelName: 'PDO-PREMIUM-EXTRA-LONG-500-SE',
      udiDi: '04012345678901234567890123456789',
      alias: '프리미엄 롱',
    },
  },
};
