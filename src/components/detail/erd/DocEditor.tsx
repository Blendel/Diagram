import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  MarkerType,
  ConnectionMode,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Node,
  type Edge,
  type NodeProps,
  type NodeChange,
  type EdgeChange,
  type NodeTypes,
  type Connection,
  type OnSelectionChangeParams,
} from '@xyflow/react'
import { Plus, Trash2, FileJson } from 'lucide-react'
import type { DbCollection, DbField, DbReference } from '../../../types/diagram'
import { uid } from '../../../lib/uid'
import { inputCls, btnCls, dangerBtnCls } from '../../../lib/ui'

const ACCENT = '#0891b2'

type DocNode = Node<{ collection: DbCollection }>
type RefData = { sourceField?: string; name?: string }
type DocEdge = Edge<RefData>

// --- Collection node ----------------------------------------------------------
function DocCollectionNode({ data, selected }: NodeProps<DocNode>) {
  const c = data.collection
  return (
    <div
      className="rounded-lg shadow-sm min-w-[180px] overflow-hidden"
      style={{
        background: 'var(--node-bg)',
        border: `1px solid ${selected ? ACCENT : 'var(--node-border)'}`,
        boxShadow: selected ? `0 0 0 2px ${ACCENT}33` : undefined,
      }}
    >
      <div
        className="relative flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-semibold"
        style={{ background: `color-mix(in srgb, ${ACCENT} 16%, var(--node-bg))`, color: 'var(--node-text)' }}
      >
        <Handle type="target" position={Position.Left} id="in" style={{ background: ACCENT }} />
        <FileJson size={14} style={{ color: ACCENT }} />
        {c.name}
      </div>
      <div>
        {c.fields.length === 0 && (
          <div className="px-2.5 py-1 text-xs text-slate-400">nessun campo</div>
        )}
        {c.fields.map((f) => (
          <div
            key={f.id}
            className="relative flex items-center gap-1.5 px-2.5 py-1 text-xs border-t border-slate-100 dark:border-slate-700"
            style={{ color: 'var(--node-text-muted)' }}
          >
            <span className="font-medium" style={{ color: 'var(--node-text)' }}>
              {f.name}
            </span>
            {f.embedded && <span className="opacity-70">{'{}'}</span>}
            {f.array && <span className="opacity-70">[]</span>}
            <span className="ml-auto font-mono opacity-70">{f.type}</span>
            <Handle type="source" position={Position.Right} id={f.id} style={{ background: ACCENT }} />
          </div>
        ))}
      </div>
    </div>
  )
}

const docNodeTypes: NodeTypes = { docCollection: DocCollectionNode }

interface DocEditorProps {
  initialCollections: DbCollection[]
  initialReferences: DbReference[]
  onChange: (collections: DbCollection[], references: DbReference[]) => void
}

export function DocEditor(props: DocEditorProps) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  )
}

const toNode = (c: DbCollection): DocNode => ({
  id: c.id,
  type: 'docCollection',
  position: { x: c.x, y: c.y },
  data: { collection: c },
})
const toEdge = (r: DbReference): DocEdge => ({
  id: r.id,
  source: r.source,
  target: r.target,
  sourceHandle: r.sourceField,
  targetHandle: 'in',
  type: 'smoothstep',
  label: r.name || 'ref',
  markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  style: { stroke: '#94a3b8' },
  data: { sourceField: r.sourceField, name: r.name },
})

