import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react'
import type { AppEdge, EdgeAnimation } from '../../../types/diagram'
import { PROTOCOL_META } from '../../../lib/edgeCatalog'

export function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<AppEdge>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12,
  })

  const proto = PROTOCOL_META[data?.protocol ?? 'http']
  const broken = !!data?.broken
  const srcLoad = Math.max(0, Math.min(100, data?.srcLoad ?? 0))

  // A broken (cascaded failure) link is never animated, but keeps its arrow.
  const animation: EdgeAnimation = broken
    ? 'none'
    : data?.animation ?? (data?.sync === 'async' ? 'flow' : 'none')

  const dotDur = Math.max(0.22, 1.3 - (srcLoad / 100) * 1.05)
  const dashDur = Math.max(0.18, 0.9 - (srcLoad / 100) * 0.72)

  const stroke = broken ? '#ef4444' : selected ? '#2563eb' : proto.color
  const strokeWidth = broken ? 2 : selected ? 2.5 : 1.8

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth,
          opacity: broken ? 0.9 : 1,
          ...(broken ? { strokeDasharray: '5 5' } : {}),
          ...(animation === 'flow'
            ? { strokeDasharray: '6 4', animation: `dashdraw ${dashDur}s linear infinite` }
            : {}),
        }}
      />

      {animation === 'pulse' && (
        <circle r={4} fill={stroke}>
          <animateMotion dur={`${dotDur}s`} repeatCount="indefinite" path={path} />
        </circle>
      )}

      {animation === 'pubsub' &&
        [0, 1, 2].map((i) => (
          <circle key={i} r={3.5} fill={stroke} opacity={0.9}>
            <animateMotion
              dur={`${dotDur * 1.4}s`}
              begin={`${(i * dotDur * 1.4) / 3}s`}
              repeatCount="indefinite"
              path={path}
            />
          </circle>
        ))}

      {broken && (
        <EdgeLabelRenderer>
          <div
            className="absolute grid place-items-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold shadow pointer-events-none"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
            title="Connessione interrotta"
          >
            ✕
          </div>
        </EdgeLabelRenderer>
      )}

      {!broken && data?.label && (
        <EdgeLabelRenderer>
          <div
            className="absolute px-1.5 py-0.5 rounded text-[11px] font-medium shadow-sm pointer-events-none"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: 'var(--node-bg)',
              color: 'var(--node-text-muted)',
              border: '1px solid var(--node-border)',
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
