import { useEffect, useRef } from 'react'
import { useStore } from '@xyflow/react'

/** Draws blue alignment guide lines over the canvas while dragging. */
export function HelperLines({ horizontal, vertical }: { horizontal?: number; vertical?: number }) {
  const width = useStore((s) => s.width)
  const height = useStore((s) => s.height)
  const tx = useStore((s) => s.transform[0])
  const ty = useStore((s) => s.transform[1])
  const zoom = useStore((s) => s.transform[2])
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 1

    if (typeof vertical === 'number') {
      const x = vertical * zoom + tx
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    if (typeof horizontal === 'number') {
      const y = horizontal * zoom + ty
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }, [width, height, tx, ty, zoom, horizontal, vertical])

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 pointer-events-none"
      style={{ width, height, zIndex: 10 }}
    />
  )
}
