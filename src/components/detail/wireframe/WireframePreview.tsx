import { useMemo, useState } from 'react'
import type { UiNode } from '../../../types/diagram'
import { UI_CATALOG } from '../../../lib/uiCatalog'
import { WireBlock, type WireState } from './WireBlock'

const num = (v: unknown, fallback: number) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : fallback
}

function dim(n: UiNode) {
  const meta = UI_CATALOG[n.data.kind] ?? UI_CATALOG.text
  return {
    w: num(n.style?.width ?? n.width, meta.w),
    h: num(n.style?.height ?? n.height, meta.h),
  }
}

/** Interactive preview of a wireframe: inputs, toggles, tabs work and buttons navigate frames. */
export function WireframePreview({ nodes }: { nodes: UiNode[] }) {
  const frames = useMemo(() => nodes.filter((n) => n.data.kind === 'frame'), [nodes])
  const [currentId, setCurrentId] = useState<string | null>(frames[0]?.id ?? null)
  const [stateMap, setStateMap] = useState<Record<string, WireState>>({})

  const patch = (id: string, p: Partial<WireState>) =>
    setStateMap((m) => ({ ...m, [id]: { ...m[id], ...p } }))
  const navigate = (link?: string) => {
    if (link && frames.some((f) => f.id === link)) setCurrentId(link)
  }

  const renderEl = (el: UiNode, offX: number, offY: number) => {
    const meta = UI_CATALOG[el.data.kind] ?? UI_CATALOG.text
    const { w, h } = dim(el)
    const st = stateMap[el.id]
    return (
      <div
        key={el.id}
        style={{ position: 'absolute', left: el.position.x - offX, top: el.position.y - offY, width: w, height: h }}
      >
        <WireBlock
          data={el.data}
          accent={meta.accent}
          interactive
          linked={!!el.data.link}
          state={st}
          onValue={(v) => patch(el.id, { value: v })}
          onToggleChecked={() => patch(el.id, { checked: !(st?.checked ?? el.data.checked ?? false) })}
          onToggleOn={() => patch(el.id, { on: !(st?.on ?? el.data.on ?? false) })}
          onTab={(i) => patch(el.id, { tab: i })}
          onActivate={() => navigate(el.data.link)}
        />
      </div>
    )
  }

  // --- Frame-based navigation ---
  if (frames.length > 0) {
    const current = frames.find((f) => f.id === currentId) ?? frames[0]
    const fx = current.position.x
    const fy = current.position.y
    const { w: fw, h: fh } = dim(current)
    const inside = nodes.filter((n) => {
      if (n.data.kind === 'frame' || n.data.kind === 'note') return false
      const { w, h } = dim(n)
      const cx = n.position.x + w / 2
      const cy = n.position.y + h / 2
      return cx >= fx && cx <= fx + fw && cy >= fy && cy <= fy + fh
    })
    const frameMeta = UI_CATALOG.frame

    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center gap-1.5 flex-wrap pb-2">
          <span className="text-[11px] text-slate-400 mr-1">Schermi:</span>
          {frames.map((f) => (
            <button
              key={f.id}
              onClick={() => setCurrentId(f.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                f.id === current.id
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {f.data.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 overflow-auto grid place-items-center rounded-lg bg-slate-100 dark:bg-slate-950/40 p-4">
          <div
            className="relative shrink-0 rounded-2xl shadow-xl"
            style={{ width: fw, height: fh, background: 'var(--node-bg)' }}
          >
            <div className="absolute inset-0">
              <WireBlock data={current.data} accent={frameMeta.accent} />
            </div>
            {inside.map((el) => renderEl(el, fx, fy))}
          </div>
        </div>
      </div>
    )
  }

  // --- No frames: render everything on a board ---
  if (nodes.length === 0) {
    return (
      <div className="grid place-items-center h-full text-sm text-slate-400">
        Aggiungi elementi (e almeno uno <b className="mx-1">Schermo / Frame</b>) per
        l'anteprima interattiva.
      </div>
    )
  }
  const minX = Math.min(...nodes.map((n) => n.position.x)) - 20
  const minY = Math.min(...nodes.map((n) => n.position.y)) - 20
  const maxX = Math.max(...nodes.map((n) => n.position.x + dim(n).w)) + 20
  const maxY = Math.max(...nodes.map((n) => n.position.y + dim(n).h)) + 20

  return (
    <div className="flex-1 min-h-0 overflow-auto rounded-lg bg-slate-100 dark:bg-slate-950/40 p-4">
      <div className="relative mx-auto" style={{ width: maxX - minX, height: maxY - minY }}>
        {nodes.filter((el) => el.data.kind !== 'note').map((el) => renderEl(el, minX, minY))}
      </div>
    </div>
  )
}
