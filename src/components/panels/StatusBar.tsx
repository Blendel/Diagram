import { useState } from 'react'
import { useViewport } from '@xyflow/react'
import {
  Bell,
  Info,
  TriangleAlert,
  CircleAlert,
  CircleCheck,
  Trash2,
  Boxes,
  Waypoints,
} from 'lucide-react'
import { useDiagramStore } from '../../store/useDiagramStore'
import { useUiStore, type EventLevel } from '../../store/useUiStore'

const LEVEL_META: Record<EventLevel, { color: string; Icon: typeof Info }> = {
  info: { color: '#64748b', Icon: Info },
  success: { color: '#16a34a', Icon: CircleCheck },
  warning: { color: '#d97706', Icon: TriangleAlert },
  error: { color: '#dc2626', Icon: CircleAlert },
}

const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export function StatusBar() {
  const nodeCount = useDiagramStore((s) => s.nodes.length)
  const edgeCount = useDiagramStore((s) => s.edges.length)
  const events = useUiStore((s) => s.events)
  const clearEvents = useUiStore((s) => s.clearEvents)
  const { zoom } = useViewport()
  const [open, setOpen] = useState(false)

  const latest = events[0]
  const LatestIcon = latest ? LEVEL_META[latest.level].Icon : Bell

  return (
    <footer className="relative flex items-center gap-4 h-7 px-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
      <span className="inline-flex items-center gap-1">
        <Boxes size={13} /> {nodeCount} nodi
      </span>
      <span className="inline-flex items-center gap-1">
        <Waypoints size={13} /> {edgeCount} connessioni
      </span>
      <span className="hidden sm:inline">Zoom {Math.round(zoom * 100)}%</span>

      <button
        onClick={() => setOpen((o) => !o)}
        className="ml-auto inline-flex items-center gap-1.5 max-w-[50%] px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
        title="Registro eventi"
      >
        <LatestIcon size={13} style={{ color: latest ? LEVEL_META[latest.level].color : undefined }} />
        <span className="truncate">
          {latest ? latest.message : 'Pronto'}
        </span>
      </button>

      {open && (
        <div className="absolute bottom-full right-2 mb-1.5 w-80 max-h-72 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl pop-in">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Registro eventi
            </span>
            <button
              onClick={clearEvents}
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-500"
            >
              <Trash2 size={12} /> Pulisci
            </button>
          </div>
          {events.length === 0 ? (
            <p className="px-3 py-4 text-center text-slate-400 text-xs">Nessun evento</p>
          ) : (
            <ul>
              {events.map((ev) => {
                const m = LEVEL_META[ev.level]
                return (
                  <li
                    key={ev.id}
                    className="flex items-start gap-2 px-3 py-1.5 border-b border-slate-50 dark:border-slate-700/50"
                  >
                    <m.Icon size={13} style={{ color: m.color }} className="mt-0.5 shrink-0" />
                    <span className="flex-1 text-xs text-slate-600 dark:text-slate-300">
                      {ev.message}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {fmtTime(ev.at)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </footer>
  )
}
