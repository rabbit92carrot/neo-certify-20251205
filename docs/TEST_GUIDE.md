# 테스트 가이드

> **목적**: 테스트 계정 정보, 전체 페이지 구조, 테스트 시나리오 안내

---

## 테스트 계정

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

### 조직 ID 참조

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

## 전체 페이지 구조

### 공개 페이지 (인증 불필요)

| 경로 | 페이지명 | 설명 | UI 접근 |
|------|----------|------|---------|
| `/` | 홈 | 랜딩 페이지, 로그인 페이지로 리다이렉트 | 직접 URL |
| `/login` | 로그인 | 이메일/비밀번호 로그인 | 직접 URL |
| `/register` | 회원가입 | 조직 등록 신청 | 로그인 페이지 링크 |
| `/mock/kakao` | 카카오 알림톡 Mock | 알림톡 미리보기 (개발용) | **직접 URL만** |

### 제조사 페이지 (`manufacturer@neocert.com`)

| 경로 | 페이지명 | 설명 | UI 접근 |
|------|----------|------|---------|
| `/manufacturer/dashboard` | 대시보드 | 통계 요약, 최근 활동 | 사이드바 메뉴 |
| `/manufacturer/products` | 제품 관리 | 제품 등록/수정/삭제 | 사이드바 메뉴 |
| `/manufacturer/production` | 생산 등록 | Lot 생산, 가상코드 생성 | 사이드바 메뉴 |
| `/manufacturer/shipment` | 출고 | 유통사/병원으로 출고 | 사이드바 메뉴 |
| `/manufacturer/shipment-history` | 이관 이력 | 출고 내역, 회수 기능 | 사이드바 메뉴 |
| `/manufacturer/inventory` | 재고 조회 | 보유 재고 현황 | 사이드바 메뉴 |
| `/manufacturer/history` | 거래 이력 | 전체 거래 히스토리 | 사이드바 메뉴 |
| `/manufacturer/settings` | 환경 설정 | Lot 번호 형식 설정 | 사이드바 메뉴 |

### 유통사 페이지 (`distributor@neocert.com`)

| 경로 | 페이지명 | 설명 | UI 접근 |
|------|----------|------|---------|
| `/distributor/dashboard` | 대시보드 | 통계 요약, 최근 활동 | 사이드바 메뉴 |
| `/distributor/shipment` | 출고 | 병원/다른 유통사로 출고 | 사이드바 메뉴 |
| `/distributor/shipment-history` | 이관 이력 | 출고 내역, 회수 기능 | 사이드바 메뉴 |
| `/distributor/inventory` | 재고 조회 | 보유 재고 현황 | 사이드바 메뉴 |
| `/distributor/history` | 거래 이력 | 전체 거래 히스토리 | 사이드바 메뉴 |

### 병원 페이지 (`hospital@neocert.com`)

| 경로 | 페이지명 | 설명 | UI 접근 |
|------|----------|------|---------|
| `/hospital/dashboard` | 대시보드 | 통계 요약, 최근 활동 | 사이드바 메뉴 |
| `/hospital/treatment` | 시술 등록 | 환자 시술 기록 | 사이드바 메뉴 |
| `/hospital/treatment-history` | 시술 이력 | 시술 내역, 회수 기능 | 사이드바 메뉴 |
| `/hospital/inventory` | 재고 조회 | 보유 재고 현황 | 사이드바 메뉴 |
| `/hospital/history` | 거래 이력 | 전체 거래 히스토리 | 사이드바 메뉴 |

### 관리자 페이지 (`admin@neocert.com`)

| 경로 | 페이지명 | 설명 | UI 접근 |
|------|----------|------|---------|
| `/admin/dashboard` | 대시보드 | 전체 시스템 통계 | 사이드바 메뉴 |
| `/admin/organizations` | 조직 관리 | 조직 목록, 상태 관리 | 사이드바 메뉴 |
| `/admin/approvals` | 가입 승인 | 대기 중인 가입 신청 처리 | 사이드바 메뉴 |
| `/admin/history` | 전체 이력 | 시스템 전체 이벤트 조회 | 사이드바 메뉴 |
| `/admin/recalls` | 회수 이력 | 회수 발생 모니터링 | 사이드바 메뉴 |

---

## UI에서 직접 접근 불가능한 페이지

다음 페이지들은 **네비게이션 메뉴에 없으며** 직접 URL 입력으로만 접근 가능합니다:

| 경로 | 설명 | 접근 계정 |
|------|------|----------|
| `/` | 홈 (리다이렉트) | 모든 사용자 |
| `/mock/kakao` | 카카오 알림톡 Mock | 인증 불필요 |

### 샘플 페이지 (개발용)

UI 패턴 비교 및 프로토타입 검토를 위한 샘플 페이지입니다:

| 경로 | 설명 | 용도 |
|------|------|------|
| `/sample/mobile-nav` | 모바일 네비게이션 샘플 인덱스 | 3가지 패턴 비교 |
| `/sample/mobile-nav/bottom-nav` | Bottom Navigation 패턴 | 하단 고정 네비게이션 바 |
| `/sample/mobile-nav/hamburger` | Hamburger Menu 패턴 | 전체 화면 메뉴 |
| `/sample/mobile-nav/top-tabs` | Top Tabs 패턴 | 상단 탭 네비게이션 |
| `/sample/admin-history-detail` | 관리자 이력 상세 UI 패턴 | 5가지 Lot 상세 뷰 옵션 비교 |
| `/sample/history-scroll-comparison` | 이력 테이블 반응형 비교 | 가로스크롤/반응형 페이지네이션 비교 |
| `/sample/org-history-detail` | 조직 거래이력 상세보기 | 제품 코드 목록 표시 UI 테스트 |
| `/sample/production-selector` | 생산 등록 제품 선택 UI 패턴 | 4가지 UX 개선 옵션 비교 |

