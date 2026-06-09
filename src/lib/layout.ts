import Dagre from '@dagrejs/dagre'
import type { AppEdge, AppNode } from '../types/diagram'
import { dimOf } from './nodeDims'

export type LayoutDirection = 'LR' | 'TB'

/**
 * Computes auto-layout positions (dagre) for the top-level, non-group nodes.
 * Groups and nested children are left untouched.
 */
export function layoutPositions(
  nodes: AppNode[],
  edges: AppEdge[],
  direction: LayoutDirection,
): Map<string, { x: number; y: number }> {
  const g = new Dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 90, marginx: 24, marginy: 24 })

  const laid = nodes.filter((n) => !n.parentId && n.type !== 'group')
  const ids = new Set(laid.map((n) => n.id))
  for (const n of laid) {
    const { w, h } = dimOf(n)
    g.setNode(n.id, { width: w, height: h })
  }
  for (const e of edges) {
    if (ids.has(e.source) && ids.has(e.target)) g.setEdge(e.source, e.target)
  }

  Dagre.layout(g)

  const positions = new Map<string, { x: number; y: number }>()
  for (const n of laid) {
    const p = g.node(n.id)
    if (!p) continue
    const { w, h } = dimOf(n)
    positions.set(n.id, { x: p.x - w / 2, y: p.y - h / 2 })
  }
  return positions
}
