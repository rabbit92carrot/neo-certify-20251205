# 네오인증서(Neo-Certify) 개발 마스터 플랜

> **문서 목적**: 세션 간 일관된 개발 진행을 위한 종합 개발 계획서
> **PRD 참조**: [docs/core-planning-document/neo-cert-prd-2.1.md](docs/core-planning-document/neo-cert-prd-2.1.md)

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **서비스명** | 네오인증서 |
| **목적** | PDO threads 정품 인증 시스템 |
| **사용자** | 제조사, 유통사, 병원, 환자(알림만), 관리자 |
| **핵심 기능** | 제조→유통→병원→환자 유통 이력 추적, 정품 인증 발급 |

---

## 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| **Frontend** | Next.js (App Router) | 15.x |
| **UI Library** | React | 19.x |
| **Styling** | Tailwind CSS + shadcn/ui | v4 |
| **Language** | TypeScript | 5.x (strict mode) |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions, Storage) | - |
| **Testing** | Vitest | 3.x |
| **Type Generation** | Supabase CLI | - |

---

## 개발 원칙 (필수 준수)

1. **SSOT** - 상수, 설정, 타입을 단일 위치에서 정의 (`src/constants/`, `src/types/`)
2. **No Magic Numbers** - 모든 숫자/문자열을 의미 있는 상수로 관리
3. **No 'any' Type** - TypeScript strict mode, ESLint `@typescript-eslint/no-explicit-any: "error"`
4. **Clean Code** - 읽기 쉽고 유지보수 가능한 코드
5. **TDD** - 비즈니스 로직은 테스트와 함께 개발
6. **Conventional Commits** - `feat:`, `fix:`, `refactor:`, `test:`, `docs:`

---

## 프로젝트 구조

```
neo-certify/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 인증 (login, register)
│   │   ├── (dashboard)/        # 대시보드
│   │   │   ├── manufacturer/   # 제조사 페이지
│   │   │   ├── distributor/    # 유통사 페이지
│   │   │   ├── hospital/       # 병원 페이지
│   │   │   └── admin/          # 관리자 페이지
│   │   └── mock/               # Mock 페이지
│   ├── components/
│   │   ├── ui/                 # shadcn/ui
│   │   ├── forms/              # 폼 컴포넌트
│   │   ├── tables/             # 테이블 컴포넌트
│   │   ├── layout/             # 레이아웃
│   │   └── shared/             # 공통 컴포넌트
│   ├── lib/
│   │   ├── supabase/           # Supabase 클라이언트
│   │   ├── utils/              # 유틸리티
│   │   └── validations/        # Zod 스키마
│   ├── hooks/                  # Custom Hooks
│   ├── constants/              # 상수 (SSOT)
│   ├── types/                  # TypeScript 타입
│   └── services/               # 비즈니스 로직
├── supabase/
│   ├── migrations/             # DB 마이그레이션
│   ├── functions/              # Edge Functions
│   └── seed.sql                # 시드 데이터
└── tests/
    ├── unit/                   # 단위 테스트
    └── integration/            # 통합 테스트
```

---

## Phase별 개발 계획

### Phase 0: 프로젝트 초기 설정 ✅ 완료
**완료일**: 2025-12-09

- [x] Next.js 15 프로젝트 생성 (App Router, TypeScript)
- [x] 패키지 설치 (shadcn/ui, Tailwind CSS v4, @supabase/ssr, Vitest)
- [x] ESLint/Prettier/TypeScript 엄격 설정
- [x] Supabase 프로젝트 연결 및 환경 변수
- [x] 기본 디렉토리 구조 생성
- [x] shadcn/ui 초기화 및 기본 컴포넌트

**산출물**:
- 실행 가능한 Next.js 15 프로젝트
- Supabase 클라이언트 아키텍처 (client/server/middleware/admin)
- SSOT 상수 구조 (organization, config, messages, product, history)
- 유틸리티 함수 + 16개 단위 테스트 통과
- shadcn/ui 컴포넌트 15개 설치

---

### Phase 1: 데이터베이스 스키마 ✅ 완료
**완료일**: 2025-12-09

- [x] 12개 테이블 마이그레이션 SQL 작성 (13개 파일)
- [x] ENUM 타입 정의 (6개: organization_type, organization_status, virtual_code_status, owner_type, history_action_type, notification_type)
- [x] RLS 정책 설정 (모든 테이블)
- [x] 인덱스 생성 (FIFO, 조회 성능 최적화)
- [x] 트리거 생성 (updated_at, 가상코드 자동 생성, 이력 기록)
- [x] 헬퍼 함수 (FIFO 선택, 회수 검증, Lot 번호 생성)
- [x] 시드 데이터 (테스트 계정 7개)

