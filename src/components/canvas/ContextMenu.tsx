import type { ReactNode } from 'react'
import { useReactFlow } from '@xyflow/react'
import { Eye, Copy, Trash2 } from 'lucide-react'
import { useUiStore } from '../../store/useUiStore'
import { useDiagramStore } from '../../store/useDiagramStore'
import { NODE_CATALOG, STATUS_META, STATUS_ORDER, PALETTE_ORDER } from '../../lib/nodeCatalog'
import { SHAPE_ORDER, SHAPE_LABEL } from '../../lib/shapes'
import type { EdgeAnimation } from '../../types/diagram'

function Item({
  icon,
  label,
  onClick,
  danger,
}: {
  icon?: ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 ${
        danger ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function Divider() {
  return <div className="my-1 h-px bg-slate-100 dark:bg-slate-700" />
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
      {children}
    </div>
  )
}

export function ContextMenu() {
  const menu = useUiStore((s) => s.contextMenu)
  const close = useUiStore((s) => s.closeContextMenu)
  const openDetail = useUiStore((s) => s.openDetail)
  const { screenToFlowPosition } = useReactFlow()

  const addNode = useDiagramStore((s) => s.addNode)
  const duplicateNode = useDiagramStore((s) => s.duplicateNode)
  const deleteNode = useDiagramStore((s) => s.deleteNode)
  const deleteEdge = useDiagramStore((s) => s.deleteEdge)
  const updateNodeData = useDiagramStore((s) => s.updateNodeData)
  const updateEdgeData = useDiagramStore((s) => s.updateEdgeData)
  const node = useDiagramStore((s) =>
    menu?.type === 'node' ? s.nodes.find((n) => n.id === menu.targetId) ?? null : null,
  )

  if (!menu) return null

  const style = {
    left: Math.min(menu.x, window.innerWidth - 240),
    top: Math.min(menu.y, window.innerHeight - 340),
  }
  const act = (fn: () => void) => {
    fn()
    close()
  }
  const isGroup = node?.data.kind === 'group'

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onMouseDown={close}
        onContextMenu={(e) => {
          e.preventDefault()
          close()
        }}
      />
      <div
        className="fixed z-50 pop-in w-56 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1 text-sm"
        style={style}
      >
        {menu.type === 'node' && node && (
          <>
            <Item
              icon={<Eye size={15} />}
              label="Apri dettagli"
              onClick={() => act(() => openDetail(node.id))}
            />
            <Item
              icon={<Copy size={15} />}
              label="Duplica"
              onClick={() => act(() => duplicateNode(node.id))}
            />

            {!isGroup && (
              <>
                <Divider />
                <SectionLabel>Stato</SectionLabel>
                <div className="flex gap-1.5 px-3 py-1">
                  {STATUS_ORDER.map((s) => (
                    <button
                      key={s}
                      title={STATUS_META[s].label}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => act(() => updateNodeData(node.id, { status: s }))}
                      className="w-5 h-5 rounded-full ring-2 ring-transparent hover:ring-slate-300"
                      style={{ background: STATUS_META[s].color }}
                    />
                  ))}
                </div>

                <SectionLabel>Forma</SectionLabel>
                <div className="grid grid-cols-3 gap-1 px-2 pb-1">
                  {SHAPE_ORDER.map((sh) => (
                    <button
                      key={sh}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => act(() => updateNodeData(node.id, { shape: sh }))}
                      className={`rounded px-1.5 py-1 text-[11px] hover:bg-slate-100 dark:hover:bg-slate-700 ${
                        (node.data.shape ?? 'rounded') === sh
                          ? 'bg-slate-100 dark:bg-slate-700 font-medium'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {SHAPE_LABEL[sh]}
                    </button>
                  ))}
                </div>
              </>
            )}

            <Divider />
            <Item
              icon={<Trash2 size={15} />}
              label="Elimina"
              danger
              onClick={() => act(() => deleteNode(node.id))}
            />
          </>
        )}

        {menu.type === 'edge' && menu.targetId && (
          <>
            <SectionLabel>Animazione</SectionLabel>
            <div className="grid grid-cols-3 gap-1 px-2 pb-1">
              {(['none', 'flow', 'pulse'] as EdgeAnimation[]).map((a) => (
                <button
                  key={a}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => act(() => updateEdgeData(menu.targetId!, { animation: a }))}
                  className="rounded px-1.5 py-1 text-[11px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {a === 'none' ? 'Statica' : a === 'flow' ? 'Flusso' : 'Pulse'}
                </button>
              ))}
            </div>
            <Divider />
            <Item
              icon={<Trash2 size={15} />}
              label="Elimina connessione"
              danger
              onClick={() => act(() => deleteEdge(menu.targetId!))}
            />
          </>
        )}

        {menu.type === 'pane' && (
          <>
            <SectionLabel>Aggiungi componente</SectionLabel>
            {PALETTE_ORDER.map((kind) => {
              const m = NODE_CATALOG[kind]
              const Icon = m.icon
              return (
                <Item
                  key={kind}
                  icon={<Icon size={15} color={m.accent} />}
                  label={m.label}
                  onClick={() =>
                    act(() =>
                      addNode(kind, screenToFlowPosition({ x: menu.x, y: menu.y })),
                    )
                  }
                />
              )
            })}
          </>
        )}
      </div>
    </>
  )
}
