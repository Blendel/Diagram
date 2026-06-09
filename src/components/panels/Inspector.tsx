import type { ReactNode } from 'react'
import { Trash2, MousePointer2, Maximize2, Palette } from 'lucide-react'
import { useDiagramStore } from '../../store/useDiagramStore'
import { useUiStore } from '../../store/useUiStore'
import { NODE_CATALOG, STATUS_META, STATUS_ORDER } from '../../lib/nodeCatalog'
import { PROTOCOL_META, PROTOCOL_ORDER, SYNC_META } from '../../lib/edgeCatalog'
import { SHAPE_LABEL, SHAPE_ORDER } from '../../lib/shapes'
import { GROUP_VARIANTS, GROUP_ORDER } from '../../lib/groupCatalog'
import { ICON_REGISTRY, ICON_NAMES } from '../../lib/iconRegistry'
import { PRESET_COLORS } from '../../lib/colors'
import { inputCls, primaryBtnCls, dangerBtnCls } from '../../lib/ui'
import { MetricSliders } from '../detail/MetricSliders'
import type { AppEdge, AppNode, DiagramEdgeData } from '../../types/diagram'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </span>
      {children}
    </label>
  )
}

function NodeInspector({ node }: { node: AppNode }) {
  const update = useDiagramStore((s) => s.updateNodeData)
  const remove = useDiagramStore((s) => s.deleteNode)
  const openDetail = useUiStore((s) => s.openDetail)
  const meta = NODE_CATALOG[node.data.kind] ?? NODE_CATALOG.service
  const Icon = (node.data.icon && ICON_REGISTRY[node.data.icon]) || meta.icon
  const isGroup = node.data.kind === 'group'
  const accent = node.data.color || meta.accent

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span
          className="grid place-items-center w-8 h-8 rounded-md"
          style={{ background: `color-mix(in srgb, ${accent} 16%, var(--node-bg))`, color: accent }}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
            {meta.label}
          </div>
          <div className="text-[11px] text-slate-400">Componente selezionato</div>
        </div>
      </div>

      {!isGroup && (
        <button className={`${primaryBtnCls} w-full justify-center mb-4`} onClick={() => openDetail(node.id)}>
          <Maximize2 size={15} /> Apri dettagli
        </button>
      )}

      <Field label="Nome">
        <input
          className={inputCls}
          value={node.data.label}
          onChange={(e) => update(node.id, { label: e.target.value })}
        />
      </Field>

      <Field label="Forma">
        <select
          className={inputCls}
          value={node.data.shape ?? meta.defaultShape}
          onChange={(e) => update(node.id, { shape: e.target.value as AppNode['data']['shape'] })}
        >
          {SHAPE_ORDER.map((s) => (
            <option key={s} value={s}>
              {SHAPE_LABEL[s]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Colore">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {PRESET_COLORS.map((c) => {
            const sel = accent.toLowerCase() === c.value.toLowerCase()
            return (
              <button
                key={c.value}
                title={c.name}
                onClick={() => update(node.id, { color: c.value })}
                className="w-6 h-6 rounded-full transition"
                style={{
                  background: c.value,
                  outline: sel ? `2px solid ${c.value}` : '2px solid transparent',
                  outlineOffset: 2,
                }}
              />
            )
          })}
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={accent}
            onChange={(e) => update(node.id, { color: e.target.value })}
            className="h-9 w-12 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer p-0.5"
          />
          <button
            className="inline-flex items-center gap-1.5 px-2.5 h-9 rounded-md border border-slate-200 dark:border-slate-700 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            title="Ripristina colore di default"
            onClick={() => update(node.id, { color: undefined })}
          >
            <Palette size={14} /> Default
          </button>
        </div>
      </Field>

      {isGroup && (
        <Field label="Tipo di gruppo">
          <select
            className={inputCls}
            value={node.data.groupType ?? 'generic'}
            onChange={(e) =>
              update(node.id, { groupType: e.target.value as AppNode['data']['groupType'] })
            }
          >
            {GROUP_ORDER.map((g) => (
              <option key={g} value={g}>
                {GROUP_VARIANTS[g].label}
              </option>
            ))}
          </select>
        </Field>
      )}

      {!isGroup && (
        <>
          <Field label="Icona">
            <div className="grid grid-cols-8 gap-1 max-h-28 overflow-y-auto p-1 rounded-md border border-slate-200 dark:border-slate-700">
              <button
                title="Icona di default"
                onClick={() => update(node.id, { icon: undefined })}
                className={`grid place-items-center h-7 rounded text-[10px] ${
                  !node.data.icon
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300'
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                auto
              </button>
              {ICON_NAMES.map((name) => {
                const Ic = ICON_REGISTRY[name]
                const active = node.data.icon === name
                return (
                  <button
                    key={name}
                    title={name}
                    onClick={() => update(node.id, { icon: name })}
                    className={`grid place-items-center h-7 rounded ${
                      active
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Ic size={15} />
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Stato">
            <select
              className={inputCls}
              value={node.data.status}
              onChange={(e) =>
                update(node.id, { status: e.target.value as AppNode['data']['status'] })
              }
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tecnologia">
            <input
              className={inputCls}
              placeholder="es. Node.js, PostgreSQL…"
              value={node.data.technology ?? ''}
              onChange={(e) => update(node.id, { technology: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Porta">
              <input
                className={inputCls}
                placeholder="8080"
                value={node.data.port ?? ''}
                onChange={(e) => update(node.id, { port: e.target.value })}
              />
            </Field>
            <Field label="Owner / Team">
              <input
                className={inputCls}
                placeholder="Team…"
                value={node.data.owner ?? ''}
                onChange={(e) => update(node.id, { owner: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Link (repo, runbook…)">
            <input
              className={inputCls}
              placeholder="https://…"
              value={node.data.url ?? ''}
              onChange={(e) => update(node.id, { url: e.target.value })}
            />
          </Field>

          <div className="mb-3">
            <MetricSliders nodeId={node.id} />
          </div>
        </>
      )}

      <button onClick={() => remove(node.id)} className={`${dangerBtnCls} mt-1`}>
        <Trash2 size={15} /> Elimina componente
      </button>
    </div>
  )
}

function EdgeInspector({ edge }: { edge: AppEdge }) {
  const update = useDiagramStore((s) => s.updateEdgeData)
  const remove = useDiagramStore((s) => s.deleteEdge)
  const data = edge.data ?? { protocol: 'http' as const, sync: 'sync' as const }

  return (
    <div>
      <div className="mb-4">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Connessione</div>
        <div className="text-[11px] text-slate-400">Collegamento selezionato</div>
      </div>

      <Field label="Etichetta">
        <input
          className={inputCls}
          placeholder="es. OrderCreated"
          value={data.label ?? ''}
          onChange={(e) => update(edge.id, { label: e.target.value })}
        />
      </Field>

      <Field label="Protocollo">
        <select
          className={inputCls}
          value={data.protocol}
          onChange={(e) => update(edge.id, { protocol: e.target.value as DiagramEdgeData['protocol'] })}
        >
          {PROTOCOL_ORDER.map((p) => (
            <option key={p} value={p}>
              {PROTOCOL_META[p].label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tipo di chiamata">
        <select
          className={inputCls}
          value={data.sync}
          onChange={(e) => update(edge.id, { sync: e.target.value as DiagramEdgeData['sync'] })}
        >
          {(['sync', 'async'] as const).map((s) => (
            <option key={s} value={s}>
              {SYNC_META[s]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Animazione">
        <select
          className={inputCls}
          value={data.animation ?? (data.sync === 'async' ? 'flow' : 'none')}
          onChange={(e) =>
            update(edge.id, { animation: e.target.value as DiagramEdgeData['animation'] })
          }
        >
          <option value="none">Statica</option>
          <option value="flow">Flusso (tratteggio)</option>
          <option value="pulse">Pulse (pacchetto)</option>
          <option value="pubsub">Pub/Sub (impulso)</option>
        </select>
      </Field>

      <button onClick={() => remove(edge.id)} className={`${dangerBtnCls} mt-1`}>
        <Trash2 size={15} /> Elimina connessione
      </button>
    </div>
  )
}

export function Inspector() {
  const node = useDiagramStore(
    (s) => s.nodes.find((n) => n.id === s.selectedNodeId) ?? null,
  )
  const edge = useDiagramStore(
    (s) => s.edges.find((e) => e.id === s.selectedEdgeId) ?? null,
  )

  return (
    <aside className="w-72 shrink-0 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 overflow-y-auto">
      {node ? (
        <NodeInspector node={node} />
      ) : edge ? (
        <EdgeInspector edge={edge} />
      ) : (
        <div className="flex flex-col items-center justify-center text-center text-slate-400 h-full gap-2 pt-10">
          <MousePointer2 size={28} />
          <p className="text-sm">
            Seleziona un componente o una connessione per modificarne i dettagli.
            Doppio click su un nodo per aprire i dettagli completi.
          </p>
        </div>
      )}
    </aside>
  )
}
