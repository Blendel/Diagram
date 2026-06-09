import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react'
import type {
  AppEdge,
  AppNode,
  Diagram,
  DiagramEdgeData,
  DiagramFile,
  DiagramNodeData,
  NodeKind,
  NodeStatus,
} from '../types/diagram'
import { SCHEMA_VERSION } from '../types/diagram'

/** Alignment mode for multi-selection group operations. */
export type AlignMode = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom'
import { NODE_CATALOG } from '../lib/nodeCatalog'
import { DEFAULT_MARKER } from '../lib/edgeCatalog'
import { SEED_EDGES, SEED_NODES } from '../lib/seed'
import { deriveStatus } from '../lib/status'
import { migrateNodes } from '../lib/migrate'
import { dimOf } from '../lib/nodeDims'
import type { LayoutDirection } from '../lib/layout'
import { useUiStore } from './useUiStore'

const STORAGE_KEY = 'architect:current-diagram'
const HISTORY_LIMIT = 60

/**
 * zustand persist storage backed by IndexedDB (via idb-keyval).
 * Writes are debounced so a continuous drag doesn't serialize the whole diagram
 * to IndexedDB on every frame; the latest pending write is flushed on page hide.
 */
let writeTimer: ReturnType<typeof setTimeout> | undefined
let pending: { name: string; value: string } | null = null
const flushPersist = () => {
  if (writeTimer) {
    clearTimeout(writeTimer)
    writeTimer = undefined
  }
  if (pending) {
    void idbSet(pending.name, pending.value)
    pending = null
  }
}
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushPersist)
  window.addEventListener('beforeunload', flushPersist)
}

const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await idbGet<string>(name)
    return value ?? null
  },
  setItem: (name: string, value: string): Promise<void> => {
    pending = { name, value }
    if (writeTimer) clearTimeout(writeTimer)
    writeTimer = setTimeout(flushPersist, 500)
    return Promise.resolve()
  },
  removeItem: (name: string): Promise<void> => idbDel(name),
}

const emit = (level: 'info' | 'success' | 'warning' | 'error', message: string) =>
  useUiStore.getState().pushEvent(level, message)

