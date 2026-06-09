import type { NodePositionChange } from '@xyflow/react'
import type { AppNode } from '../types/diagram'

export interface HelperLineResult {
  horizontal?: number
  vertical?: number
  snapPosition: { x?: number; y?: number }
}

/**
 * Computes alignment guides while dragging a node: when an edge or center of the
 * dragged node is within `distance` of another node's edge/center, returns the
 * guide line position and a snapped position. Only top-level nodes participate.
 */
export function getHelperLines(
  change: NodePositionChange,
  nodes: AppNode[],
  distance = 5,
): HelperLineResult {
  const result: HelperLineResult = { snapPosition: {} }
  const nodeA = nodes.find((n) => n.id === change.id)
  if (!nodeA || !change.position || nodeA.parentId) return result

  const aw = nodeA.measured?.width ?? 0
  const ah = nodeA.measured?.height ?? 0
  const a = {
    left: change.position.x,
    right: change.position.x + aw,
    top: change.position.y,
    bottom: change.position.y + ah,
    cx: change.position.x + aw / 2,
    cy: change.position.y + ah / 2,
  }

  let vDist = distance
  let hDist = distance

  for (const nodeB of nodes) {
    if (nodeB.id === nodeA.id || nodeB.parentId) continue
    const bw = nodeB.measured?.width ?? 0
    const bh = nodeB.measured?.height ?? 0
    const b = {
      left: nodeB.position.x,
      right: nodeB.position.x + bw,
      top: nodeB.position.y,
      bottom: nodeB.position.y + bh,
      cx: nodeB.position.x + bw / 2,
      cy: nodeB.position.y + bh / 2,
    }

    // Vertical guides (align on X): [distance, snapped left X, guide X]
    const vCandidates: [number, number, number][] = [
      [Math.abs(a.left - b.left), b.left, b.left],
      [Math.abs(a.right - b.right), b.right - aw, b.right],
      [Math.abs(a.left - b.right), b.right, b.right],
      [Math.abs(a.right - b.left), b.left - aw, b.left],
      [Math.abs(a.cx - b.cx), b.cx - aw / 2, b.cx],
    ]
    for (const [d, snapX, guideX] of vCandidates) {
      if (d < vDist) {
        result.snapPosition.x = snapX
        result.vertical = guideX
        vDist = d
      }
    }

    // Horizontal guides (align on Y): [distance, snapped top Y, guide Y]
    const hCandidates: [number, number, number][] = [
      [Math.abs(a.top - b.top), b.top, b.top],
      [Math.abs(a.bottom - b.bottom), b.bottom - ah, b.bottom],
      [Math.abs(a.top - b.bottom), b.bottom, b.bottom],
      [Math.abs(a.bottom - b.top), b.top - ah, b.top],
      [Math.abs(a.cy - b.cy), b.cy - ah / 2, b.cy],
    ]
    for (const [d, snapY, guideY] of hCandidates) {
      if (d < hDist) {
        result.snapPosition.y = snapY
        result.horizontal = guideY
        hDist = d
      }
    }
  }

  return result
}
