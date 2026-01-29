# Neo-Certify 프로젝트 정밀 분석 보고서

**분석일**: 2025-07-20  
**분석 대상**: neo-certify-20251205  
**분석자**: Claude (Opus 4.5)

---

## 1. PRD 분석

### 1.1 서비스 개요
PDO threads(미용성형용 의료기기)의 **생산 → 유통 → 시술** 전 과정 이력 추적 및 정품 인증 시스템.

**핵심 설계 철학:**
- 환자 개입 최소화 (카카오 알림톡 수신만)
- 가상 식별코드 기반 통계적 관리 (물리적 개별 추적 불가 제품 특성)
- 즉시 이관 (Pending 없음)
- FIFO 자동 처리

### 1.2 PRD 대비 구현 Gap 분석

| 기능 | PRD 정의 | 구현 상태 | Gap |
|------|----------|----------|-----|
| 출고 회수 (발송자, 24h) | 설계됨 | DB RPC 존재, UI/서비스 deprecated | ⚠️ 미완성 → 반품으로 대체 |
| 카카오 알림톡 발송 | 핵심 기능 | Mock만 구현, Aligo API 연동 코드 존재 | ⚠️ 실제 발송 미작동 |
| 사업자등록증 파일 업로드 | 가입 시 필수 | Storage 버킷 마이그레이션 있음 | 미확인 (UI 레벨) |
| 비밀번호 재설정 | 기본 기능 | 최근 구현 (f9ecb2a) | ✅ 완료 |
| 이메일 인증 | 가입 플로우 | 최근 개선 (ffedcb6) | ✅ 완료 |
| 문의 페이지 | 공개 페이지 | `/inquiry` 라우트 존재 | ✅ |
| 코드 검증 페이지 | 공개 페이지 | `/verify/[treatmentId]` 존재 | ✅ |

**주요 Gap:** 카카오 알림톡 실제 발송이 미작동 상태. 서비스의 핵심 가치 제안(환자에게 정품 인증 알림 전달)이 완전히 동작하지 않음.

---

## 2. 코드 구조 분석

### 2.1 디렉토리 구조 평가

```
src/
├── app/                    # Next.js App Router (라우팅 + Server Actions)
│   ├── (auth)/             # 인증 라우트 그룹
│   ├── (dashboard)/        # 역할별 대시보드 (4개 역할)
│   ├── (design-system)/    # 디자인 시스템 프리뷰
│   ├── mock/               # 카카오 알림톡 Mock
│   └── sample/             # UI 프로토타입들
├── components/
│   ├── ui/                 # shadcn/ui (30+ 컴포넌트)
│   ├── views/              # 페이지 뷰 컴포넌트 (역할별)
│   ├── forms/              # 폼 컴포넌트
│   ├── tables/             # 테이블 컴포넌트
│   ├── shared/             # 공유 컴포넌트
│   ├── layout/             # 레이아웃 컴포넌트
│   └── design-system/      # 디자인 시스템 인프라
├── services/               # 비즈니스 로직 (8,101줄, 24개 파일)
├── lib/                    # 유틸리티, Supabase 클라이언트, 검증
├── types/                  # 타입 정의
├── constants/              # 상수 중앙화
└── hooks/                  # 커스텀 훅 (6개)
```

**구조 평가: 양호 (B+)**
- 역할별 명확한 라우트 분리
- Server Action → Service → DB 패턴 일관
- constants/ 중앙화 (SSOT 원칙)

### 2.2 컴포넌트 계층 구조

```
page.tsx (Server Component, 데이터 페칭)
  └── *View.tsx (Client Component, 상태 관리)
       ├── *Table.tsx (데이터 표시)
       ├── *Form.tsx (react-hook-form)
       └── shared/* (공유 UI)
```

**강점:**
- page.tsx가 Server Component로 데이터 페칭 담당
- View 컴포넌트로 클라이언트 로직 분리
- loading.tsx로 Suspense 경계 일관 적용

**약점:**
- View 컴포넌트가 너무 많은 책임 (데이터 변환 + 상태 + 렌더링)
- sample/ 디렉토리에 프로토타입 코드가 프로덕션에 포함됨

### 2.3 Server Actions 패턴

