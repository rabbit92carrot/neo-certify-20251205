import type { Node, Edge } from '@xyflow/react';

/**
 * 페이지 노드 데이터 타입
 * Record<string, unknown>를 extend하여 React Flow와 호환
 */
export interface PageNodeData extends Record<string, unknown> {
  /** 페이지 라벨 */
  label: string;
  /** 라우트 경로 */
  route: string;
  /** 페이지 타입 (dashboard, form, table, settings) */
  pageType: 'dashboard' | 'form' | 'table' | 'settings' | 'list';
  /** 사용되는 컴포넌트 목록 */
  components: string[];
  /** Storybook 경로 */
  storybookPath?: string;
}

/**
 * 페이지 노드 타입
 */
export type PageNode = Node<PageNodeData, 'page'>;

/**
 * 페이지 맵 설정 타입
 */
export interface PageMapConfig {
  nodes: PageNode[];
  edges: Edge[];
}

/**
 * 역할 타입
 */
export type RoleType = 'manufacturer' | 'distributor' | 'hospital' | 'admin';

/**
 * 역할별 라벨 매핑
 */
export const ROLE_LABELS: Record<RoleType, string> = {
  manufacturer: '제조사',
  distributor: '유통사',
  hospital: '병원',
  admin: '관리자',
};
