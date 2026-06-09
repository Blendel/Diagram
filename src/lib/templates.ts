import type { AppEdge, AppNode, DiagramNodeData, NodeKind } from '../types/diagram'
import { uid } from './uid'
import { DEFAULT_MARKER } from './edgeCatalog'

function node(
  kind: NodeKind,
  label: string,
  x: number,
  y: number,
  extra: Partial<DiagramNodeData> = {},
): AppNode {
  return {
    id: uid(),
    type: kind === 'group' ? 'group' : 'component',
    position: { x, y },
    data: { kind, label, status: 'healthy', ...extra },
  }
}

function edge(
  source: AppNode,
  target: AppNode,
  data: AppEdge['data'],
): AppEdge {
  return {
    id: uid(),
    type: 'flow',
    source: source.id,
    target: target.id,
    markerEnd: DEFAULT_MARKER,
    data,
  }
}

function grp(
  label: string,
  groupType: DiagramNodeData['groupType'],
  x: number,
  y: number,
  w: number,
  h: number,
): AppNode {
  return {
    id: uid(),
    type: 'group',
    position: { x, y },
    style: { width: w, height: h },
    data: { kind: 'group', label, status: 'unknown', groupType },
  }
}

/** A node nested inside `parent` (relative position). */
function child(
  kind: NodeKind,
  label: string,
  parent: AppNode,
  x: number,
  y: number,
  extra: Partial<DiagramNodeData> = {},
): AppNode {
  return { ...node(kind, label, x, y, extra), parentId: parent.id, extent: 'parent' }
}

export interface Template {
  id: string
  name: string
  description: string
  build: () => { nodes: AppNode[]; edges: AppEdge[] }
}

