import { redirect } from 'next/navigation';
import { getCachedCurrentUser } from '@/services/auth.service';
import { PageHeader } from '@/components/shared';
import { DbExplorerClient } from './db-explorer-client';
import { getDbStructureAction, getSampleHistoriesAction } from './actions';

export const metadata = {
  title: 'DB Explorer | 개발자 도구',
  description: 'DB 구조 및 이력 조회 로직 시각화',
};

/**
 * DB 구조 탐색기 페이지 (개발자용)
 * - histories 테이블 구조 및 관계
 * - 이력 생성 플로우 다이어그램
 * - 라이브 데이터 샘플 조회
 */
export default async function DbExplorerPage(): Promise<React.ReactElement> {
  const user = await getCachedCurrentUser();

  // Admin만 접근 가능
  if (user?.organization.type !== 'ADMIN') {
    redirect('/login');
  }

  // 초기 데이터 로드
  const [dbStructure, sampleHistories] = await Promise.all([
    getDbStructureAction(),
    getSampleHistoriesAction(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="DB Explorer"
        description="histories 테이블 구조, 이력 생성 플로우, 조회 로직을 시각적으로 확인합니다."
      />

      <DbExplorerClient
        dbStructure={dbStructure.data ?? null}
        sampleHistories={sampleHistories.data ?? []}
      />
    </div>
  );
}
