import { NodeResizer, type NodeProps } from '@xyflow/react'
import { Box } from 'lucide-react'
import type { AppNode } from '../../../types/diagram'
import { NODE_CATALOG } from '../../../lib/nodeCatalog'

/** A resizable boundary container (cluster, VPC, domain). Rendered behind components. */
export function GroupNode({ data, selected }: NodeProps<AppNode>) {
  const meta = NODE_CATALOG.group

  return (
    <>
      <NodeResizer
        color={meta.accent}
        isVisible={selected}
        minWidth={160}
        minHeight={120}
      />
      <div
        className="w-full h-full rounded-xl border-2 border-dashed"
        style={{ borderColor: meta.accent, background: meta.soft }}
      >
        <div
          className="inline-flex items-center gap-1.5 m-2 px-2 py-1 rounded-md text-xs font-semibold shadow-sm"
          style={{ color: meta.accent, background: 'var(--node-bg)' }}
        >
          <Box size={14} />
          <span className="truncate max-w-[200px]">{data.label}</span>
        </div>
      </div>
    </>
  )
}
