import type { NodeStatus } from '../types/diagram'

/** Derives a node's operational status from its load metric (0-100). */
export function deriveStatus(load = 0): NodeStatus {
  if (load >= 95) return 'down'
  if (load >= 75) return 'degraded'
  return 'healthy'
}