**산출물**:
- 13개 마이그레이션 파일 (`supabase/migrations/00001~00013_*.sql`)
- 시드 데이터 (`supabase/seed.sql`)
- 12개 테이블: organizations, manufacturer_settings, products, lots, patients, virtual_codes, shipment_batches, shipment_details, treatment_records, treatment_details, histories, notification_messages

**핵심 파일**:
- `supabase/migrations/00001_create_enums.sql` - ENUM 타입
- `supabase/migrations/00011_create_functions.sql` - 헬퍼 함수
- `supabase/migrations/00013_enable_rls.sql` - RLS 정책
- `supabase/seed.sql` - 테스트 계정

**다음 단계**:
1. 로컬 Supabase 실행: `npx supabase start`
2. 마이그레이션 적용: `npx supabase db reset`
3. TypeScript 타입 생성: `npm run gen:types`

---

### Phase 2: 상수 및 타입 정의 ✅ 완료
**완료일**: 2025-12-09

- [x] 조직/제품/상태 상수 정의 (Phase 0에서 완료)
- [x] 에러/성공 메시지 상수 (Phase 0에서 완료)
- [x] 설정 값 상수 (Phase 0에서 완료)
- [x] Zod 유효성 검사 스키마 (7개 파일)
- [x] API 요청/응답 타입
- [x] TypeScript 타입 자동 생성 (Supabase CLI)

**산출물**:
- Zod 스키마 7개 파일 (`src/lib/validations/`)
  - `common.ts` - 공통 스키마 (전화번호, 사업자번호, 수량, 파일 등)
  - `auth.ts` - 인증 스키마 (로그인, 회원가입)
  - `organization.ts` - 조직 스키마 (등록, 수정, 제조사 설정)
  - `product.ts` - 제품/Lot 스키마
  - `shipment.ts` - 출고/회수 스키마
  - `treatment.ts` - 시술 스키마
  - `index.ts` - 중앙 export
- API 타입 2개 파일 (`src/types/`)
  - `api.types.ts` - API 응답, 페이지네이션, 조인 엔티티, 대시보드 통계
  - `forms.types.ts` - 폼 데이터 타입, 장바구니 상태

**핵심 파일**:
- `src/types/database.types.ts` - Supabase CLI로 생성
- `src/lib/validations/index.ts` - 모든 Zod 스키마 중앙 export
- `src/types/api.types.ts` - API 응답 표준 타입

---

### Phase 3: 인증 시스템 ✅ 완료
**완료일**: 2025-12-09

- [x] 라우트 상수 정의 (`src/constants/routes.ts`)
- [x] 미들웨어 설정 (세션 갱신, 권한 체크)
- [x] 인증 서비스 (`src/services/auth.service.ts`)
- [x] Server Actions (회원가입, 로그인, 로그아웃)
- [x] OAuth 콜백 라우트
- [x] `useAuth` 훅
- [x] 로그인 페이지 및 폼 컴포넌트
- [x] 회원가입 페이지 및 폼 컴포넌트 (조직 유형, 사업자번호 검증, 파일 업로드)
- [x] 보호된 라우트 레이아웃 ((auth), (dashboard))
- [x] 대시보드 페이지 (제조사/유통사/병원/관리자)
- [x] Storage 버킷 마이그레이션 (사업자등록증 업로드)

**산출물**:
- `middleware.ts` - 세션 갱신 및 권한 체크
- `src/constants/routes.ts` - 라우트 상수
- `src/services/auth.service.ts` - 인증 비즈니스 로직
- `src/hooks/useAuth.ts` - 클라이언트 인증 상태 관리
- `src/app/(auth)/` - 로그인/회원가입 페이지
- `src/app/(dashboard)/` - 대시보드 페이지
- `src/components/forms/` - LoginForm, RegisterForm
- `src/components/shared/LogoutButton.tsx`
- `supabase/migrations/00014_create_storage_bucket.sql`

**핵심 파일**:
- `middleware.ts` - 미들웨어
- `src/services/auth.service.ts` - 인증 서비스
- `src/app/(auth)/actions.ts` - Server Actions

---

### Phase 4: 공통 레이아웃 및 UI ✅ 완료
**완료일**: 2025-12-09

- [x] shadcn/ui 추가 컴포넌트 설치 (collapsible, sheet, tooltip)
- [x] 네비게이션 상수 정의 (`src/constants/navigation.ts`)
- [x] 대시보드 레이아웃 (사이드바, 헤더)
- [x] 역할별 네비게이션 메뉴
- [x] 데이터 테이블 (무한 스크롤)
- [x] 장바구니 컴포넌트
- [x] 접기/펼치기 카드
- [x] 공통 UI 컴포넌트 (StatCard, PageHeader, LoadingSpinner, EmptyState)

