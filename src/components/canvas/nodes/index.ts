import type { NodeTypes } from '@xyflow/react'
import { ComponentNode } from './ComponentNode'
import { GroupNode } from './GroupNode'

export const nodeTypes: NodeTypes = {
  component: ComponentNode,
  group: GroupNode,
}
