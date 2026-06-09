import type { ComponentType } from 'react'
import { Workflow, Globe, Boxes, Variable, Braces, StickyNote, Settings, Eye, Zap } from 'lucide-react'
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
}

/** Palette for service / generic component internals. */
export const SUB_ORDER: SubNodeKind[] = [
  'function',
  'endpoint',
  'module',
  'variable',
  'class',
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
