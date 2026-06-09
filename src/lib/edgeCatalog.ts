import { MarkerType } from '@xyflow/react'
import type { EdgeProtocol, EdgeSync } from '../types/diagram'

/** Shared arrowhead applied to every connection so React Flow renders the marker def. */
export const DEFAULT_MARKER = {
  type: MarkerType.ArrowClosed,
  color: '#64748b',
  width: 18,
  height: 18,
} as const

/** Red arrowhead used on broken / unavailable connections (direction stays visible). */
export const BROKEN_MARKER = {
  type: MarkerType.ArrowClosed,
  color: '#ef4444',
  width: 18,
  height: 18,
} as const

export interface ProtocolMeta {
  label: string
  color: string
}

export const PROTOCOL_META: Record<EdgeProtocol, ProtocolMeta> = {
  http: { label: 'HTTP / REST', color: '#2563eb' },
  grpc: { label: 'gRPC', color: '#0d9488' },
  event: { label: 'Evento / Messaggio', color: '#7c3aed' },
  db: { label: 'Query DB', color: '#d97706' },
  tcp: { label: 'TCP', color: '#475569' },
  other: { label: 'Altro', color: '#64748b' },
}

export const PROTOCOL_ORDER: EdgeProtocol[] = ['http', 'grpc', 'event', 'db', 'tcp', 'other']

export const SYNC_META: Record<EdgeSync, string> = {
  sync: 'Sincrono',
  async: 'Asincrono',
}