각 역할별 `actions.ts` 파일에 모든 액션 집중:
- `manufacturer/actions.ts` — 제품, Lot, 출고, 설정, 알림, 이력 (16개 액션)
- `hospital/actions.ts` — 시술, 폐기, 설정
- `distributor/actions.ts` — 출고, 반품
- `admin/actions.ts` — 조직 관리, 이력, 회수

**패턴 평가:**
- ✅ 일관된 인증 체크 패턴 (`getManufacturerOrganizationId()`)
- ✅ Zod 스키마 검증 후 서비스 호출
- ✅ `revalidatePath` 적절히 사용
- ✅ `after()`로 비중요 revalidation 비동기 처리 (최신 Next.js 패턴)
- ⚠️ 파일당 액션 수가 과다 (manufacturer: 16개) — 분할 필요

### 2.4 상태 관리

| 대상 | 방식 | 평가 |
|------|------|------|
| 장바구니 | `useCart()` hook (React state) | ✅ 적절 |
| 페이지네이션 | `useCursorPagination()` hook | ✅ 잘 추상화 |
| 인증 | `useAuth()` hook | ✅ |
| 폼 상태 | react-hook-form | ✅ |
| 서버 상태 | Server Components + revalidation | ✅ |
| 전역 상태 | 없음 (불필요) | ✅ |

**외부 상태 관리 라이브러리 없음** — 적절한 판단. Next.js App Router의 Server Component 패턴으로 충분.

### 2.5 에러 핸들링 패턴

```typescript
// 표준 ApiResponse<T> 패턴
type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }
```

- ✅ 일관된 에러 응답 형식
- ✅ 에러 코드 중앙화 (`constants/errors.ts`)
- ✅ PostgrestError → ApiResponse 변환 유틸리티
- ✅ RPC 결과 Zod 검증 (`parseRpcResult`, `parseRpcArray`, `parseRpcSingle`)
- ⚠️ `error.tsx` 존재하지만 사용자 친화적 에러 UI 부족
- ⚠️ 일부 서비스에서 generic catch-all 에러 메시지 사용

### 2.6 타입 시스템 활용도

- **TypeScript strict mode**: `noUncheckedIndexedAccess`, `strictNullChecks` 등 최대한 활성화
- **Database types**: 자동 생성 + MergeDeep 커스텀 확장
- **Zod 스키마**: 모든 입력 검증에 사용, RPC 결과 검증까지 확장
- **ESLint**: `no-explicit-any: error` — any 사용 금지
- **평가**: **A** — TypeScript 활용이 매우 엄격하고 체계적

### 2.7 코드 중복 및 기술 부채

