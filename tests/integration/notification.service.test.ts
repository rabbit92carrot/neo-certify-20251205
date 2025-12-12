/**
 * Notification Service 통합 테스트
 *
 * 알림 메시지 조회 관련 기능을 테스트합니다.
 * 실제 Supabase 로컬 인스턴스를 사용합니다.
 */
import { describe, it, expect, afterEach, afterAll } from 'vitest';
import {
  createTestAdminClient,
  createTestOrganization,
  createTestProduct,
  createTestLot,
  getVirtualCodesByLot,
  updateVirtualCodeOwner,
  cleanupAllTestData,
  trackTestData,
} from '../helpers';

describe('Notification Service Integration Tests', () => {
  const adminClient = createTestAdminClient();

  afterEach(async () => {
    await cleanupAllTestData();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  // 알림 메시지 생성 헬퍼
  async function createNotificationMessage(options: {
    patientPhone: string;
    type: 'CERTIFICATION' | 'RECALL';
    content?: string;
    isSent?: boolean;
  }) {
    const { data: notification, error } = await adminClient
      .from('notification_messages')
      .insert({
        patient_phone: options.patientPhone,
        type: options.type,
        content:
          options.content ||
          (options.type === 'CERTIFICATION'
            ? '정품 인증이 완료되었습니다.'
            : '인증이 회수되었습니다.'),
        is_sent: options.isSent ?? false,
      })
      .select()
      .single();

    if (error) {throw new Error(`알림 생성 실패: ${error.message}`);}
    trackTestData('notifications', notification.id);
    return notification;
  }

  describe('알림 메시지 목록 조회', () => {
    it('전체 알림 메시지 목록을 조회할 수 있어야 한다', async () => {
      const phone1 = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
      const phone2 = `010${Math.floor(10000000 + Math.random() * 90000000)}`;

      await createNotificationMessage({
        patientPhone: phone1,
        type: 'CERTIFICATION',
      });
      await createNotificationMessage({
        patientPhone: phone2,
        type: 'RECALL',
      });

      const { data: notifications, count } = await adminClient
        .from('notification_messages')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      expect(notifications).toBeDefined();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    it('전화번호로 필터링할 수 있어야 한다', async () => {
      const phone1 = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
      const phone2 = `010${Math.floor(10000000 + Math.random() * 90000000)}`;

      await createNotificationMessage({
        patientPhone: phone1,
        type: 'CERTIFICATION',
      });
      await createNotificationMessage({
        patientPhone: phone1,
        type: 'RECALL',
      });
      await createNotificationMessage({
        patientPhone: phone2,
        type: 'CERTIFICATION',
      });

      const { data: filtered } = await adminClient
        .from('notification_messages')
        .select('*')
        .eq('patient_phone', phone1);

      expect(filtered?.length).toBe(2);
    });

    it('메시지 유형으로 필터링할 수 있어야 한다', async () => {
      const phone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;

      await createNotificationMessage({
        patientPhone: phone,
        type: 'CERTIFICATION',
      });
      await createNotificationMessage({
        patientPhone: phone,
        type: 'CERTIFICATION',
      });
      await createNotificationMessage({
        patientPhone: phone,
        type: 'RECALL',
      });

      const { data: certifications } = await adminClient
        .from('notification_messages')
        .select('*')
        .eq('patient_phone', phone)
        .eq('type', 'CERTIFICATION');

      const { data: recalls } = await adminClient
        .from('notification_messages')
        .select('*')
        .eq('patient_phone', phone)
        .eq('type', 'RECALL');

      expect(certifications?.length).toBe(2);
      expect(recalls?.length).toBe(1);
    });

    it('페이지네이션이 정상적으로 동작해야 한다', async () => {
      const phone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;

      // 5개 알림 생성
      for (let i = 0; i < 5; i++) {
        await createNotificationMessage({
          patientPhone: phone,
          type: i % 2 === 0 ? 'CERTIFICATION' : 'RECALL',
        });
      }

      // 페이지 크기 2로 조회
      const { data: page1 } = await adminClient
        .from('notification_messages')
        .select('*')
        .eq('patient_phone', phone)
        .order('created_at', { ascending: false })
        .range(0, 1);

      const { data: page2 } = await adminClient
        .from('notification_messages')
        .select('*')
        .eq('patient_phone', phone)
        .order('created_at', { ascending: false })
        .range(2, 3);

      expect(page1?.length).toBe(2);
      expect(page2?.length).toBe(2);

      // 페이지 간 중복 없음
      const page1Ids = page1?.map((n) => n.id);
      const page2Ids = page2?.map((n) => n.id);
      for (const id of page1Ids || []) {
        expect(page2Ids?.includes(id)).toBe(false);
      }
    });

    it('최신순으로 정렬되어야 한다', async () => {
      const phone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;

      const first = await createNotificationMessage({
        patientPhone: phone,
        type: 'CERTIFICATION',
        content: '첫 번째',
      });

      // 시간차를 두고 생성
      await new Promise((resolve) => setTimeout(resolve, 10));

      const second = await createNotificationMessage({
        patientPhone: phone,
        type: 'RECALL',
        content: '두 번째',
      });

      const { data: notifications } = await adminClient
        .from('notification_messages')
        .select('*')
        .eq('patient_phone', phone)
        .order('created_at', { ascending: false });

      expect(notifications?.[0].id).toBe(second.id);
      expect(notifications?.[1].id).toBe(first.id);
    });
  });

  describe('알림 메시지 통계', () => {
    it('유형별 알림 수를 조회할 수 있어야 한다', async () => {
      const phone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;

      // CERTIFICATION 3개, RECALL 2개
      await createNotificationMessage({ patientPhone: phone, type: 'CERTIFICATION' });
      await createNotificationMessage({ patientPhone: phone, type: 'CERTIFICATION' });
      await createNotificationMessage({ patientPhone: phone, type: 'CERTIFICATION' });
      await createNotificationMessage({ patientPhone: phone, type: 'RECALL' });
      await createNotificationMessage({ patientPhone: phone, type: 'RECALL' });

      // 인증 알림 수
      const { count: certCount } = await adminClient
        .from('notification_messages')
        .select('*', { count: 'exact', head: true })
        .eq('patient_phone', phone)
        .eq('type', 'CERTIFICATION');

      // 회수 알림 수
      const { count: recallCount } = await adminClient
        .from('notification_messages')
        .select('*', { count: 'exact', head: true })
        .eq('patient_phone', phone)
        .eq('type', 'RECALL');

      expect(certCount).toBe(3);
      expect(recallCount).toBe(2);
    });

    it('발송 상태별 알림 수를 조회할 수 있어야 한다', async () => {
      const phone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;

      // 발송 완료 2개, 미발송 3개
      await createNotificationMessage({
        patientPhone: phone,
        type: 'CERTIFICATION',
        isSent: true,
      });
      await createNotificationMessage({
        patientPhone: phone,
        type: 'CERTIFICATION',
        isSent: true,
      });
      await createNotificationMessage({
        patientPhone: phone,
        type: 'CERTIFICATION',
        isSent: false,
      });
      await createNotificationMessage({
        patientPhone: phone,
        type: 'RECALL',
        isSent: false,
      });
      await createNotificationMessage({
        patientPhone: phone,
        type: 'RECALL',
        isSent: false,
      });

      // 발송 완료
      const { count: sentCount } = await adminClient
        .from('notification_messages')
        .select('*', { count: 'exact', head: true })
        .eq('patient_phone', phone)
        .eq('is_sent', true);

      // 미발송
      const { count: pendingCount } = await adminClient
        .from('notification_messages')
        .select('*', { count: 'exact', head: true })
        .eq('patient_phone', phone)
        .eq('is_sent', false);

      expect(sentCount).toBe(2);
      expect(pendingCount).toBe(3);
    });
  });

  describe('시술 시 알림 생성', () => {
    it('시술 등록 후 CERTIFICATION 알림을 수동으로 생성할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const hospital = await createTestOrganization({ type: 'HOSPITAL' });

      const product = await createTestProduct({ organizationId: manufacturer.id });
      const lot = await createTestLot({ productId: product.id, quantity: 1 });
      const codes = await getVirtualCodesByLot(lot.id);

      // 병원에게 소유권 이전
      await updateVirtualCodeOwner(codes[0].id, 'ORGANIZATION', hospital.id);

      // 시술 등록 (환자에게 이전)
      const patientPhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;

      // 시술 기록 생성
      const { data: treatment } = await adminClient
        .from('treatment_records')
        .insert({
          hospital_id: hospital.id,
          patient_phone: patientPhone,
          treatment_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      trackTestData('treatmentRecords', treatment!.id);

      // 시술 후 알림 메시지 생성
      const { data: notification } = await adminClient
        .from('notification_messages')
        .insert({
          patient_phone: patientPhone,
          type: 'CERTIFICATION',
          content: '정품 인증이 완료되었습니다.',
        })
        .select()
        .single();

      trackTestData('notifications', notification!.id);

      expect(notification).toBeDefined();
      expect(notification?.type).toBe('CERTIFICATION');
      expect(notification?.patient_phone).toBe(patientPhone);
    });
  });

  describe('알림 메시지 내용', () => {
    it('알림 메시지 내용이 올바르게 저장되어야 한다', async () => {
      const phone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
      const customContent = '테스트 알림 메시지입니다. 제품명: PDO 실 30G';

      const notification = await createNotificationMessage({
        patientPhone: phone,
        type: 'CERTIFICATION',
        content: customContent,
      });

      const { data: retrieved } = await adminClient
        .from('notification_messages')
        .select('*')
        .eq('id', notification.id)
        .single();

      expect(retrieved?.content).toBe(customContent);
      expect(retrieved?.type).toBe('CERTIFICATION');
      expect(retrieved?.patient_phone).toBe(phone);
    });
  });
});
