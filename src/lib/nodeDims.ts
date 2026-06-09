import type { AppNode } from '../types/diagram'

/** Approximate node dimensions, preferring React Flow's measured size. */
export function dimOf(n: AppNode): { w: number; h: number } {
  const w = n.measured?.width ?? (typeof n.width === 'number' ? n.width : undefined)
  const h = n.measured?.height ?? (typeof n.height === 'number' ? n.height : undefined)
  const sw = typeof n.style?.width === 'number' ? n.style.width : undefined
  const sh = typeof n.style?.height === 'number' ? n.style.height : undefined
  if (n.type === 'group') {
    return { w: w ?? sw ?? 360, h: h ?? sh ?? 240 }
  }
  return { w: w ?? sw ?? 190, h: h ?? sh ?? 90 }
}
