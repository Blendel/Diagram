import type { DragEvent } from 'react'
import { NODE_CATALOG, PALETTE_ORDER } from '../../lib/nodeCatalog'
import { DND_MIME } from '../canvas/dnd'
import type { NodeKind } from '../../types/diagram'

export function NodePalette() {
  const onDragStart = (e: DragEvent, kind: NodeKind) => {
    e.dataTransfer.setData(DND_MIME, kind)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 overflow-y-auto">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Componenti
      </h2>
      <p className="text-[11px] text-slate-400 mb-3">Trascina sul canvas</p>

      <div className="flex flex-col gap-2">
        {PALETTE_ORDER.map((kind) => {
          const meta = NODE_CATALOG[kind]
          const Icon = meta.icon
          return (
            <button
              key={kind}
              draggable
              onDragStart={(e) => onDragStart(e, kind)}
              className="flex items-center gap-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-left hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm cursor-grab active:cursor-grabbing transition"
            >
              <span
                className="grid place-items-center w-8 h-8 rounded-md shrink-0"
                style={{ background: meta.soft, color: meta.accent }}
              >
                <Icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {meta.label}
                </span>
                <span className="block text-[11px] text-slate-400 truncate">
                  {meta.description}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
