import type { Node, Edge } from '@xyflow/react'

/** The kind of architectural component a node represents. */
export type NodeKind =
  | 'service'
  | 'serverless'
  | 'database'
  | 'storage'
  | 'queue'
  | 'stream'
  | 'gateway'
  | 'loadbalancer'
  | 'cdn'
  | 'cache'
  | 'client'
  | 'scheduler'
  | 'monitoring'
  | 'firewall'
  | 'dns'
  | 'auth'
  | 'secrets'
  | 'external'
  | 'custom'
  | 'group'

/** Live/operational status shown as a colored indicator on the node. */
export type NodeStatus = 'healthy' | 'degraded' | 'down' | 'unknown'

/** Typed boundary variant for group nodes. */
export type GroupVariant =
  | 'generic'
  | 'region'
  | 'zone'
  | 'vpc'
  | 'subnet'
  | 'cluster'
  | 'namespace'
  | 'pod'

/** Geometric shape of a component node. */
export type NodeShape =
  | 'rounded'
  | 'rectangle'
  | 'pill'
  | 'cylinder'
  | 'circle'
  | 'hexagon'
  | 'diamond'

// --- Component drill-down: an internal sub-diagram --------------------------

/** Kind of an internal sub-component shown in a component's dedicated canvas. */
export type SubNodeKind =
  | 'function'
  | 'endpoint'
  | 'module'
  | 'variable'
  | 'class'
  | 'note'
  // clean / hexagonal architecture building blocks
  | 'controller'
  | 'usecase'
  | 'repository'
  | 'port'
  | 'adapter'
  | 'dto'
  // database-flavored objects
  | 'procedure'
  | 'view'
  | 'trigger'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface SubNodeData {
  kind: SubNodeKind
  label: string
  /** e.g. "(id: string): Order" or "GET /orders/:id" */
  signature?: string
  description?: string
  /** endpoint HTTP method */
  method?: HttpMethod
  /** function/method visibility */
  visibility?: 'public' | 'private'
  /** asynchronous function/method */
  async?: boolean
  [key: string]: unknown
}

export type SubNode = Node<SubNodeData>
export type SubEdge = Edge

/** The internal map of a component (its functions, endpoints, modules, variables…). */
export interface ComponentChildren {
  nodes: SubNode[]
  edges: SubEdge[]
}

// --- Web App drill-down: a low-fidelity page/wireframe designer -------------

export type UiKind =
  | 'frame'
  | 'navbar'
  | 'sidebar'
  | 'footer'
  | 'heading'
  | 'text'
  | 'button'
  | 'input'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'toggle'
  | 'slider'
  | 'image'
  | 'icon'
  | 'card'
  | 'list'
  | 'table'
  | 'chart'
  | 'progress'
  | 'breadcrumb'
  | 'pagination'
  | 'tabs'
  | 'avatar'
  | 'badge'
  | 'container'
  | 'modal'
  | 'divider'

export interface UiNodeData {
  kind: UiKind
  label: string
  /** For interactive preview: id of the frame this element navigates to when activated. */
  link?: string

  // --- editable characteristics (per element kind) ---
  /** navbar/sidebar items, list/table rows, radio/tabs options, pagination pages */
  count?: number
  /** table columns */
  cols?: number
  /** text & card body skeleton lines */
  lines?: number
  /** fill level 0-100 (progress) or default value (slider) */
  percent?: number
  /** accent color override (hex) */
  color?: string
  /** button / badge visual style */
  variant?: 'solid' | 'soft' | 'outline'
  /** heading font size */
  size?: 'sm' | 'md' | 'lg'
  /** input field type */
  inputType?: 'text' | 'email' | 'password' | 'search' | 'number'
  /** list rows show a leading avatar */
  withAvatar?: boolean
  /** card shows a top image band */
  withImage?: boolean
  /** checkbox default checked / toggle default on / default active tab */
  checked?: boolean
  on?: boolean
  tab?: number
  /** responsive breakpoint tag (frame elements) */
  breakpoint?: 'mobile' | 'tablet' | 'desktop'

  [key: string]: unknown
}

