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

### Phase 5: 제조사 - 제품/생산 (1-2 세션)

- [ ] 제품 CRUD 페이지
- [ ] Lot 생산 등록 (자동 번호 생성)
- [ ] 가상 식별코드 자동 생성
- [ ] 제조사 설정 페이지
- [ ] 대시보드 통계

**핵심 파일**:
- `src/app/(dashboard)/manufacturer/*`
- `src/services/product.service.ts`
- `src/services/lot.service.ts`

---

### Phase 6: 출고 시스템 (2 세션)

- [ ] 출고 페이지 (장바구니 방식)
- [ ] FIFO 자동 할당 로직
- [ ] Lot 선택 옵션 (제조사)
- [ ] 이관 뭉치 생성
- [ ] 소유권 즉시 이전
- [ ] 동시성 처리 (Lock)
- [ ] Edge Function: `create-shipment`

**핵심 파일**:
- `src/services/shipment.service.ts`
- `supabase/functions/create-shipment/index.ts`

---

### Phase 7: 이관 이력/회수 (1-2 세션)

- [ ] 이관 이력 페이지 (뭉치 단위)
- [ ] 회수 기능 (24시간 제한)
- [ ] 회수 이력 표시
- [ ] Edge Function: `recall-shipment`

---

### Phase 8: 병원 - 시술 등록 (1-2 세션)

- [ ] 시술 등록 페이지
- [ ] 환자 자동 생성/조회
- [ ] 알림 메시지 DB 기록
- [ ] 환자 회수 알림

---

### Phase 9: 재고/이력 조회 (1 세션)

- [ ] 재고 조회 (제품별, Lot별)
- [ ] 거래 이력 조회

---

### Phase 10: 관리자 기능 (1-2 세션)

- [ ] 조직 관리
- [ ] 전체 이력 조회 (Excel형)
- [ ] 회수 모니터링

---

### Phase 11: Mock 페이지 (0.5 세션)

- [ ] 카카오 알림톡 Mock UI

---

### Phase 12: 테스트 (1-2 세션)

- [ ] 단위 테스트 (유틸, 서비스)
- [ ] 통합 테스트 (FIFO, 회수 로직)

---

### Phase 13: 최종 검토/배포 (1 세션)

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
| Phase 5 | ⏳ 다음 | - |
| Phase 6-13 | 대기 | - |

---

## 다음 세션 작업 (Phase 5: 제조사 - 제품/생산)

1. 제품 CRUD 페이지
2. Lot 생산 등록 (자동 번호 생성)
3. 가상 식별코드 자동 생성
4. 제조사 설정 페이지
5. 대시보드 통계
