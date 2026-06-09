import { useEffect, useState } from 'react'
import { Activity, Play, Pause } from 'lucide-react'
import { useDiagramStore } from '../../store/useDiagramStore'
import { STATUS_META } from '../../lib/nodeCatalog'

/** Interactive load slider that drives the node's derived status, with a live simulator. */
export function MetricSliders({ nodeId }: { nodeId: string }) {
  const node = useDiagramStore((s) => s.nodes.find((n) => n.id === nodeId))
  const setLoad = useDiagramStore((s) => s.setLoad)
  const [sim, setSim] = useState(false)

  useEffect(() => {
    if (!sim) return
    const iv = setInterval(() => {
      const n = useDiagramStore.getState().nodes.find((x) => x.id === nodeId)
      if (!n) return
      const v = n.data.load ?? 40
      const next = Math.max(0, Math.min(100, Math.round(v + (Math.random() * 2 - 1) * 18)))
      setLoad(nodeId, next)
    }, 900)
    return () => clearInterval(iv)
  }, [sim, nodeId, setLoad])

  if (!node) return null
  const load = node.data.load ?? 0
  const status = STATUS_META[node.data.status] ?? STATUS_META.unknown

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={15} className="text-slate-400" />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Carico</span>
        <span
          className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ background: `${status.color}1f`, color: status.color }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
          {status.label}
        </span>
      </div>

      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Carico simulato
        </span>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{load}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={load}
        onChange={(e) => setLoad(nodeId, Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{ accentColor: status.color }}
      />
      <p className="text-[11px] text-slate-400 mt-1 mb-2">
        ≥ 75% degradato · ≥ 95% non disponibile. Aumenta anche la velocità delle animazioni.
      </p>

      <button
        onClick={() => setSim((s) => !s)}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition ${
          sim
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
        }`}
      >
        {sim ? <Pause size={14} /> : <Play size={14} />}
        {sim ? 'Ferma simulazione' : 'Simula traffico'}
      </button>
    </div>
  )
}
