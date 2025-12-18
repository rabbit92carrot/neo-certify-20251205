/**
 * 관리자 서비스 모듈
 *
 * admin.service.ts가 큰 파일이므로 도메인별로 분리된 모듈을 제공합니다.
 * 기존 admin.service.ts는 하위 호환성을 위해 유지되며,
 * 새로운 코드는 이 모듈을 직접 사용할 수 있습니다.
 */

export * from './types';

// 향후 분리될 모듈들:
// export * from './organization';
// export * from './history';
// export * from './recall';
// export * from './event-summary';
