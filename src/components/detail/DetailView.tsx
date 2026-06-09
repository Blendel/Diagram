import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Table2, Boxes, LayoutGrid } from 'lucide-react'
import { useUiStore } from '../../store/useUiStore'
import { useDiagramStore } from '../../store/useDiagramStore'
import { NODE_CATALOG, STATUS_META } from '../../lib/nodeCatalog'
import { SUB_ORDER_DB } from '../../lib/subCatalog'
import { uid } from '../../lib/uid'
import type { ComponentChildren, SubNodeKind } from '../../types/diagram'

// Heavy editors are code-split: loaded only when a detail view is opened.
const ErdEditor = lazy(() => import('./erd/ErdEditor').then((m) => ({ default: m.ErdEditor })))
const DocEditor = lazy(() => import('./erd/DocEditor').then((m) => ({ default: m.DocEditor })))
const SubGraphEditor = lazy(() =>
  import('./subgraph/SubGraphEditor').then((m) => ({ default: m.SubGraphEditor })),
)
const WireframeEditor = lazy(() =>
  import('./wireframe/WireframeEditor').then((m) => ({ default: m.WireframeEditor })),
)

/** Maps a legacy `data.functions` array (older schema) onto the new sub-graph. */
function legacyChildren(data: Record<string, unknown>): ComponentChildren {
  const fns = Array.isArray(data.functions) ? (data.functions as Array<Record<string, unknown>>) : []
  const map: Record<string, SubNodeKind> = {
    endpoint: 'endpoint',
    module: 'module',
    function: 'function',
    job: 'function',
  }
  return {
    nodes: fns.map((f, i) => ({
      id: uid('sub'),
      type: 'sub',
      position: { x: 80, y: 60 + i * 90 },
      data: {
        kind: map[String(f.kind)] ?? 'function',
        label: String(f.name ?? 'elemento'),
        signature: '',
        description: typeof f.description === 'string' ? f.description : '',
      },
    })),
    edges: [],
  }
}

