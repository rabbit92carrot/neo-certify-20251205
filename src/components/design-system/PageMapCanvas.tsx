'use client';

import { useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type NodeTypes,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { FramePreviewNode } from './FramePreviewNode';
import { ComponentCard } from './ComponentCard';
import { ComponentShowcaseNode } from './ComponentShowcaseNode';
import type { FrameMapConfig } from './types';

interface FrameMapCanvasProps {
  config: FrameMapConfig;
  selectedNodeId: string | null;
  focusKey?: number;
  onNodeClick?: (nodeId: string, nodeType: string) => void;
}

/**
 * 네비게이션 핸들러 - ReactFlow 내부에서 fitView 호출
 */
function NavigationHandler({
  selectedNodeId,
  focusKey,
}: {
  selectedNodeId: string | null;
  focusKey?: number;
}) {
  const { fitView, getNode } = useReactFlow();
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!selectedNodeId) {
      return;
    }

    const node = getNode(selectedNodeId);
    if (!node) {
      return;
    }

    // focusKey가 변경되면 항상 fitView 실행 (같은 노드 재선택 시에도)
    fitView({
      nodes: [node],
      padding: 0.3,
      duration: isInitialMount.current ? 0 : 500, // 초기 로드는 애니메이션 없이
    });

    isInitialMount.current = false;
  }, [selectedNodeId, focusKey, fitView, getNode]);

  return null;
}

/**
 * 프레임 맵 캔버스 내부 컴포넌트
 */
function FrameMapCanvasInner({
  config,
  selectedNodeId,
  focusKey,
  onNodeClick,
}: FrameMapCanvasProps): React.ReactElement {
  const [nodes, , onNodesChange] = useNodesState(config.nodes as Node[]);
  const [edges, , onEdgesChange] = useEdgesState(config.edges);

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      frame: FramePreviewNode,
      'component-card': ComponentCard,
      'component-showcase': ComponentShowcaseNode,
    }),
    []
  );

  const handleNodeClick = useMemo(
    () =>
      onNodeClick
        ? (_event: React.MouseEvent, node: Node) => {
            onNodeClick(node.id, node.type ?? 'unknown');
          }
        : undefined,
    [onNodeClick]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      fitView={!selectedNodeId} // 선택된 노드 없으면 전체 뷰
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.05}
      maxZoom={1.5}
      nodesDraggable={false}
      nodesConnectable={false}
      defaultEdgeOptions={{
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      }}
      proOptions={{ hideAttribution: true }}
    >
      <NavigationHandler selectedNodeId={selectedNodeId} focusKey={focusKey} />
      <Background color="#e2e8f0" gap={20} />
      <Controls position="bottom-left" />
      <MiniMap
        position="bottom-right"
        nodeStrokeWidth={3}
        pannable
        zoomable
        className="!bg-white !border !border-gray-200 !rounded-lg"
      />
    </ReactFlow>
  );
}

/**
 * 프레임 맵 캔버스 컴포넌트 (Figma 스타일)
 * React Flow를 사용하여 실제 페이지 프리뷰를 캔버스에 표시
 *
 * @param config - 노드와 엣지 설정
 * @param selectedNodeId - 선택된 노드 ID (사이드바에서 선택)
 * @param onNodeClick - 노드 클릭 핸들러
 */
export function FrameMapCanvas({
  config,
  selectedNodeId,
  focusKey,
  onNodeClick,
}: FrameMapCanvasProps): React.ReactElement {
  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <FrameMapCanvasInner
          config={config}
          selectedNodeId={selectedNodeId}
          focusKey={focusKey}
          onNodeClick={onNodeClick}
        />
      </ReactFlowProvider>
    </div>
  );
}