1. **역할별 액션 중복**: manufacturer/distributor/hospital의 출고/반품 액션이 거의 동일한 패턴 반복
2. **Dual RPC 함수**: `create_shipment_atomic`이 3-param, 4-param 두 가지 버전 공존 (레거시 + SECURITY DEFINER 버전)
3. **sample/ 디렉토리**: 프로덕션 빌드에 포함되는 프로토타입 코드 (~15개 파일)
4. **design-system/**: 개발용 도구가 프로덕션 빌드에 포함됨 (~40개 파일)
5. **admin.service.ts** 28줄짜리 파일 — admin/index.ts와 역할 불명확

---

## 3. 데이터베이스 분석

### 3.1 스키마 개요

**핵심 테이블 (11개):**
- `organizations` — 4개 역할 (MANUFACTURER, DISTRIBUTOR, HOSPITAL, ADMIN)
- `products`, `lots`, `virtual_codes` — 제품 계층
- `shipment_batches`, `shipment_details` — 출고
- `treatment_records`, `treatment_details` — 시술
- `disposal_records`, `disposal_details` — 폐기
- `histories` — 전체 이력 (핵심 감사 테이블)

**캐시/보조 테이블 (5개):**
- `hospital_known_products`, `hospital_known_patients` — 자동완성 캐시
- `manufacturer_settings` — 제조사 설정
- `notification_messages` — 알림 메시지
- `organization_alerts` — 조직 알림

**Materialized View:**
- `org_code_counts_mv` — 조직별 코드 수 (pg_cron 5분 주기 갱신)

### 3.2 설계 평가

**강점:**
- ✅ 가상 코드 기반 추적 아키텍처 — 물리적 개별 추적 불가 제품에 적합
- ✅ 원자적 RPC 함수로 트랜잭션 무결성 보장 (FIFO + 소유권 + 이력)
- ✅ `FOR UPDATE SKIP LOCKED` 동시성 처리
- ✅ 반품 체인 추적 (parent_batch_id)
- ✅ HMAC 서명 가상코드로 위조 방지

**약점:**
- ⚠️ `virtual_codes` 테이블이 코드 수 증가 시 성능 병목 (각 Lot당 최대 100,000개)
- ⚠️ `histories` 테이블의 빠른 성장 — 코드당 2+ 이력 레코드 (출고 시 SHIPPED+RECEIVED)
- ⚠️ `owner_id`가 VARCHAR — UUID와 전화번호 혼재 (타입 안전성 결여)
- ⚠️ `patients` 테이블의 PK가 `phone_number` — PII가 PK, 변경 불가

### 3.3 인덱스 분석

마이그레이션 `20260127000002`, `20260127000003`에서 성능 인덱스 추가:
- `idx_vc_owner_status` on `virtual_codes(owner_id, status)` — FIFO 조회 핵심
- 기타 성능 인덱스들

**누락된 인덱스:**
- `histories(created_at)` — 커서 페이지네이션에 필수적이지만 명시적 인덱스 미확인
- `histories(from_owner_id)`, `histories(to_owner_id)` — 이벤트 요약 조회 필터
- `shipment_batches(recall_date)` — 회수 이력 조회

### 3.4 RLS 정책

마이그레이션 `20260121000001~5`에서 보안 강화:
- anon 역할 권한 제한
- 테이블별 SELECT/INSERT/UPDATE 정책
- RPC 함수 anon 접근 제한

**평가:** 
- ✅ SECURITY DEFINER 원자적 함수 내부에서 `get_user_organization_id()` 검증
- ⚠️ RLS 정책과 서비스 레벨 권한 체크가 이중으로 존재 — 의도적이지만 유지보수 복잡도 증가

### 3.5 마이그레이션 패턴 분석

**총 55개 마이그레이션 파일 (2025-12-19 ~ 2026-01-28)**

**반복되는 수정 패턴:**
1. **MAX(UUID) 오류** — 3회 수정 (20251229, 20260106, 20260107) → PostgreSQL UUID 비교 미지원
2. **타입 캐스팅** — 4회 (VARCHAR↔TEXT, BIGINT 캐스팅) → RPC 반환 타입 불일치
3. **grp_key 구성 오류** — 2회 (action_type 누락) → 이벤트 집계 로직 복잡도
4. **빈 배열/null 방어** — 3회 → JSONB 입력 검증 부족
5. **history RLS 필터링** — 2회 → 방향성 필터 누락

**패턴 시사점:**
- RPC 함수가 지나치게 복잡 (get_admin_event_summary_cursor: ~150줄 SQL)
- 타입 시스템이 DB↔앱 경계에서 약함
- 테스트가 마이그레이션 후 충분히 수행되지 않아 연쇄 수정 발생

---

## 4. 빌드/개발 환경 분석

### 4.1 기술 스택

| 구성 | 버전 | 평가 |
|------|------|------|
| Next.js | 16.1.6 | ✅ 최신 (Turbopack 기본) |
| React | 19.2.1 | ✅ 최신 |
| TypeScript | 5.x | ✅ strict mode |
| Tailwind CSS | 4.x | ✅ 최신 |
| Zod | 4.1.13 | ✅ 최신 (v4) |
| Supabase JS | 2.87.0 | ✅ |
| react-hook-form | 7.68.0 | ✅ |

### 4.2 의존성 분석

**프로덕션 의존성 (29개):**
- UI: 17개 Radix 패키지 + shadcn/ui 생태계
- 코어: Next.js, React, Supabase
- 유틸: date-fns, zod, class-variance-authority, clsx, tailwind-merge
- 특수: @xyflow/react (디자인 시스템 캔버스), @upstash/ratelimit (Rate Limiting)
- 가상화: @tanstack/react-virtual

**평가:**
- ✅ 의존성 수 적절
- ⚠️ `@xyflow/react` — 디자인 시스템용으로만 사용, 프로덕션 번들에 불필요하게 포함될 가능성
- ⚠️ `@upstash/redis` + `@upstash/ratelimit` — Rate Limiting에 외부 서비스 의존

### 4.3 테스트 환경

| 도구 | 설정 | 커버리지 |
|------|------|---------|
| Vitest | 단위 + 통합, jsdom | 7개 단위, 18개 통합 |
| Playwright | E2E, 성능 테스트 | 역할별 플로우 + 보안 |
| Vitest Coverage | v8 provider | 미확인 |

**테스트 인프라 평가:**
- ✅ 통합 테스트가 실제 Supabase 사용 (격리 헬퍼 있음)
- ✅ 성능 테스트 인프라 (페이지 로드, 액션 응답 시간 측정)
- ✅ 보안 테스트 (auth-security, security-policies, rls-filtering)
- ⚠️ 컴포넌트 단위 테스트 부재 (React Testing Library 설치되었으나 미사용)
- ⚠️ 서비스 레이어 단위 테스트 없음 (모두 통합 테스트)

### 4.4 ESLint/Prettier

- **ESLint**: Flat config, `no-explicit-any: error`, `no-magic-numbers: warn` (관대한 허용 목록)
- **Prettier**: 설정 있음 (`.prettierrc`)
- **파일별 Override**: shadcn/ui, scripts, e2e, constants, validations 등 세밀한 규칙 관리
- **평가**: **A** — 매우 체계적

### 4.5 TypeScript 설정

strict mode + 추가 엄격 옵션:
- `noUncheckedIndexedAccess: true` — 배열/객체 인덱스 접근 시 undefined 체크 강제
- `noUnusedLocals`, `noUnusedParameters` — 사용하지 않는 변수 금지
- `noImplicitReturns` — 모든 경로에서 반환값 필수

**평가**: **A+** — TypeScript를 가능한 한 엄격하게 사용

---

## 5. Git 이력 분석

### 5.1 커밋 패턴 (80개 분석)

| 유형 | 수 | 비율 |
|------|---|------|
| feat | ~25 | 31% |
| fix | ~25 | 31% |
| perf | ~12 | 15% |
| test | ~8 | 10% |
| refactor | ~5 | 6% |
| docs/style/ci | ~5 | 6% |

### 5.2 반복되는 수정 패턴

1. **DB RPC 타입 불일치 (8회)**: UUID 캐스팅, VARCHAR↔TEXT, BIGINT 변환
   - 근본 원인: PostgreSQL RPC의 반환 타입과 TypeScript 타입 간 자동 검증 부재
   
2. **이벤트 집계 로직 (5회)**: grp_key 구성, 방향성 필터, MAX(UUID)
   - 근본 원인: 복잡한 이벤트 그룹화 SQL이 한 번에 정확히 작성하기 어려움

3. **성능 최적화 (12회)**: lazy loading, 캐싱, 병렬 쿼리, 인덱스
   - 패턴: 기능 구현 후 성능 문제 발견 → 사후 최적화

4. **디자인 시스템 수정 (10회)**: Mock 데이터, 프리뷰 컴포넌트
   - 패턴: 프로덕션 컴포넌트 변경 시 디자인 시스템 동기화 필요

### 5.3 기술 부채 추적

| 부채 | 심각도 | 영향 |
|------|--------|------|
| Dual RPC 함수 (레거시 + SECURITY DEFINER) | 중 | 유지보수 혼란 |
| sample/ 프로토타입 코드 | 하 | 번들 크기 |
| design-system/ 프로덕션 포함 | 하 | 번들 크기 |
| owner_id VARCHAR 타입 | 중 | 타입 안전성 |
| 카카오 알림톡 미완성 | 상 | 핵심 기능 미작동 |
| 출고 회수 deprecated but 존재 | 하 | 코드 혼란 |

---

## 6. 개선 포인트 도출

### 6.1 아키텍처 개선

| 현재 | 문제 | 제안 |
|------|------|------|
| 역할별 actions.ts에 모든 액션 집중 | 파일 비대 (manufacturer: 400줄+) | 기능별 분할: `product.actions.ts`, `shipment.actions.ts` |
| RPC 함수 복잡도 (150줄+ SQL) | 디버깅/수정 어려움 | 함수 분할 또는 뷰 기반 단순화 |
| Service → Supabase 직접 호출 | 테스트 어려움 | Repository 패턴 도입 (선택적) |

### 6.2 DB 스키마 개선

| 현재 | 문제 | 제안 |
|------|------|------|
| `owner_id` VARCHAR | UUID/전화번호 혼재 | owner_org_id UUID + owner_patient_phone VARCHAR 분리 |
| `patients.phone_number` PK | PII가 PK, 변경 불가 | surrogate UUID PK + phone_number UNIQUE |
| Dual RPC 함수 공존 | 혼란 | 레거시 버전 제거, SECURITY DEFINER만 유지 |
| 대량 virtual_codes | 스케일 우려 | 파티셔닝 고려 (lot_id 기반) |

### 6.3 성능 최적화

| 영역 | 현재 | 제안 |
|------|------|------|
| histories 테이블 | 무한 성장, 커서 페이지네이션 | `created_at` 기반 시계열 파티셔닝 |
| MV 갱신 | pg_cron 5분 주기 | 이벤트 기반 갱신 (트리거) 또는 주기 단축 |
| Admin 이벤트 조회 | 복잡한 CTE 4단계 | Pre-aggregated 이벤트 테이블 도입 |
| 누락 인덱스 | histories 필터 컬럼 | `(created_at)`, `(from_owner_id)`, `(to_owner_id)` 복합 인덱스 |

### 6.4 코드 품질

| 영역 | 현재 | 제안 |
|------|------|------|
| 컴포넌트 테스트 | 0개 | 핵심 폼/테이블 컴포넌트 RTL 테스트 추가 |
| 서비스 단위 테스트 | 0개 (통합만) | Mock Supabase로 단위 테스트 분리 |
| sample/ 코드 | 프로덕션 포함 | 별도 브랜치 또는 조건부 빌드 |
| design-system/ | 프로덕션 포함 | 별도 패키지 또는 dev-only 라우트 |

### 6.5 테스트 커버리지

| 레이어 | 현재 커버리지 | 목표 |
|--------|-------------|------|
| Validation (Zod) | ✅ 7개 파일 | 유지 |
| Service (통합) | ✅ 18개 파일 | 단위 테스트 추가 |
| Component | ❌ 없음 | 핵심 폼 5개 이상 |
| E2E | ✅ 역할별 + 보안 | 유지/확대 |
| API Routes | ✅ 1개 (logout) | 추가 필요 없음 (Server Actions 중심) |

### 6.6 보안 강화

| 현재 | 평가 | 추가 제안 |
|------|------|----------|
| RLS | ✅ 적용 | owner_id 타입 강화 |
| CSRF (logout) | ✅ | Server Actions는 Next.js 내장 보호 |
| Rate Limiting | ✅ Upstash | 로그인 시도 횟수 제한 강화 |
| PII 마스킹 | ✅ | 로그 레벨 분리 (prod에서 debug 비활성화) |
| 입력 검증 | ✅ Zod 4 | SQL 인젝션 방어 (ilike 패턴 이스케이프 확인 필요) |
| Secret 관리 | Vault 사용 | HMAC 키 로테이션 정책 필요 |

### 6.7 DX (개발자 경험) 개선

| 현재 | 제안 |
|------|------|
| `npm run gen:types` 수동 실행 | pre-commit hook으로 자동 실행 또는 CI 검증 |
| 마이그레이션 파일 55개 | 주기적 squash (분기별) |
| CI/CD 없음 (revert됨) | GitHub Actions 복원: lint + type-check + test |
| CLAUDE.md 존재 | ✅ AI 개발 친화적 |
| DB Explorer (개발용) | ✅ 디버깅 편의 |

### 6.8 기술 스택 한계점 및 대안

| 현재 기술 | 한계 | 대안/보완 |
|-----------|------|----------|
| Supabase (PostgreSQL) | RPC 복잡도 증가, 타입 안전성 부족 | Drizzle ORM 또는 Prisma 도입 (타입 안전 쿼리) |
| `unstable_cache` | API 불안정, 캐시 무효화 어려움 | React `cache()` + revalidation 조합, 또는 Redis 캐시 |
| Server Actions only | 외부 API 연동 제한 | 필요 시 Route Handlers 추가 (Webhook 등) |
| 1조직 1계정 | 감사 추적 불가 (누가 작업했는지) | 장기적으로 멀티유저 + 역할 체계 |
| Vercel 배포 | 함수 실행 시간 제한 (10s/30s) | 대량 생산(5K+) 시 timeout 이슈 발생 (이미 batch 분할 구현) |

---

## 7. 종합 평가

### 7.1 성숙도 점수

| 영역 | 점수 | 근거 |
|------|------|------|
| 코드 구조 | **B+** | 명확한 레이어 분리, 일부 중복 |
| 타입 안전성 | **A** | strict mode + Zod + no-any |
| DB 설계 | **B** | 원자적 RPC 우수, 타입 혼재 약점 |
| 테스트 | **B** | 통합/E2E 충실, 단위/컴포넌트 부족 |
| 성능 | **B+** | 사후 최적화 다수 적용, MV/인덱스 |
| 보안 | **A-** | RLS + Rate Limit + CSRF, Secret 로테이션 미비 |
| DX | **B+** | 좋은 문서화, CI/CD 미비 |
| **종합** | **B+** | 초기 스타트업 수준에서 우수한 품질 |

### 7.2 우선순위 Top 5 개선사항

1. **🔴 카카오 알림톡 실제 발송 구현** — 핵심 비즈니스 가치
2. **🟡 CI/CD 파이프라인 복원** — lint + type-check + test 자동화
3. **🟡 레거시 RPC 함수 정리** — dual 버전 제거, SECURITY DEFINER 통일
4. **🟡 histories 테이블 인덱스 추가** — 성능 안정성
5. **🟢 컴포넌트 단위 테스트 추가** — 회귀 방지

---

*본 보고서는 코드베이스, PRD, 마이그레이션 이력, Git 커밋 80개를 기반으로 작성되었습니다.*

---

## 7. 추가 분석 (2차 검토)

### 7.1 develop 브랜치 미머지 작업
develop 브랜치에 main에 미반영된 중요 작업이 있음:

| 커밋 | 내용 | 중요도 |
|------|------|--------|
| `2171875` | Aligo API 연동 리팩터링 (공유 템플릿 추출) | 높음 |
| `28e54bb` | Aligo API 서비스 (mock/live 토글, 템플릿 프리뷰) | 높음 |
| `a70f592` | E2E 비즈니스 플로우 테스트 추가 | 높음 |
| `ff882e6` | 알림톡 동일 제품명 집계 기능 | 중간 |
| `26e8f5b` | 시술 서비스 리팩터링 (admin client 제거) | 중간 |
| `923a03c` | Lot 5K 초과 시 배치 분할 (Cloud 타임아웃 방지) | 높음 |
| `d26a22a` | 성능 최적화 (lazy load, useInfiniteScroll 안정화) | 중간 |

**결론:** 카카오 알림톡은 Mock이 아닌 Aligo API 연동 코드가 이미 존재하며, 템플릿 심사 대기 중. 핵심 기능 미작동이 아니라 **외부 심사 대기** 상태.

### 7.2 문서화 수준 (A-)
프로젝트 문서화 수준이 매우 높음:
- **PRD** (역설계 기반 현재 상태 문서)
- **기술 참조** (TECHNICAL_REFERENCE.md) — 아키텍처, DB 최적화, 패턴 정리
- **카카오 알림톡** — 5개 문서 (가이드, API, 심사, 템플릿)
- **성능 감사** — Vercel React Best Practices 8단계 전체 감사 완료
- **디자인 시스템** — 구현 가이드
- **이슈 추적** — 성능 이상치 해결 문서
- **테스트 가이드** — E2E, 유닛, 통합 테스트

### 7.3 수정된 평가

| 항목 | 기존 평가 | 수정 평가 | 이유 |
|------|----------|----------|------|
| 카카오 알림톡 | 🔴 미작동 | 🟡 심사 대기 | Aligo API 연동 코드 존재, 템플릿 심사 중 |
| 문서화 | 언급 안됨 | A- | 매우 체계적인 문서화 |
| 성능 감사 | 언급 안됨 | 완료 | 8단계 전체 감사 + 이상치 해결 |
| 종합 평가 | B+ | **A-** | 문서화, 성능 감사, 알림톡 연동 고려 |

### 7.4 새 프로젝트에서 개선할 핵심 영역

1. **DB 스키마 재설계** — owner_id 타입 정리, 레거시 RPC 제거, 마이그레이션 정리 (squashed 재시작)
2. **CI/CD 복원** — GitHub Actions 파이프라인
3. **테스트 기반 강화** — 컴포넌트 단위 테스트, 서비스 레이어 테스트 확대
4. **코드 구조 개선** — sample/mock 페이지 정리, 디자인 시스템 자동 동기화
5. **알림톡 완성** — 심사 후 바로 Live 전환 가능한 구조 유지
