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

// ============================================
// Component Showcase Types (Storybook-like)
// ============================================

/**
 * 컴포넌트 variant 설정
 * 컴포넌트의 다양한 상태/변형을 정의
 */
export interface ComponentVariant {
  /** Variant 식별자 */
  id: string;
  /** 표시 이름 (예: "Default", "Loading", "Error") */
  name: string;
  /** Variant 설명 (선택적) */
  description?: string;
  /** 해당 variant에 전달할 props */
  props: Record<string, unknown>;
}

/**
 * 컴포넌트 Props 문서화
 */
export interface ComponentPropDoc {
  /** 속성 이름 */
  name: string;
  /** TypeScript 타입 (문자열) */
  type: string;
  /** 필수 여부 */
  required: boolean;
  /** 기본값 (있는 경우) */
  defaultValue?: string;
  /** 속성 설명 */
  description: string;
}

/**
 * 컴포넌트 쇼케이스 설정
 * Storybook 스타일로 컴포넌트를 표시하기 위한 전체 설정
 */
export interface ComponentShowcaseConfig {
  /** 컴포넌트 식별자 */
  id: string;
  /** 표시 이름 */
  name: string;
  /** 컴포넌트 카테고리 */
  category: 'ui' | 'shared' | 'forms' | 'tables' | 'layout';
  /** 간단한 설명 */
  description: string;
  /** Storybook 경로 (외부 링크용) */
  storybookPath?: string;
  /** 렌더링할 실제 컴포넌트 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: React.ComponentType<any>;
  /** 표시할 variant 목록 */
  variants: ComponentVariant[];
  /** Props 문서 */
  props: ComponentPropDoc[];
}

/**
 * 컴포넌트 쇼케이스 노드 데이터 (ReactFlow용)
 */
export interface ComponentShowcaseData extends Record<string, unknown> {
  /** 쇼케이스 설정 */
  showcase: ComponentShowcaseConfig;
  /** 현재 선택된 variant ID */
  selectedVariantId?: string;
  /** Props 테이블 표시 여부 */
  showProps?: boolean;
}

/**
 * 컴포넌트 쇼케이스 노드 타입
 */
export type ComponentShowcaseNode = Node<ComponentShowcaseData, 'component-showcase'>;

/**
 * 페이지 맵 설정 타입
 */
export interface PageMapConfig {
  nodes: PageNode[];
  edges: Edge[];
}

/**
 * 프레임 맵 설정 타입 (Figma 스타일)
 * FrameNode, ComponentCardNode, ComponentShowcaseNode를 포함
 */
export interface FrameMapConfig {
  nodes: (FrameNode | ComponentCardNode | ComponentShowcaseNode)[];
  edges: Edge[];
}

// ============================================
// Detail Panel Types
// ============================================

/**
 * 상세 패널에 표시할 페이지 상태/모달 정보
 */
export interface PageStateInfo {
  /** 상태 식별자 */
  id: string;
  /** 상태 이름 */
  name: string;
  /** 설명 */
  description?: string;
}

/**
 * 상세 패널 데이터
 * 프레임 클릭 시 우측에 표시되는 정보
 */
export interface DetailPanelData {
  /** 페이지 ID */
  pageId: string;
  /** 페이지 라벨 */
  label: string;
  /** 라우트 경로 */
  route: string;
  /** 페이지 타입 */
  pageType: string;
  /** 사용 컴포넌트 목록 */
  components: string[];
  /** 페이지 상태/모달 정보 (선택적) */
  states?: PageStateInfo[];
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