export type UiNode = Node<UiNodeData>

/** The page wireframe of a client component. */
export interface Wireframe {
  nodes: UiNode[]
  edges: Edge[]
}

// --- Database drill-down: relational schema ---------------------------------

export interface DbColumn {
  id: string
  name: string
  type: string
  pk?: boolean
  fk?: boolean
  nullable?: boolean
  unique?: boolean
  default?: string
}

export interface DbIndex {
  id: string
  name: string
  columns: string[]
  unique?: boolean
}

export interface DbTable {
  id: string
  name: string
  x: number
  y: number
  columns: DbColumn[]
  indexes?: DbIndex[]
}

// --- NoSQL / document modeling ---------------------------------------------

export interface DbField {
  id: string
  name: string
  type: string
  /** array of `type` */
  array?: boolean
  /** embedded object/sub-document */
  embedded?: boolean
}

export interface DbCollection {
  id: string
  name: string
  x: number
  y: number
  fields: DbField[]
}

export interface DbReference {
  id: string
  source: string
  target: string
  sourceField?: string
  name?: string
}

export type DbReferentialAction = 'cascade' | 'restrict' | 'set null' | 'no action'

export interface DbRelation {
  id: string
  source: string
  target: string
  sourceColumn?: string
  targetColumn?: string
  cardinality: '1-1' | '1-n' | 'n-n'
  name?: string
  onDelete?: DbReferentialAction
  onUpdate?: DbReferentialAction
}

/**
 * Payload carried by every node. React Flow requires node data to be an
 * index-signature object, hence the `[key: string]: unknown`.
 */
export interface DiagramNodeData {
  kind: NodeKind
  label: string
  status: NodeStatus
  technology?: string
  description?: string
  owner?: string
  url?: string
  port?: string

  /** Visual customization */
  shape?: NodeShape
  color?: string
  /** Icon override (key into the icon registry); falls back to the kind's icon. */
  icon?: string
  /** Boundary variant (group nodes only). */
  groupType?: GroupVariant

  /** Dynamic load metric, 0-100. Drives the derived status and edge speed. */
  load?: number

  /** Component drill-down: internal sub-diagram (functions, endpoints, …). */
  children?: ComponentChildren

  /** Database drill-down: relational schema. */
  tables?: DbTable[]
  relations?: DbRelation[]

  /** Database modeling mode + NoSQL/document schema. */
  dbMode?: 'relational' | 'document'
  collections?: DbCollection[]
  references?: DbReference[]

  /** Client drill-down: page wireframe / UI design. */
  wireframe?: Wireframe

  /** Derived at render time (not persisted): impacted by an upstream failure. */
  impacted?: boolean

  [key: string]: unknown
}

export type AppNode = Node<DiagramNodeData>

/** Communication protocol of a connection between two components. */
export type EdgeProtocol = 'http' | 'grpc' | 'event' | 'db' | 'tcp' | 'other'

/** Whether the call is synchronous (request/response) or asynchronous (fire-and-forget). */
export type EdgeSync = 'sync' | 'async'

/** Animation rendered along a connection. */
export type EdgeAnimation = 'none' | 'flow' | 'pulse' | 'pubsub'

export interface DiagramEdgeData {
  label?: string
  protocol: EdgeProtocol
  sync: EdgeSync
  animation?: EdgeAnimation
  /** Draw an arrow at both ends. */
  bidirectional?: boolean
  /** Multiplicity labels near each end, e.g. "1", "*", "0..1". */
  sourceMult?: string
  targetMult?: string
  /** Derived at render time (not persisted). */
  broken?: boolean
  srcLoad?: number
  [key: string]: unknown
}

export type AppEdge = Edge<DiagramEdgeData>

/** A complete, serializable diagram. This is exactly what we persist / export. */
export interface Diagram {
  id: string
  name: string
  nodes: AppNode[]
  edges: AppEdge[]
  updatedAt: number
}

export const SCHEMA_VERSION = 3

/** Shape of an exported `.json` file. */
export interface DiagramFile {
  schema: 'architect-diagram'
  version: number
  diagram: Diagram
}
