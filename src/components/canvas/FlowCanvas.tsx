import { useCallback, useMemo, useState, type DragEvent, type MouseEvent as ReactMouseEvent } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ConnectionMode,
  useReactFlow,
  type OnSelectionChangeParams,
  type NodeChange,
} from '@xyflow/react'
import { LayoutDashboard, Maximize2, LayoutGrid } from 'lucide-react'
import { useDiagramStore } from '../../store/useDiagramStore'
import { useUiStore } from '../../store/useUiStore'
import { nodeTypes } from './nodes'
import { edgeTypes } from './edges'
import { ContextMenu } from './ContextMenu'
import { BulkToolbar } from './BulkToolbar'
import { HelperLines } from './HelperLines'
import { NODE_CATALOG } from '../../lib/nodeCatalog'
import { BROKEN_MARKER, DEFAULT_MARKER } from '../../lib/edgeCatalog'
import { computeImpact } from '../../lib/impact'
import { getHelperLines } from '../../lib/helperLines'
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
  const reparentNode = useDiagramStore((s) => s.reparentNode)
  const autoLayout = useDiagramStore((s) => s.autoLayout)
  const updateEdgeData = useDiagramStore((s) => s.updateEdgeData)
  const selectedNodeIds = useDiagramStore((s) => s.selectedNodeIds)

  const openDetail = useUiStore((s) => s.openDetail)
  const openContextMenu = useUiStore((s) => s.openContextMenu)
  const closeContextMenu = useUiStore((s) => s.closeContextMenu)
  const snapToGrid = useUiStore((s) => s.snapToGrid)
  const toggleSnap = useUiStore((s) => s.toggleSnap)
  // While the full-screen detail view is open, the main canvas (behind it) must
  // ignore the Delete key, otherwise it would delete the parent component.
  const detailOpen = useUiStore((s) => s.detailNodeId !== null)

  const { screenToFlowPosition, fitView } = useReactFlow()
  const [helperH, setHelperH] = useState<number | undefined>(undefined)
  const [helperV, setHelperV] = useState<number | undefined>(undefined)
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null)

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
      rawEdges.map((e) => {
        const isBroken = broken.has(e.id)
        const endMarker = isBroken ? BROKEN_MARKER : e.markerEnd
        return {
          ...e,
          // Broken links keep a visible (red) direction arrow.
          markerEnd: endMarker,
          // Bidirectional edges get a matching arrow at the source end too.
          markerStart: e.data?.bidirectional
            ? isBroken
              ? BROKEN_MARKER
              : DEFAULT_MARKER
            : undefined,
          data: {
            ...(e.data ?? { protocol: 'http' as const, sync: 'sync' as const }),
            broken: isBroken,
            srcLoad: loadById.get(e.source) ?? 0,
          },
        }
      }),
    [rawEdges, broken, loadById],
  )

  // Connection-focus: hovering a node highlights its edges + neighbours and
  // fades the rest, to untangle dense routing.
  const focus = useMemo(() => {
    if (!hoverNodeId) return null
    const activeEdges = new Set<string>()
    const activeNodes = new Set<string>([hoverNodeId])
    for (const e of rawEdges) {
      if (e.source === hoverNodeId || e.target === hoverNodeId) {
        activeEdges.add(e.id)
        activeNodes.add(e.source)
        activeNodes.add(e.target)
      }
    }
    return { activeEdges, activeNodes }
  }, [hoverNodeId, rawEdges])

  const displayNodes = useMemo(() => {
    if (!focus) return nodes
    return nodes.map((n) =>
      n.type === 'group' || focus.activeNodes.has(n.id)
        ? n
        : { ...n, data: { ...n.data, dimmed: true } },
    )
  }, [nodes, focus])

  const displayEdges = useMemo(() => {
    if (!focus) return edges
    return edges.map((e) => {
      const active = focus.activeEdges.has(e.id)
      return { ...e, zIndex: active ? 1000 : 0, data: { ...e.data, dimmed: !active, focused: active } }
    })
  }, [edges, focus])

  const onSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: OnSelectionChangeParams) => {
      const edge = selEdges[0]
      setSelection(
        selNodes.map((n) => n.id),
        selNodes.length ? null : edge?.id ?? null,
      )
    },
    [setSelection],
  )

  // Snap to alignment guides while dragging a single node.
  const onNodesChangeWrapped = useCallback(
    (changes: NodeChange<AppNode>[]) => {
      const only = changes.length === 1 ? changes[0] : null
      if (only && only.type === 'position' && only.dragging && only.position) {
        const lines = getHelperLines(only, rawNodes)
        if (lines.snapPosition.x !== undefined) only.position.x = lines.snapPosition.x
        if (lines.snapPosition.y !== undefined) only.position.y = lines.snapPosition.y
        setHelperH(lines.horizontal)
        setHelperV(lines.vertical)
      } else if (helperH !== undefined || helperV !== undefined) {
        setHelperH(undefined)
        setHelperV(undefined)
      }
      onNodesChange(changes)
    },
    [rawNodes, onNodesChange, helperH, helperV],
  )

  const onEdgeDoubleClick = useCallback(
    (_: ReactMouseEvent, edge: AppEdge) => {
      const next = window.prompt('Etichetta della connessione', edge.data?.label ?? '')
      if (next !== null) updateEdgeData(edge.id, { label: next })
    },
    [updateEdgeData],
  )

  const onFit = useCallback(() => {
    if (selectedNodeIds.length) {
      void fitView({ nodes: selectedNodeIds.map((id) => ({ id })), padding: 0.3, duration: 400 })
    } else {
      void fitView({ padding: 0.2, duration: 400 })
    }
  }, [fitView, selectedNodeIds])

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

  const onNodeMouseEnter = useCallback((_: ReactMouseEvent, node: AppNode) => {
    if (node.type !== 'group') setHoverNodeId(node.id)
  }, [])
  const onNodeMouseLeave = useCallback(() => setHoverNodeId(null), [])

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
      className="relative w-full h-full"
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDoubleClick={onWrapperDoubleClick}
    >
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChangeWrapped}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={() => pushHistory()}
        onNodeDragStop={(_, node) => reparentNode(node.id)}
        onSelectionChange={onSelectionChange}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={closeContextMenu}
        connectionMode={ConnectionMode.Loose}
        elevateNodesOnSelect={false}
        defaultEdgeOptions={{ type: 'flow' }}
        deleteKeyCode={detailOpen ? null : ['Backspace', 'Delete']}
        snapToGrid={snapToGrid}
        snapGrid={[16, 16]}
        minZoom={0.2}
        maxZoom={2.5}
        fitView
      >
        <Panel position="top-right">
          <div className="flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur shadow px-1.5 py-1">
            <LayoutDashboard size={14} className="text-slate-400 ml-0.5" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Auto-layout</span>
            <button
              className="w-6 h-6 grid place-items-center rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold"
              title="Disposizione verticale (alto → basso)"
              onClick={() => autoLayout('TB')}
            >
              ↓
            </button>
            <button
              className="w-6 h-6 grid place-items-center rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold"
              title="Disposizione orizzontale (sinistra → destra)"
              onClick={() => autoLayout('LR')}
            >
              →
            </button>
            <span className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
            <button
              className="w-6 h-6 grid place-items-center rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Zoom sulla selezione (o adatta tutto)"
              onClick={onFit}
            >
              <Maximize2 size={14} />
            </button>
            <button
              className={`w-6 h-6 grid place-items-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
                snapToGrid ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'
              }`}
              title={snapToGrid ? 'Snap alla griglia: ON' : 'Snap alla griglia: OFF'}
              onClick={toggleSnap}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </Panel>
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--dot)" />
        <HelperLines horizontal={helperH} vertical={helperV} />
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

      <BulkToolbar />
      <ContextMenu />
    </div>
  )
}
