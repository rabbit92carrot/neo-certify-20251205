'use client';

/**
 * 승인 대기 조직 테이블 래퍼 컴포넌트
 *
 * Split View 레이아웃을 제공합니다.
 * - 데스크톱 (≥1024px): 좌측 테이블 + 우측 상세 패널
 * - 모바일 (<1024px): 테이블 + Sheet 모달
 */

import { useState, useEffect, useTransition, useCallback } from 'react';
import { toast } from 'sonner';
import { ApprovalTable } from '@/components/tables/ApprovalTable';
import { OrganizationDetailPanel } from '@/components/shared/OrganizationDetailPanel';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  approveOrganizationAction,
  rejectOrganizationAction,
  getPendingOrganizationsAction,
  getBusinessLicenseSignedUrlAction,
} from '../actions';
import type { Organization } from '@/types/api.types';

export function ApprovalTableWrapper(): React.ReactElement {
  const [, startTransition] = useTransition();

  // 데이터 상태
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Split View 선택 상태
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);

  // 모바일 Sheet 상태
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // 데이터 로드
  useEffect(() => {
    let ignore = false;

    const fetchData = async (): Promise<void> => {
      setLoading(true);
      const result = await getPendingOrganizationsAction({
        page: 1,
        pageSize: 50,
      });
      if (!ignore) {
        if (result.success && result.data) {
          setOrganizations(result.data.items);
        }
        setLoading(false);
      }
    };

    void fetchData();

    return (): void => {
      ignore = true;
    };
  }, [refreshKey]);

  // Signed URL 로드
  const fetchSignedUrl = useCallback(async (filePath: string): Promise<void> => {
    setUrlLoading(true);
    setSignedUrl(null);

    const result = await getBusinessLicenseSignedUrlAction(filePath);

    if (result.success && result.data) {
      setSignedUrl(result.data.signedUrl);
    } else {
      toast.error('파일을 불러올 수 없습니다');
    }

    setUrlLoading(false);
  }, []);

  // 데이터 새로고침
  const refreshData = (): void => {
    setRefreshKey((prev) => prev + 1);
  };

  // 조직 선택 핸들러 (데스크톱)
  const handleSelectOrg = useCallback(
    (org: Organization): void => {
      setSelectedOrg(org);

      // 사업자등록증 파일이 있으면 Signed URL 로드
      if (org.business_license_file) {
        void fetchSignedUrl(org.business_license_file);
      } else {
        setSignedUrl(null);
      }
    },
    [fetchSignedUrl]
  );

  // 조직 선택 핸들러 (모바일)
  const handleSelectOrgMobile = useCallback(
    (org: Organization): void => {
      handleSelectOrg(org);
      setMobileSheetOpen(true);
    },
    [handleSelectOrg]
  );

  // 승인 핸들러
  const handleApprove = async (id: string): Promise<void> => {
    startTransition(async () => {
      const result = await approveOrganizationAction(id);
      if (result.success) {
        toast.success('조직이 승인되었습니다');
        refreshData();

        // 선택된 조직이 승인된 경우 선택 해제
        if (selectedOrg?.id === id) {
          setSelectedOrg(null);
          setSignedUrl(null);
        }
      } else {
        toast.error(result.error?.message || '승인에 실패했습니다');
      }
    });
  };

  // 거부 핸들러
  const handleReject = async (id: string): Promise<void> => {
    startTransition(async () => {
      const result = await rejectOrganizationAction(id);
      if (result.success) {
        toast.success('조직이 거부되었습니다');
        refreshData();

        // 선택된 조직이 거부된 경우 선택 해제
        if (selectedOrg?.id === id) {
          setSelectedOrg(null);
          setSignedUrl(null);
        }
      } else {
        toast.error(result.error?.message || '거부에 실패했습니다');
      }
    });
  };

  // 모바일에서 승인/거부 후 Sheet 닫기
  const handleApproveAndClose = async (id: string): Promise<void> => {
    await handleApprove(id);
    setMobileSheetOpen(false);
  };

  const handleRejectAndClose = async (id: string): Promise<void> => {
    await handleReject(id);
    setMobileSheetOpen(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      {/* Desktop: Split View */}
      <div className="hidden lg:grid lg:grid-cols-5 lg:gap-4 lg:min-h-[600px]">
        {/* 좌측: 테이블 */}
        <div className="col-span-3 overflow-auto">
          <ApprovalTable
            organizations={organizations}
            selectedOrgId={selectedOrg?.id}
            onSelectOrg={handleSelectOrg}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>

        {/* 우측: 상세 패널 */}
        <div className="col-span-2 overflow-hidden rounded-lg border bg-gray-50/50">
          <OrganizationDetailPanel
            organization={selectedOrg}
            signedUrl={signedUrl}
            isLoading={urlLoading}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>
      </div>

      {/* Mobile: Table + Sheet */}
      <div className="block lg:hidden">
        <ApprovalTable
          organizations={organizations}
          selectedOrgId={selectedOrg?.id}
          onSelectOrg={handleSelectOrgMobile}
          onApprove={handleApprove}
          onReject={handleReject}
        />

        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>조직 상세</SheetTitle>
            </SheetHeader>
            <OrganizationDetailPanel
              organization={selectedOrg}
              signedUrl={signedUrl}
              isLoading={urlLoading}
              onApprove={handleApproveAndClose}
              onReject={handleRejectAndClose}
              className="h-full"
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