**산출물**:
- 레이아웃 컴포넌트: `NavItem`, `Sidebar`, `Header`, `DashboardLayout`
- 공통 컴포넌트: `StatCard`, `PageHeader`, `LoadingSpinner`, `EmptyState`, `DataTable`, `CartDisplay`, `CollapsibleCard`
- 커스텀 훅: `useInfiniteScroll`, `useCart`
- 네비게이션 상수: `NAVIGATION_ITEMS` (역할별 메뉴)

**핵심 파일**:
- `src/components/layout/*` - 레이아웃 컴포넌트
- `src/components/shared/*` - 공통 UI 컴포넌트
- `src/hooks/useInfiniteScroll.ts` - 무한 스크롤 훅
- `src/hooks/useCart.ts` - 장바구니 훅
- `src/constants/navigation.ts` - 네비게이션 상수

---

### Phase 5: 제조사 - 제품/생산 ✅ 완료
**완료일**: 2025-12-09

- [x] 제품 CRUD 페이지
- [x] Lot 생산 등록 (자동 번호 생성)
- [x] 가상 식별코드 자동 생성 (DB 트리거)
- [x] 제조사 설정 페이지
- [x] 대시보드 통계

**산출물**:
- 서비스 레이어 4개 파일
  - `src/services/product.service.ts` - 제품 CRUD
  - `src/services/lot.service.ts` - Lot 생산 등록
  - `src/services/manufacturer-settings.service.ts` - 제조사 설정
  - `src/services/dashboard.service.ts` - 대시보드 통계
- Server Actions: `src/app/(dashboard)/manufacturer/actions.ts`
- 컴포넌트 5개
  - `src/components/shared/ProductCard.tsx` - 박스형 제품 선택 UI
  - `src/components/forms/ProductForm.tsx` - 제품 등록/수정 다이얼로그
  - `src/components/forms/LotForm.tsx` - Lot 생산 등록 폼
  - `src/components/forms/ManufacturerSettingsForm.tsx` - 제조사 설정 폼
  - `src/components/tables/ProductsTable.tsx` - 제품 목록 테이블
- 페이지 4개
  - `src/app/(dashboard)/manufacturer/products/page.tsx` - 제품 관리
  - `src/app/(dashboard)/manufacturer/production/page.tsx` - 생산 등록
  - `src/app/(dashboard)/manufacturer/settings/page.tsx` - 환경 설정
  - `src/app/(dashboard)/manufacturer/dashboard/page.tsx` - 대시보드 (수정)

**핵심 파일**:
- `src/app/(dashboard)/manufacturer/*`
- `src/services/product.service.ts`
- `src/services/lot.service.ts`

---

### Phase 6: 출고 시스템 ✅ 완료
**완료일**: 2025-12-09

- [x] 출고 페이지 (장바구니 방식)
- [x] FIFO 자동 할당 로직 (DB 함수 `select_fifo_codes`)
- [x] Lot 선택 옵션 (제조사만)
- [x] 이관 뭉치 생성
- [x] 소유권 즉시 이전
- [x] 동시성 처리 (`FOR UPDATE SKIP LOCKED`)
- [x] 이관 이력 페이지 (뭉치 단위, 접기/펼치기)
- [x] 회수 기능 (24시간 제한)
- [x] 재고 조회 (제품별, Lot별)

**산출물**:
- 서비스 레이어 2개 파일
  - `src/services/shipment.service.ts` - 출고 생성, 이력 조회, 회수
  - `src/services/inventory.service.ts` - 재고 조회
- Server Actions
  - `src/app/(dashboard)/manufacturer/actions.ts` - 출고/회수 액션 추가
  - `src/app/(dashboard)/distributor/actions.ts` - 유통사 출고/회수 액션
- 컴포넌트 3개
  - `src/components/forms/ShipmentForm.tsx` - 출고 폼 (장바구니 방식)
  - `src/components/tables/ShipmentHistoryTable.tsx` - 출고 이력 테이블
  - `src/components/tables/InventoryTable.tsx` - 재고 테이블
- 제조사 페이지 3개
  - `src/app/(dashboard)/manufacturer/shipment/page.tsx` - 출고
  - `src/app/(dashboard)/manufacturer/shipment-history/page.tsx` - 출고 이력
  - `src/app/(dashboard)/manufacturer/inventory/page.tsx` - 재고 조회
