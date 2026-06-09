import { toPng, toSvg } from 'html-to-image'
import { getNodesBounds, getViewportForBounds, type Node } from '@xyflow/react'

/**
 * Exports the current diagram as a PNG or SVG by rendering the React Flow
 * viewport fitted to the bounding box of all nodes.
 */
export async function exportImage(
  format: 'png' | 'svg',
  nodes: Node[],
  dark: boolean,
  name = 'diagramma',
): Promise<void> {
  if (nodes.length === 0) return
  const bounds = getNodesBounds(nodes)
  const w = Math.max(200, Math.ceil(bounds.width) + 96)
  const h = Math.max(200, Math.ceil(bounds.height) + 96)
  const vp = getViewportForBounds(bounds, w, h, 0.2, 2, 0.06)

  const el = document.querySelector('.react-flow__viewport') as HTMLElement | null
  if (!el) return

  const options = {
    backgroundColor: dark ? '#0b1220' : '#ffffff',
    width: w,
    height: h,
    style: {
      width: `${w}px`,
      height: `${h}px`,
      transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`,
    },
  }

  const dataUrl = format === 'png' ? await toPng(el, options) : await toSvg(el, options)
  const safe = (name || 'diagramma').replace(/[^\w.-]+/g, '_')
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${safe}.${format}`
  document.body.appendChild(a)
  a.click()
  a.remove()
}
