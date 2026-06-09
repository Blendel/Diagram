import type { AppEdge, AppNode, ComponentChildren, DbTable, DbRelation } from '../types/diagram'
import { DEFAULT_MARKER } from './edgeCatalog'

// Internal map of the Orders service (shown when you open its detail).
const ORDERS_CHILDREN: ComponentChildren = {
  nodes: [
    { id: 'o-ep1', type: 'sub', position: { x: 40, y: 40 }, data: { kind: 'endpoint', label: 'POST /orders', signature: 'createOrder(dto): Order' } },
    { id: 'o-ep2', type: 'sub', position: { x: 40, y: 180 }, data: { kind: 'endpoint', label: 'GET /orders/:id', signature: 'getOrder(id): Order' } },
    { id: 'o-fn1', type: 'sub', position: { x: 320, y: 40 }, data: { kind: 'function', label: 'reserveStock', signature: '(items): Reservation' } },
    { id: 'o-mod', type: 'sub', position: { x: 320, y: 180 }, data: { kind: 'module', label: 'OrderRepository' } },
    { id: 'o-var', type: 'sub', position: { x: 600, y: 110 }, data: { kind: 'variable', label: 'MAX_ITEMS', signature: '= 50' } },
  ],
  edges: [
    { id: 'oe1', source: 'o-ep1', target: 'o-fn1', type: 'smoothstep' },
    { id: 'oe2', source: 'o-ep1', target: 'o-mod', type: 'smoothstep' },
    { id: 'oe3', source: 'o-ep2', target: 'o-mod', type: 'smoothstep' },
    { id: 'oe4', source: 'o-fn1', target: 'o-var', type: 'smoothstep' },
  ],
}

// A richer relational schema for the Orders DB.
const DB_TABLES: DbTable[] = [
  {
    id: 'tbl-customers',
    name: 'customers',
    x: 40,
    y: 40,
    columns: [
      { id: 'c-cu-id', name: 'id', type: 'uuid', pk: true },
      { id: 'c-cu-email', name: 'email', type: 'text' },
      { id: 'c-cu-name', name: 'name', type: 'text' },
    ],
  },
  {
    id: 'tbl-orders',
    name: 'orders',
    x: 360,
    y: 30,
    columns: [
      { id: 'c-o-id', name: 'id', type: 'uuid', pk: true },
      { id: 'c-o-cust', name: 'customer_id', type: 'uuid', fk: true },
      { id: 'c-o-total', name: 'total', type: 'numeric' },
      { id: 'c-o-status', name: 'status', type: 'text' },
      { id: 'c-o-created', name: 'created_at', type: 'timestamptz' },
    ],
  },
  {
    id: 'tbl-items',
    name: 'order_items',
    x: 700,
    y: 30,
    columns: [
      { id: 'c-i-id', name: 'id', type: 'uuid', pk: true },
      { id: 'c-i-order', name: 'order_id', type: 'uuid', fk: true },
      { id: 'c-i-prod', name: 'product_id', type: 'uuid', fk: true },
      { id: 'c-i-qty', name: 'qty', type: 'int' },
    ],
  },
  {
    id: 'tbl-products',
    name: 'products',
    x: 700,
    y: 250,
    columns: [
      { id: 'c-p-id', name: 'id', type: 'uuid', pk: true },
      { id: 'c-p-sku', name: 'sku', type: 'text' },
      { id: 'c-p-price', name: 'price', type: 'numeric' },
    ],
  },
  {
    id: 'tbl-payments',
    name: 'payments',
    x: 360,
    y: 260,
    columns: [
      { id: 'c-pa-id', name: 'id', type: 'uuid', pk: true },
      { id: 'c-pa-order', name: 'order_id', type: 'uuid', fk: true },
      { id: 'c-pa-amount', name: 'amount', type: 'numeric' },
      { id: 'c-pa-state', name: 'state', type: 'text' },
    ],
  },
]

