import { useCallback, useMemo, type DragEvent, type MouseEvent as ReactMouseEvent } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ConnectionMode,
  useReactFlow,
  type OnSelectionChangeParams,
} from '@xyflow/react'
import { useDiagramStore } from '../../store/useDiagramStore'
import { useUiStore } from '../../store/useUiStore'
import { nodeTypes } from './nodes'
import { edgeTypes } from './edges'
import { ContextMenu } from './ContextMenu'
import { NODE_CATALOG } from '../../lib/nodeCatalog'
import { computeImpact } from '../../lib/impact'
import type { AppEdge, AppNode, NodeKind } from '../../types/diagram'
import { DND_MIME } from './dnd'

export function FlowCanvas() {
  const rawNodes = useDiagramStore((s) => s.nodes)
  const rawEdges = useDiagramStore((s) => s.edges)
  const onNodesChange = useDiagramStore((s) => s.onNodesChange)
  const onEdgesChange = useDiagramStore((s) => s.onEdgesChange)
  const onConnect = useDiagramStore((s) => s.onConnect)
  const addNode = useDiagramStore((s) => s.addNode)
  const setSelection = useDiagramStore((s) => s.setSelection)
  const pushHistory = useDiagramStore((s) => s.pushHistory)

  const openDetail = useUiStore((s) => s.openDetail)
  const openContextMenu = useUiStore((s) => s.openContextMenu)
  const closeContextMenu = useUiStore((s) => s.closeContextMenu)
  // While the full-screen detail view is open, the main canvas (behind it) must
  // ignore the Delete key, otherwise it would delete the parent component.
  const detailOpen = useUiStore((s) => s.detailNodeId !== null)

  const { screenToFlowPosition } = useReactFlow()

  // Derive failure cascade and inject render-only flags into nodes/edges.
  const { impacted, broken } = useMemo(
    () => computeImpact(rawNodes, rawEdges),
    [rawNodes, rawEdges],
  )
  const loadById = useMemo(
    () => new Map(rawNodes.map((n) => [n.id, n.data.load ?? 0])),
    [rawNodes],
  )
  const nodes = useMemo(
    () =>
      rawNodes.map((n) =>
        impacted.has(n.id) ? { ...n, data: { ...n.data, impacted: true } } : n,
      ),
    [rawNodes, impacted],
  )
  const edges = useMemo(
    () =>
      rawEdges.map((e) => ({
        ...e,
        data: {
          ...(e.data ?? { protocol: 'http' as const, sync: 'sync' as const }),
          broken: broken.has(e.id),
          srcLoad: loadById.get(e.source) ?? 0,
        },
      })),
    [rawEdges, broken, loadById],
  )

  const onSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: OnSelectionChangeParams) => {
      const node = selNodes[0]
      const edge = selEdges[0]
      setSelection(node?.id ?? null, node ? null : edge?.id ?? null)
    },
    [setSelection],
  )

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      const kind = e.dataTransfer.getData(DND_MIME) as NodeKind
      if (!kind || !(kind in NODE_CATALOG)) return
      addNode(kind, screenToFlowPosition({ x: e.clientX, y: e.clientY }))
    },
    [screenToFlowPosition, addNode],
  )

  const onNodeDoubleClick = useCallback(
    (_: ReactMouseEvent, node: AppNode) => openDetail(node.id),
    [openDetail],
  )

  const onNodeContextMenu = useCallback(
    (e: ReactMouseEvent, node: AppNode) => {
      e.preventDefault()
      openContextMenu({ x: e.clientX, y: e.clientY, type: 'node', targetId: node.id })
    },
    [openContextMenu],
  )

  const onEdgeContextMenu = useCallback(
    (e: ReactMouseEvent, edge: AppEdge) => {
      e.preventDefault()
      openContextMenu({ x: e.clientX, y: e.clientY, type: 'edge', targetId: edge.id })
    },
    [openContextMenu],
  )

  const onPaneContextMenu = useCallback(
    (e: ReactMouseEvent | MouseEvent) => {
      e.preventDefault()
      openContextMenu({ x: e.clientX, y: e.clientY, type: 'pane' })
    },
    [openContextMenu],
  )

  const onWrapperDoubleClick = useCallback(
    (e: ReactMouseEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('react-flow__pane')) {
        addNode('service', screenToFlowPosition({ x: e.clientX, y: e.clientY }))
      }
    },
    [addNode, screenToFlowPosition],
  )

  return (
    <div
      className="w-full h-full"
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDoubleClick={onWrapperDoubleClick}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={() => pushHistory()}
        onSelectionChange={onSelectionChange}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={closeContextMenu}
        connectionMode={ConnectionMode.Loose}
        elevateNodesOnSelect={false}
        defaultEdgeOptions={{ type: 'flow' }}
        deleteKeyCode={detailOpen ? null : ['Backspace', 'Delete']}
        minZoom={0.2}
        maxZoom={2.5}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--dot)" />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={2}
          maskColor="rgba(100,116,139,0.18)"
          nodeColor={(n) =>
            ((n.data?.color as string) ||
              NODE_CATALOG[(n.data?.kind as NodeKind) ?? 'service']?.accent) ??
            '#94a3b8'
          }
        />
      </ReactFlow>

      <ContextMenu />
    </div>
  )
}
