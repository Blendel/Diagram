import type { ComponentType } from 'react'
import { Boxes, Database, Inbox, Network, Monitor, Zap, Box, Cloud } from 'lucide-react'
import type { NodeKind, NodeShape, NodeStatus } from '../types/diagram'

/** Minimal prop surface shared by all lucide icons we use. */
export type IconComponent = ComponentType<{
  size?: number | string
  className?: string
  strokeWidth?: number
  color?: string
}>

export interface NodeKindMeta {
  kind: NodeKind
  /** Default label applied when a fresh node is dropped, and palette caption. */
  label: string
  icon: IconComponent
  /** Primary color: icon + border. */
  accent: string
  /** Soft tint used as node background. */
  soft: string
  description: string
  /** Distinct default geometric shape for this kind. */
  defaultShape: NodeShape
}

export const NODE_CATALOG: Record<NodeKind, NodeKindMeta> = {
  service: {
    kind: 'service',
    label: 'Servizio',
    icon: Boxes,
    accent: '#2563eb',
    soft: '#eff6ff',
    description: 'Microservizio o applicazione',
    defaultShape: 'rounded',
  },
  database: {
    kind: 'database',
    label: 'Database',
    icon: Database,
    accent: '#d97706',
    soft: '#fffbeb',
    description: 'Archivio dati persistente',
    defaultShape: 'cylinder',
  },
  queue: {
    kind: 'queue',
    label: 'Coda / Broker',
    icon: Inbox,
    accent: '#7c3aed',
    soft: '#f5f3ff',
    description: 'Message broker / event bus',
    defaultShape: 'pill',
  },
  gateway: {
    kind: 'gateway',
    label: 'API Gateway',
    icon: Network,
    accent: '#0d9488',
    soft: '#f0fdfa',
    description: 'Gateway / reverse proxy / LB',
    defaultShape: 'hexagon',
  },
  client: {
    kind: 'client',
    label: 'Client',
    icon: Monitor,
    accent: '#475569',
    soft: '#f8fafc',
    description: 'Web / mobile / consumer esterno',
    defaultShape: 'circle',
  },
  cache: {
    kind: 'cache',
    label: 'Cache',
    icon: Zap,
    accent: '#e11d48',
    soft: '#fff1f2',
    description: 'Cache in memoria (Redis…)',
    defaultShape: 'diamond',
  },
  external: {
    kind: 'external',
    label: 'Sistema esterno',
    icon: Cloud,
    accent: '#64748b',
    soft: '#f8fafc',
    description: 'Terza parte / no accesso o dettagli',
    defaultShape: 'rounded',
  },
  group: {
    kind: 'group',
    label: 'Gruppo / Boundary',
    icon: Box,
    accent: '#64748b',
    soft: 'rgba(100, 116, 139, 0.06)',
    description: 'Container: cluster, VPC, dominio',
    defaultShape: 'rounded',
  },
}

/** Catalog entries shown in the palette (everything except the implicit group flow). */
export const PALETTE_ORDER: NodeKind[] = [
  'service',
  'database',
  'queue',
  'gateway',
  'cache',
  'client',
  'external',
  'group',
]

export interface StatusMeta {
  label: string
  color: string
}

export const STATUS_META: Record<NodeStatus, StatusMeta> = {
  healthy: { label: 'Operativo', color: '#16a34a' },
  degraded: { label: 'Degradato', color: '#d97706' },
  down: { label: 'Non disponibile', color: '#dc2626' },
  unknown: { label: 'Sconosciuto', color: '#94a3b8' },
}

export const STATUS_ORDER: NodeStatus[] = ['healthy', 'degraded', 'down', 'unknown']
