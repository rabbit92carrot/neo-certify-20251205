# 테스트 계정 및 로컬 환경 안내

> **목적**: 로컬 개발 환경에서 디버깅 및 테스트를 위한 계정 정보 및 환경 설정 가이드

---

## 로컬 환경 시작하기

### 1. Supabase 로컬 서버 시작

```bash
# Supabase 로컬 서버 시작
npx supabase start

# 시작 후 출력되는 정보 확인
# - API URL: http://127.0.0.1:54321
# - Studio URL: http://127.0.0.1:54323
# - anon key / service_role key
```

### 2. 데이터베이스 초기화

```bash
# 마이그레이션 적용 및 시드 데이터 삽입
npx supabase db reset

# TypeScript 타입 재생성 (스키마 변경 시)
npm run gen:types
```

### 3. Next.js 개발 서버 시작

```bash
npm run dev
# http://localhost:3000
```

---

## 테스트 계정 목록

### 기본 테스트 계정

| 역할 | 이메일 | 비밀번호 | 조직명 | 상태 |
|------|--------|----------|--------|------|
| 관리자 | `admin@neocert.com` | `admin123` | 네오인증서 관리자 | ACTIVE |
| 제조사 | `manufacturer@neocert.com` | `test123` | 테스트제조사 | ACTIVE |
| 유통사 | `distributor@neocert.com` | `test123` | 테스트유통사 | ACTIVE |
| 병원 | `hospital@neocert.com` | `test123` | 테스트병원 | ACTIVE |

### 추가 테스트 계정

| 역할 | 이메일 | 비밀번호 | 조직명 | 상태 | 용도 |
|------|--------|----------|--------|------|------|
| 유통사 | `distributor2@neocert.com` | `test123` | 테스트유통사2 | ACTIVE | 다단계 유통 테스트 |
| 병원 | `hospital2@neocert.com` | `test123` | 테스트병원2 | ACTIVE | 복수 병원 테스트 |
| 병원 | `pending@neocert.com` | `test123` | 승인대기병원 | PENDING_APPROVAL | 승인 플로우 테스트 |

---

## 조직 ID 참조

테스트 계정의 고정 UUID (API 호출, 디버깅 시 참조용):

| 조직 | UUID |
|------|------|
| 관리자 | `a0000000-0000-0000-0000-000000000001` |
| 제조사 | `a0000000-0000-0000-0000-000000000002` |
| 유통사1 | `a0000000-0000-0000-0000-000000000003` |
| 병원1 | `a0000000-0000-0000-0000-000000000004` |
| 유통사2 | `a0000000-0000-0000-0000-000000000005` |
| 병원2 | `a0000000-0000-0000-0000-000000000006` |
| 승인대기 | `a0000000-0000-0000-0000-000000000007` |

---

## 계정 연동 방법

시드 데이터는 조직(organizations) 테이블만 생성합니다.
실제 로그인을 위해서는 **Supabase Auth에 사용자를 등록**해야 합니다.

### 방법 1: 회원가입 페이지 사용 (권장)

1. `http://localhost:3000/register` 접속
2. 위 테이블의 이메일/비밀번호로 회원가입
3. 조직 정보 입력 (사업자번호는 시드와 다르게 입력)
4. 회원가입 완료 후 `PENDING_APPROVAL` 상태
5. Supabase Studio에서 `status`를 `ACTIVE`로 변경

### 방법 2: Supabase Studio에서 직접 생성

1. `http://127.0.0.1:54323` (Supabase Studio) 접속
2. **Authentication > Users** 메뉴
3. **Add user** 버튼 클릭
4. 이메일/비밀번호 입력 후 생성
5. 생성된 User UID 복사
6. **Table Editor > organizations** 테이블에서 해당 이메일의 `auth_user_id` 업데이트

### 방법 3: SQL로 연동 (시드 계정 재사용)

```sql
-- Supabase Auth에 사용자 생성 후, 해당 UUID로 업데이트
UPDATE organizations
SET auth_user_id = '<생성된-auth-user-uuid>'
WHERE email = 'manufacturer@neocert.com';
```

---

## 제조사 설정 기본값

제조사 계정(`manufacturer@neocert.com`)의 기본 설정:

| 설정 | 값 | 설명 |
|------|-----|------|
| Lot 접두사 | `ND` | Lot 번호 앞에 붙는 식별자 |
| 모델 자릿수 | `5` | 모델 번호 자릿수 |
| 날짜 형식 | `yymmdd` | Lot 번호의 날짜 부분 형식 |
| 사용기한 | `24개월` | 제품 기본 사용기한 |

생성되는 Lot 번호 예시: `ND00001-241210-001`

---

## 역할별 기능 요약

### 관리자 (`/admin/*`)
- 조직 관리 (승인/비활성화)
- 전체 이력 조회
- 회수 모니터링

### 제조사 (`/manufacturer/*`)
- 제품 등록/관리
- Lot 생산 등록
- 출고 (유통사/병원으로)
- 재고 조회
- 이관/거래 이력

### 유통사 (`/distributor/*`)
- 출고 (병원/다른 유통사로)
- 재고 조회
- 이관/거래 이력

### 병원 (`/hospital/*`)
- 시술 등록 (환자에게)
- 시술 이력
- 재고 조회
- 거래 이력

---

## 테스트 시나리오 예시

### 전체 유통 흐름 테스트

1. **제조사 로그인** → 제품 등록 → Lot 생산
2. **제조사** → 유통사1로 출고 (10개)
3. **유통사1 로그인** → 병원1로 출고 (5개)
4. **병원1 로그인** → 시술 등록 (환자: 010-1234-5678, 2개)
5. **각 대시보드**에서 통계 확인
6. **거래 이력**에서 전체 흐름 확인

### 회수 테스트

1. 출고/시술 후 **24시간 이내**에 회수 버튼 클릭
2. 회수 사유 입력
3. 재고 복귀 확인
4. 이력에 회수 표시 확인

### 승인 플로우 테스트

1. **pending@neocert.com** 계정 생성
2. 로그인 시 `/pending` 페이지로 리다이렉트 확인
3. **관리자**로 로그인 → 조직 승인
4. 다시 로그인 → 대시보드 접근 확인

---

## 문제 해결

### "이메일 또는 비밀번호가 올바르지 않습니다"

- Supabase Auth에 사용자가 등록되지 않음
- 회원가입 페이지에서 먼저 계정 생성 필요

### "승인 대기 중입니다"

- 조직 상태가 `PENDING_APPROVAL`
- Supabase Studio에서 `status`를 `ACTIVE`로 변경

### 대시보드 통계가 0으로 표시됨

- 시드 데이터에는 제품/Lot/출고 데이터가 없음
- 제조사에서 제품 등록 → 생산 → 출고 순서로 데이터 생성 필요

### Supabase 연결 오류

```bash
# 환경 변수 확인
cat .env.local

# 필수 변수
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Supabase 상태 확인
npx supabase status
```

---

## 관련 문서

- [개발 계획서](./DEVELOPMENT_PLAN.md)
- [PRD 문서](./core-planning-document/neo-cert-prd-2.1.md)
- [Supabase 마이그레이션](../supabase/migrations/)