const DB_RELATIONS: DbRelation[] = [
  { id: 'r1', source: 'tbl-orders', target: 'tbl-customers', sourceColumn: 'c-o-cust', targetColumn: 'c-cu-id', cardinality: '1-n' },
  { id: 'r2', source: 'tbl-items', target: 'tbl-orders', sourceColumn: 'c-i-order', targetColumn: 'c-o-id', cardinality: '1-n' },
  { id: 'r3', source: 'tbl-items', target: 'tbl-products', sourceColumn: 'c-i-prod', targetColumn: 'c-p-id', cardinality: '1-n' },
  { id: 'r4', source: 'tbl-payments', target: 'tbl-orders', sourceColumn: 'c-pa-order', targetColumn: 'c-o-id', cardinality: '1-1' },
]

export const SEED_NODES: AppNode[] = [
  {
    id: 'seed-client',
    type: 'component',
    position: { x: 20, y: 220 },
    data: { kind: 'client', label: 'Web App', status: 'healthy', technology: 'React' },
  },
  {
    id: 'seed-gateway',
    type: 'component',
    position: { x: 250, y: 220 },
    data: { kind: 'gateway', label: 'API Gateway', status: 'healthy', technology: 'NGINX', port: '443', load: 35 },
  },
  {
    id: 'seed-orders',
    type: 'component',
    position: { x: 520, y: 110 },
    data: {
      kind: 'service',
      label: 'Orders',
      status: 'healthy',
      technology: 'Node.js',
      port: '8080',
      owner: 'Team Checkout',
      load: 48,
      children: ORDERS_CHILDREN,
    },
  },
  {
    id: 'seed-payments',
    type: 'component',
    position: { x: 520, y: 330 },
    data: {
      kind: 'service',
      label: 'Payments',
      status: 'degraded',
      technology: 'Go',
      port: '8081',
      owner: 'Team Payments',
      load: 82,
    },
  },
  {
    id: 'seed-cache',
    type: 'component',
    position: { x: 800, y: 250 },
    data: { kind: 'cache', label: 'Redis', status: 'healthy', technology: 'Redis 7', load: 22 },
  },
  {
    id: 'seed-db',
    type: 'component',
    position: { x: 820, y: 80 },
    data: {
      kind: 'database',
      label: 'Orders DB',
      status: 'healthy',
      technology: 'PostgreSQL 16',
      load: 40,
      tables: DB_TABLES,
      relations: DB_RELATIONS,
    },
  },
  {
    id: 'seed-queue',
    type: 'component',
    position: { x: 800, y: 410 },
    data: { kind: 'queue', label: 'Events', status: 'healthy', technology: 'Kafka' },
  },
  {
    id: 'seed-notify',
    type: 'component',
    position: { x: 1080, y: 410 },
    data: { kind: 'service', label: 'Notifications', status: 'healthy', technology: 'Python', load: 18 },
  },
]

const RAW_EDGES: AppEdge[] = [
  { id: 'seed-e1', type: 'flow', source: 'seed-client', target: 'seed-gateway', data: { protocol: 'http', sync: 'sync', label: 'HTTPS' } },
  { id: 'seed-e2', type: 'flow', source: 'seed-gateway', target: 'seed-orders', data: { protocol: 'http', sync: 'sync' } },
  { id: 'seed-e3', type: 'flow', source: 'seed-gateway', target: 'seed-payments', data: { protocol: 'http', sync: 'sync' } },
  { id: 'seed-e4', type: 'flow', source: 'seed-orders', target: 'seed-db', data: { protocol: 'db', sync: 'sync' } },
  { id: 'seed-e5', type: 'flow', source: 'seed-orders', target: 'seed-cache', data: { protocol: 'tcp', sync: 'sync', animation: 'flow' } },
  { id: 'seed-e6', type: 'flow', source: 'seed-orders', target: 'seed-queue', data: { protocol: 'event', sync: 'async', animation: 'pubsub', label: 'OrderCreated' } },
  { id: 'seed-e7', type: 'flow', source: 'seed-payments', target: 'seed-queue', data: { protocol: 'event', sync: 'async', label: 'PaymentDone' } },
  { id: 'seed-e8', type: 'flow', source: 'seed-queue', target: 'seed-notify', data: { protocol: 'event', sync: 'async', animation: 'flow', label: '*' } },
]

export const SEED_EDGES: AppEdge[] = RAW_EDGES.map((e) => ({ ...e, markerEnd: DEFAULT_MARKER }))