- 유통사 페이지 4개
  - `src/app/(dashboard)/distributor/shipment/page.tsx` - 출고
  - `src/app/(dashboard)/distributor/shipment-history/page.tsx` - 출고 이력
  - `src/app/(dashboard)/distributor/inventory/page.tsx` - 재고 조회
  - `src/app/(dashboard)/distributor/dashboard/page.tsx` - 대시보드 (수정)

**핵심 파일**:
- `src/services/shipment.service.ts`
- `src/services/inventory.service.ts`
- `src/components/forms/ShipmentForm.tsx`

---

### Phase 7: 병원 - 시술 등록 ✅ 완료
**완료일**: 2025-12-10

- [x] 병원 재고 조회 페이지
- [x] 시술 등록 페이지 (장바구니 방식 + 환자 전화번호)
- [x] 환자 자동 생성/조회
- [x] 알림 메시지 DB 기록
- [x] 환자 회수 알림 (시술 회수 시)
- [x] 병원 대시보드 통계 업데이트
- [x] 시술 이력 페이지 (회수 기능 포함)

**산출물**:
- 서비스 레이어: `src/services/treatment.service.ts` - 시술 생성, 조회, 회수 로직
- Server Actions: `src/app/(dashboard)/hospital/actions.ts`
- 컴포넌트:
  - `src/components/forms/TreatmentForm.tsx` - 시술 폼 (장바구니 방식)
  - `src/components/tables/TreatmentHistoryTable.tsx` - 시술 이력 테이블
- 페이지 3개:
  - `src/app/(dashboard)/hospital/inventory/page.tsx` - 재고 조회
  - `src/app/(dashboard)/hospital/treatment/page.tsx` - 시술 등록
  - `src/app/(dashboard)/hospital/treatment-history/page.tsx` - 시술 이력
- 대시보드: `src/app/(dashboard)/hospital/dashboard/page.tsx` - 실제 통계 연동

**핵심 파일**:
- `src/services/treatment.service.ts`
- `src/app/(dashboard)/hospital/*`

---

### Phase 7.5: 필수 수정 및 개선 ✅ 완료
**완료일**: 2025-12-10

Phase 8(관리자 기능) 진행 전 리뷰에서 발견된 개선사항 적용

**7.5.1 필수 수정사항**:
- [x] ProductCard export 누락 수정 (`src/components/shared/index.ts`)
- [x] 병원 시술이력 네비게이션 추가 (`src/constants/navigation.ts`)
- [x] ERROR_CODES 상수 추가 (`src/constants/errors.ts`)

**7.5.2 타임존 관리 개선**:
- [x] 타임존 유틸리티 함수 생성 (`src/lib/utils.ts`)
  - `getKoreaToday()`: 한국 시간 기준 오늘 날짜
  - `getKoreaTodayStart()`: 오늘 시작 시간 (00:00:00 KST)
  - `getKoreaTodayEnd()`: 오늘 끝 시간 (23:59:59.999 KST)
  - `getHoursDifference()`: 시간 차이 계산
  - `formatDateTimeKorea()`: 한국 시간 포맷팅
- [x] dashboard.service.ts 타임존 적용
- [x] treatment.service.ts 타임존 적용

**7.5.3 거래이력 기능**:
- [x] 거래이력 Zod 스키마 (`src/lib/validations/history.ts`)
- [x] 거래이력 서비스 (`src/services/history.service.ts`)
  - `getTransactionHistory()`: 조직 거래이력 조회 (그룹화 지원)
  - `getManufacturerHistory()`: 제조사 이력 (생산/출고/회수)
  - `getDistributorHistory()`: 유통사 이력 (입고/출고/회수)
  - `getHospitalHistory()`: 병원 이력 (입고/시술/회수)
- [x] 거래이력 테이블 컴포넌트 (`src/components/tables/TransactionHistoryTable.tsx`)
- [x] 거래이력 페이지
  - `src/app/(dashboard)/manufacturer/history/page.tsx`
  - `src/app/(dashboard)/distributor/history/page.tsx`
  - `src/app/(dashboard)/hospital/history/page.tsx`
- [x] 네비게이션에 거래이력 추가 (모든 역할)

**산출물**:
- `src/constants/errors.ts` - ERROR_CODES 상수 및 메시지
- `src/lib/utils.ts` - 타임존 유틸리티 함수 추가
- `src/lib/validations/history.ts` - 거래이력 쿼리 스키마
- `src/services/history.service.ts` - 거래이력 서비스
- `src/components/tables/TransactionHistoryTable.tsx` - 거래이력 테이블
- `src/app/(dashboard)/*/history/page.tsx` - 역할별 거래이력 페이지

