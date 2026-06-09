import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { ReactNode } from 'react'
import type { AppNode } from '../../../types/diagram'
import { NODE_CATALOG, STATUS_META } from '../../../lib/nodeCatalog'
import { getShape } from '../../../lib/shapes'
import { cssVars } from '../../../lib/ui'

const HANDLES: { id: string; position: Position }[] = [
  { id: 't', position: Position.Top },
  { id: 'r', position: Position.Right },
  { id: 'b', position: Position.Bottom },
  { id: 'l', position: Position.Left },
]

export function ComponentNode({ data, selected }: NodeProps<AppNode>) {
  const meta = NODE_CATALOG[data.kind] ?? NODE_CATALOG.service
  const Icon = meta.icon
  const status = STATUS_META[data.status] ?? STATUS_META.unknown
  const accent = data.color || meta.accent
  const shape = getShape(data.shape ?? meta.defaultShape)
  const subtitle = data.technology || meta.label
  const load = Math.max(0, Math.min(100, data.load ?? 0))

  const failing = data.status === 'down' || data.status === 'degraded'
  const impacted = !!data.impacted && !failing
  const showPulse = failing || impacted
  const pulseColor = failing ? status.color : '#f59e0b'
  const pulseVar = cssVars({ '--pulse': `${pulseColor}66` })
  const border = selected ? accent : impacted ? '#f59e0b' : 'var(--node-border)'
  const tint = `color-mix(in srgb, ${accent} 14%, var(--node-bg))`
  // External / third-party systems get a dashed outline to signal "no access".
  const borderStyle = data.kind === 'external' ? 'dashed' : 'solid'

  const handles = HANDLES.map((h) => (
    <Handle key={h.id} id={h.id} type="source" position={h.position} style={{ background: accent }} />
  ))

  const headerRow = (
    <div className="flex items-center gap-2 px-3 py-2" style={{ background: tint }}>
      <span style={{ color: accent }} className="shrink-0">
        <Icon size={18} />
      </span>
      <span className="font-semibold text-sm truncate" style={{ color: 'var(--node-text)' }}>
        {data.label}
      </span>
      <span
        title={impacted ? 'Impatto a cascata' : `Stato: ${status.label}`}
        className="ml-auto shrink-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-800"
        style={{ background: impacted ? '#f59e0b' : status.color }}
      />
    </div>
  )

  const detailRows = (
    <>
      <div
        className="px-3 py-1.5 text-xs flex items-center gap-1.5 truncate"
        style={{ color: 'var(--node-text-muted)' }}
      >
        <span className="truncate">{subtitle}</span>
        {data.port && (
          <span className="ml-auto shrink-0 font-mono text-[11px] opacity-80">:{data.port}</span>
        )}
      </div>
      {load > 0 && (
        <div className="px-3 pb-2 pt-0.5">
          <MetricBar value={load} color={status.color} />
        </div>
      )}
    </>
  )

  // --- Compact silhouette shapes (circle / hexagon / diamond) ---
  if (shape.variant === 'compact') {
    return (
      <div className="relative grid place-items-center" style={{ width: 150, height: 150 }}>
        {handles}
        <div
          className={showPulse && !selected ? 'node-pulse' : undefined}
          style={{
            width: '100%',
            height: '100%',
            clipPath: shape.clipPath,
            borderRadius: shape.borderRadius,
            background: `color-mix(in srgb, ${accent} 22%, var(--node-bg))`,
            filter: selected
              ? `drop-shadow(0 0 4px ${accent})`
              : impacted
                ? 'drop-shadow(0 0 4px #f59e0b)'
                : undefined,
            ...pulseVar,
          }}
        >
          <div className="grid place-items-center text-center h-full px-6 gap-1">
            <span style={{ color: accent }}>
              <Icon size={22} />
            </span>
            <span
              className="text-xs font-semibold truncate max-w-[110px]"
              style={{ color: 'var(--node-text)' }}
            >
              {data.label}
            </span>
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: impacted ? '#f59e0b' : status.color }}
            />
          </div>
        </div>
      </div>
    )
  }

  // --- Cylinder (database) ---
  if (shape.variant === 'cylinder') {
    return (
      <Wrapper>
        {handles}
        <div
          className={showPulse && !selected ? 'node-pulse' : undefined}
          style={{ position: 'relative', ...pulseVar }}
        >
          <div
            style={{
              height: 14,
              borderRadius: '50%',
              background: tint,
              border: `1px solid ${border}`,
              borderBottom: 'none',
            }}
          />
          <div
            style={{
              background: 'var(--node-bg)',
              borderLeft: `1px solid ${border}`,
              borderRight: `1px solid ${border}`,
              marginTop: -1,
            }}
          >
            {headerRow}
            {detailRows}
          </div>
          <div
            style={{
              height: 14,
              borderRadius: '50%',
              background: 'var(--node-bg)',
              border: `1px solid ${border}`,
              borderTop: 'none',
              marginTop: -1,
            }}
          />
        </div>
      </Wrapper>
    )
  }

  // --- Card shapes (rounded / rectangle / pill) ---
  return (
    <Wrapper>
      {handles}
      <div
        className={`shadow-sm overflow-hidden ${showPulse && !selected ? 'node-pulse' : ''}`}
        style={{
          background: 'var(--node-bg)',
          border: `1px ${borderStyle} ${border}`,
          borderRadius: shape.borderRadius,
          boxShadow: selected ? `0 0 0 2px ${accent}33` : undefined,
          outline: impacted && !selected ? '2px dashed #f59e0b' : undefined,
          outlineOffset: 2,
          ...pulseVar,
        }}
      >
        {headerRow}
        {detailRows}
      </div>
    </Wrapper>
  )
}

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <div className="relative" style={{ minWidth: 184, maxWidth: 260 }}>
      {children}
    </div>
  )
}

function MetricBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="text-[9px] uppercase tracking-wide w-9 shrink-0"
        style={{ color: 'var(--node-text-muted)' }}
      >
        Load
      </span>
      <span
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'color-mix(in srgb, currentColor 12%, transparent)' }}
      >
        <span
          className="block h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </span>
      <span
        className="text-[9px] font-mono w-6 text-right shrink-0"
        style={{ color: 'var(--node-text-muted)' }}
      >
        {value}
      </span>
    </div>
  )
}
