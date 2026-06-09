import { NodeResizer, type NodeProps } from '@xyflow/react'
import type { UiNode } from '../../../types/diagram'
import { UI_CATALOG } from '../../../lib/uiCatalog'
import { WireBlock } from './WireBlock'

export function WireframeNode({ data, selected }: NodeProps<UiNode>) {
  const meta = UI_CATALOG[data.kind] ?? UI_CATALOG.text
  return (
    <>
      <NodeResizer color={meta.accent} isVisible={selected} minWidth={40} minHeight={16} />
      <WireBlock data={data} accent={meta.accent} />
    </>
  )
}