---

### Phase 8: 관리자 기능 (1-2 세션)

- [ ] 조직 관리 (승인/비활성화)
- [ ] 전체 이력 조회 (Excel형)
- [ ] 회수 모니터링

---

### Phase 9: Mock 페이지 (0.5 세션)

- [ ] 카카오 알림톡 Mock UI

---

### Phase 10: 테스트 (1-2 세션)

- [ ] 단위 테스트 (유틸, 서비스)
- [ ] 통합 테스트 (FIFO, 회수 로직)

---

### Phase 11: 최종 검토/배포 (1 세션)

- [ ] 코드 리뷰
- [ ] 성능 최적화
- [ ] 배포 설정

---

## 핵심 데이터 모델 요약

| 엔티티 | 설명 | 주요 필드 |
|--------|------|----------|
| **organizations** | 조직(=계정) | type, email, business_number, status |
| **products** | 제품 종류 | organization_id, name, udi_di, is_active |
| **lots** | 생산 배치 | product_id, lot_number, quantity, expiry_date |
| **virtual_codes** | 가상 식별코드 | code, lot_id, status, owner_type, owner_id |
| **shipment_batches** | 이관 뭉치 | from_org, to_org, is_recalled, recall_reason |
| **treatment_records** | 시술 기록 | hospital_id, patient_phone, treatment_date |
| **histories** | 이력 | virtual_code_id, action_type, from/to_owner |
| **notification_messages** | 알림 | type, patient_phone, content, is_sent |

---

## 세션 시작 체크리스트

```markdown
## 세션 시작 시
1. [ ] Git 최신 상태 확인 (`git pull`, `git log -5`)
2. [ ] 이 계획 문서 확인 (현재 Phase 파악)
3. [ ] 이전 세션 TODO 확인

## 세션 종료 시
1. [ ] 린트/포맷 검사 (`npm run lint`)
2. [ ] 테스트 통과 (`npm test`)
3. [ ] Git 커밋 (Conventional Commits)
4. [ ] 다음 세션 TODO 기록
```

---

## 기술 가이드라인 참조

### Next.js 15 App Router
- `app/` 디렉토리 사용, `page.tsx`로 라우트 정의
- Server Components 기본, 클라이언트 상태 최소화
- Server Actions로 데이터 변경

### Supabase Auth (SSR)
- `@supabase/ssr` 패키지 사용
- 서버: `createServerClient` + `cookies()`
- 클라이언트: `createBrowserClient`
- 미들웨어: 세션 갱신 처리

### RLS 정책
- 모든 테이블 RLS 활성화
- `auth.uid()` 기반 소유권 검증
- 관리자 전체 접근 별도 정책

### TypeScript
- `strict: true`, `noImplicitAny: true`
- Supabase CLI로 타입 자동 생성
- 제네릭으로 `createClient<Database>` 타입 적용

### Vitest
- `jsdom` 환경
- `tests/setup.ts`로 전역 설정
- 커버리지 목표: 비즈니스 로직 80%+

---

## 현재 진행 상황

| Phase | 상태 | 완료일 |
|-------|------|--------|
| Phase 0 | ✅ 완료 | 2025-12-09 |
| Phase 1 | ✅ 완료 | 2025-12-09 |
| Phase 2 | ✅ 완료 | 2025-12-09 |
| Phase 3 | ✅ 완료 | 2025-12-09 |
| Phase 4 | ✅ 완료 | 2025-12-09 |
| Phase 5 | ✅ 완료 | 2025-12-09 |
| Phase 6 | ✅ 완료 | 2025-12-09 |
| Phase 7 | ✅ 완료 | 2025-12-10 |
| Phase 7.5 | ✅ 완료 | 2025-12-10 |
| Phase 8 | ⏳ 다음 | - |
| Phase 9-11 | 대기 | - |

---

## 다음 세션 작업 (Phase 8: 관리자 기능)

1. 조직 관리 페이지 (`/admin/organizations`)
   - 전체 조직 목록 (무한 스크롤)
   - 상태별 필터 (ACTIVE, PENDING_APPROVAL, INACTIVE)
   - 상태 변경 (승인, 비활성화)
2. 가입 승인 페이지 (`/admin/approvals`)
   - PENDING_APPROVAL 조직 목록
   - 사업자등록증 확인
   - 승인/거부 처리
3. 전체 이력 조회 (`/admin/history`)
   - Excel형 테이블
   - 필터: 기간, 상태, 소유자, 제조사, 제품
4. 회수 모니터링 (`/admin/recalls`)
   - 회수된 이관/시술 목록
   - 회수 사유 확인
