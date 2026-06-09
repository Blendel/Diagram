import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  Copy,
  Trash2,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useDiagramStore, type AlignMode } from '../../store/useDiagramStore'
import { PRESET_COLORS } from '../../lib/colors'
import { STATUS_META, STATUS_ORDER } from '../../lib/nodeCatalog'

type Icon = ComponentType<{ size?: number }>

const ALIGN: { mode: AlignMode; icon: Icon; title: string }[] = [
  { mode: 'left', icon: AlignStartVertical, title: 'Allinea a sinistra' },
  { mode: 'hcenter', icon: AlignCenterVertical, title: 'Centra orizzontalmente' },
  { mode: 'right', icon: AlignEndVertical, title: 'Allinea a destra' },
  { mode: 'top', icon: AlignStartHorizontal, title: 'Allinea in alto' },
  { mode: 'vcenter', icon: AlignCenterHorizontal, title: 'Centra verticalmente' },
  { mode: 'bottom', icon: AlignEndHorizontal, title: 'Allinea in basso' },
]

const tool =
  'grid place-items-center w-7 h-7 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'

function Sep() {
  return <span className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
}

export function BulkToolbar() {
  const ids = useDiagramStore((s) => s.selectedNodeIds)
  const align = useDiagramStore((s) => s.alignNodes)
  const distribute = useDiagramStore((s) => s.distributeNodes)
  const setColor = useDiagramStore((s) => s.setNodesColor)
  const setStatus = useDiagramStore((s) => s.setNodesStatus)
  const duplicate = useDiagramStore((s) => s.duplicateNodes)
  const remove = useDiagramStore((s) => s.deleteNodes)

  if (ids.length < 2) return null
  const canDistribute = ids.length >= 3

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur shadow-lg px-2 py-1.5">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-1">
        {ids.length} selez.
      </span>
      <Sep />

      {ALIGN.map(({ mode, icon: Icon, title }) => (
        <button key={mode} className={tool} title={title} onClick={() => align(ids, mode)}>
          <Icon size={15} />
        </button>
      ))}
      <Sep />

      <button
        className={`${tool} disabled:opacity-40`}
        title="Distribuisci orizzontalmente"
        disabled={!canDistribute}
        onClick={() => distribute(ids, 'h')}
      >
        <AlignHorizontalDistributeCenter size={15} />
      </button>
      <button
        className={`${tool} disabled:opacity-40`}
        title="Distribuisci verticalmente"
        disabled={!canDistribute}
        onClick={() => distribute(ids, 'v')}
      >
        <AlignVerticalDistributeCenter size={15} />
      </button>
      <Sep />

      <div className="flex items-center gap-1 px-0.5">
        {PRESET_COLORS.slice(0, 6).map((c) => (
          <button
            key={c.value}
            title={`Colore ${c.name}`}
            onClick={() => setColor(ids, c.value)}
            className="w-4 h-4 rounded-full ring-1 ring-black/10"
            style={{ background: c.value }}
          />
        ))}
      </div>
      <Sep />

      <div className="flex items-center gap-1 px-0.5">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            title={`Stato: ${STATUS_META[s].label}`}
            onClick={() => setStatus(ids, s)}
            className="w-4 h-4 rounded-full"
            style={{ background: STATUS_META[s].color }}
          />
        ))}
      </div>
      <Sep />

      <button className={tool} title="Duplica selezione" onClick={() => duplicate(ids)}>
        <Copy size={15} />
      </button>
      <button
        className={`${tool} text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40`}
        title="Elimina selezione"
        onClick={() => remove(ids)}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
