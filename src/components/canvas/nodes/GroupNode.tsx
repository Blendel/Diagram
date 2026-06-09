import { NodeResizer, type NodeProps } from '@xyflow/react'
import type { AppNode } from '../../../types/diagram'
import { GROUP_VARIANTS } from '../../../lib/groupCatalog'

/** A resizable, typed boundary container (region, VPC, cluster, namespace, pod…). */
export function GroupNode({ data, selected }: NodeProps<AppNode>) {
  const variant = GROUP_VARIANTS[data.groupType ?? 'generic'] ?? GROUP_VARIANTS.generic
  const accent = data.color || variant.accent
  const Icon = variant.icon

  return (
    <>
      <NodeResizer color={accent} isVisible={selected} minWidth={160} minHeight={120} />
      <div
        className="w-full h-full rounded-xl border-2 border-dashed"
        style={{
          borderColor: accent,
          background: `color-mix(in srgb, ${accent} 7%, transparent)`,
        }}
      >
        <div
          className="inline-flex items-center gap-1.5 m-2 px-2 py-1 rounded-md text-xs font-semibold shadow-sm"
          style={{ color: accent, background: 'var(--node-bg)' }}
        >
          <Icon size={14} />
          <span className="truncate max-w-[220px]">{data.label}</span>
          {data.groupType && data.groupType !== 'generic' && (
            <span className="opacity-60 font-normal">· {variant.label}</span>
          )}
        </div>
      </div>
    </>
  )
}