export const TEMPLATES: Template[] = [
  {
    id: 'three-tier',
    name: 'Architettura 3-tier',
    description: 'Client → Gateway → Servizio → Database',
    build: () => {
      const client = node('client', 'Web App', 40, 180, { technology: 'React' })
      const gw = node('gateway', 'API Gateway', 300, 180, { technology: 'NGINX', port: '443' })
      const svc = node('service', 'App Service', 560, 180, { technology: 'Node.js', port: '8080', load: 40 })
      const db = node('database', 'Database', 840, 180, { technology: 'PostgreSQL', load: 35 })
      const cache = node('cache', 'Cache', 840, 360, { technology: 'Redis' })
      return {
        nodes: [client, gw, svc, db, cache],
        edges: [
          edge(client, gw, { protocol: 'http', sync: 'sync', label: 'HTTPS' }),
          edge(gw, svc, { protocol: 'http', sync: 'sync' }),
          edge(svc, db, { protocol: 'db', sync: 'sync' }),
          edge(svc, cache, { protocol: 'tcp', sync: 'sync', animation: 'flow' }),
        ],
      }
    },
  },
  {
    id: 'event-driven',
    name: 'Event-driven',
    description: 'Producer → Broker → Consumer (+ proiezione)',
    build: () => {
      const producer = node('service', 'Producer', 60, 120, { technology: 'Go', load: 45 })
      const broker = node('queue', 'Event Bus', 340, 200, { technology: 'Kafka', load: 50 })
      const c1 = node('service', 'Consumer A', 620, 80, { technology: 'Node.js' })
      const c2 = node('service', 'Consumer B', 620, 300, { technology: 'Python' })
      const db = node('database', 'Read Model', 880, 300, { technology: 'MongoDB' })
      return {
        nodes: [producer, broker, c1, c2, db],
        edges: [
          edge(producer, broker, { protocol: 'event', sync: 'async', animation: 'pubsub', label: 'events' }),
          edge(broker, c1, { protocol: 'event', sync: 'async', animation: 'flow', label: 'subscribe' }),
          edge(broker, c2, { protocol: 'event', sync: 'async', animation: 'flow', label: 'subscribe' }),
          edge(c2, db, { protocol: 'db', sync: 'sync' }),
        ],
      }
    },
  },
  {
    id: 'microservices',
    name: 'Microservizi',
    description: 'Gateway, più servizi, dati condivisi ed eventi',
    build: () => {
      const client = node('client', 'Web App', 40, 240, { technology: 'React' })
      const lb = node('loadbalancer', 'Load Balancer', 280, 240)
      const gw = node('gateway', 'API Gateway', 520, 240, { port: '443' })
      const orders = node('service', 'Orders', 780, 100, { technology: 'Node.js', load: 50 })
      const users = node('service', 'Users', 780, 260, { technology: 'Java', load: 35 })
      const billing = node('service', 'Billing', 780, 420, { technology: 'Go', load: 40 })
      const ordersDb = node('database', 'Orders DB', 1040, 100, { technology: 'PostgreSQL' })
      const usersDb = node('database', 'Users DB', 1040, 260, { technology: 'PostgreSQL' })
      const queue = node('queue', 'Events', 1040, 420, { technology: 'RabbitMQ' })
      return {
        nodes: [client, lb, gw, orders, users, billing, ordersDb, usersDb, queue],
        edges: [
          edge(client, lb, { protocol: 'http', sync: 'sync', label: 'HTTPS' }),
          edge(lb, gw, { protocol: 'http', sync: 'sync' }),
          edge(gw, orders, { protocol: 'http', sync: 'sync' }),
          edge(gw, users, { protocol: 'http', sync: 'sync' }),
          edge(gw, billing, { protocol: 'http', sync: 'sync' }),
          edge(orders, ordersDb, { protocol: 'db', sync: 'sync' }),
          edge(users, usersDb, { protocol: 'db', sync: 'sync' }),
          edge(orders, queue, { protocol: 'event', sync: 'async', animation: 'pubsub', label: 'OrderCreated' }),
          edge(billing, queue, { protocol: 'event', sync: 'async', label: 'Invoiced' }),
        ],
      }
    },
  },
  {
    id: 'serverless',
    name: 'Serverless',
    description: 'CDN, API Gateway, funzioni FaaS, storage e coda',
    build: () => {
      const client = node('client', 'Web App', 40, 220, { technology: 'React' })
      const cdn = node('cdn', 'CDN', 260, 80)
      const gw = node('gateway', 'API Gateway', 260, 260, { port: '443' })
      const fn1 = node('serverless', 'createOrder', 520, 140, { technology: 'Lambda' })
      const fn2 = node('serverless', 'getOrder', 520, 320, { technology: 'Lambda' })
      const db = node('database', 'DynamoDB', 780, 140, { technology: 'DynamoDB' })
      const storage = node('storage', 'S3', 780, 320, { technology: 'S3' })
      const q = node('queue', 'EventBridge', 520, 480, { technology: 'EventBridge' })
      return {
        nodes: [client, cdn, gw, fn1, fn2, db, storage, q],
        edges: [
          edge(client, cdn, { protocol: 'other', sync: 'sync', label: 'assets' }),
          edge(client, gw, { protocol: 'http', sync: 'sync', label: 'HTTPS' }),
          edge(gw, fn1, { protocol: 'http', sync: 'sync' }),
          edge(gw, fn2, { protocol: 'http', sync: 'sync' }),
          edge(fn1, db, { protocol: 'db', sync: 'sync' }),
          edge(fn2, db, { protocol: 'db', sync: 'sync' }),
          edge(fn1, storage, { protocol: 'tcp', sync: 'sync' }),
          edge(fn1, q, { protocol: 'event', sync: 'async', animation: 'pubsub', label: 'OrderCreated' }),
        ],
      }
    },
  },
  {
    id: 'data-pipeline',
    name: 'Data pipeline / ETL',
    description: 'Ingest → coda → stream processor → warehouse + data lake',
    build: () => {
      const src = node('service', 'Ingest API', 40, 180, { technology: 'Go' })
      const q = node('queue', 'Kafka', 280, 180, { load: 55 })
      const stream = node('stream', 'Flink', 520, 180, { load: 60 })
      const wh = node('database', 'Warehouse', 780, 90, { technology: 'ClickHouse' })
      const lake = node('storage', 'Data Lake', 780, 270, { technology: 'S3' })
      const mon = node('monitoring', 'Metrics', 280, 360)
      return {
        nodes: [src, q, stream, wh, lake, mon],
        edges: [
          edge(src, q, { protocol: 'event', sync: 'async', label: 'events' }),
          edge(q, stream, { protocol: 'event', sync: 'async', animation: 'flow', label: 'consume' }),
          edge(stream, wh, { protocol: 'db', sync: 'sync', animation: 'pulse' }),
          edge(stream, lake, { protocol: 'tcp', sync: 'sync', animation: 'flow' }),
          edge(mon, stream, { protocol: 'other', sync: 'async', label: 'scrape' }),
        ],
      }
    },
  },
  {
    id: 'kubernetes',
    name: 'Cloud-native / Kubernetes',
    description: 'Cluster con servizi annidati, ingress LB e database',
    build: () => {
      const cluster = grp('Cluster prod', 'cluster', 300, 40, 540, 440)
      const lb = node('loadbalancer', 'Ingress LB', 40, 220)
      const gw = child('gateway', 'API Gateway', cluster, 30, 50, { port: '443' })
      const cache = child('cache', 'Redis', cluster, 320, 50)
      const orders = child('service', 'orders', cluster, 30, 220, { load: 45 })
      const users = child('service', 'users', cluster, 300, 220, { load: 35 })
      const db = node('database', 'PostgreSQL', 900, 220, { technology: 'PostgreSQL' })
      return {
        nodes: [cluster, gw, cache, orders, users, lb, db],
        edges: [
          edge(lb, gw, { protocol: 'http', sync: 'sync', label: 'HTTPS' }),
          edge(gw, orders, { protocol: 'http', sync: 'sync' }),
          edge(gw, users, { protocol: 'http', sync: 'sync' }),
          edge(orders, cache, { protocol: 'tcp', sync: 'sync', animation: 'flow' }),
          edge(orders, db, { protocol: 'db', sync: 'sync' }),
          edge(users, db, { protocol: 'db', sync: 'sync' }),
        ],
      }
    },
  },
  {
    id: 'cqrs',
    name: 'CQRS / Event Sourcing',
    description: 'Command → event store → bus → projector → read model',
    build: () => {
      const client = node('client', 'UI', 40, 220, { technology: 'React' })
      const cmd = node('service', 'Command API', 280, 120, { technology: 'Node.js' })
      const query = node('service', 'Query API', 280, 320)
      const es = node('database', 'Event Store', 540, 120, { technology: 'EventStoreDB' })
      const bus = node('queue', 'Event Bus', 540, 300, { technology: 'Kafka' })
      const proj = node('service', 'Projector', 780, 300)
      const readdb = node('database', 'Read Model', 1020, 300, { technology: 'MongoDB' })
      return {
        nodes: [client, cmd, query, es, bus, proj, readdb],
        edges: [
          edge(client, cmd, { protocol: 'http', sync: 'sync', label: 'command' }),
          edge(client, query, { protocol: 'http', sync: 'sync', label: 'query' }),
          edge(cmd, es, { protocol: 'db', sync: 'sync', label: 'append' }),
          edge(cmd, bus, { protocol: 'event', sync: 'async', animation: 'pubsub', label: 'events' }),
          edge(bus, proj, { protocol: 'event', sync: 'async', animation: 'flow' }),
          edge(proj, readdb, { protocol: 'db', sync: 'sync', animation: 'pulse' }),
          edge(query, readdb, { protocol: 'db', sync: 'sync' }),
        ],
      }
    },
  },
]