---

## 배포 환경 URL

- **Production**: `https://neo-certify-20251205.vercel.app`
- **로컬 개발**: `http://localhost:3000`

### 배포 환경 전체 페이지 URL

```
# 공개 페이지
https://neo-certify-20251205.vercel.app/
https://neo-certify-20251205.vercel.app/login
https://neo-certify-20251205.vercel.app/register
https://neo-certify-20251205.vercel.app/mock/kakao

# 샘플 페이지 (개발용)
https://neo-certify-20251205.vercel.app/sample/mobile-nav
https://neo-certify-20251205.vercel.app/sample/mobile-nav/bottom-nav
https://neo-certify-20251205.vercel.app/sample/mobile-nav/hamburger
https://neo-certify-20251205.vercel.app/sample/mobile-nav/top-tabs
https://neo-certify-20251205.vercel.app/sample/admin-history-detail
https://neo-certify-20251205.vercel.app/sample/history-scroll-comparison
https://neo-certify-20251205.vercel.app/sample/org-history-detail
https://neo-certify-20251205.vercel.app/sample/production-selector

# 제조사
https://neo-certify-20251205.vercel.app/manufacturer/dashboard
https://neo-certify-20251205.vercel.app/manufacturer/products
https://neo-certify-20251205.vercel.app/manufacturer/production
https://neo-certify-20251205.vercel.app/manufacturer/shipment
https://neo-certify-20251205.vercel.app/manufacturer/shipment-history
https://neo-certify-20251205.vercel.app/manufacturer/inventory
https://neo-certify-20251205.vercel.app/manufacturer/history
https://neo-certify-20251205.vercel.app/manufacturer/settings

# 유통사
https://neo-certify-20251205.vercel.app/distributor/dashboard
https://neo-certify-20251205.vercel.app/distributor/shipment
https://neo-certify-20251205.vercel.app/distributor/shipment-history
https://neo-certify-20251205.vercel.app/distributor/inventory
https://neo-certify-20251205.vercel.app/distributor/history

# 병원
https://neo-certify-20251205.vercel.app/hospital/dashboard
https://neo-certify-20251205.vercel.app/hospital/treatment
https://neo-certify-20251205.vercel.app/hospital/treatment-history
https://neo-certify-20251205.vercel.app/hospital/inventory
https://neo-certify-20251205.vercel.app/hospital/history

# 관리자
https://neo-certify-20251205.vercel.app/admin/dashboard
https://neo-certify-20251205.vercel.app/admin/organizations
https://neo-certify-20251205.vercel.app/admin/approvals
https://neo-certify-20251205.vercel.app/admin/history
https://neo-certify-20251205.vercel.app/admin/recalls
```

---

## 테스트 시나리오

### 1. 전체 유통 흐름 테스트

1. **제조사 로그인** (`manufacturer@neocert.com`)
   - `/manufacturer/products` → 제품 등록
   - `/manufacturer/production` → Lot 생산 (가상코드 생성)
   - `/manufacturer/shipment` → 유통사로 출고

2. **유통사 로그인** (`distributor@neocert.com`)
   - `/distributor/inventory` → 재고 확인
   - `/distributor/shipment` → 병원으로 출고

3. **병원 로그인** (`hospital@neocert.com`)
   - `/hospital/inventory` → 재고 확인
   - `/hospital/treatment` → 시술 등록 (환자 연락처 입력)
   - `/mock/kakao` → 알림톡 메시지 확인

4. **각 대시보드에서 통계 확인**

### 2. 회수 테스트

1. 출고 또는 시술 완료 후 **24시간 이내**
2. 해당 이력 페이지에서 **회수 버튼** 클릭
3. 회수 사유 입력
4. 재고 복귀 확인
5. `/admin/recalls`에서 회수 이력 확인

### 3. 승인 플로우 테스트

1. `/register`에서 새 계정 등록 (또는 `pending@neocert.com` 사용)
2. 로그인 시도 → "승인 대기" 메시지 확인
3. **관리자 로그인** (`admin@neocert.com`)
4. `/admin/approvals` → 승인 처리
5. 해당 계정으로 다시 로그인 → 대시보드 접근 확인

### 4. 카카오 알림톡 확인

1. 병원 계정으로 시술 등록
2. `/mock/kakao` 페이지 접속
3. 정품 인증 메시지 확인

---

## 로컬 개발 환경 설정

### 1. Supabase 로컬 서버 시작

```bash
npx supabase start
```

### 2. 데이터베이스 초기화

```bash
npx supabase db reset
npm run gen:types
```

### 3. Next.js 개발 서버 시작

```bash
npm run dev
```

---

## 문제 해결

### "이메일 또는 비밀번호가 올바르지 않습니다"

- Supabase Auth에 사용자가 등록되지 않음
- Cloud 환경: 테스트 계정 Auth 사용자 생성 필요

### "승인 대기 중입니다"

- 조직 상태가 `PENDING_APPROVAL`
- 관리자 계정으로 승인 필요

### 대시보드 통계가 0으로 표시됨

- 데이터가 없는 상태
- 제조사에서 제품 등록 → 생산 → 출고 순서로 데이터 생성 필요

### 페이지 접근 권한 오류

- 각 역할별 페이지는 해당 조직 유형만 접근 가능
- 다른 유형의 페이지 접근 시 리다이렉트됨

---

## 관련 문서

- [개발 계획서](./DEVELOPMENT_PLAN.md)
- [PRD 문서](./core-planning-document/neo-cert-prd-2.1.md)
- [E2E 테스트 가이드](./E2E_TESTING_GUIDE.md)
