import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// React 컴포넌트 테스트 후 자동 정리
afterEach(() => {
  cleanup();
});

// 전역 모킹 설정 (필요시 추가)