const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}-${Date.now()}`

function makeNode(kind: NodeKind, position: { x: number; y: number }): AppNode {
  const meta = NODE_CATALOG[kind]
  const isGroup = kind === 'group'
  const data: DiagramNodeData = { kind, label: meta.label, status: 'healthy' }
  const node: AppNode = {
    id: uid(),
    type: isGroup ? 'group' : 'component',
    position,
    data,
  }
  if (isGroup) {
    node.style = { width: 360, height: 240 }
    node.data.label = 'Nuovo gruppo'
    node.data.status = 'unknown'
  }
  return node
}

interface Snapshot {
  nodes: AppNode[]
  edges: AppEdge[]
}

interface DiagramState {
  diagramId: string
  name: string
  nodes: AppNode[]
  edges: AppEdge[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  selectedNodeIds: string[]
  hydrated: boolean
  /** Saved diagrams library, keyed by id (the active one is kept in sync). */
  diagrams: Record<string, Diagram>

  // Undo/redo history (not persisted)
  _past: Snapshot[]
  _future: Snapshot[]
  _coalesceKey: string | null
  _coalesceTime: number
  pushHistory: (coalesceKey?: string) => void
  undo: () => void
  redo: () => void

  // React Flow handlers
  onNodesChange: (changes: NodeChange<AppNode>[]) => void
  onEdgesChange: (changes: EdgeChange<AppEdge>[]) => void
  onConnect: (connection: Connection) => void

  setSelection: (nodeIds: string[], edgeId: string | null) => void

  // Mutations
  addNode: (kind: NodeKind, position: { x: number; y: number }) => void
  updateNodeData: (id: string, patch: Partial<DiagramNodeData>) => void
  updateEdgeData: (id: string, patch: Partial<DiagramEdgeData>) => void
  setLoad: (id: string, load: number) => void
  duplicateNode: (id: string) => void
  deleteNode: (id: string) => void
  deleteEdge: (id: string) => void

  // Group operations on the current multi-selection
  deleteNodes: (ids: string[]) => void
  duplicateNodes: (ids: string[]) => void
  setNodesColor: (ids: string[], color: string) => void
  setNodesStatus: (ids: string[], status: NodeStatus) => void
  alignNodes: (ids: string[], mode: AlignMode) => void
  distributeNodes: (ids: string[], axis: 'h' | 'v') => void

  // Document-level
  setName: (name: string) => void
  newDiagram: () => void
  loadDiagram: (diagram: Diagram) => void
  toFile: () => DiagramFile

  // Multi-diagram library
  _commitActive: () => void
  switchDiagram: (id: string) => void
  duplicateDiagram: (id: string) => void
  deleteDiagram: (id: string) => void
  renameDiagram: (id: string, name: string) => void

  // Layout & nesting
  autoLayout: (direction: LayoutDirection) => void
  reparentNode: (id: string) => void
}

export const useDiagramStore = create<DiagramState>()(
  persist(
    (set, get) => ({
      diagramId: uid(),
      name: 'Architettura senza titolo',
      nodes: SEED_NODES,
      edges: SEED_EDGES,
      selectedNodeId: null,
      selectedEdgeId: null,
      selectedNodeIds: [],
      hydrated: false,
      diagrams: {},

      _past: [],
      _future: [],
      _coalesceKey: null,
      _coalesceTime: 0,

      pushHistory: (coalesceKey) => {
        const now = Date.now()
        const s = get()
        if (coalesceKey && coalesceKey === s._coalesceKey && now - s._coalesceTime < 700) {
          set({ _coalesceTime: now })
          return
        }
        set({
          _past: [...s._past, { nodes: s.nodes, edges: s.edges }].slice(-HISTORY_LIMIT),
          _future: [],
          _coalesceKey: coalesceKey ?? null,
          _coalesceTime: now,
        })
      },

      undo: () => {
        const { _past, _future, nodes, edges } = get()
        if (_past.length === 0) return
        const prev = _past[_past.length - 1]
        set({
          nodes: prev.nodes,
          edges: prev.edges,
          _past: _past.slice(0, -1),
          _future: [{ nodes, edges }, ..._future].slice(0, HISTORY_LIMIT),
          _coalesceKey: null,
          selectedNodeId: null,
          selectedEdgeId: null,
          selectedNodeIds: [],
        })
        emit('info', 'Annullato (Ctrl+Z)')
      },

      redo: () => {
        const { _past, _future, nodes, edges } = get()
        if (_future.length === 0) return
        const next = _future[0]
        set({
          nodes: next.nodes,
          edges: next.edges,
          _future: _future.slice(1),
          _past: [..._past, { nodes, edges }].slice(-HISTORY_LIMIT),
          _coalesceKey: null,
          selectedNodeId: null,
          selectedEdgeId: null,
          selectedNodeIds: [],
        })
        emit('info', 'Ripristinato')
      },

      onNodesChange: (changes) => {
        if (changes.some((c) => c.type === 'remove')) get().pushHistory()
        set({ nodes: applyNodeChanges(changes, get().nodes) })
      },

      onEdgesChange: (changes) => {
        if (changes.some((c) => c.type === 'remove')) get().pushHistory()
        set({ edges: applyEdgeChanges(changes, get().edges) })
      },

      onConnect: (connection) => {
        get().pushHistory()
        const edge: AppEdge = {
          ...connection,
          id: uid(),
          type: 'flow',
          markerEnd: DEFAULT_MARKER,
          data: { protocol: 'http', sync: 'sync', label: '' },
        }
        set({ edges: addEdge(edge, get().edges) })
        emit('info', 'Connessione creata')
      },

      setSelection: (nodeIds, edgeId) =>
        set({
          selectedNodeIds: nodeIds,
          selectedNodeId: nodeIds.length === 1 ? nodeIds[0] : null,
          selectedEdgeId: edgeId,
        }),

      addNode: (kind, position) => {
        get().pushHistory()
        const node = makeNode(kind, position)
        const nodes = get().nodes
        set({
          nodes: kind === 'group' ? [node, ...nodes] : [...nodes, node],
          selectedNodeId: node.id,
          selectedEdgeId: null,
          selectedNodeIds: [node.id],
        })
        emit('success', `Aggiunto: ${NODE_CATALOG[kind].label}`)
      },

      updateNodeData: (id, patch) => {
        get().pushHistory(`node:${id}`)
        set({
          nodes: get().nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...patch } } : n,
          ),
        })
      },

      updateEdgeData: (id, patch) => {
        get().pushHistory(`edge:${id}`)
        set({
          edges: get().edges.map((e) =>
            e.id === id
              ? { ...e, data: { ...(e.data ?? { protocol: 'http', sync: 'sync' }), ...patch } }
              : e,
          ),
        })
      },

      setLoad: (id, load) => {
        const node = get().nodes.find((n) => n.id === id)
        if (!node) return
        get().pushHistory(`load:${id}`)
        const clamped = Math.max(0, Math.min(100, Math.round(load)))
        const prevStatus = node.data.status
        const status = deriveStatus(clamped)
        set({
          nodes: get().nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, load: clamped, status } } : n,
          ),
        })
        if (status !== prevStatus) {
          const level =
            status === 'down' ? 'error' : status === 'degraded' ? 'warning' : 'success'
          emit(level, `${node.data.label}: stato → ${status}`)
        }
      },

      duplicateNode: (id) => {
        const node = get().nodes.find((n) => n.id === id)
        if (!node) return
        get().pushHistory()
        const clone: AppNode = {
          ...node,
          id: uid(),
          position: { x: node.position.x + 40, y: node.position.y + 40 },
          selected: false,
          data: { ...node.data, label: `${node.data.label} (copia)` },
        }
        set({
          nodes: [...get().nodes, clone],
          selectedNodeId: clone.id,
          selectedEdgeId: null,
          selectedNodeIds: [clone.id],
        })
        emit('info', `Duplicato: ${node.data.label}`)
      },

      deleteNode: (id) => {
        const node = get().nodes.find((n) => n.id === id)
        get().pushHistory()
        set({
          nodes: get().nodes.filter((n) => n.id !== id),
          edges: get().edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: null,
          selectedNodeIds: [],
        })
        if (node) emit('warning', `Eliminato: ${node.data.label}`)
      },

      deleteNodes: (ids) => {
        if (ids.length === 0) return
        const set_ = new Set(ids)
        get().pushHistory()
        set({
          nodes: get().nodes.filter((n) => !set_.has(n.id)),
          edges: get().edges.filter((e) => !set_.has(e.source) && !set_.has(e.target)),
          selectedNodeId: null,
          selectedNodeIds: [],
        })
        emit('warning', `Eliminati ${ids.length} componenti`)
      },

      duplicateNodes: (ids) => {
        if (ids.length === 0) return
        const set_ = new Set(ids)
        const originals = get().nodes.filter((n) => set_.has(n.id))
        if (originals.length === 0) return
        get().pushHistory()
        const clones: AppNode[] = originals.map((n) => ({
          ...n,
          id: uid(),
          position: { x: n.position.x + 32, y: n.position.y + 32 },
          selected: false,
          data: { ...n.data },
        }))
        set({
          nodes: [...get().nodes, ...clones],
          selectedNodeIds: clones.map((c) => c.id),
          selectedNodeId: clones.length === 1 ? clones[0].id : null,
          selectedEdgeId: null,
        })
        emit('info', `Duplicati ${clones.length} componenti`)
      },

      setNodesColor: (ids, color) => {
        if (ids.length === 0) return
        const set_ = new Set(ids)
        get().pushHistory('color:bulk')
        set({
          nodes: get().nodes.map((n) =>
            set_.has(n.id) ? { ...n, data: { ...n.data, color } } : n,
          ),
        })
      },

      setNodesStatus: (ids, status) => {
        if (ids.length === 0) return
        const set_ = new Set(ids)
        get().pushHistory()
        set({
          nodes: get().nodes.map((n) =>
            set_.has(n.id) && n.data.kind !== 'group'
              ? { ...n, data: { ...n.data, status } }
              : n,
          ),
        })
      },

      alignNodes: (ids, mode) => {
        if (ids.length < 2) return
        const set_ = new Set(ids)
        const sel = get().nodes.filter((n) => set_.has(n.id))
        const dims = new Map(sel.map((n) => [n.id, dimOf(n)]))
        const lefts = sel.map((n) => n.position.x)
        const tops = sel.map((n) => n.position.y)
        const rights = sel.map((n) => n.position.x + dims.get(n.id)!.w)
        const bottoms = sel.map((n) => n.position.y + dims.get(n.id)!.h)
        const minL = Math.min(...lefts)
        const maxR = Math.max(...rights)
        const minT = Math.min(...tops)
        const maxB = Math.max(...bottoms)
        const cx = (minL + maxR) / 2
        const cy = (minT + maxB) / 2
        get().pushHistory()
        set({
          nodes: get().nodes.map((n) => {
            if (!set_.has(n.id)) return n
            const { w, h } = dims.get(n.id)!
            let { x, y } = n.position
            if (mode === 'left') x = minL
            else if (mode === 'right') x = maxR - w
            else if (mode === 'hcenter') x = cx - w / 2
            else if (mode === 'top') y = minT
            else if (mode === 'bottom') y = maxB - h
            else if (mode === 'vcenter') y = cy - h / 2
            return { ...n, position: { x, y } }
          }),
        })
      },

      distributeNodes: (ids, axis) => {
        if (ids.length < 3) return
        const set_ = new Set(ids)
        const sel = get().nodes.filter((n) => set_.has(n.id))
        const dims = new Map(sel.map((n) => [n.id, dimOf(n)]))
        const center = (n: AppNode) =>
          axis === 'h'
            ? n.position.x + dims.get(n.id)!.w / 2
            : n.position.y + dims.get(n.id)!.h / 2
        const sorted = [...sel].sort((a, b) => center(a) - center(b))
        const first = center(sorted[0])
        const last = center(sorted[sorted.length - 1])
        const step = (last - first) / (sorted.length - 1)
        const targetCenter = new Map<string, number>()
        sorted.forEach((n, i) => targetCenter.set(n.id, first + step * i))
        get().pushHistory()
        set({
          nodes: get().nodes.map((n) => {
            if (!set_.has(n.id)) return n
            const { w, h } = dims.get(n.id)!
            const c = targetCenter.get(n.id)!
            return axis === 'h'
              ? { ...n, position: { x: c - w / 2, y: n.position.y } }
              : { ...n, position: { x: n.position.x, y: c - h / 2 } }
          }),
        })
      },

      deleteEdge: (id) => {
        get().pushHistory()
        set({
          edges: get().edges.filter((e) => e.id !== id),
          selectedEdgeId: null,
        })
      },

      setName: (name) => set({ name }),

      newDiagram: () => {
        get()._commitActive()
        const id = uid()
        const empty: Diagram = {
          id,
          name: 'Architettura senza titolo',
          nodes: [],
          edges: [],
          updatedAt: Date.now(),
        }
        set({
          diagramId: id,
          name: empty.name,
          nodes: [],
          edges: [],
          selectedNodeId: null,
          selectedEdgeId: null,
          selectedNodeIds: [],
          _past: [],
          _future: [],
          diagrams: { ...get().diagrams, [id]: empty },
        })
        emit('info', 'Nuovo diagramma')
      },

      loadDiagram: (diagram) => {
        get().pushHistory()
        set({
          diagramId: diagram.id || uid(),
          name: diagram.name || 'Architettura importata',
          nodes: diagram.nodes ?? [],
          edges: diagram.edges ?? [],
          selectedNodeId: null,
          selectedEdgeId: null,
          selectedNodeIds: [],
        })
      },

      toFile: () => {
        const { diagramId, name, nodes, edges } = get()
        const diagram: Diagram = {
          id: diagramId,
          name,
          nodes,
          edges,
          updatedAt: Date.now(),
        }
        return { schema: 'architect-diagram', version: SCHEMA_VERSION, diagram }
      },

      // --- Multi-diagram library ---
      _commitActive: () => {
        const { diagramId, name, nodes, edges, diagrams } = get()
        set({
          diagrams: {
            ...diagrams,
            [diagramId]: { id: diagramId, name, nodes, edges, updatedAt: Date.now() },
          },
        })
      },

      switchDiagram: (id) => {
        if (id === get().diagramId) return
        get()._commitActive()
        const d = get().diagrams[id]
        if (!d) return
        set({
          diagramId: d.id,
          name: d.name,
          nodes: d.nodes ?? [],
          edges: d.edges ?? [],
          selectedNodeId: null,
          selectedEdgeId: null,
          selectedNodeIds: [],
          _past: [],
          _future: [],
        })
        emit('info', `Aperto: ${d.name}`)
      },

      duplicateDiagram: (id) => {
        get()._commitActive()
        const src = get().diagrams[id]
        if (!src) return
        const newId = uid()
        const copy: Diagram = {
          ...src,
          id: newId,
          name: `${src.name} (copia)`,
          updatedAt: Date.now(),
        }
        set({ diagrams: { ...get().diagrams, [newId]: copy } })
        emit('success', `Duplicato: ${src.name}`)
      },

      deleteDiagram: (id) => {
        const diagrams = { ...get().diagrams }
        const removed = diagrams[id]
        delete diagrams[id]
        if (id === get().diagramId) {
          const next = Object.values(diagrams).sort((a, b) => b.updatedAt - a.updatedAt)[0]
          if (next) {
            set({
              diagrams,
              diagramId: next.id,
              name: next.name,
              nodes: next.nodes ?? [],
              edges: next.edges ?? [],
              selectedNodeId: null,
              selectedEdgeId: null,
              selectedNodeIds: [],
              _past: [],
              _future: [],
            })
          } else {
            const nid = uid()
            const empty: Diagram = {
              id: nid,
              name: 'Architettura senza titolo',
              nodes: [],
              edges: [],
              updatedAt: Date.now(),
            }
            set({
              diagrams: { [nid]: empty },
              diagramId: nid,
              name: empty.name,
              nodes: [],
              edges: [],
              selectedNodeId: null,
              selectedEdgeId: null,
              selectedNodeIds: [],
              _past: [],
              _future: [],
            })
          }
        } else {
          set({ diagrams })
        }
        if (removed) emit('warning', `Eliminato diagramma: ${removed.name}`)
      },

      renameDiagram: (id, name) => {
        if (id === get().diagramId) set({ name })
        const d = get().diagrams[id]
        if (d) set({ diagrams: { ...get().diagrams, [id]: { ...d, name } } })
      },

      // --- Layout & nesting ---
      autoLayout: async (direction) => {
        // dagre is loaded on demand so it stays out of the initial bundle.
        const { layoutPositions } = await import('../lib/layout')
        const { nodes, edges } = get()
        const positions = layoutPositions(nodes, edges, direction)
        if (positions.size === 0) return
        get().pushHistory()
        set({
          nodes: nodes.map((n) => {
            const p = positions.get(n.id)
            return p ? { ...n, position: p } : n
          }),
        })
        emit('success', 'Auto-layout applicato')
      },

      reparentNode: (id) => {
        const nodes = get().nodes
        const node = nodes.find((n) => n.id === id)
        if (!node || node.type === 'group') return

        const parentNow = node.parentId
          ? nodes.find((n) => n.id === node.parentId)
          : undefined
        const abs = parentNow
          ? { x: node.position.x + parentNow.position.x, y: node.position.y + parentNow.position.y }
          : { ...node.position }

        const { w, h } = dimOf(node)
        const cx = abs.x + w / 2
        const cy = abs.y + h / 2
        const target = nodes.find((g) => {
          if (g.type !== 'group') return false
          const gd = dimOf(g)
          return cx >= g.position.x && cx <= g.position.x + gd.w && cy >= g.position.y && cy <= g.position.y + gd.h
        })
        const targetId = target?.id
        if (targetId === node.parentId) return

        set({
          nodes: nodes.map((n) => {
            if (n.id !== id) return n
            if (target) {
              return {
                ...n,
                parentId: targetId,
                extent: 'parent',
                position: { x: abs.x - target.position.x, y: abs.y - target.position.y },
              }
            }
            return { ...n, parentId: undefined, extent: undefined, position: abs }
          }),
        })
        if (target) emit('info', `Inserito in: ${target.data.label}`)
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => idbStorage),
      version: SCHEMA_VERSION,
      partialize: (state) => ({
        diagramId: state.diagramId,
        name: state.name,
        nodes: state.nodes,
        edges: state.edges,
        diagrams: state.diagrams,
      }),
      // Upgrade diagrams saved by an older schema version on rehydration.
      migrate: (persisted) => {
        const p = (persisted ?? {}) as {
          nodes?: AppNode[]
          diagrams?: Record<string, Diagram>
        }
        if (Array.isArray(p.nodes)) p.nodes = migrateNodes(p.nodes)
        if (p.diagrams) {
          for (const key of Object.keys(p.diagrams)) {
            const d = p.diagrams[key]
            if (d?.nodes) d.nodes = migrateNodes(d.nodes)
          }
        }
        return p as never
      },
      onRehydrateStorage: () => () => {
        useDiagramStore.setState({ hydrated: true })
        // Ensure the active diagram is present in the saved library.
        useDiagramStore.getState()._commitActive()
      },
    },
  ),
)

// Keep the active diagram synced into the saved library (debounced).
let commitTimer: ReturnType<typeof setTimeout> | undefined
useDiagramStore.subscribe((state, prev) => {
  if (
    state.nodes !== prev.nodes ||
    state.edges !== prev.edges ||
    state.name !== prev.name ||
    state.diagramId !== prev.diagramId
  ) {
    clearTimeout(commitTimer)
    commitTimer = setTimeout(() => useDiagramStore.getState()._commitActive(), 400)
  }
})
