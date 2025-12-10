# ESLint 분석 및 개선 방향

> 작성일: 2025-12-10
> 분석 대상: neo-certify 프로젝트 전체

## 개요

ESLint 실행 결과 **388개 문제** (34 에러, 354 경고)가 감지되었습니다.
본 문서는 각 문제의 분류와 수정/미수정 결정의 근거를 기록합니다.

---

## 분석 결과 요약

| 분류 | 개수 | 조치 |
|------|------|------|
| 수정 진행 | 3개 | useEffect 패턴 개선 |
| 수정 보류 | ~385개 | 스타일 경고, 테스트 코드, 의도적 패턴 |

---

## 수정 진행 항목

### 1. `react-hooks/set-state-in-effect` (에러 3개)

**대상 파일**:
- `src/app/(dashboard)/admin/approvals/ApprovalTableWrapper.tsx:31`
- `src/app/(dashboard)/admin/history/HistoryTableWrapper.tsx:83`
- `src/app/(dashboard)/admin/recalls/RecallTableWrapper.tsx:73`

**에러 내용**:
```
Error: Calling setState synchronously within an effect can trigger cascading renders
```

**문제점**:
- useEffect 내에서 비동기 함수 호출 후 setState 실행
- Race condition 발생 가능 (빠른 연속 요청 시 이전 요청 결과가 덮어쓸 수 있음)
- 컴포넌트 언마운트 후 setState 호출 가능

**수정 목적**:
1. **Race condition 방지**: cleanup flag로 이전 요청 결과 무시
2. **메모리 누수 방지**: 언마운트 후 상태 업데이트 차단
3. **React 모범 사례 준수**: 공식 문서 권장 패턴 적용

**수정 방안**: cleanup flag 패턴
```tsx
// 수정 전
const fetchData = useCallback(async () => {
  setLoading(true);
  const result = await service.getData();
  setData(result);
  setLoading(false);
}, []);

useEffect(() => {
  fetchData();
}, [fetchData]);

// 수정 후
useEffect(() => {
  let ignore = false;

  async function fetchData() {
    setLoading(true);
    const result = await service.getData();
    if (!ignore) {
      setData(result);
      setLoading(false);
    }
  }

  fetchData();

  return () => {
    ignore = true;
  };
}, [/* dependencies */]);
```

**참고**: [React Docs - Fetching data](https://react.dev/learn/synchronizing-with-effects#fetching-data)

---

## 수정 보류 항목

### 1. `@typescript-eslint/prefer-nullish-coalescing` (경고 ~200개)

**예시**:
```typescript
const page = query.page || 1;
// 경고: Prefer using nullish coalescing operator (`??`) instead of a logical or (`||`)
```

**수정하지 않는 이유**:

| 연산자 | 동작 |
|--------|------|
| `\|\|` | falsy 값 (`0`, `''`, `false`, `null`, `undefined`) 처리 |
| `??` | nullish 값 (`null`, `undefined`)만 처리 |

1. **현재 컨텍스트에서 차이 없음**
   - `page`가 `0`인 경우는 없음 (페이지는 1부터 시작)
   - 대부분의 경우 의미적으로 동일하게 동작

2. **일괄 변경 시 버그 위험**
   ```typescript
   // 위험한 케이스 예시
   const count = input || 10;  // input이 0이면 10
   const count = input ?? 10;  // input이 0이면 0 (의도와 다를 수 있음)
   ```

3. **일관성 유지**
   - 기존 코드베이스 전체가 `||` 사용
   - 부분적 변경은 오히려 혼란 유발

**향후 고려**: 새로 작성하는 코드에서는 `??` 사용 권장

---

### 2. `@typescript-eslint/no-magic-numbers` (경고 ~100개)

**예시**:
```typescript
if (hoursDiff > 24) { ... }
// 경고: No magic number: 24
```

**수정하지 않는 이유**:

1. **도메인에서 명확한 의미**
   - `24`: 24시간 회수 제한 (PRD 명시 요구사항)
   - `302`: HTTP 리다이렉트 상태 코드
   - `20`: 기본 페이지 크기

2. **상수화 시 가독성 저하**
   ```typescript
   // 상수화 후 - 오히려 가독성 저하
   const RECALL_TIME_LIMIT_HOURS = 24;
   if (hoursDiff > RECALL_TIME_LIMIT_HOURS) { ... }

   // 현재 - 문맥에서 명확
   if (hoursDiff > 24) { ... }  // 24시간 제한
   ```

3. **테스트 코드에서는 매직 넘버 허용이 일반적**
   - 테스트 데이터는 명시적 값이 더 명확

**예외**: 의미가 불명확하거나 여러 곳에서 사용되는 숫자는 상수화 권장

---

### 3. `@typescript-eslint/explicit-function-return-type` (경고 ~50개)

**예시**:
```typescript
const handleApprove = async (id: string) => { ... }
// 경고: Missing return type on function
```

**수정하지 않는 이유**:

1. **TypeScript 자동 추론**
   - 대부분의 경우 반환 타입이 정확하게 추론됨
   - 명시적 타입이 필요한 경우는 드묾

2. **이벤트 핸들러의 반환 타입은 명확**
   - `void` 또는 `Promise<void>`
   - 반환값을 사용하지 않음

3. **코드 verbose 증가**
   ```typescript
   // 타입 명시 후
   const handleApprove = async (id: string): Promise<void> => { ... }

   // 현재 - 더 간결
   const handleApprove = async (id: string) => { ... }
   ```

**예외**: 공개 API나 복잡한 반환 타입은 명시 권장

---

### 4. `@next/next/no-assign-module-variable` (에러 1개)

**파일**: `src/__tests__/api/auth/logout.test.ts:30`

**코드**:
```typescript
module = { params: {} };  // 테스트용 모킹
```

**수정하지 않는 이유**:

1. **테스트 전용 코드**
   - 프로덕션 빌드에 포함되지 않음
   - Jest 모킹을 위한 의도적 패턴

2. **Next.js 런타임에서 실행되지 않음**
   - 해당 규칙은 Next.js 런타임 문제 방지 목적
   - 테스트 환경에서는 해당 없음

**향후 고려**: ESLint 설정에서 테스트 파일 예외 처리

---

## 린트 규칙 설정 권장사항

### `.eslintrc.json` 수정 제안

```json
{
  "overrides": [
    {
      "files": ["**/__tests__/**/*", "**/*.test.ts", "**/*.test.tsx"],
      "rules": {
        "@typescript-eslint/no-magic-numbers": "off",
        "@next/next/no-assign-module-variable": "off"
      }
    }
  ]
}
```

이 설정은 테스트 파일에서 불필요한 경고를 제거합니다.

---

## 결론

| 항목 | 조치 | 이유 |
|------|------|------|
| useEffect 패턴 | **수정** | 실제 버그 가능성, React 모범 사례 |
| nullish coalescing | 보류 | 동작 동일, 일괄 변경 리스크 |
| magic numbers | 보류 | 도메인 명확, 과도한 추상화 |
| return type | 보류 | TypeScript 자동 추론 |
| 테스트 코드 에러 | 보류 | 테스트 전용 패턴 |

**총 수정 항목**: 3개 파일
**예상 에러 감소**: 34 → 31 (테스트 코드 에러 제외 시 실질적으로 0)
