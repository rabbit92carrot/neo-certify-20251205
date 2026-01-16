'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PagePreviewNode } from './PagePreviewNode';
import type { PageMapConfig, PageNodeData } from './types';

interface PageMapCanvasProps {
  config: PageMapConfig;
  onNodeSelect: (node: PageNodeData | null) => void;
}

/**
 * 페이지 맵 캔버스 컴포넌트
 * React Flow를 사용하여 페이지 관계도를 시각화
 */
export function PageMapCanvas({ config, onNodeSelect }: PageMapCanvasProps): React.ReactElement {
  const [nodes, , onNodesChange] = useNodesState(config.nodes as Node[]);
  const [edges, , onEdgesChange] = useEdgesState(config.edges);

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      page: PagePreviewNode,
    }),
    []
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeSelect(node.data as PageNodeData);
    },
    [onNodeSelect]
  );

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
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
    </div>
  );
}
