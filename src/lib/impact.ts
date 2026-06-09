import type { AppEdge, AppNode } from '../types/diagram'

export interface ImpactResult {
  /** Edge ids that are "broken" (source is failing or downstream-impacted). */
  broken: Set<string>
  /** Node ids downstream of a failure that are collaterally impacted. */
  impacted: Set<string>
}

/**
 * Propagates failures downstream: any node that is `down`/`degraded` breaks its
 * outgoing connections; the targets become "impacted" and break their own
 * outgoing connections in turn — cascading through the graph.
 */
export function computeImpact(nodes: AppNode[], edges: AppEdge[]): ImpactResult {
  const broken = new Set<string>()
  const impacted = new Set<string>()

  const failing = nodes.filter(
    (n) => n.data.status === 'down' || n.data.status === 'degraded',
  )
  const outgoing = new Map<string, AppEdge[]>()
  for (const e of edges) {
    const list = outgoing.get(e.source)
    if (list) list.push(e)
    else outgoing.set(e.source, [e])
  }

  const failingIds = new Set(failing.map((n) => n.id))
  const queue: string[] = [...failingIds]

  while (queue.length) {
    const id = queue.shift()!
    for (const e of outgoing.get(id) ?? []) {
      broken.add(e.id)
      if (!failingIds.has(e.target) && !impacted.has(e.target)) {
        impacted.add(e.target)
        queue.push(e.target)
      }
    }
  }

  return { broken, impacted }
}
