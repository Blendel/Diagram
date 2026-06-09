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
} from '../types/diagram'
import { SCHEMA_VERSION } from '../types/diagram'
import { NODE_CATALOG } from '../lib/nodeCatalog'
import { DEFAULT_MARKER } from '../lib/edgeCatalog'
import { SEED_EDGES, SEED_NODES } from '../lib/seed'
import { deriveStatus } from '../lib/status'
import { useUiStore } from './useUiStore'

const STORAGE_KEY = 'architect:current-diagram'
const HISTORY_LIMIT = 60

/** zustand persist storage backed by IndexedDB (via idb-keyval). */
const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await idbGet<string>(name)
    return value ?? null
  },
  setItem: (name: string, value: string): Promise<void> => idbSet(name, value),
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
  hydrated: boolean

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

  setSelection: (nodeId: string | null, edgeId: string | null) => void

  // Mutations
  addNode: (kind: NodeKind, position: { x: number; y: number }) => void
  updateNodeData: (id: string, patch: Partial<DiagramNodeData>) => void
  updateEdgeData: (id: string, patch: Partial<DiagramEdgeData>) => void
  setLoad: (id: string, load: number) => void
  duplicateNode: (id: string) => void
  deleteNode: (id: string) => void
  deleteEdge: (id: string) => void

  // Document-level
  setName: (name: string) => void
  newDiagram: () => void
  loadDiagram: (diagram: Diagram) => void
  toFile: () => DiagramFile
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
      hydrated: false,

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

      setSelection: (nodeId, edgeId) =>
        set({ selectedNodeId: nodeId, selectedEdgeId: edgeId }),

      addNode: (kind, position) => {
        get().pushHistory()
        const node = makeNode(kind, position)
        const nodes = get().nodes
        set({
          nodes: kind === 'group' ? [node, ...nodes] : [...nodes, node],
          selectedNodeId: node.id,
          selectedEdgeId: null,
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
        })
        if (node) emit('warning', `Eliminato: ${node.data.label}`)
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
        get().pushHistory()
        set({
          diagramId: uid(),
          name: 'Architettura senza titolo',
          nodes: [],
          edges: [],
          selectedNodeId: null,
          selectedEdgeId: null,
        })
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
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        diagramId: state.diagramId,
        name: state.name,
        nodes: state.nodes,
        edges: state.edges,
      }),
      onRehydrateStorage: () => () => {
        useDiagramStore.setState({ hydrated: true })
      },
    },
  ),
)
