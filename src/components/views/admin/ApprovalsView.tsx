/**
 * 가입 승인 View 컴포넌트
 * Admin 가입 승인 페이지 뷰 (props 기반)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Factory, Stethoscope, Clock, Check, X } from 'lucide-react';

export interface ApprovalOrganization {
  id: string;
  name: string;
  email: string;
  type: 'MANUFACTURER' | 'DISTRIBUTOR' | 'HOSPITAL';
  businessNumber: string;
  representativeName: string;
  createdAt: string;
}

export interface ApprovalsViewProps {
  /** 승인 대기 조직 목록 */
  pendingOrganizations: ApprovalOrganization[];
}

const TYPE_ICONS = {
  MANUFACTURER: <Factory className="h-5 w-5" />,
  DISTRIBUTOR: <Building2 className="h-5 w-5" />,
  HOSPITAL: <Stethoscope className="h-5 w-5" />,
};

const TYPE_LABELS = {
  MANUFACTURER: '제조사',
  DISTRIBUTOR: '유통사',
  HOSPITAL: '병원',
};

const TYPE_COLORS = {
  MANUFACTURER: 'bg-blue-50 text-blue-700 border-blue-200',
  DISTRIBUTOR: 'bg-purple-50 text-purple-700 border-purple-200',
  HOSPITAL: 'bg-green-50 text-green-700 border-green-200',
};

export function ApprovalsView({
  pendingOrganizations,
}: ApprovalsViewProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader
        title="가입 승인"
        description="신규 조직의 가입 요청을 검토하고 승인합니다."
      />

      {/* 승인 대기 통계 */}
      <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <Clock className="h-5 w-5 text-yellow-600" />
        <span className="font-medium text-yellow-800">
          {pendingOrganizations.length}건의 승인 대기 중
        </span>
      </div>

      {/* 승인 대기 조직 카드 목록 */}
      <div className="space-y-4">
        {pendingOrganizations.map((org) => (
          <Card key={org.id} className={`border-l-4 ${TYPE_COLORS[org.type]}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {TYPE_ICONS[org.type]}
                  <div>
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{org.email}</p>
                  </div>
                </div>
                <Badge variant="outline">{TYPE_LABELS[org.type]}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-muted-foreground">사업자번호</p>
                  <p className="font-medium">{org.businessNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">대표자</p>
                  <p className="font-medium">{org.representativeName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">신청일</p>
                  <p className="font-medium">{org.createdAt}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" disabled>
                  <Check className="h-4 w-4 mr-2" />
                  승인
                </Button>
                <Button size="sm" variant="outline" className="flex-1" disabled>
                  <X className="h-4 w-4 mr-2" />
                  거절
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {pendingOrganizations.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            승인 대기 중인 조직이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
