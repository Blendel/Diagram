import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ConnectionMode,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type Node,
  type Edge,
  type NodeProps,
  type NodeChange,
  type EdgeChange,
  type NodeTypes,
  type EdgeTypes,
  type EdgeProps,
  type Connection,
  type OnSelectionChangeParams,
} from '@xyflow/react'
import { Plus, Trash2, KeyRound, Link2, Table2 } from 'lucide-react'
import type { DbColumn, DbRelation, DbTable } from '../../../types/diagram'
import { uid } from '../../../lib/uid'
import { inputCls, btnCls, dangerBtnCls } from '../../../lib/ui'

const ACCENT = '#d97706'

type ErdNode = Node<{ table: DbTable }>
type RelData = {
  sourceColumn?: string
  targetColumn?: string
  cardinality: DbRelation['cardinality']
  name?: string
  onDelete?: DbRelation['onDelete']
  onUpdate?: DbRelation['onUpdate']
}
type ErdEdge = Edge<RelData>

// --- Table node ---------------------------------------------------------------
function ErdTableNode({ data, selected }: NodeProps<ErdNode>) {
  const table = data.table
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
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-semibold"
        style={{ background: `color-mix(in srgb, ${ACCENT} 16%, var(--node-bg))`, color: 'var(--node-text)' }}
      >
        <Table2 size={14} style={{ color: ACCENT }} />
        {table.name}
      </div>
      <div>
        {table.columns.length === 0 && (
          <div className="px-2.5 py-1 text-xs text-slate-400">nessuna colonna</div>
        )}
        {table.columns.map((c) => (
          <div
            key={c.id}
            className="relative flex items-center gap-1.5 px-2.5 py-1 text-xs border-t border-slate-100 dark:border-slate-700"
            style={{ color: 'var(--node-text-muted)' }}
          >
            <Handle type="target" position={Position.Left} id={`${c.id}__tgt`} style={{ background: ACCENT }} />
            <Handle type="source" position={Position.Right} id={`${c.id}__src`} style={{ background: ACCENT }} />
            {c.pk ? (
              <KeyRound size={11} className="text-amber-500 shrink-0" />
            ) : c.fk ? (
              <Link2 size={11} className="text-blue-500 shrink-0" />
            ) : (
              <span className="w-[11px] shrink-0" />
            )}
            <span className="font-medium" style={{ color: 'var(--node-text)' }}>
              {c.name}
            </span>
            <span className="ml-auto font-mono opacity-70">{c.type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const erdNodeTypes: NodeTypes = { erdTable: ErdTableNode }

/** Crow's-foot end markers (shared SVG defs, referenced by url). */
function ErdMarkers() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden>
      <defs>
        <marker id="erd-one" markerWidth="18" markerHeight="18" refX="9" refY="9" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path d="M9,3 L9,15" stroke="#94a3b8" strokeWidth="1.6" />
        </marker>
        <marker id="erd-many" markerWidth="20" markerHeight="20" refX="2" refY="10" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path d="M2,10 L16,3 M2,10 L16,10 M2,10 L16,17" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
        </marker>
      </defs>
    </svg>
  )
}

/** Relation edge drawn with crow's-foot notation from its cardinality. */
function ErdEdgeView({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<ErdEdge>) {
  const [path, lx, ly] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  })
  const card = data?.cardinality ?? '1-n'
  const startType = card.startsWith('n') ? 'many' : 'one'
  const endType = card.endsWith('n') ? 'many' : 'one'
  const label = data?.name || card
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerStart={`url(#erd-${startType})`}
        markerEnd={`url(#erd-${endType})`}
        style={{ stroke: selected ? ACCENT : '#94a3b8', strokeWidth: selected ? 2 : 1.5 }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="absolute px-1.5 py-0.5 rounded text-[10px] font-medium shadow-sm pointer-events-none"
            style={{
              transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)`,
              background: 'var(--node-bg)',
              color: 'var(--node-text-muted)',
              border: '1px solid var(--node-border)',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

const erdEdgeTypes: EdgeTypes = { erd: ErdEdgeView }

interface ErdEditorProps {
  initialTables: DbTable[]
  initialRelations: DbRelation[]
  onChange: (tables: DbTable[], relations: DbRelation[]) => void
}

export function ErdEditor(props: ErdEditorProps) {
  return (
    <ReactFlowProvider>
      <ErdInner {...props} />
    </ReactFlowProvider>
  )
}

const toNode = (t: DbTable): ErdNode => ({
  id: t.id,
  type: 'erdTable',
  position: { x: t.x, y: t.y },
  data: { table: t },
})
const toEdge = (r: DbRelation): ErdEdge => ({
  id: r.id,
  source: r.source,
  target: r.target,
  sourceHandle: r.sourceColumn ? `${r.sourceColumn}__src` : undefined,
  targetHandle: r.targetColumn ? `${r.targetColumn}__tgt` : undefined,
  type: 'erd',
  data: {
    sourceColumn: r.sourceColumn,
    targetColumn: r.targetColumn,
    cardinality: r.cardinality,
    name: r.name,
    onDelete: r.onDelete,
    onUpdate: r.onUpdate,
  },
})

function ErdInner({ initialTables, initialRelations, onChange }: ErdEditorProps) {
  // React Flow is the source of truth → node identity stays stable while dragging.
  const [nodes, setNodes] = useState<ErdNode[]>(() => initialTables.map(toNode))
  const [edges, setEdges] = useState<ErdEdge[]>(() => initialRelations.map(toEdge))
  const [selNode, setSelNode] = useState<string | null>(null)
  const [selEdge, setSelEdge] = useState<string | null>(null)

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const commit = (ns: ErdNode[], es: ErdEdge[]) => {
    const tables: DbTable[] = ns.map((n) => ({
      ...n.data.table,
      x: n.position.x,
      y: n.position.y,
    }))
    const relations: DbRelation[] = es.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceColumn: e.data?.sourceColumn,
      targetColumn: e.data?.targetColumn,
      cardinality: e.data?.cardinality ?? '1-n',
      name: e.data?.name,
      onDelete: e.data?.onDelete,
      onUpdate: e.data?.onUpdate,
    }))
    onChangeRef.current(tables, relations)
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

  const onNodesChange = useCallback(
    (ch: NodeChange<ErdNode>[]) => setNodes((ns) => applyNodeChanges(ch, ns)),
    [],
  )
  const onEdgesChange = useCallback(
    (ch: EdgeChange<ErdEdge>[]) => setEdges((es) => applyEdgeChanges(ch, es)),
    [],
  )
  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target || c.source === c.target) return
    const sourceColumn = c.sourceHandle?.replace(/__(src|tgt)$/, '') || undefined
    const targetColumn = c.targetHandle?.replace(/__(src|tgt)$/, '') || undefined
    setEdges((es) =>
      addEdge(
        toEdge({
          id: uid('rel'),
          source: c.source!,
          target: c.target!,
          sourceColumn,
          targetColumn,
          cardinality: '1-n',
        }),
        es,
      ),
    )
  }, [])
  const onSelectionChange = useCallback(({ nodes: n, edges: e }: OnSelectionChangeParams) => {
    setSelNode(n[0]?.id ?? null)
    setSelEdge(n[0] ? null : e[0]?.id ?? null)
  }, [])

  // --- mutations ---
  const addTable = () => {
    const t: DbTable = {
      id: uid('tbl'),
      name: `tabella_${nodes.length + 1}`,
      x: 80 + nodes.length * 36,
      y: 60 + nodes.length * 28,
      columns: [{ id: uid('col'), name: 'id', type: 'uuid', pk: true }],
    }
    setNodes((ns) => [...ns, toNode(t)])
    setSelNode(t.id)
    setSelEdge(null)
  }

  const patchTable = (id: string, mut: (t: DbTable) => DbTable) =>
    setNodes((ns) =>
      ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, table: mut(n.data.table) } } : n)),
    )

  const deleteTable = (id: string) => {
    setNodes((ns) => ns.filter((n) => n.id !== id))
    setEdges((es) => es.filter((e) => e.source !== id && e.target !== id))
    setSelNode(null)
  }

  const selectedNode = nodes.find((n) => n.id === selNode) ?? null
  const selectedTable = selectedNode?.data.table ?? null
  const selectedEdge = edges.find((e) => e.id === selEdge) ?? null
  const selectedRel: DbRelation | null = selectedEdge
    ? {
        id: selectedEdge.id,
        source: selectedEdge.source,
        target: selectedEdge.target,
        sourceColumn: selectedEdge.data?.sourceColumn,
        targetColumn: selectedEdge.data?.targetColumn,
        cardinality: selectedEdge.data?.cardinality ?? '1-n',
        name: selectedEdge.data?.name,
        onDelete: selectedEdge.data?.onDelete,
        onUpdate: selectedEdge.data?.onUpdate,
      }
    : null
  const tableById = (id: string) => nodes.find((n) => n.id === id)?.data.table

  return (
    <div className="flex h-full min-h-0 gap-3">
      <div className="relative flex-1 min-w-0 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="absolute z-10 top-2 left-2">
          <button className={`${btnCls} bg-white dark:bg-slate-800 shadow-sm`} onClick={addTable}>
            <Plus size={14} /> Tabella
          </button>
        </div>
        <ErdMarkers />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={erdNodeTypes}
          edgeTypes={erdEdgeTypes}
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
        {selectedTable ? (
          <TablePanel
            table={selectedTable}
            onRename={(name) => patchTable(selectedTable.id, (t) => ({ ...t, name }))}
            onAddColumn={() =>
              patchTable(selectedTable.id, (t) => ({
                ...t,
                columns: [...t.columns, { id: uid('col'), name: 'colonna', type: 'text' }],
              }))
            }
            onPatchColumn={(cid, p) =>
              patchTable(selectedTable.id, (t) => ({
                ...t,
                columns: t.columns.map((c) => (c.id === cid ? { ...c, ...p } : c)),
              }))
            }
            onRemoveColumn={(cid) => {
              patchTable(selectedTable.id, (t) => ({
                ...t,
                columns: t.columns.filter((c) => c.id !== cid),
              }))
              // Drop column anchoring from any relation that referenced it.
              setEdges((es) =>
                es.map((e) => {
                  let ne = e
                  if (e.data?.sourceColumn === cid)
                    ne = { ...ne, sourceHandle: undefined, data: { ...ne.data!, sourceColumn: undefined } }
                  if (ne.data?.targetColumn === cid)
                    ne = { ...ne, targetHandle: undefined, data: { ...ne.data!, targetColumn: undefined } }
                  return ne
                }),
              )
            }}
            onDelete={() => deleteTable(selectedTable.id)}
          />
        ) : selectedRel ? (
          <RelationPanel
            relation={selectedRel}
            source={tableById(selectedRel.source)}
            target={tableById(selectedRel.target)}
            onPatch={(p) =>
              setEdges((es) =>
                es.map((e) => {
                  if (e.id !== selectedRel.id) return e
                  const sc = p.sourceColumn ?? e.data?.sourceColumn
                  const tc = p.targetColumn ?? e.data?.targetColumn
                  return {
                    ...e,
                    data: { ...e.data, ...p } as RelData,
                    label: ((p.name ?? e.data?.name) ||
                      (p.cardinality ?? e.data?.cardinality)) as string,
                    sourceHandle: sc ? `${sc}__src` : undefined,
                    targetHandle: tc ? `${tc}__tgt` : undefined,
                  }
                }),
              )
            }
            onDelete={() => {
              setEdges((es) => es.filter((e) => e.id !== selectedRel.id))
              setSelEdge(null)
            }}
          />
        ) : (
          <div className="text-sm text-slate-400 p-3 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            Aggiungi una tabella, poi <b>trascina dal bordo destro</b> di una
            tabella a un'altra per creare una relazione. Seleziona una tabella o
            una relazione per modificarla.
          </div>
        )}
      </div>
    </div>
  )
}

// --- Side panels --------------------------------------------------------------
function TablePanel({
  table,
  onRename,
  onAddColumn,
  onPatchColumn,
  onRemoveColumn,
  onDelete,
}: {
  table: DbTable
  onRename: (name: string) => void
  onAddColumn: () => void
  onPatchColumn: (cid: string, p: Partial<DbColumn>) => void
  onRemoveColumn: (cid: string) => void
  onDelete: () => void
}) {
  return (
    <div>
      <label className="block mb-3">
        <span className="block text-[11px] font-medium text-slate-500 mb-1">Tabella</span>
        <input className={inputCls} value={table.name} onChange={(e) => onRename(e.target.value)} />
      </label>

      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-slate-500">Colonne</span>
        <button className={btnCls} onClick={onAddColumn}>
          <Plus size={13} /> Colonna
        </button>
      </div>

      <ul className="flex flex-col gap-2 mb-3">
        {table.columns.map((c) => (
          <li key={c.id} className="rounded-md border border-slate-200 dark:border-slate-700 p-2">
            <div className="flex items-center gap-1.5">
              <input
                className={`${inputCls} flex-1`}
                value={c.name}
                onChange={(e) => onPatchColumn(c.id, { name: e.target.value })}
              />
              <button
                className="shrink-0 grid place-items-center w-7 h-7 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                onClick={() => onRemoveColumn(c.id)}
                title="Rimuovi colonna"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex gap-1.5 mt-1.5">
              <input
                className={`${inputCls} flex-1`}
                placeholder="tipo (es. uuid, text, int)"
                value={c.type}
                onChange={(e) => onPatchColumn(c.id, { type: e.target.value })}
              />
              <input
                className={`${inputCls} w-24`}
                placeholder="default"
                value={c.default ?? ''}
                onChange={(e) => onPatchColumn(c.id, { default: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={!!c.pk} onChange={(e) => onPatchColumn(c.id, { pk: e.target.checked })} />
                PK
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={!!c.fk} onChange={(e) => onPatchColumn(c.id, { fk: e.target.checked })} />
                FK
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={!!c.unique} onChange={(e) => onPatchColumn(c.id, { unique: e.target.checked })} />
                UQ
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={!!c.nullable} onChange={(e) => onPatchColumn(c.id, { nullable: e.target.checked })} />
                null
              </label>
            </div>
          </li>
        ))}
      </ul>

      <button className={dangerBtnCls} onClick={onDelete}>
        <Trash2 size={15} /> Elimina tabella
      </button>
    </div>
  )
}

function RelationPanel({
  relation,
  source,
  target,
  onPatch,
  onDelete,
}: {
  relation: DbRelation
  source?: DbTable
  target?: DbTable
  onPatch: (p: Partial<DbRelation>) => void
  onDelete: () => void
}) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Relazione</div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        <b>{source?.name ?? '?'}</b> → <b>{target?.name ?? '?'}</b>
      </p>

      <label className="block mb-3">
        <span className="block text-[11px] font-medium text-slate-500 mb-1">Nome relazione</span>
        <input
          className={inputCls}
          placeholder="es. fk_orders_customer"
          value={relation.name ?? ''}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
      </label>

      <label className="block mb-3">
        <span className="block text-[11px] font-medium text-slate-500 mb-1">Colonna sorgente</span>
        <select
          className={inputCls}
          value={relation.sourceColumn ?? ''}
          onChange={(e) => onPatch({ sourceColumn: e.target.value })}
        >
          <option value="">—</option>
          {source?.columns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block mb-3">
        <span className="block text-[11px] font-medium text-slate-500 mb-1">Colonna destinazione</span>
        <select
          className={inputCls}
          value={relation.targetColumn ?? ''}
          onChange={(e) => onPatch({ targetColumn: e.target.value })}
        >
          <option value="">—</option>
          {target?.columns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block mb-3">
        <span className="block text-[11px] font-medium text-slate-500 mb-1">Cardinalità</span>
        <select
          className={inputCls}
          value={relation.cardinality}
          onChange={(e) => onPatch({ cardinality: e.target.value as DbRelation['cardinality'] })}
        >
          <option value="1-1">Uno a uno (1-1)</option>
          <option value="1-n">Uno a molti (1-n)</option>
          <option value="n-n">Molti a molti (n-n)</option>
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block mb-3">
          <span className="block text-[11px] font-medium text-slate-500 mb-1">ON DELETE</span>
          <select
            className={inputCls}
            value={relation.onDelete ?? 'no action'}
            onChange={(e) => onPatch({ onDelete: e.target.value as DbRelation['onDelete'] })}
          >
            <option value="no action">No action</option>
            <option value="cascade">Cascade</option>
            <option value="restrict">Restrict</option>
            <option value="set null">Set null</option>
          </select>
        </label>
        <label className="block mb-3">
          <span className="block text-[11px] font-medium text-slate-500 mb-1">ON UPDATE</span>
          <select
            className={inputCls}
            value={relation.onUpdate ?? 'no action'}
            onChange={(e) => onPatch({ onUpdate: e.target.value as DbRelation['onUpdate'] })}
          >
            <option value="no action">No action</option>
            <option value="cascade">Cascade</option>
            <option value="restrict">Restrict</option>
            <option value="set null">Set null</option>
          </select>
        </label>
      </div>

      <button className={dangerBtnCls} onClick={onDelete}>
        <Trash2 size={15} /> Elimina relazione
      </button>
    </div>
  )
}
