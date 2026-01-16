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
 * 프레임 노드 데이터 타입 (Figma 스타일 프리뷰용)
 * 실제 페이지를 축소하여 렌더링하는 노드에 사용
 */
export interface FrameNodeData extends Record<string, unknown> {
  /** 페이지 라벨 */
  label: string;
  /** 라우트 경로 */
  route: string;
  /** 페이지 타입 */
  pageType: 'dashboard' | 'form' | 'table' | 'settings' | 'list';
  /** 사용되는 컴포넌트 목록 */
  components: string[];
  /** Storybook 경로 */
  storybookPath?: string;
  /** 프리뷰 컴포넌트 (선택적 - 없으면 빈 프레임 표시) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PreviewComponent?: React.ComponentType<any>;
  /** 프리뷰에 전달할 mock 데이터 (선택적) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockData?: Record<string, any>;
}

/**
 * 페이지 노드 타입
 */
export type PageNode = Node<PageNodeData, 'page'>;

/**
 * 프레임 노드 타입 (Figma 스타일)
 */
export type FrameNode = Node<FrameNodeData, 'frame'>;

/**
 * 컴포넌트 카드 데이터 타입
 * 페이지에서 사용되는 컴포넌트를 작은 카드로 표시
 */
export interface ComponentCardData extends Record<string, unknown> {
  /** 컴포넌트 이름 */
  componentName: string;
  /** Storybook 경로 (선택적) */
  storybookPath?: string;
}

/**
 * 컴포넌트 카드 노드 타입
 */
export type ComponentCardNode = Node<ComponentCardData, 'component-card'>;

/**
 * 페이지 맵 설정 타입
 */
export interface PageMapConfig {
  nodes: PageNode[];
  edges: Edge[];
}

/**
 * 프레임 맵 설정 타입 (Figma 스타일)
 * FrameNode와 ComponentCardNode를 모두 포함
 */
export interface FrameMapConfig {
  nodes: (FrameNode | ComponentCardNode)[];
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
