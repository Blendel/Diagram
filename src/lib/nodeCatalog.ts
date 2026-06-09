import type { ComponentType } from 'react'
import {
  Boxes,
  Database,
  Inbox,
  Network,
  Monitor,
  Zap,
  Box,
  Cloud,
  SquareFunction,
  HardDrive,
  Scale,
  Globe,
  Clock,
  Activity,
  Waves,
  Shield,
  Waypoints,
  Fingerprint,
  Lock,
  Shapes,
} from 'lucide-react'
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
  serverless: {
    kind: 'serverless',
    label: 'Funzione serverless',
    icon: SquareFunction,
    accent: '#6366f1',
    soft: '#eef2ff',
    description: 'Lambda / Cloud Function',
    defaultShape: 'rounded',
  },
  storage: {
    kind: 'storage',
    label: 'Object storage',
    icon: HardDrive,
    accent: '#b45309',
    soft: '#fffbeb',
    description: 'Blob / S3 / file store',
    defaultShape: 'cylinder',
  },
  loadbalancer: {
    kind: 'loadbalancer',
    label: 'Load balancer',
    icon: Scale,
    accent: '#0ea5e9',
    soft: '#f0f9ff',
    description: 'Bilanciatore di carico',
    defaultShape: 'hexagon',
  },
  cdn: {
    kind: 'cdn',
    label: 'CDN',
    icon: Globe,
    accent: '#06b6d4',
    soft: '#ecfeff',
    description: 'Content delivery network',
    defaultShape: 'pill',
  },
  scheduler: {
    kind: 'scheduler',
    label: 'Scheduler / Cron',
    icon: Clock,
    accent: '#db2777',
    soft: '#fdf2f8',
    description: 'Job pianificati / cron',
    defaultShape: 'rounded',
  },
  monitoring: {
    kind: 'monitoring',
    label: 'Monitoring',
    icon: Activity,
    accent: '#16a34a',
    soft: '#f0fdf4',
    description: 'Osservabilità / metriche / alert',
    defaultShape: 'rounded',
  },
  stream: {
    kind: 'stream',
    label: 'Stream processor',
    icon: Waves,
    accent: '#0e7490',
    soft: '#ecfeff',
    description: 'Pipeline / stream processing',
    defaultShape: 'pill',
  },
  firewall: {
    kind: 'firewall',
    label: 'Firewall / WAF',
    icon: Shield,
    accent: '#dc2626',
    soft: '#fef2f2',
    description: 'Firewall / web application firewall',
    defaultShape: 'hexagon',
  },
  dns: {
    kind: 'dns',
    label: 'DNS',
    icon: Waypoints,
    accent: '#0369a1',
    soft: '#f0f9ff',
    description: 'DNS / service discovery',
    defaultShape: 'rounded',
  },
  auth: {
    kind: 'auth',
    label: 'IAM / Identity',
    icon: Fingerprint,
    accent: '#9333ea',
    soft: '#faf5ff',
    description: 'Identity / autenticazione / autorizzazione',
    defaultShape: 'rounded',
  },
  secrets: {
    kind: 'secrets',
    label: 'Secret / Config',
    icon: Lock,
    accent: '#7c2d12',
    soft: '#fff7ed',
    description: 'Secret / config manager / vault',
    defaultShape: 'rounded',
  },
  custom: {
    kind: 'custom',
    label: 'Componente generico',
    icon: Shapes,
    accent: '#64748b',
    soft: '#f8fafc',
    description: 'Nodo personalizzabile (forma e colore)',
    defaultShape: 'rounded',
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
  'serverless',
  'gateway',
  'loadbalancer',
  'queue',
  'stream',
  'database',
  'storage',
  'cache',
  'cdn',
  'client',
  'scheduler',
  'monitoring',
  'firewall',
  'dns',
  'auth',
  'secrets',
  'external',
  'custom',
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
