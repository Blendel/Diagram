import type { ComponentType } from 'react'
import {
  Workflow,
  Globe,
  Boxes,
  Variable,
  Braces,
  StickyNote,
  Settings,
  Eye,
  Zap,
  Webhook,
  Target,
  Package,
  Plug,
  Cable,
  Brackets,
} from 'lucide-react'
import type { SubNodeKind } from '../types/diagram'

export type IconComponent = ComponentType<{
  size?: number | string
  className?: string
  strokeWidth?: number
  color?: string
}>

export interface SubKindMeta {
  kind: SubNodeKind
  label: string
  icon: IconComponent
  accent: string
  description: string
}

export const SUB_CATALOG: Record<SubNodeKind, SubKindMeta> = {
  function: {
    kind: 'function',
    label: 'Funzione',
    icon: Workflow,
    accent: '#2563eb',
    description: 'Funzione / metodo interno',
  },
  endpoint: {
    kind: 'endpoint',
    label: 'Endpoint',
    icon: Globe,
    accent: '#0d9488',
    description: 'Rotta HTTP / RPC esposta',
  },
  module: {
    kind: 'module',
    label: 'Modulo',
    icon: Boxes,
    accent: '#7c3aed',
    description: 'Package / modulo logico',
  },
  variable: {
    kind: 'variable',
    label: 'Variabile',
    icon: Variable,
    accent: '#d97706',
    description: 'Config / stato / costante',
  },
  class: {
    kind: 'class',
    label: 'Classe',
    icon: Braces,
    accent: '#db2777',
    description: 'Classe / tipo / entità',
  },
  note: {
    kind: 'note',
    label: 'Nota',
    icon: StickyNote,
    accent: '#64748b',
    description: 'Annotazione libera',
  },
  procedure: {
    kind: 'procedure',
    label: 'Procedura',
    icon: Settings,
    accent: '#0d9488',
    description: 'Stored procedure / funzione DB',
  },
  view: {
    kind: 'view',
    label: 'Vista',
    icon: Eye,
    accent: '#2563eb',
    description: 'View materializzata o logica',
  },
  trigger: {
    kind: 'trigger',
    label: 'Trigger',
    icon: Zap,
    accent: '#e11d48',
    description: 'Trigger su evento tabella',
  },
  controller: {
    kind: 'controller',
    label: 'Controller',
    icon: Webhook,
    accent: '#0d9488',
    description: 'Adattatore in ingresso (HTTP/RPC)',
  },
  usecase: {
    kind: 'usecase',
    label: 'Use case',
    icon: Target,
    accent: '#2563eb',
    description: 'Logica applicativa / servizio',
  },
  repository: {
    kind: 'repository',
    label: 'Repository',
    icon: Package,
    accent: '#d97706',
    description: 'Accesso ai dati (porta in uscita)',
  },
  port: {
    kind: 'port',
    label: 'Port',
    icon: Plug,
    accent: '#7c3aed',
    description: 'Interfaccia (porta) del dominio',
  },
  adapter: {
    kind: 'adapter',
    label: 'Adapter',
    icon: Cable,
    accent: '#0891b2',
    description: 'Implementazione di una porta',
  },
  dto: {
    kind: 'dto',
    label: 'DTO / Model',
    icon: Brackets,
    accent: '#db2777',
    description: 'Oggetto dati / modello',
  },
}

/** Palette for service / generic component internals. */
export const SUB_ORDER: SubNodeKind[] = [
  'controller',
  'usecase',
  'repository',
  'port',
  'adapter',
  'function',
  'endpoint',
  'module',
  'class',
  'dto',
  'variable',
  'note',
]

/** Palette for database internals (functions, procedures, views, triggers). */
export const SUB_ORDER_DB: SubNodeKind[] = [
  'procedure',
  'function',
  'view',
  'trigger',
  'module',
  'note',
]