function Inner({ initialCollections, initialReferences, onChange }: DocEditorProps) {
  const [nodes, setNodes] = useState<DocNode[]>(() => initialCollections.map(toNode))
  const [edges, setEdges] = useState<DocEdge[]>(() => initialReferences.map(toEdge))
  const [selNode, setSelNode] = useState<string | null>(null)
  const [selEdge, setSelEdge] = useState<string | null>(null)

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const commit = (ns: DocNode[], es: DocEdge[]) => {
    const collections: DbCollection[] = ns.map((n) => ({
      ...n.data.collection,
      x: n.position.x,
      y: n.position.y,
    }))
    const references: DbReference[] = es.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceField: e.data?.sourceField,
      name: e.data?.name,
    }))
    onChangeRef.current(collections, references)
  }
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const t = setTimeout(() => commit(nodes, edges), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges])
  const latest = useRef({ nodes, edges })
  latest.current = { nodes, edges }
  useEffect(() => () => commit(latest.current.nodes, latest.current.edges), [])

  const onNodesChange = useCallback((ch: NodeChange<DocNode>[]) => {
    const removed = ch.filter((c) => c.type === 'remove').map((c) => c.id)
    setNodes((ns) => applyNodeChanges(ch, ns))
    if (removed.length) {
      setEdges((es) => es.filter((e) => !removed.includes(e.source) && !removed.includes(e.target)))
    }
  }, [])
  const onEdgesChange = useCallback(
    (ch: EdgeChange<DocEdge>[]) => setEdges((es) => applyEdgeChanges(ch, es)),
    [],
  )
  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target) return
    setEdges((es) =>
      addEdge(
        toEdge({ id: uid('ref'), source: c.source!, target: c.target!, sourceField: c.sourceHandle ?? undefined }),
        es,
      ),
    )
  }, [])
  const onSelectionChange = useCallback(({ nodes: n, edges: e }: OnSelectionChangeParams) => {
    setSelNode(n[0]?.id ?? null)
    setSelEdge(n[0] ? null : e[0]?.id ?? null)
  }, [])

  const addCollection = () => {
    const c: DbCollection = {
      id: uid('coll'),
      name: `collection_${nodes.length + 1}`,
      x: 80 + nodes.length * 36,
      y: 60 + nodes.length * 28,
      fields: [{ id: uid('fld'), name: '_id', type: 'ObjectId' }],
    }
    setNodes((ns) => [...ns, toNode(c)])
    setSelNode(c.id)
    setSelEdge(null)
  }
  const patchCollection = (id: string, mut: (c: DbCollection) => DbCollection) =>
    setNodes((ns) =>
      ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, collection: mut(n.data.collection) } } : n)),
    )
  const deleteCollection = (id: string) => {
    setNodes((ns) => ns.filter((n) => n.id !== id))
    setEdges((es) => es.filter((e) => e.source !== id && e.target !== id))
    setSelNode(null)
  }

  const selectedNode = nodes.find((n) => n.id === selNode) ?? null
  const selectedColl = selectedNode?.data.collection ?? null
  const selectedEdge = edges.find((e) => e.id === selEdge) ?? null
  const collById = (id: string) => nodes.find((n) => n.id === id)?.data.collection

  return (
    <div className="flex h-full min-h-0 gap-3">
      <div className="relative flex-1 min-w-0 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="absolute z-10 top-2 left-2">
          <button className={`${btnCls} bg-white dark:bg-slate-800 shadow-sm`} onClick={addCollection}>
            <Plus size={14} /> Collection
          </button>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={docNodeTypes}
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

      <div className="w-64 shrink-0 overflow-y-auto">
        {selectedColl ? (
          <CollectionPanel
            collection={selectedColl}
            onRename={(name) => patchCollection(selectedColl.id, (c) => ({ ...c, name }))}
            onAddField={() =>
              patchCollection(selectedColl.id, (c) => ({
                ...c,
                fields: [...c.fields, { id: uid('fld'), name: 'campo', type: 'string' }],
              }))
            }
            onPatchField={(fid, p) =>
              patchCollection(selectedColl.id, (c) => ({
                ...c,
                fields: c.fields.map((f) => (f.id === fid ? { ...f, ...p } : f)),
              }))
            }
            onRemoveField={(fid) => {
              patchCollection(selectedColl.id, (c) => ({
                ...c,
                fields: c.fields.filter((f) => f.id !== fid),
              }))
              setEdges((es) =>
                es.map((e) =>
                  e.data?.sourceField === fid
                    ? { ...e, sourceHandle: undefined, data: { ...e.data, sourceField: undefined } }
                    : e,
                ),
              )
            }}
            onDelete={() => deleteCollection(selectedColl.id)}
          />
        ) : selectedEdge ? (
          <ReferencePanel
            source={collById(selectedEdge.source)}
            target={collById(selectedEdge.target)}
            name={selectedEdge.data?.name}
            onName={(name) =>
              setEdges((es) =>
                es.map((e) =>
                  e.id === selectedEdge.id ? { ...e, data: { ...e.data, name }, label: name || 'ref' } : e,
                ),
              )
            }
            onDelete={() => {
              setEdges((es) => es.filter((e) => e.id !== selectedEdge.id))
              setSelEdge(null)
            }}
          />
        ) : (
          <div className="text-sm text-slate-400 p-3 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            Modella documenti: aggiungi <b>collection</b>, definisci i <b>campi</b> (tipo,
            array <span className="font-mono">[]</span>, oggetto annidato
            <span className="font-mono">{' {}'}</span>) e trascina da un campo a un'altra
            collection per creare un <b>riferimento</b>.
          </div>
        )}
      </div>
    </div>
  )
}

