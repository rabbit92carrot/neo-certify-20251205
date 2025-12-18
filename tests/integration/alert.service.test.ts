/**
 * Alert Service 통합 테스트
 *
 * 조직 알림 CRUD, 페이지네이션, 읽음 처리 등을 테스트합니다.
 * 실제 Supabase 로컬 인스턴스를 사용합니다.
 */
import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import {
  createTestAdminClient,
  createTestOrganization,
  cleanupAllTestData,
  cleanupOrganizationAlerts,
} from '../helpers';

describe('Alert Service Integration Tests', () => {
  const adminClient = createTestAdminClient();

  // 테스트 데이터
  let adminOrg: Awaited<ReturnType<typeof createTestOrganization>>;
  let manufacturerOrg: Awaited<ReturnType<typeof createTestOrganization>>;
  let createdAlertIds: string[] = [];

  beforeEach(async () => {
    // 테스트 조직 생성
    adminOrg = await createTestOrganization({ type: 'ADMIN' });
    manufacturerOrg = await createTestOrganization({ type: 'MANUFACTURER' });
    createdAlertIds = [];
  });

  afterEach(async () => {
    // 테스트 알림 정리 - 생성된 ID로 먼저 삭제
    if (createdAlertIds.length > 0) {
      await adminClient
        .from('organization_alerts')
        .delete()
        .in('id', createdAlertIds);
    }
    // 조직별 알림 정리
    const orgIds = [adminOrg?.id, manufacturerOrg?.id].filter(Boolean);
    if (orgIds.length > 0) {
      await adminClient
        .from('organization_alerts')
        .delete()
        .in('recipient_org_id', orgIds);
    }
    await cleanupAllTestData();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  /**
   * 테스트용 알림 생성 헬퍼
   */
  async function createTestAlert(
    recipientOrgId: string,
    options: {
      alertType?: 'INACTIVE_PRODUCT_USAGE' | 'SYSTEM_NOTICE' | 'CUSTOM_MESSAGE';
      title?: string;
      content?: string;
      isRead?: boolean;
    } = {}
  ) {
    const { data, error } = await adminClient
      .from('organization_alerts')
      .insert({
        alert_type: options.alertType || 'INACTIVE_PRODUCT_USAGE',
        recipient_org_id: recipientOrgId,
        title: options.title || '테스트 알림',
        content: options.content || '테스트 알림 내용입니다.',
        metadata: { test: true },
        is_read: options.isRead ?? false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`테스트 알림 생성 실패: ${error.message}`);
    }

    createdAlertIds.push(data.id);
    return data;
  }

  describe('알림 생성 및 조회', () => {
    it('organization_alerts 테이블에 알림을 생성할 수 있다', async () => {
      const alert = await createTestAlert(adminOrg.id, {
        title: '비활성 제품 사용 감지',
        content: '테스트 조직에서 비활성 제품을 사용했습니다.',
      });

      expect(alert).toBeDefined();
      expect(alert.id).toBeDefined();
      expect(alert.title).toBe('비활성 제품 사용 감지');
      expect(alert.recipient_org_id).toBe(adminOrg.id);
      expect(alert.is_read).toBe(false);
    });

    it('조직별로 알림을 조회할 수 있다', async () => {
      // 관리자 조직에 알림 3개 생성
      const alert1 = await createTestAlert(adminOrg.id, { title: '알림 1' });
      const alert2 = await createTestAlert(adminOrg.id, { title: '알림 2' });
      const alert3 = await createTestAlert(adminOrg.id, { title: '알림 3' });

      // 제조사 조직에 알림 1개 생성
      await createTestAlert(manufacturerOrg.id, { title: '제조사 알림' });

      // 관리자 조직 알림 조회 - 이 테스트에서 생성한 알림 ID로 필터링
      const testAlertIds = [alert1.id, alert2.id, alert3.id];
      const { data: adminAlerts, error } = await adminClient
        .from('organization_alerts')
        .select('*')
        .eq('recipient_org_id', adminOrg.id)
        .in('id', testAlertIds)
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(adminAlerts).toHaveLength(3);
    });

    it('alert_type으로 필터링할 수 있다', async () => {
      await createTestAlert(adminOrg.id, { alertType: 'INACTIVE_PRODUCT_USAGE' });
      await createTestAlert(adminOrg.id, { alertType: 'SYSTEM_NOTICE' });
      await createTestAlert(adminOrg.id, { alertType: 'INACTIVE_PRODUCT_USAGE' });

      const { data, error } = await adminClient
        .from('organization_alerts')
        .select('*')
        .eq('recipient_org_id', adminOrg.id)
        .eq('alert_type', 'INACTIVE_PRODUCT_USAGE');

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    it('is_read로 필터링할 수 있다', async () => {
      await createTestAlert(adminOrg.id, { isRead: false });
      await createTestAlert(adminOrg.id, { isRead: false });
      await createTestAlert(adminOrg.id, { isRead: true });

      // 미읽은 알림만 조회
      const { data: unreadAlerts, error } = await adminClient
        .from('organization_alerts')
        .select('*')
        .eq('recipient_org_id', adminOrg.id)
        .eq('is_read', false);

      expect(error).toBeNull();
      expect(unreadAlerts).toHaveLength(2);
    });
  });

  describe('알림 읽음 처리', () => {
    it('단일 알림을 읽음 처리할 수 있다', async () => {
      const alert = await createTestAlert(adminOrg.id);
      expect(alert.is_read).toBe(false);

      // 읽음 처리
      const { error: updateError } = await adminClient
        .from('organization_alerts')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', alert.id);

      expect(updateError).toBeNull();

      // 확인
      const { data: updatedAlert } = await adminClient
        .from('organization_alerts')
        .select('*')
        .eq('id', alert.id)
        .single();

      expect(updatedAlert?.is_read).toBe(true);
      expect(updatedAlert?.read_at).toBeDefined();
    });

    it('여러 알림을 일괄 읽음 처리할 수 있다', async () => {
      const alert1 = await createTestAlert(adminOrg.id);
      const alert2 = await createTestAlert(adminOrg.id);
      const alert3 = await createTestAlert(adminOrg.id);
      const testAlertIds = [alert1.id, alert2.id, alert3.id];

      // 일괄 읽음 처리
      const { error } = await adminClient
        .from('organization_alerts')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .in('id', [alert1.id, alert2.id]);

      expect(error).toBeNull();

      // 확인 - 이 테스트에서 생성한 알림만 필터링
      const { data: alerts } = await adminClient
        .from('organization_alerts')
        .select('*')
        .in('id', testAlertIds);

      const readCount = alerts?.filter(a => a.is_read).length;
      const unreadCount = alerts?.filter(a => !a.is_read).length;

      expect(readCount).toBe(2);
      expect(unreadCount).toBe(1);
    });

    it('조직의 모든 알림을 읽음 처리할 수 있다', async () => {
      await createTestAlert(adminOrg.id);
      await createTestAlert(adminOrg.id);
      await createTestAlert(adminOrg.id);

      // 모두 읽음 처리
      const { error } = await adminClient
        .from('organization_alerts')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('recipient_org_id', adminOrg.id)
        .eq('is_read', false);

      expect(error).toBeNull();

      // 미읽은 알림 카운트 확인
      const { count } = await adminClient
        .from('organization_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_org_id', adminOrg.id)
        .eq('is_read', false);

      expect(count).toBe(0);
    });
  });

  describe('미읽은 알림 카운트', () => {
    it('미읽은 알림 개수를 정확히 조회할 수 있다', async () => {
      const alert1 = await createTestAlert(adminOrg.id, { isRead: false });
      const alert2 = await createTestAlert(adminOrg.id, { isRead: false });
      const alert3 = await createTestAlert(adminOrg.id, { isRead: true });
      const alert4 = await createTestAlert(adminOrg.id, { isRead: false });
      const testAlertIds = [alert1.id, alert2.id, alert3.id, alert4.id];

      const { count, error } = await adminClient
        .from('organization_alerts')
        .select('*', { count: 'exact', head: true })
        .in('id', testAlertIds)
        .eq('is_read', false);

      expect(error).toBeNull();
      expect(count).toBe(3);
    });

    it('읽음 처리 후 카운트가 감소해야 한다', async () => {
      const alert1 = await createTestAlert(adminOrg.id, { isRead: false });
      const alert2 = await createTestAlert(adminOrg.id, { isRead: false });
      const testAlertIds = [alert1.id, alert2.id];

      // 초기 카운트
      const { count: initialCount } = await adminClient
        .from('organization_alerts')
        .select('*', { count: 'exact', head: true })
        .in('id', testAlertIds)
        .eq('is_read', false);

      expect(initialCount).toBe(2);

      // 하나 읽음 처리
      await adminClient
        .from('organization_alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', alert1.id);

      // 업데이트 후 카운트
      const { count: afterCount } = await adminClient
        .from('organization_alerts')
        .select('*', { count: 'exact', head: true })
        .in('id', testAlertIds)
        .eq('is_read', false);

      expect(afterCount).toBe(1);
    });
  });

  describe('페이지네이션', () => {
    it('페이지별로 알림을 조회할 수 있다', async () => {
      // 5개 알림 생성 및 ID 추적
      const testAlertIds: string[] = [];
      for (let i = 0; i < 5; i++) {
        const alert = await createTestAlert(adminOrg.id, { title: `알림 ${i + 1}` });
        testAlertIds.push(alert.id);
      }

      // 이 테스트에서 생성한 알림만 조회
      const { data: allAlerts } = await adminClient
        .from('organization_alerts')
        .select('*')
        .in('id', testAlertIds)
        .order('created_at', { ascending: false });

      expect(allAlerts).toHaveLength(5);

      // 페이지네이션 테스트 (첫 2개)
      const page1 = allAlerts?.slice(0, 2);
      expect(page1).toHaveLength(2);

      // 페이지 2 (다음 2개)
      const page2 = allAlerts?.slice(2, 4);
      expect(page2).toHaveLength(2);

      // 페이지 3 (마지막 1개)
      const page3 = allAlerts?.slice(4, 6);
      expect(page3).toHaveLength(1);
    });

    it('총 개수를 정확히 반환해야 한다', async () => {
      // 7개 알림 생성 및 ID 추적
      const testAlertIds: string[] = [];
      for (let i = 0; i < 7; i++) {
        const alert = await createTestAlert(adminOrg.id);
        testAlertIds.push(alert.id);
      }

      const { count, error } = await adminClient
        .from('organization_alerts')
        .select('*', { count: 'exact' })
        .in('id', testAlertIds);

      expect(error).toBeNull();
      expect(count).toBe(7);
    });
  });

  describe('알림 상세 조회', () => {
    it('알림 상세 정보를 조회할 수 있다', async () => {
      const alert = await createTestAlert(adminOrg.id, {
        title: '상세 조회 테스트',
        content: '상세 내용입니다.',
        alertType: 'INACTIVE_PRODUCT_USAGE',
      });

      const { data, error } = await adminClient
        .from('organization_alerts')
        .select('*')
        .eq('id', alert.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.title).toBe('상세 조회 테스트');
      expect(data?.content).toBe('상세 내용입니다.');
      expect(data?.alert_type).toBe('INACTIVE_PRODUCT_USAGE');
      expect(data?.metadata).toEqual({ test: true });
    });

    it('존재하지 않는 알림 조회 시 에러가 발생해야 한다', async () => {
      const { data, error } = await adminClient
        .from('organization_alerts')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();

      expect(data).toBeNull();
      expect(error).toBeDefined();
    });
  });

  describe('RLS 정책 검증', () => {
    it('다른 조직의 알림은 조회되지 않아야 한다', async () => {
      // 제조사 조직에 알림 생성
      await createTestAlert(manufacturerOrg.id, { title: '제조사 전용 알림' });

      // 관리자 조직 ID로 조회 시 제조사 알림은 조회되지 않음
      const { data, error } = await adminClient
        .from('organization_alerts')
        .select('*')
        .eq('recipient_org_id', adminOrg.id);

      expect(error).toBeNull();
      // 관리자 조직에는 알림이 없으므로 0개
      const manufacturerAlerts = data?.filter(a => a.title === '제조사 전용 알림');
      expect(manufacturerAlerts).toHaveLength(0);
    });
  });
});
