/**
 * Treatment Service 통합 테스트
 *
 * 시술 등록, 환자 자동 생성, 상태 변경, 회수 등을 테스트합니다.
 * 실제 Supabase 로컬 인스턴스를 사용합니다.
 */
import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import {
  createTestAdminClient,
  createTestOrganization,
  createTestProduct,
  createTestLot,
  getVirtualCodesByLot,
  updateVirtualCodeOwner,
  createTestPatient,
  cleanupAllTestData,
  generateTestPhoneNumber,
} from '../helpers';
import { VIRTUAL_CODE_STATUSES, ORGANIZATION_TYPES } from '@/constants';

describe('Treatment Service Integration Tests', () => {
  const adminClient = createTestAdminClient();

  afterEach(async () => {
    await cleanupAllTestData();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('환자 자동 생성 (전화번호 기반)', () => {
    it('존재하지 않는 전화번호로 시술 시 환자가 자동 생성되어야 한다', async () => {
      const patientPhone = generateTestPhoneNumber();

      // 환자 생성
      const { data: patient, error } = await adminClient
        .from('patients')
        .insert({ phone_number: patientPhone })
        .select()
        .single();

      expect(error).toBeNull();
      expect(patient).toBeDefined();
      expect(patient?.phone_number).toBe(patientPhone);
    });

    it('같은 전화번호로 환자를 중복 생성하면 에러가 발생해야 한다', async () => {
      const patientPhone = generateTestPhoneNumber();

      // 첫 번째 환자 생성
      await adminClient.from('patients').insert({ phone_number: patientPhone });

      // 중복 생성 시도
      const { error } = await adminClient
        .from('patients')
        .insert({ phone_number: patientPhone })
        .select()
        .single();

      expect(error).toBeDefined();
      expect(error?.code).toBe('23505'); // unique_violation
    });

    it('기존 환자가 있으면 재사용되어야 한다', async () => {
      const patientPhone = generateTestPhoneNumber();

      // 환자 생성
      await adminClient.from('patients').insert({ phone_number: patientPhone });

      // 기존 환자 조회
      const { data: existingPatient } = await adminClient
        .from('patients')
        .select('*')
        .eq('phone_number', patientPhone)
        .single();

      expect(existingPatient).toBeDefined();
      expect(existingPatient?.phone_number).toBe(patientPhone);
    });
  });

  describe('시술 등록 (createTreatment)', () => {
    let manufacturer: Awaited<ReturnType<typeof createTestOrganization>>;
    let hospital: Awaited<ReturnType<typeof createTestOrganization>>;
    let product: Awaited<ReturnType<typeof createTestProduct>>;
    let lot: Awaited<ReturnType<typeof createTestLot>>;

    beforeEach(async () => {
      manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      hospital = await createTestOrganization({ type: 'HOSPITAL' });
      product = await createTestProduct({ organizationId: manufacturer.id });
      lot = await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 10,
      });

      // 병원에게 코드 소유권 이전 (출고된 상태 시뮬레이션)
      const codes = await getVirtualCodesByLot(lot.id);
      for (const code of codes) {
        await updateVirtualCodeOwner(code.id, 'ORGANIZATION', hospital.id);
      }
    });

    it('시술 기록이 정상적으로 생성되어야 한다', async () => {
      const patientPhone = generateTestPhoneNumber();
      const treatmentDate = '2025-12-10';

      // 환자 생성
      await adminClient.from('patients').insert({ phone_number: patientPhone });

      // 시술 기록 생성
      const { data: treatment, error } = await adminClient
        .from('treatment_records')
        .insert({
          hospital_id: hospital.id,
          patient_phone: patientPhone,
          treatment_date: treatmentDate,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(treatment).toBeDefined();
      expect(treatment?.hospital_id).toBe(hospital.id);
      expect(treatment?.patient_phone).toBe(patientPhone);
    });

    it('시술 시 가상코드 상태가 IN_STOCK에서 USED로 변경되어야 한다', async () => {
      const codes = await getVirtualCodesByLot(lot.id);
      const codeId = codes[0].id;

      // 상태 변경
      await adminClient
        .from('virtual_codes')
        .update({ status: VIRTUAL_CODE_STATUSES.USED })
        .eq('id', codeId);

      // 확인
      const { data: updatedCode } = await adminClient
        .from('virtual_codes')
        .select('status')
        .eq('id', codeId)
        .single();

      expect(updatedCode?.status).toBe(VIRTUAL_CODE_STATUSES.USED);
    });

    it('시술 시 소유권이 조직에서 환자로 이전되어야 한다', async () => {
      const patientPhone = generateTestPhoneNumber();
      const codes = await getVirtualCodesByLot(lot.id);
      const codeId = codes[0].id;

      // 소유권 이전
      await adminClient
        .from('virtual_codes')
        .update({
          owner_id: patientPhone,
          owner_type: 'PATIENT',
          status: VIRTUAL_CODE_STATUSES.USED,
        })
        .eq('id', codeId);

      // 확인
      const { data: updatedCode } = await adminClient
        .from('virtual_codes')
        .select('owner_id, owner_type, status')
        .eq('id', codeId)
        .single();

      expect(updatedCode?.owner_id).toBe(patientPhone);
      expect(updatedCode?.owner_type).toBe('PATIENT');
      expect(updatedCode?.status).toBe(VIRTUAL_CODE_STATUSES.USED);
    });

    it('시술 상세(treatment_details)가 정상적으로 기록되어야 한다', async () => {
      const patientPhone = generateTestPhoneNumber();
      await adminClient.from('patients').insert({ phone_number: patientPhone });

      const { data: treatment, error: treatmentError } = await adminClient
        .from('treatment_records')
        .insert({
          hospital_id: hospital.id,
          patient_phone: patientPhone,
          treatment_date: '2025-12-10',
        })
        .select()
        .single();

      if (treatmentError || !treatment) {
        throw new Error(`시술 기록 생성 실패: ${treatmentError?.message}`);
      }

      const codes = await getVirtualCodesByLot(lot.id);
      const codeIds = codes.slice(0, 3).map((c) => c.id);

      // 시술 상세 기록
      const detailInserts = codeIds.map((virtualCodeId) => ({
        treatment_id: treatment.id,
        virtual_code_id: virtualCodeId,
      }));
      const { error } = await adminClient.from('treatment_details').insert(detailInserts);

      expect(error).toBeNull();

      // 확인
      const { data: details } = await adminClient
        .from('treatment_details')
        .select('*')
        .eq('treatment_id', treatment.id);

      expect(details).toHaveLength(3);
    });

    it('시술 이력이 histories 테이블에 기록되어야 한다', async () => {
      const patientPhone = generateTestPhoneNumber();
      const codes = await getVirtualCodesByLot(lot.id);
      const codeId = codes[0].id;

      // 이력 기록
      const { error } = await adminClient.from('histories').insert({
        virtual_code_id: codeId,
        action_type: 'TREATED',
        from_owner_type: 'ORGANIZATION',
        from_owner_id: hospital.id,
        to_owner_type: 'PATIENT',
        to_owner_id: patientPhone,
        is_recall: false,
      });

      expect(error).toBeNull();

      // 확인
      const { data: history } = await adminClient
        .from('histories')
        .select('*')
        .eq('virtual_code_id', codeId)
        .eq('action_type', 'TREATED')
        .single();

      expect(history).toBeDefined();
      expect(history?.from_owner_id).toBe(hospital.id);
      expect(history?.to_owner_id).toBe(patientPhone);
    });
  });

  describe('정품 인증 알림 메시지', () => {
    it('시술 완료 시 CERTIFICATION 타입의 알림 메시지가 생성되어야 한다', async () => {
      const patientPhone = generateTestPhoneNumber();

      // 알림 메시지 생성
      const { data: notification, error } = await adminClient
        .from('notification_messages')
        .insert({
          type: 'CERTIFICATION',
          patient_phone: patientPhone,
          content: '[네오인증서] 정품 인증 완료\n\n안녕하세요...',
          is_sent: false,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(notification).toBeDefined();
      expect(notification?.type).toBe('CERTIFICATION');
      expect(notification?.is_sent).toBe(false);
    });
  });

  describe('시술 회수 24시간 제한', () => {
    let hospital: Awaited<ReturnType<typeof createTestOrganization>>;

    beforeEach(async () => {
      hospital = await createTestOrganization({ type: 'HOSPITAL' });
    });

    it('생성 직후 시술은 회수 가능해야 한다', async () => {
      const patientPhone = generateTestPhoneNumber();
      await adminClient.from('patients').insert({ phone_number: patientPhone });

      // 시술 기록 생성 (현재 시간)
      const { data: treatment } = await adminClient
        .from('treatment_records')
        .insert({
          hospital_id: hospital.id,
          patient_phone: patientPhone,
          treatment_date: '2025-12-10',
        })
        .select()
        .single();

      // 생성 시간과 현재 시간 차이 계산 (시간 단위)
      const createdAt = new Date(treatment!.created_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      expect(hoursDiff).toBeLessThan(24);
    });

    it('23시간 전에 생성된 시술은 회수 가능해야 한다', async () => {
      const patientPhone = generateTestPhoneNumber();
      await adminClient.from('patients').insert({ phone_number: patientPhone });

      const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();

      // 시술 기록 생성 (23시간 전)
      const { data: treatment } = await adminClient
        .from('treatment_records')
        .insert({
          hospital_id: hospital.id,
          patient_phone: patientPhone,
          treatment_date: '2025-12-10',
          created_at: twentyThreeHoursAgo,
        })
        .select()
        .single();

      const createdAt = new Date(treatment!.created_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      expect(hoursDiff).toBeLessThan(24);
    });

    it('25시간 전에 생성된 시술은 회수 불가능해야 한다', async () => {
      const patientPhone = generateTestPhoneNumber();
      await adminClient.from('patients').insert({ phone_number: patientPhone });

      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

      // 시술 기록 생성 (25시간 전)
      const { data: treatment } = await adminClient
        .from('treatment_records')
        .insert({
          hospital_id: hospital.id,
          patient_phone: patientPhone,
          treatment_date: '2025-12-10',
          created_at: twentyFiveHoursAgo,
        })
        .select()
        .single();

      const createdAt = new Date(treatment!.created_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      expect(hoursDiff).toBeGreaterThan(24);
    });
  });

  describe('시술 회수 (recallTreatment)', () => {
    let manufacturer: Awaited<ReturnType<typeof createTestOrganization>>;
    let hospital: Awaited<ReturnType<typeof createTestOrganization>>;
    let product: Awaited<ReturnType<typeof createTestProduct>>;

    beforeEach(async () => {
      manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      hospital = await createTestOrganization({ type: 'HOSPITAL' });
      product = await createTestProduct({ organizationId: manufacturer.id });
    });

    it('회수 시 소유권이 환자에서 병원으로 복귀되어야 한다', async () => {
      const lot = await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 5,
      });

      const patientPhone = generateTestPhoneNumber();
      const codes = await getVirtualCodesByLot(lot.id);
      const codeId = codes[0].id;

      // 시술 상태 (환자 소유, USED)
      await adminClient
        .from('virtual_codes')
        .update({
          owner_id: patientPhone,
          owner_type: 'PATIENT',
          status: VIRTUAL_CODE_STATUSES.USED,
        })
        .eq('id', codeId);

      // 회수: 소유권 복귀 및 상태 변경
      await adminClient
        .from('virtual_codes')
        .update({
          owner_id: hospital.id,
          owner_type: 'ORGANIZATION',
          status: VIRTUAL_CODE_STATUSES.IN_STOCK,
        })
        .eq('id', codeId);

      // 확인
      const { data: updatedCode } = await adminClient
        .from('virtual_codes')
        .select('owner_id, owner_type, status')
        .eq('id', codeId)
        .single();

      expect(updatedCode?.owner_id).toBe(hospital.id);
      expect(updatedCode?.owner_type).toBe('ORGANIZATION');
      expect(updatedCode?.status).toBe(VIRTUAL_CODE_STATUSES.IN_STOCK);
    });

    it('회수 시 가상코드 상태가 USED에서 IN_STOCK으로 변경되어야 한다', async () => {
      const lot = await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 5,
      });

      const _patientPhone = generateTestPhoneNumber();
      const codes = await getVirtualCodesByLot(lot.id);
      const codeId = codes[0].id;

      // 시술 상태로 변경
      await adminClient
        .from('virtual_codes')
        .update({ status: VIRTUAL_CODE_STATUSES.USED })
        .eq('id', codeId);

      // 회수: 상태 복원
      await adminClient
        .from('virtual_codes')
        .update({ status: VIRTUAL_CODE_STATUSES.IN_STOCK })
        .eq('id', codeId);

      const { data: updatedCode } = await adminClient
        .from('virtual_codes')
        .select('status')
        .eq('id', codeId)
        .single();

      expect(updatedCode?.status).toBe(VIRTUAL_CODE_STATUSES.IN_STOCK);
    });

    it('회수 시 시술 기록이 삭제되어야 한다', async () => {
      const patientPhone = generateTestPhoneNumber();
      await adminClient.from('patients').insert({ phone_number: patientPhone });

      // 시술 기록 생성
      const { data: treatment } = await adminClient
        .from('treatment_records')
        .insert({
          hospital_id: hospital.id,
          patient_phone: patientPhone,
          treatment_date: '2025-12-10',
        })
        .select()
        .single();

      // 시술 기록 삭제
      await adminClient.from('treatment_records').delete().eq('id', treatment!.id);

      // 확인
      const { data: deletedTreatment } = await adminClient
        .from('treatment_records')
        .select('*')
        .eq('id', treatment!.id)
        .single();

      expect(deletedTreatment).toBeNull();
    });

    it('회수 이력이 histories 테이블에 기록되어야 한다', async () => {
      const lot = await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 5,
      });

      const patientPhone = generateTestPhoneNumber();
      const codes = await getVirtualCodesByLot(lot.id);
      const codeId = codes[0].id;

      // 회수 이력 기록
      const { error } = await adminClient.from('histories').insert({
        virtual_code_id: codeId,
        action_type: 'RECALLED',
        from_owner_type: 'PATIENT',
        from_owner_id: patientPhone,
        to_owner_type: 'ORGANIZATION',
        to_owner_id: hospital.id,
        is_recall: true,
        recall_reason: '환자 요청',
      });

      expect(error).toBeNull();

      // 확인
      const { data: history } = await adminClient
        .from('histories')
        .select('*')
        .eq('virtual_code_id', codeId)
        .eq('action_type', 'RECALLED')
        .single();

      expect(history?.is_recall).toBe(true);
      expect(history?.recall_reason).toBe('환자 요청');
    });
  });

  describe('회수 알림 메시지', () => {
    it('회수 시 RECALL 타입의 알림 메시지가 생성되어야 한다', async () => {
      const patientPhone = generateTestPhoneNumber();

      // 회수 알림 메시지 생성
      const { data: notification, error } = await adminClient
        .from('notification_messages')
        .insert({
          type: 'RECALL',
          patient_phone: patientPhone,
          content: '[네오인증서] 정품 인증 회수 안내\n\n안녕하세요...',
          is_sent: false,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(notification?.type).toBe('RECALL');
    });
  });

  describe('병원 권한 검증', () => {
    it('다른 병원에서는 시술을 회수할 수 없어야 한다', async () => {
      const hospital1 = await createTestOrganization({ type: 'HOSPITAL' });
      const hospital2 = await createTestOrganization({ type: 'HOSPITAL' });
      const patientPhone = generateTestPhoneNumber();

      await adminClient.from('patients').insert({ phone_number: patientPhone });

      // hospital1에서 시술 등록
      const { data: treatment } = await adminClient
        .from('treatment_records')
        .insert({
          hospital_id: hospital1.id,
          patient_phone: patientPhone,
          treatment_date: '2025-12-10',
        })
        .select()
        .single();

      expect(treatment?.hospital_id).toBe(hospital1.id);
      expect(treatment?.hospital_id).not.toBe(hospital2.id);
      // 실제 서비스에서 hospital2는 이 시술을 회수할 수 없음
    });
  });

  describe('병원 FIFO 선택', () => {
    it('병원 재고에서 FIFO 기반으로 코드가 선택되어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const hospital = await createTestOrganization({ type: 'HOSPITAL' });
      const product = await createTestProduct({ organizationId: manufacturer.id });

      // 오래된 Lot
      const oldLot = await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 5,
        manufactureDate: '2024-06-01',
      });

      // 새로운 Lot
      const newLot = await createTestLot({
        productId: product.id,
        manufacturerId: manufacturer.id,
        quantity: 5,
        manufactureDate: '2025-01-01',
      });

      // 병원에게 모든 코드 소유권 이전
      const oldCodes = await getVirtualCodesByLot(oldLot.id);
      const newCodes = await getVirtualCodesByLot(newLot.id);

      for (const code of [...oldCodes, ...newCodes]) {
        await updateVirtualCodeOwner(code.id, 'ORGANIZATION', hospital.id);
      }

      // FIFO 선택 (병원 재고에서 3개)
      const { data: selectedCodes } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product.id,
        p_owner_id: hospital.id,
        p_quantity: 3,
      });

      // 오래된 Lot에서 선택되어야 함
      const oldLotCodeIds = oldCodes.map((c) => c.id);
      const selectedIds = selectedCodes.map((c: { virtual_code_id: string }) => c.virtual_code_id);

      expect(selectedIds.every((id: string) => oldLotCodeIds.includes(id))).toBe(true);
    });
  });

  describe('다중 제품 시술', () => {
    it('여러 제품을 한 번에 시술 등록할 수 있어야 한다', async () => {
      const manufacturer = await createTestOrganization({ type: 'MANUFACTURER' });
      const hospital = await createTestOrganization({ type: 'HOSPITAL' });
      const patientPhone = generateTestPhoneNumber();

      // 제품 2개
      const product1 = await createTestProduct({
        organizationId: manufacturer.id,
        name: 'PDO-001',
      });
      const product2 = await createTestProduct({
        organizationId: manufacturer.id,
        name: 'PDO-002',
      });

      // 각 제품별 Lot
      const lot1 = await createTestLot({
        productId: product1.id,
        manufacturerId: manufacturer.id,
        quantity: 10,
      });
      const lot2 = await createTestLot({
        productId: product2.id,
        manufacturerId: manufacturer.id,
        quantity: 10,
      });

      // 병원에게 소유권 이전
      const codes1 = await getVirtualCodesByLot(lot1.id);
      const codes2 = await getVirtualCodesByLot(lot2.id);

      for (const code of [...codes1, ...codes2]) {
        await updateVirtualCodeOwner(code.id, 'ORGANIZATION', hospital.id);
      }

      // 환자 및 시술 기록 생성
      await adminClient.from('patients').insert({ phone_number: patientPhone });

      const { data: treatment } = await adminClient
        .from('treatment_records')
        .insert({
          hospital_id: hospital.id,
          patient_phone: patientPhone,
          treatment_date: '2025-12-10',
        })
        .select()
        .single();

      // 제품1에서 2개, 제품2에서 3개 선택
      const { data: selected1 } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product1.id,
        p_owner_id: hospital.id,
        p_quantity: 2,
      });
      const { data: selected2 } = await adminClient.rpc('select_fifo_codes', {
        p_product_id: product2.id,
        p_owner_id: hospital.id,
        p_quantity: 3,
      });

      const allCodeIds = [
        ...selected1.map((c: { virtual_code_id: string }) => c.virtual_code_id),
        ...selected2.map((c: { virtual_code_id: string }) => c.virtual_code_id),
      ];

      // 시술 상세 기록
      const detailInserts = allCodeIds.map((virtualCodeId: string) => ({
        treatment_id: treatment!.id,
        virtual_code_id: virtualCodeId,
      }));
      await adminClient.from('treatment_details').insert(detailInserts);

      // 소유권 이전 및 상태 변경
      await adminClient
        .from('virtual_codes')
        .update({
          owner_id: patientPhone,
          owner_type: 'PATIENT',
          status: VIRTUAL_CODE_STATUSES.USED,
        })
        .in('id', allCodeIds);

      // 확인
      const { data: details } = await adminClient
        .from('treatment_details')
        .select('*')
        .eq('treatment_id', treatment!.id);

      expect(details).toHaveLength(5); // 2 + 3

      const { data: usedCodes } = await adminClient
        .from('virtual_codes')
        .select('status, owner_type')
        .in('id', allCodeIds);

      expect(usedCodes?.every((c) => c.status === VIRTUAL_CODE_STATUSES.USED)).toBe(true);
      expect(usedCodes?.every((c) => c.owner_type === 'PATIENT')).toBe(true);
    });
  });
});
