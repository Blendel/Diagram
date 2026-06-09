import { Image as ImageIcon } from 'lucide-react'
import type { UiNodeData } from '../../../types/diagram'

const line = 'rounded bg-slate-300/70 dark:bg-slate-600'
const widths = ['w-full', 'w-11/12', 'w-3/4', 'w-5/6', 'w-2/3', 'w-10/12', 'w-4/6', 'w-9/12']
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export interface WireState {
  value?: string
  checked?: boolean
  on?: boolean
  tab?: number
}

export interface WireBlockProps {
  data: UiNodeData
  accent: string
  interactive?: boolean
  linked?: boolean
  state?: WireState
  onValue?: (v: string) => void
  onToggleChecked?: () => void
  onToggleOn?: () => void
  onTab?: (i: number) => void
  onActivate?: () => void
}

/** Renders one wireframe element from its characteristics, static (design) or live (preview). */
export function WireBlock({
  data,
  accent: accentProp,
  interactive = false,
  linked = false,
  state = {},
  onValue,
  onToggleChecked,
  onToggleOn,
  onTab,
  onActivate,
}: WireBlockProps) {
  const { kind, label } = data
  const accent = data.color || accentProp

  switch (kind) {
    case 'frame':
      return (
        <div
          className="w-full h-full rounded-2xl border-2 overflow-hidden bg-white/50 dark:bg-slate-800/40 flex flex-col"
          style={{ borderColor: accent }}
        >
          <div
            className="flex items-center gap-1.5 px-3 h-7 shrink-0 border-b"
            style={{ borderColor: accent, background: `color-mix(in srgb, ${accent} 10%, var(--node-bg))` }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="ml-2 text-[11px] font-semibold truncate" style={{ color: 'var(--node-text-muted)' }}>
              {label}
            </span>
          </div>
        </div>
      )
    case 'navbar': {
      const items = clamp(data.count ?? 3, 0, 6)
      return (
        <div
          className="w-full h-full rounded-md flex items-center gap-2 px-3"
          style={{ background: `color-mix(in srgb, ${accent} 16%, var(--node-bg))` }}
        >
          <span className="w-5 h-5 rounded" style={{ background: accent }} />
          <span className="text-xs font-semibold truncate" style={{ color: 'var(--node-text)' }}>
            {label}
          </span>
          <span className="ml-auto flex gap-1.5">
            {Array.from({ length: items }).map((_, i) => (
              <span key={i} className={`w-6 h-2 ${line}`} />
            ))}
          </span>
        </div>
      )
    }
    case 'heading': {
      const size = data.size ?? 'lg'
      const cls = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-sm'
      return (
        <div className="w-full h-full flex items-center">
          <span className={`${cls} font-bold truncate`} style={{ color: 'var(--node-text)' }}>
            {label}
          </span>
        </div>
      )
    }
    case 'text': {
      const lines = clamp(data.lines ?? 3, 1, 8)
      return (
        <div className="w-full h-full flex flex-col justify-center gap-1.5 px-0.5">
          {Array.from({ length: lines }).map((_, i) => (
            <span key={i} className={`h-2 ${line} ${widths[i % widths.length]}`} />
          ))}
        </div>
      )
    }
    case 'button': {
      const variant = data.variant ?? 'solid'
      const style =
        variant === 'solid'
          ? { background: accent, color: '#fff', border: 'none' }
          : variant === 'soft'
            ? { background: `color-mix(in srgb, ${accent} 18%, var(--node-bg))`, color: accent, border: 'none' }
            : { background: 'transparent', color: accent, border: `1.5px solid ${accent}` }
      const cls =
        'w-full h-full rounded-lg grid place-items-center text-sm font-semibold px-2 ' +
        (interactive ? 'transition hover:brightness-110 active:brightness-95 cursor-pointer' : '')
      const content = (
        <span className="truncate flex items-center gap-1">
          {label}
          {linked && <span aria-hidden>›</span>}
        </span>
      )
      return interactive ? (
        <button onClick={onActivate} className={cls} style={style}>
          {content}
        </button>
      ) : (
        <div className={cls} style={style}>
          {content}
        </div>
      )
    }
    case 'input':
      return interactive ? (
        <input
          type={data.inputType ?? 'text'}
          value={state.value ?? ''}
          placeholder={label}
          onChange={(e) => onValue?.(e.target.value)}
          className="w-full h-full rounded-md border bg-white dark:bg-slate-800 px-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2"
          style={{ borderColor: accent }}
        />
      ) : (
        <div
          className="w-full h-full rounded-md border bg-white dark:bg-slate-800 flex items-center px-2.5 text-xs"
          style={{ borderColor: accent, color: 'var(--node-text-muted)' }}
        >
          <span className="truncate">{label}</span>
        </div>
      )
    case 'image':
      return (
        <div
          className="w-full h-full rounded-md border grid place-items-center text-slate-400"
          style={{ borderColor: accent, background: 'color-mix(in srgb, currentColor 6%, var(--node-bg))' }}
        >
          <div className="flex flex-col items-center gap-1">
            <ImageIcon size={22} style={{ color: accent }} />
            <span className="text-[10px] truncate max-w-[90%]">{label}</span>
          </div>
        </div>
      )
    case 'card': {
      const lines = clamp(data.lines ?? 3, 0, 8)
      return (
        <div
          className="w-full h-full rounded-lg border bg-white dark:bg-slate-800 overflow-hidden flex flex-col"
          style={{ borderColor: 'var(--node-border)' }}
        >
          {data.withImage && (
            <div className="h-12 grid place-items-center text-slate-300 dark:text-slate-600 border-b border-slate-100 dark:border-slate-700">
              <ImageIcon size={18} />
            </div>
          )}
          <div
            className="px-2.5 py-1.5 text-xs font-semibold"
            style={{ background: `color-mix(in srgb, ${accent} 14%, var(--node-bg))`, color: 'var(--node-text)' }}
          >
            {label}
          </div>
          <div className="flex-1 flex flex-col gap-1.5 p-2.5">
            {Array.from({ length: lines }).map((_, i) => (
              <span key={i} className={`h-2 ${line} ${widths[i % widths.length]}`} />
            ))}
          </div>
        </div>
      )
    }
    case 'list': {
      const rows = clamp(data.count ?? 3, 1, 8)
      const withAvatar = data.withAvatar ?? true
      return (
        <div
          className="w-full h-full rounded-lg border bg-white dark:bg-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700"
          style={{ borderColor: 'var(--node-border)' }}
        >
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-2.5 py-2 ${interactive ? 'hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer' : ''}`}
            >
              {withAvatar && (
                <span className="w-5 h-5 rounded-full shrink-0" style={{ background: `${accent}55` }} />
              )}
              <span className={`h-2 flex-1 ${line}`} />
            </div>
          ))}
        </div>
      )
    }
    case 'divider':
      return (
        <div className="w-full h-full flex items-center">
          <span className="w-full h-0.5 rounded" style={{ background: accent }} />
        </div>
      )
    case 'avatar':
      return (
        <div
          className="w-full h-full rounded-full grid place-items-center"
          style={{ background: `color-mix(in srgb, ${accent} 20%, var(--node-bg))`, color: accent }}
        >
          <span className="text-xs font-bold">{(label || 'A').slice(0, 2).toUpperCase()}</span>
        </div>
      )
    case 'badge': {
      const soft = data.variant === 'soft'
      return (
        <div
          className="w-full h-full rounded-full grid place-items-center text-[11px] font-semibold px-2"
          style={
            soft
              ? { background: `color-mix(in srgb, ${accent} 18%, var(--node-bg))`, color: accent }
              : { background: accent, color: '#fff' }
          }
        >
          <span className="truncate">{label}</span>
        </div>
      )
    }
    case 'tabs': {
      const total = clamp(data.count ?? 3, 2, 5)
      const active = (interactive ? state.tab : undefined) ?? data.tab ?? 0
      return (
        <div className="w-full h-full flex items-end gap-1">
          {Array.from({ length: total }).map((_, i) => {
            const on = i === active
            return (
              <button
                key={i}
                disabled={!interactive}
                onClick={() => onTab?.(i)}
                className={`flex-1 h-full grid place-items-center text-[11px] truncate rounded-t-md border-b-2 ${interactive ? 'cursor-pointer' : ''}`}
                style={
                  on
                    ? { color: accent, borderColor: accent, fontWeight: 600 }
                    : { color: 'var(--node-text-muted)', borderColor: 'transparent' }
                }
              >
                {i === 0 ? label : `Tab ${i + 1}`}
              </button>
            )
          })}
        </div>
      )
    }
    case 'checkbox': {
      const checked = interactive ? (state.checked ?? data.checked ?? false) : (data.checked ?? false)
      return (
        <button
          disabled={!interactive}
          onClick={onToggleChecked}
          className={`w-full h-full flex items-center gap-2 ${interactive ? 'cursor-pointer' : ''}`}
        >
          <span
            className="w-4 h-4 rounded grid place-items-center text-white text-[10px] shrink-0 border"
            style={{ background: checked ? accent : 'transparent', borderColor: accent }}
          >
            {checked ? '✓' : ''}
          </span>
          <span className="text-xs truncate" style={{ color: 'var(--node-text)' }}>
            {label}
          </span>
        </button>
      )
    }
    case 'toggle': {
      const on = interactive ? (state.on ?? data.on ?? false) : (data.on ?? false)
      return (
        <button
          disabled={!interactive}
          onClick={onToggleOn}
          className={`w-full h-full flex items-center gap-2 ${interactive ? 'cursor-pointer' : ''}`}
        >
          <span
            className="relative w-9 h-5 rounded-full shrink-0 transition-colors"
            style={{ background: on ? accent : '#cbd5e1' }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
              style={{ left: on ? 18 : 2 }}
            />
          </span>
          <span className="text-xs truncate" style={{ color: 'var(--node-text-muted)' }}>
            {label}
          </span>
        </button>
      )
    }
    case 'sidebar': {
      const items = clamp(data.count ?? 5, 1, 10)
      return (
        <div
          className="w-full h-full rounded-lg p-2 flex flex-col gap-1.5 overflow-hidden"
          style={{ background: `color-mix(in srgb, ${accent} 12%, var(--node-bg))` }}
        >
          <div className="text-xs font-semibold truncate mb-1" style={{ color: 'var(--node-text)' }}>
            {label}
          </div>
          {Array.from({ length: items }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-2 py-1 rounded"
              style={i === 0 ? { background: `color-mix(in srgb, ${accent} 22%, var(--node-bg))` } : undefined}
            >
              <span className="w-3.5 h-3.5 rounded" style={{ background: `${accent}88` }} />
              <span className={`h-2 flex-1 ${line}`} />
            </div>
          ))}
        </div>
      )
    }
    case 'footer':
      return (
        <div
          className="w-full h-full rounded-md flex items-center gap-3 px-3"
          style={{ background: `color-mix(in srgb, ${accent} 14%, var(--node-bg))`, color: 'var(--node-text-muted)' }}
        >
          <span className="text-[11px] truncate">{label}</span>
          <span className="ml-auto flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`w-8 h-2 ${line}`} />
            ))}
          </span>
        </div>
      )
    case 'textarea':
      return interactive ? (
        <textarea
          value={state.value ?? ''}
          placeholder={label}
          onChange={(e) => onValue?.(e.target.value)}
          className="w-full h-full rounded-md border bg-white dark:bg-slate-800 p-2 text-xs text-slate-700 dark:text-slate-200 resize-none focus:outline-none focus:ring-2"
          style={{ borderColor: accent }}
        />
      ) : (
        <div
          className="w-full h-full rounded-md border bg-white dark:bg-slate-800 p-2 flex flex-col gap-1.5"
          style={{ borderColor: accent }}
        >
          <span className="text-[11px]" style={{ color: 'var(--node-text-muted)' }}>{label}</span>
          <span className={`h-2 w-5/6 ${line}`} />
          <span className={`h-2 w-2/3 ${line}`} />
        </div>
      )
    case 'select':
      return (
        <div
          className="w-full h-full rounded-md border bg-white dark:bg-slate-800 flex items-center px-2.5 text-xs"
          style={{ borderColor: accent, color: 'var(--node-text-muted)' }}
        >
          <span className="truncate">{label}</span>
          <span className="ml-auto" style={{ color: accent }}>▾</span>
        </div>
      )
    case 'radio': {
      const opts = clamp(data.count ?? 3, 1, 8)
      const sel = (interactive ? state.tab : undefined) ?? data.tab ?? 0
      return (
        <div className="w-full h-full flex flex-col justify-center gap-2 px-1">
          {Array.from({ length: opts }).map((_, i) => (
            <button
              key={i}
              disabled={!interactive}
              onClick={() => onTab?.(i)}
              className={`flex items-center gap-2 text-left ${interactive ? 'cursor-pointer' : ''}`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full border grid place-items-center shrink-0"
                style={{ borderColor: accent }}
              >
                {i === sel && <span className="w-2 h-2 rounded-full" style={{ background: accent }} />}
              </span>
              <span className={`h-2 ${i === sel ? 'w-2/3' : 'w-1/2'} ${line}`} />
            </button>
          ))}
        </div>
      )
    }
    case 'slider': {
      const pct = interactive
        ? Number(state.value ?? data.percent ?? 50)
        : (data.percent ?? 50)
      return interactive ? (
        <div className="w-full h-full flex items-center">
          <input
            type="range"
            min={0}
            max={100}
            value={Number.isFinite(pct) ? pct : 50}
            onChange={(e) => onValue?.(e.target.value)}
            className="w-full cursor-pointer"
            style={{ accentColor: accent }}
          />
        </div>
      ) : (
        <div className="w-full h-full flex items-center">
          <span className="relative w-full h-1.5 rounded-full" style={{ background: `${accent}33` }}>
            <span className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
            <span
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border"
              style={{ left: `calc(${pct}% - 6px)`, borderColor: accent }}
            />
          </span>
        </div>
      )
    }
    case 'table': {
      const rows = clamp(data.count ?? 3, 1, 8)
      const cols = clamp(data.cols ?? 3, 1, 6)
      return (
        <div
          className="w-full h-full rounded-lg border bg-white dark:bg-slate-800 overflow-hidden flex flex-col"
          style={{ borderColor: 'var(--node-border)' }}
        >
          <div className="flex" style={{ background: `color-mix(in srgb, ${accent} 14%, var(--node-bg))` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="flex-1 px-2 py-1.5 border-r border-slate-100 dark:border-slate-700 last:border-r-0">
                <span className={`block h-2 w-3/4 ${line}`} />
              </div>
            ))}
          </div>
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex border-t border-slate-100 dark:border-slate-700">
              {Array.from({ length: cols }).map((_, c) => (
                <div key={c} className="flex-1 px-2 py-1.5 border-r border-slate-100 dark:border-slate-700 last:border-r-0">
                  <span className={`block h-2 w-2/3 ${line}`} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )
    }
    case 'chart': {
      const bars = [55, 80, 40, 95, 65]
      return (
        <div
          className="w-full h-full rounded-lg border bg-white dark:bg-slate-800 p-3 flex items-end gap-2"
          style={{ borderColor: 'var(--node-border)' }}
        >
          {bars.map((h, i) => (
            <span key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `${accent}cc` }} />
          ))}
        </div>
      )
    }
    case 'progress': {
      const pct = clamp(data.percent ?? 60, 0, 100)
      return (
        <div className="w-full h-full flex items-center">
          <span className="relative w-full h-2.5 rounded-full overflow-hidden" style={{ background: `${accent}26` }}>
            <span className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
          </span>
        </div>
      )
    }
    case 'breadcrumb': {
      const items = clamp(data.count ?? 3, 1, 6)
      return (
        <div className="w-full h-full flex items-center gap-1.5 text-xs" style={{ color: 'var(--node-text-muted)' }}>
          {Array.from({ length: items }).map((_, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span style={{ color: accent }}>/</span>}
              <span
                className={i === items - 1 ? 'font-semibold' : ''}
                style={{ color: i === items - 1 ? 'var(--node-text)' : undefined }}
              >
                {i === 0 ? label : `Liv. ${i + 1}`}
              </span>
            </span>
          ))}
        </div>
      )
    }
    case 'pagination': {
      const pages = clamp(data.count ?? 5, 1, 9)
      return (
        <div className="w-full h-full flex items-center justify-center gap-1">
          {Array.from({ length: pages }).map((_, i) => (
            <span
              key={i}
              className="grid place-items-center w-6 h-6 rounded text-[11px] border"
              style={
                i === 0
                  ? { background: accent, color: '#fff', borderColor: accent }
                  : { color: 'var(--node-text-muted)', borderColor: 'var(--node-border)' }
              }
            >
              {i + 1}
            </span>
          ))}
        </div>
      )
    }
    case 'icon':
      return (
        <div className="w-full h-full grid place-items-center">
          <span className="block w-3/4 h-3/4 rounded-lg" style={{ background: accent }} />
        </div>
      )
    case 'container':
      return (
        <div
          className="w-full h-full rounded-lg border-2 border-dashed"
          style={{ borderColor: accent }}
        >
          <span
            className="inline-block m-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{ color: accent, background: `${accent}1a` }}
          >
            {label}
          </span>
        </div>
      )
    case 'modal':
      return (
        <div
          className="w-full h-full rounded-lg border bg-white dark:bg-slate-800 shadow-lg overflow-hidden flex flex-col"
          style={{ borderColor: 'var(--node-border)' }}
        >
          <div
            className="px-3 py-2 text-xs font-semibold border-b border-slate-100 dark:border-slate-700 flex items-center"
            style={{ color: 'var(--node-text)' }}
          >
            {label}
            <span className="ml-auto" style={{ color: 'var(--node-text-muted)' }}>✕</span>
          </div>
          <div className="flex-1 p-3 flex flex-col gap-1.5">
            <span className={`h-2 w-full ${line}`} />
            <span className={`h-2 w-4/5 ${line}`} />
          </div>
          <div className="flex justify-end gap-2 p-2 border-t border-slate-100 dark:border-slate-700">
            <span className="px-3 py-1 rounded text-[11px]" style={{ background: `${accent}1f`, color: accent }}>Annulla</span>
            <span className="px-3 py-1 rounded text-[11px] text-white" style={{ background: accent }}>OK</span>
          </div>
        </div>
      )
    default:
      return <div className="w-full h-full" />
  }
}