export function DetailView() {
  const id = useUiStore((s) => s.detailNodeId)
  const close = useUiStore((s) => s.closeDetail)
  const node = useDiagramStore((s) => s.nodes.find((n) => n.id === id) ?? null)
  const update = useDiagramStore((s) => s.updateNodeData)
  const setLoad = useDiagramStore((s) => s.setLoad)
  const [dbTab, setDbTab] = useState<'schema' | 'objects'>('schema')
  const [exiting, setExiting] = useState(false)

  // Play a zoom-out exit animation before actually closing.
  const handleClose = useCallback(() => {
    setExiting(true)
    window.setTimeout(() => {
      setExiting(false)
      close()
    }, 200)
  }, [close])

  useEffect(() => {
    if (!id) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [id, handleClose])

  useEffect(() => {
    if (id && !node) close()
  }, [id, node, close])

  // Reset to the schema tab whenever a different node is opened.
  useEffect(() => setDbTab('schema'), [id])

  if (!id || !node) return null

  const meta = NODE_CATALOG[node.data.kind] ?? NODE_CATALOG.service
  const Icon = meta.icon
  const status = STATUS_META[node.data.status] ?? STATUS_META.unknown
  const accent = node.data.color || meta.accent
  const isDb = node.data.kind === 'database'
  const isClient = node.data.kind === 'client'
  const load = node.data.load ?? 0
  const children = node.data.children ?? legacyChildren(node.data)
  const wireframe = node.data.wireframe ?? { nodes: [], edges: [] }

  const tabBtn = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium transition ${
      active
        ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
    }`

  return (
    <div
      className={`${exiting ? 'detail-exit' : 'detail-enter'} fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900`}
    >
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={handleClose}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={15} /> Architettura
        </button>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span
          className="grid place-items-center w-8 h-8 rounded-lg shrink-0"
          style={{ background: `color-mix(in srgb, ${accent} 16%, var(--node-bg))`, color: accent }}
        >
          <Icon size={18} />
        </span>
        <input
          value={node.data.label}
          onChange={(e) => update(id, { label: e.target.value })}
          className="min-w-0 max-w-xs bg-transparent text-base font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
        />
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
          style={{ background: `${status.color}1f`, color: status.color }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
          {status.label}
        </span>

        <div className="ml-auto flex items-center gap-2 min-w-[200px]">
          <span className="text-[11px] text-slate-400 shrink-0">Carico</span>
          <input
            type="range"
            min={0}
            max={100}
            value={load}
            onChange={(e) => setLoad(id, Number(e.target.value))}
            className="flex-1 cursor-pointer"
            style={{ accentColor: status.color }}
          />
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 w-9 text-right shrink-0">
            {load}%
          </span>
        </div>
      </header>

      {/* Title strip / tabs */}
      <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
        {isDb ? (
          <>
            <button className={tabBtn(dbTab === 'schema')} onClick={() => setDbTab('schema')}>
              <Table2 size={15} className="text-amber-500" /> Schema relazionale
            </button>
            <button className={tabBtn(dbTab === 'objects')} onClick={() => setDbTab('objects')}>
              <Boxes size={15} className="text-teal-500" /> Funzioni & oggetti
            </button>
          </>
        ) : isClient ? (
          <>
            <LayoutGrid size={15} style={{ color: accent }} /> Design delle pagine — wireframe
            dell'interfaccia
          </>
        ) : (
          <>
            <Icon size={15} color={accent} /> Mappa interna del componente — funzioni, endpoint,
            moduli, variabili…
          </>
        )}
      </div>

      {/* Body: a dedicated canvas */}
      <div className="flex-1 min-h-0 p-4">
        <Suspense
          fallback={
            <div className="grid place-items-center h-full text-sm text-slate-400">
              Caricamento editor…
            </div>
          }
        >
          {isDb ? (
            dbTab === 'schema' ? (
            <div className="flex flex-col h-full min-h-0 gap-2">
              <div className="inline-flex self-start rounded-md bg-slate-100 dark:bg-slate-800 p-0.5">
                {(['relational', 'document'] as const).map((m) => {
                  const active = (node.data.dbMode ?? 'relational') === m
                  return (
                    <button
                      key={m}
                      onClick={() => update(id, { dbMode: m })}
                      className={`px-3 py-1 rounded text-sm font-medium transition ${
                        active
                          ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {m === 'relational' ? 'Relazionale' : 'Documentale'}
                    </button>
                  )
                })}
              </div>
              <div className="flex-1 min-h-0">
                {(node.data.dbMode ?? 'relational') === 'document' ? (
                  <DocEditor
                    key={`${id}-doc`}
                    initialCollections={node.data.collections ?? []}
                    initialReferences={node.data.references ?? []}
                    onChange={(collections, references) => update(id, { collections, references })}
                  />
                ) : (
                  <ErdEditor
                    key={`${id}-erd`}
                    initialTables={node.data.tables ?? []}
                    initialRelations={node.data.relations ?? []}
                    onChange={(tables, relations) => update(id, { tables, relations })}
                  />
                )}
              </div>
            </div>
          ) : (
            <SubGraphEditor
              key={`${id}-obj`}
              kinds={SUB_ORDER_DB}
              initialNodes={children.nodes}
              initialEdges={children.edges}
              onChange={(nodes, edges) => update(id, { children: { nodes, edges } })}
            />
          )
        ) : isClient ? (
          <WireframeEditor
            key={id}
            initialNodes={wireframe.nodes}
            initialEdges={wireframe.edges}
            onChange={(nodes, edges) => update(id, { wireframe: { nodes, edges } })}
          />
          ) : (
            <SubGraphEditor
              key={id}
              initialNodes={children.nodes}
              initialEdges={children.edges}
              onChange={(nodes, edges) => update(id, { children: { nodes, edges } })}
            />
          )}
        </Suspense>
      </div>
    </div>
  )
}
