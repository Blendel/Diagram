import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  ConnectionMode,
  MarkerType,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type NodeTypes,
  type OnSelectionChangeParams,
} from '@xyflow/react'
import { Trash2 } from 'lucide-react'
import type { SubNode, SubEdge, SubNodeKind, HttpMethod } from '../../../types/diagram'

const CODE_KINDS: SubNodeKind[] = ['function', 'usecase', 'controller', 'repository', 'adapter', 'port']
import { SUB_CATALOG, SUB_ORDER } from '../../../lib/subCatalog'
import { uid } from '../../../lib/uid'
import { inputCls, dangerBtnCls } from '../../../lib/ui'
import { SubNodeView } from './SubNode'

const subNodeTypes: NodeTypes = { sub: SubNodeView }
const SUB_DND = 'application/architect-subnode'

interface Props {
  initialNodes: SubNode[]
  initialEdges: SubEdge[]
  onChange: (nodes: SubNode[], edges: SubEdge[]) => void
  /** Palette of element kinds to offer (defaults to the service set). */
  kinds?: SubNodeKind[]
}

export function SubGraphEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  )
}

function makeSub(kind: SubNodeKind, position: { x: number; y: number }): SubNode {
  return {
    id: uid('sub'),
    type: 'sub',
    position,
    data: { kind, label: SUB_CATALOG[kind].label, signature: '', description: '' },
  }
}

