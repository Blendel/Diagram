import { NodeResizer, Handle, Position, type NodeProps } from '@xyflow/react'
import type { UiNode } from '../../../types/diagram'
import { UI_CATALOG } from '../../../lib/uiCatalog'
import { WireBlock } from './WireBlock'

const HANDLES: { id: string; position: Position }[] = [
  { id: 't', position: Position.Top },
  { id: 'r', position: Position.Right },
  { id: 'b', position: Position.Bottom },
  { id: 'l', position: Position.Left },
]

export function WireframeNode({ data, selected }: NodeProps<UiNode>) {
  const meta = UI_CATALOG[data.kind] ?? UI_CATALOG.text
  return (
    <>
      <NodeResizer color={meta.accent} isVisible={selected} minWidth={40} minHeight={16} />
      {/* Connection points for design flow arrows (revealed on hover). */}
      {HANDLES.map((h) => (
        <Handle
          key={h.id}
          id={h.id}
          type="source"
          position={h.position}
          className="wf-handle"
          style={{ background: '#3b82f6' }}
        />
      ))}
      <WireBlock data={data} accent={meta.accent} />
    </>
  )
}
