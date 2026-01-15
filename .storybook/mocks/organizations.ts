import type {
  Organization,
  OrganizationSelectItem,
  OrganizationType,
} from '@/types/api.types';

export const createMockOrganization = (
  overrides?: Partial<Organization>
): Organization => ({
  id: `org-${Math.random().toString(36).substr(2, 9)}`,
  name: '테스트 조직',
  type: 'MANUFACTURER',
  status: 'APPROVED',
  business_number: '123-45-67890',
  representative_name: '홍길동',
  contact_email: 'test@example.com',
  contact_phone: '02-1234-5678',
  address: '서울시 강남구 테헤란로 123',
  registration_doc_url: null,
  reject_reason: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const mockManufacturer: Organization = createMockOrganization({
  id: 'org-manufacturer-1',
  name: '(주)잼버코리아',
  type: 'MANUFACTURER',
  status: 'APPROVED',
  business_number: '123-45-67890',
  representative_name: '김제조',
  contact_email: 'manufacturer@neocert.com',
  contact_phone: '02-1111-1111',
  address: '서울시 강남구 테헤란로 123',
});

export const mockDistributor: Organization = createMockOrganization({
  id: 'org-distributor-1',
  name: '메디컬 유통',
  type: 'DISTRIBUTOR',
  status: 'APPROVED',
  business_number: '234-56-78901',
  representative_name: '이유통',
  contact_email: 'distributor@neocert.com',
  contact_phone: '02-2222-2222',
  address: '서울시 서초구 반포대로 456',
});

export const mockHospital: Organization = createMockOrganization({
  id: 'org-hospital-1',
  name: '서울미래의원',
  type: 'HOSPITAL',
  status: 'APPROVED',
  business_number: '345-67-89012',
  representative_name: '박병원',
  contact_email: 'hospital@neocert.com',
  contact_phone: '02-3333-3333',
  address: '서울시 송파구 올림픽로 789',
});

export const mockAdmin: Organization = createMockOrganization({
  id: 'org-admin-1',
  name: '시스템 관리자',
  type: 'ADMIN',
  status: 'APPROVED',
  business_number: '000-00-00000',
  representative_name: '관리자',
  contact_email: 'admin@neocert.com',
  contact_phone: '02-0000-0000',
  address: '본사',
});

export const mockOrganizations: Organization[] = [
  mockManufacturer,
  mockDistributor,
  mockHospital,
  createMockOrganization({
    id: 'org-distributor-2',
    name: '헬스케어 유통',
    type: 'DISTRIBUTOR',
    status: 'APPROVED',
    business_number: '456-78-90123',
    contact_email: 'health@example.com',
  }),
  createMockOrganization({
    id: 'org-hospital-2',
    name: '강남클리닉',
    type: 'HOSPITAL',
    status: 'APPROVED',
    business_number: '567-89-01234',
    contact_email: 'gangnam@example.com',
  }),
  createMockOrganization({
    id: 'org-pending-1',
    name: '신규 유통사',
    type: 'DISTRIBUTOR',
    status: 'PENDING',
    business_number: '678-90-12345',
    contact_email: 'new@example.com',
    registration_doc_url: '/docs/registration.pdf',
  }),
];

export const mockPendingOrganizations: Organization[] = [
  createMockOrganization({
    id: 'org-pending-1',
    name: '신규 유통사',
    type: 'DISTRIBUTOR',
    status: 'PENDING',
    business_number: '678-90-12345',
    contact_email: 'new@example.com',
    registration_doc_url: '/docs/registration1.pdf',
  }),
  createMockOrganization({
    id: 'org-pending-2',
    name: '신규 병원',
    type: 'HOSPITAL',
    status: 'PENDING',
    business_number: '789-01-23456',
    contact_email: 'newhospital@example.com',
    registration_doc_url: '/docs/registration2.pdf',
  }),
];

export const mockOrganizationSelectItems: OrganizationSelectItem[] = [
  { id: 'org-distributor-1', name: '메디컬 유통', type: 'DISTRIBUTOR' },
  { id: 'org-distributor-2', name: '헬스케어 유통', type: 'DISTRIBUTOR' },
  { id: 'org-hospital-1', name: '서울미래의원', type: 'HOSPITAL' },
  { id: 'org-hospital-2', name: '강남클리닉', type: 'HOSPITAL' },
];

export const getOrganizationsByType = (
  type: OrganizationType
): Organization[] => {
  return mockOrganizations.filter((org) => org.type === type);
};
