'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlaceholderPreviewProps {
  pageName: string;
  components: string[];
}

/**
 * Placeholder Preview 컴포넌트
 * View 컴포넌트가 아직 준비되지 않은 페이지용 플레이스홀더
 */
export function PlaceholderPreview({ pageName, components }: PlaceholderPreviewProps): React.ReactElement {
  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{pageName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            이 페이지의 View 컴포넌트는 아직 준비 중입니다.
          </p>
          <div className="space-y-2">
            <p className="text-sm font-medium">사용 컴포넌트:</p>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {components.map((comp) => (
                <li key={comp}>{comp}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