// --- Side panels --------------------------------------------------------------
function CollectionPanel({
  collection,
  onRename,
  onAddField,
  onPatchField,
  onRemoveField,
  onDelete,
}: {
  collection: DbCollection
  onRename: (name: string) => void
  onAddField: () => void
  onPatchField: (fid: string, p: Partial<DbField>) => void
  onRemoveField: (fid: string) => void
  onDelete: () => void
}) {
  return (
    <div>
      <label className="block mb-3">
        <span className="block text-[11px] font-medium text-slate-500 mb-1">Collection</span>
        <input className={inputCls} value={collection.name} onChange={(e) => onRename(e.target.value)} />
      </label>

      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-slate-500">Campi</span>
        <button className={btnCls} onClick={onAddField}>
          <Plus size={13} /> Campo
        </button>
      </div>

      <ul className="flex flex-col gap-2 mb-3">
        {collection.fields.map((f) => (
          <li key={f.id} className="rounded-md border border-slate-200 dark:border-slate-700 p-2">
            <div className="flex items-center gap-1.5">
              <input
                className={`${inputCls} flex-1`}
                value={f.name}
                onChange={(e) => onPatchField(f.id, { name: e.target.value })}
              />
              <button
                className="shrink-0 grid place-items-center w-7 h-7 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                onClick={() => onRemoveField(f.id)}
                title="Rimuovi campo"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <input
              className={`${inputCls} mt-1.5`}
              placeholder="tipo (es. string, number, ObjectId)"
              value={f.type}
              onChange={(e) => onPatchField(f.id, { type: e.target.value })}
            />
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={!!f.array} onChange={(e) => onPatchField(f.id, { array: e.target.checked })} />
                array []
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={!!f.embedded} onChange={(e) => onPatchField(f.id, { embedded: e.target.checked })} />
                embedded {'{}'}
              </label>
            </div>
          </li>
        ))}
      </ul>

      <button className={dangerBtnCls} onClick={onDelete}>
        <Trash2 size={15} /> Elimina collection
      </button>
    </div>
  )
}

function ReferencePanel({
  source,
  target,
  name,
  onName,
  onDelete,
}: {
  source?: DbCollection
  target?: DbCollection
  name?: string
  onName: (name: string) => void
  onDelete: () => void
}) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Riferimento</div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        <b>{source?.name ?? '?'}</b> → <b>{target?.name ?? '?'}</b>
      </p>
      <label className="block mb-3">
        <span className="block text-[11px] font-medium text-slate-500 mb-1">Etichetta</span>
        <input className={inputCls} placeholder="ref" value={name ?? ''} onChange={(e) => onName(e.target.value)} />
      </label>
      <button className={dangerBtnCls} onClick={onDelete}>
        <Trash2 size={15} /> Elimina riferimento
      </button>
    </div>
  )
}
