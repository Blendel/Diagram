import type { ComponentType } from 'react'
import { Box, Globe, MapPin, Cloud, Share2, Boxes, FolderTree, Container } from 'lucide-react'
import type { GroupVariant } from '../types/diagram'

export type IconComponent = ComponentType<{
  size?: number | string
  className?: string
  strokeWidth?: number
  color?: string
}>

export interface GroupVariantMeta {
  variant: GroupVariant
  label: string
  icon: IconComponent
  accent: string
}

export const GROUP_VARIANTS: Record<GroupVariant, GroupVariantMeta> = {
  generic: { variant: 'generic', label: 'Gruppo / Boundary', icon: Box, accent: '#64748b' },
  region: { variant: 'region', label: 'Region', icon: Globe, accent: '#0ea5e9' },
  zone: { variant: 'zone', label: 'Availability Zone', icon: MapPin, accent: '#0891b2' },
  vpc: { variant: 'vpc', label: 'VPC / Rete', icon: Cloud, accent: '#6366f1' },
  subnet: { variant: 'subnet', label: 'Subnet', icon: Share2, accent: '#7c3aed' },
  cluster: { variant: 'cluster', label: 'Cluster', icon: Boxes, accent: '#16a34a' },
  namespace: { variant: 'namespace', label: 'Namespace', icon: FolderTree, accent: '#d97706' },
  pod: { variant: 'pod', label: 'Pod', icon: Container, accent: '#db2777' },
}

export const GROUP_ORDER: GroupVariant[] = [
  'generic',
  'region',
  'zone',
  'vpc',
  'subnet',
  'cluster',
  'namespace',
  'pod',
]