function Inner({ initialNodes, initialEdges, onChange, kinds = SUB_ORDER }: Props) {
  const defaultKind = kinds[0] ?? 'function'
  const [nodes, setNodes] = useState<SubNode[]>(initialNodes)
  const [edges, setEdges] = useState<SubEdge[]>(initialEdges)
  const [sel, setSel] = useState<string | null>(null)
  const { screenToFlowPosition } = useReactFlow()

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const t = setTimeout(() => onChangeRef.current(nodes, edges), 350)
    return () => clearTimeout(t)
  }, [nodes, edges])

  const latest = useRef({ nodes, edges })
  latest.current = { nodes, edges }
  useEffect(() => () => onChangeRef.current(latest.current.nodes, latest.current.edges), [])

  const onNodesChange = useCallback(
    (ch: NodeChange<SubNode>[]) => setNodes((ns) => applyNodeChanges(ch, ns)),
    [],
  )
  const onEdgesChange = useCallback(
    (ch: EdgeChange<SubEdge>[]) => setEdges((es) => applyEdgeChanges(ch, es)),
    [],
  )
  const onConnect = useCallback(
    (c: Connection) =>
      setEdges((es) =>
        addEdge(
          {
            ...c,
            id: uid('se'),
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
          },
          es,
        ),
      ),
    [],
  )
  const onSelectionChange = useCallback(
    ({ nodes: n }: OnSelectionChangeParams) => setSel(n[0]?.id ?? null),
    [],
  )

  const addAt = (kind: SubNodeKind, position: { x: number; y: number }) => {
    const n = makeSub(kind, position)
    setNodes((ns) => [...ns, n])
    setSel(n.id)
  }

  const onDragStart = (e: DragEvent, kind: SubNodeKind) => {
    e.dataTransfer.setData(SUB_DND, kind)
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    const kind = e.dataTransfer.getData(SUB_DND) as SubNodeKind
    if (!kind || !(kind in SUB_CATALOG)) return
    addAt(kind, screenToFlowPosition({ x: e.clientX, y: e.clientY }))
  }
  const onDoubleClick = (e: ReactMouseEvent) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('react-flow__pane')) {
      addAt(defaultKind, screenToFlowPosition({ x: e.clientX, y: e.clientY }))
    }
  }

  const selected = nodes.find((n) => n.id === sel) ?? null
  const patch = (p: Partial<SubNode['data']>) =>
    setNodes((ns) => ns.map((n) => (n.id === sel ? { ...n, data: { ...n.data, ...p } } : n)))
  const del = () => {
    setNodes((ns) => ns.filter((n) => n.id !== sel))
    setEdges((es) => es.filter((e) => e.source !== sel && e.target !== sel))
    setSel(null)
  }

  return (
    <div className="flex h-full min-h-0 gap-3">
      {/* Palette rail */}
      <div className="w-40 shrink-0 overflow-y-auto">
        <p className="text-[11px] text-slate-400 mb-2">Trascina o clicca</p>
        <div className="flex flex-col gap-1.5">
          {kinds.map((kind) => {
            const m = SUB_CATALOG[kind]
            const Icon = m.icon
            return (
              <button
                key={kind}
                draggable
                onDragStart={(e) => onDragStart(e, kind)}
                onClick={() => addAt(kind, { x: 60 + nodes.length * 24, y: 60 + nodes.length * 18 })}
                className="flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-left hover:border-slate-300 dark:hover:border-slate-600 cursor-grab active:cursor-grabbing"
              >
                <span style={{ color: m.accent }}>
                  <Icon size={15} />
                </span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {m.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative flex-1 min-w-0 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDoubleClick={onDoubleClick}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={subNodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          connectionMode={ConnectionMode.Loose}
          deleteKeyCode={['Backspace', 'Delete']}
          minZoom={0.3}
          maxZoom={2}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="var(--dot)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {/* Inspector */}
      <div className="w-60 shrink-0 overflow-y-auto">
        {selected ? (
          <div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
              {SUB_CATALOG[selected.data.kind].label}
            </div>
            <label className="block mb-3">
              <span className="block text-[11px] font-medium text-slate-500 mb-1">Nome</span>
              <input
                className={inputCls}
                value={selected.data.label}
                onChange={(e) => patch({ label: e.target.value })}
              />
            </label>
            <label className="block mb-3">
              <span className="block text-[11px] font-medium text-slate-500 mb-1">
                Firma / rotta
              </span>
              <input
                className={inputCls}
                placeholder="(id: string): Order  ·  GET /orders/:id"
                value={selected.data.signature ?? ''}
                onChange={(e) => patch({ signature: e.target.value })}
              />
            </label>
            {selected.data.kind === 'endpoint' && (
              <label className="block mb-3">
                <span className="block text-[11px] font-medium text-slate-500 mb-1">Metodo HTTP</span>
                <select
                  className={inputCls}
                  value={selected.data.method ?? 'GET'}
                  onChange={(e) => patch({ method: e.target.value as HttpMethod })}
                >
                  {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {CODE_KINDS.includes(selected.data.kind) && (
              <>
                <label className="block mb-3">
                  <span className="block text-[11px] font-medium text-slate-500 mb-1">Visibilità</span>
                  <select
                    className={inputCls}
                    value={selected.data.visibility ?? 'public'}
                    onChange={(e) => patch({ visibility: e.target.value as 'public' | 'private' })}
                  >
                    <option value="public">public</option>
                    <option value="private">private</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 mb-3 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!selected.data.async}
                    onChange={(e) => patch({ async: e.target.checked })}
                  />
                  Asincrono
                </label>
              </>
            )}

            <label className="block mb-3">
              <span className="block text-[11px] font-medium text-slate-500 mb-1">Descrizione</span>
              <textarea
                className={`${inputCls} resize-none`}
                rows={4}
                value={selected.data.description ?? ''}
                onChange={(e) => patch({ description: e.target.value })}
              />
            </label>
            <button className={dangerBtnCls} onClick={del}>
              <Trash2 size={15} /> Elimina elemento
            </button>
          </div>
        ) : (
          <div className="text-sm text-slate-400 p-3 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            Trascina un elemento dalla colonna a sinistra (funzione, endpoint, modulo,
            variabile…), collega i nodi e seleziona un elemento per modificarlo o
            eliminarlo (anche con <b>Canc</b>).
          </div>
        )}
      </div>
    </div>
  )
}
