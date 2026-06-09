import type { AppNode, ComponentChildren, Diagram, SubNodeKind } from '../types/diagram'
import { uid } from './uid'

const SUB_KIND_MAP: Record<string, SubNodeKind> = {
  endpoint: 'endpoint',
  module: 'module',
  function: 'function',
  job: 'function',
}

/** v1/v2 → v3: convert a legacy `data.functions` array into a sub-graph. */
function functionsToChildren(data: Record<string, unknown>): ComponentChildren {
  const fns = Array.isArray(data.functions) ? (data.functions as Array<Record<string, unknown>>) : []
  return {
    nodes: fns.map((f, i) => ({
      id: uid('sub'),
      type: 'sub',
      position: { x: 80, y: 60 + i * 90 },
      data: {
        kind: SUB_KIND_MAP[String(f.kind)] ?? 'function',
        label: String(f.name ?? 'elemento'),
        signature: '',
        description: typeof f.description === 'string' ? f.description : '',
      },
    })),
    edges: [],
  }
}

/** Normalizes nodes coming from an older schema version. Idempotent. */
export function migrateNodes(nodes: AppNode[]): AppNode[] {
  if (!Array.isArray(nodes)) return []
  return nodes.map((n) => {
    const data = { ...n.data } as Record<string, unknown>
    if (!data.children && Array.isArray(data.functions)) {
      data.children = functionsToChildren(data)
    }
    delete data.functions
    return { ...n, data: data as AppNode['data'] }
  })
}

export function migrateDiagram(diagram: Diagram): Diagram {
  return { ...diagram, nodes: migrateNodes(diagram.nodes ?? []) }
}
