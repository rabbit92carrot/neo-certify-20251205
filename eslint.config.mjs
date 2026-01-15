// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "coverage/**",
    // Config files (avoid TypeScript parser issues)
    "*.config.js",
    "*.config.mjs",
    "*.config.ts",
    // Tests folder (excluded from tsconfig.json, use vitest for linting)
    "tests/**",
    "src/__tests__/**",
    // Auto-generated types (use ** pattern for flat config)
    "**/database.types.ts",
  ]),
  // 기본 TypeScript/React 규칙
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // No 'any' type - 개발 원칙 준수
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",

      // 타입 안전성
      "@typescript-eslint/explicit-function-return-type": ["warn", {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true,
        allowConciseArrowFunctionExpressionsStartingWithVoid: true,
      }],
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",

      // No Magic Numbers - 개발 원칙 준수
      // 자주 사용되는 숫자: 페이지네이션(20,50), 시간(24,60,1000,3000), 그리드(3,4,5,10)
      // 추가: UI(6,7,8,11,12,16,30), 문자열(-4,-6), debounce(300,500,1500)
      "no-magic-numbers": "off",
      "@typescript-eslint/no-magic-numbers": ["warn", {
        ignore: [0, 1, -1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 16, 20, 24, 30, 50, 60, 100, 300, 500, 1000, 1500, 3000, -4, -6],
        ignoreArrayIndexes: true,
        ignoreDefaultValues: true,
        ignoreEnums: true,
        ignoreNumericLiteralTypes: true,
        ignoreReadonlyClassProperties: true,
        ignoreTypeIndexes: true,
      }],

      // 코드 품질
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // React 관련
      "react/jsx-key": "error",
      "react/no-unescaped-entities": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // React 19 Compiler - 초기 데이터 로드 패턴에서 false positive 발생
      // 데이터 페칭 시 useEffect + setState 조합은 일반적인 패턴이며, 이 규칙은 비활성화
      // https://github.com/facebook/react/issues/34743
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // ========================================================================
  // 파일별 Override (flat config에서는 나중에 정의된 규칙이 우선)
  // ========================================================================
  // shadcn/ui 컴포넌트 - 외부 생성 코드이므로 반환 타입 경고 비활성화
  {
    files: ["src/components/ui/**/*.tsx"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  // 개발 스크립트 - 콘솔 및 any 허용
  {
    files: ["scripts/**/*.ts"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
    },
  },
  // E2E 테스트 - 반환 타입 경고 비활성화
  {
    files: ["e2e/**/*.ts"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  // 상수 정의 파일 - 매직 넘버 허용
  {
    files: ["src/constants/**/*.ts"],
    rules: {
      "@typescript-eslint/no-magic-numbers": "off",
    },
  },
  // 로거 파일 - console 허용 (의도적 사용)
  {
    files: ["src/lib/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
  // Validation 스키마 - 매직 넘버 허용 (min/max 제한값)
  {
    files: ["src/lib/validations/**/*.ts"],
    rules: {
      "@typescript-eslint/no-magic-numbers": "off",
    },
  },
  // 유틸리티 함수 - 매직 넘버 허용 (시간 계산 등)
  {
    files: ["src/lib/utils/**/*.ts", "src/lib/rate-limit.ts"],
    rules: {
      "@typescript-eslint/no-magic-numbers": "off",
    },
  },
  // 샘플 페이지 - 매직 넘버 및 반환 타입 경고 비활성화 (프로토타입 코드)
  {
    files: ["src/app/sample/**/*.ts", "src/app/sample/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-magic-numbers": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  // Loading 컴포넌트 - 매직 넘버 허용 (skeleton 개수)
  {
    files: ["**/loading.tsx"],
    rules: {
      "@typescript-eslint/no-magic-numbers": "off",
    },
  },
]);

export default eslintConfig;
