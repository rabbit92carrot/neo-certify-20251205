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

### Phase 0: 프로젝트 초기 설정 (현재 세션)
**예상 시간**: 1 세션

- [ ] Next.js 15 프로젝트 생성 (App Router, TypeScript)
- [ ] 패키지 설치 (shadcn/ui, Tailwind CSS v4, @supabase/ssr)
- [ ] ESLint/Prettier/TypeScript 엄격 설정
- [ ] Supabase 프로젝트 연결 및 환경 변수
- [ ] 기본 디렉토리 구조 생성
- [ ] shadcn/ui 초기화 및 기본 컴포넌트

**산출물**: 실행 가능한 빈 프로젝트, 개발 환경 완료

---

### Phase 1: 데이터베이스 스키마 (1 세션)

- [ ] 11개 엔티티 마이그레이션 SQL 작성
- [ ] ENUM 타입 정의 (organization_type, status 등)
- [ ] RLS 정책 설정
- [ ] 인덱스 및 트리거 생성
- [ ] TypeScript 타입 자동 생성
- [ ] 시드 데이터 (테스트 계정)

**핵심 파일**:
- `supabase/migrations/001_initial_schema.sql`
- `src/types/database.types.ts`

---

### Phase 2: 상수 및 타입 정의 (1 세션)

- [ ] 조직/제품/상태 상수 정의
- [ ] 에러/성공 메시지 상수
- [ ] 설정 값 상수 (수량 제한, 시간 제한)
- [ ] Zod 유효성 검사 스키마
- [ ] API 요청/응답 타입

**핵심 파일**:
- `src/constants/*.ts`
- `src/lib/validations/*.ts`

---

### Phase 3: 인증 시스템 (1-2 세션)

- [ ] Supabase Auth 클라이언트 (client/server/middleware)
- [ ] 미들웨어 (세션 갱신, 권한 체크)
- [ ] 회원가입 (조직 유형, 사업자번호 검증, 파일 업로드)
- [ ] 로그인/로그아웃
- [ ] `useAuth` 훅
- [ ] 보호된 라우트 레이아웃

**핵심 파일**:
- `src/lib/supabase/*.ts`
- `src/middleware.ts`
- `src/app/(auth)/*`

---

### Phase 4: 공통 레이아웃 및 UI (1 세션)

- [ ] 대시보드 레이아웃 (사이드바, 헤더)
- [ ] 역할별 네비게이션 메뉴
- [ ] 데이터 테이블 (무한 스크롤)
- [ ] 장바구니 컴포넌트
- [ ] 접기/펼치기 카드
- [ ] 폼 컴포넌트

**핵심 파일**:
- `src/components/layout/*`
- `src/components/shared/*`

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

## 다음 단계 (Phase 0 실행)

1. Next.js 15 프로젝트 생성
2. 필수 패키지 설치
3. 개발 환경 설정 (ESLint, Prettier, TypeScript)
4. Supabase 연결
5. 디렉토리 구조 생성
6. shadcn/ui 초기화
