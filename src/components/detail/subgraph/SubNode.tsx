import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { SubNode as SubNodeType, HttpMethod } from '../../../types/diagram'
import { SUB_CATALOG } from '../../../lib/subCatalog'

const HANDLES: { id: string; position: Position }[] = [
  { id: 't', position: Position.Top },
  { id: 'r', position: Position.Right },
  { id: 'b', position: Position.Bottom },
  { id: 'l', position: Position.Left },
]

const METHOD_COLOR: Record<HttpMethod, string> = {
  GET: '#16a34a',
  POST: '#2563eb',
  PUT: '#d97706',
  PATCH: '#7c3aed',
  DELETE: '#dc2626',
}

export function SubNodeView({ data, selected }: NodeProps<SubNodeType>) {
  const meta = SUB_CATALOG[data.kind] ?? SUB_CATALOG.function
  const Icon = meta.icon
  const tint = `color-mix(in srgb, ${meta.accent} 14%, var(--node-bg))`

  return (
    <div className="relative" style={{ minWidth: 150, maxWidth: 240 }}>
      {HANDLES.map((h) => (
        <Handle key={h.id} id={h.id} type="source" position={h.position} style={{ background: meta.accent }} />
      ))}
      <div
        className="rounded-lg shadow-sm overflow-hidden"
        style={{
          background: 'var(--node-bg)',
          border: `1px solid ${selected ? meta.accent : 'var(--node-border)'}`,
          boxShadow: selected ? `0 0 0 2px ${meta.accent}33` : undefined,
        }}
      >
        <div className="flex items-center gap-2 px-2.5 py-1.5" style={{ background: tint }}>
          <span style={{ color: meta.accent }} className="shrink-0">
            <Icon size={16} />
          </span>
          {data.kind === 'endpoint' && data.method && (
            <span
              className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
              style={{ background: METHOD_COLOR[data.method] }}
            >
              {data.method}
            </span>
          )}
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--node-text)' }}>
            {data.label}
          </span>
        </div>
        {data.signature && (
          <div
            className="px-2.5 py-1 text-[11px] font-mono truncate"
            style={{ color: 'var(--node-text-muted)' }}
          >
            {data.signature}
          </div>
        )}
        {(data.visibility === 'private' || data.async) && (
          <div className="flex items-center gap-1.5 px-2.5 pb-1.5">
            {data.visibility === 'private' && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                private
              </span>
            )}
            {data.async && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: `${meta.accent}22`, color: meta.accent }}>
                async
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
