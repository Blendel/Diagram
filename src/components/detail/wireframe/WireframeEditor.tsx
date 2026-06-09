import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  ConnectionMode,
  MarkerType,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type NodeTypes,
  type Edge,
  type OnSelectionChangeParams,
} from '@xyflow/react'
import { Trash2, Pencil, Play, BringToFront, SendToBack, CopyPlus } from 'lucide-react'
import type { UiNode, UiKind, UiNodeData } from '../../../types/diagram'
import { UI_CATALOG, UI_ORDER } from '../../../lib/uiCatalog'
import { uid } from '../../../lib/uid'
import { inputCls, dangerBtnCls } from '../../../lib/ui'
import { getHelperLines } from '../../../lib/helperLines'
import { WireframeNode } from './WireframeNode'
import { WireframePreview } from './WireframePreview'
import { HelperLines } from '../../canvas/HelperLines'

const nodeTypes: NodeTypes = { ui: WireframeNode }
const UI_DND = 'application/architect-ui'

/** In-memory clipboard for copy/paste inside the wireframe editor. */
let wireClipboard: UiNode[] = []

type Breakpoint = NonNullable<UiNodeData['breakpoint']>
const BREAKPOINTS: { id: Breakpoint; label: string; w: number; h: number }[] = [
  { id: 'mobile', label: 'Mobile', w: 375, h: 720 },
  { id: 'tablet', label: 'Tablet', w: 768, h: 900 },
  { id: 'desktop', label: 'Desktop', w: 1280, h: 800 },
]

const dimVal = (v: unknown, fallback: number) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : fallback
}

interface Props {
  initialNodes: UiNode[]
  initialEdges: Edge[]
  onChange: (nodes: UiNode[], edges: Edge[]) => void
}

export function WireframeEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  )
}

function defaults(kind: UiKind): Partial<UiNodeData> {
  switch (kind) {
    case 'navbar':
      return { count: 3 }
    case 'text':
      return { lines: 3 }
    case 'card':
      return { lines: 3, withImage: false }
    case 'list':
      return { count: 3, withAvatar: true }
    case 'tabs':
      return { count: 3, tab: 0 }
    case 'checkbox':
      return { checked: true }
    case 'toggle':
      return { on: true }
    case 'button':
    case 'badge':
      return { variant: 'solid' }
    case 'heading':
      return { size: 'lg' }
    case 'input':
      return { inputType: 'text' }
    case 'sidebar':
      return { count: 5 }
    case 'radio':
      return { count: 3, tab: 0 }
    case 'table':
      return { count: 3, cols: 3 }
    case 'slider':
      return { percent: 50 }
    case 'progress':
      return { percent: 60 }
    case 'breadcrumb':
      return { count: 3 }
    case 'pagination':
      return { count: 5 }
    default:
      return {}
  }
}

function makeUi(kind: UiKind, position: { x: number; y: number }): UiNode {
  const meta = UI_CATALOG[kind]
  return {
    id: uid('ui'),
    type: 'ui',
    position,
    style: { width: meta.w, height: meta.h },
    data: { kind, label: meta.label, ...defaults(kind) },
  }
}

function Inner({ initialNodes, initialEdges, onChange }: Props) {
  const [nodes, setNodes] = useState<UiNode[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const [sel, setSel] = useState<string | null>(null)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [helperH, setHelperH] = useState<number | undefined>(undefined)
  const [helperV, setHelperV] = useState<number | undefined>(undefined)
  const { screenToFlowPosition } = useReactFlow()

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const t = setTimeout(() => onChangeRef.current(nodes, edges), 350)
    return () => clearTimeout(t)
  }, [nodes, edges])
  const latest = useRef({ nodes, edges })
  latest.current = { nodes, edges }
  useEffect(() => () => onChangeRef.current(latest.current.nodes, latest.current.edges), [])

  const onNodesChange = useCallback(
    (ch: NodeChange<UiNode>[]) => {
      const only = ch.length === 1 ? ch[0] : null
      if (only && only.type === 'position' && only.dragging && only.position) {
        const lines = getHelperLines(only, nodes)
        if (lines.snapPosition.x !== undefined) only.position.x = lines.snapPosition.x
        if (lines.snapPosition.y !== undefined) only.position.y = lines.snapPosition.y
        setHelperH(lines.horizontal)
        setHelperV(lines.vertical)
      } else if (helperH !== undefined || helperV !== undefined) {
        setHelperH(undefined)
        setHelperV(undefined)
      }
      setNodes((ns) => applyNodeChanges(ch, ns))
    },
    [nodes, helperH, helperV],
  )
  const onSelectionChange = useCallback(
    ({ nodes: n }: OnSelectionChangeParams) => setSel(n[0]?.id ?? null),
    [],
  )
  const onEdgesChange = useCallback(
    (ch: EdgeChange<Edge>[]) => setEdges((es) => applyEdgeChanges(ch, es)),
    [],
  )
  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target) return
    setEdges((es) =>
      addEdge(
        {
          ...c,
          id: uid('we'),
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
          style: { stroke: '#3b82f6', strokeDasharray: '5 4' },
        },
        es,
      ),
    )
  }, [])

  const addAt = (kind: UiKind, position: { x: number; y: number }) => {
    const n = makeUi(kind, position)
    setNodes((ns) => (kind === 'frame' ? [n, ...ns] : [...ns, n]))
    setSel(n.id)
  }

  const onDragStart = (e: DragEvent, kind: UiKind) => {
    e.dataTransfer.setData(UI_DND, kind)
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    const kind = e.dataTransfer.getData(UI_DND) as UiKind
    if (!kind || !(kind in UI_CATALOG)) return
    addAt(kind, screenToFlowPosition({ x: e.clientX, y: e.clientY }))
  }

  const selected = nodes.find((n) => n.id === sel) ?? null
  const patch = (p: Partial<UiNodeData>) =>
    setNodes((ns) => ns.map((n) => (n.id === sel ? { ...n, data: { ...n.data, ...p } } : n)))
  const setDevice = (w: number, h: number) =>
    setNodes((ns) => ns.map((n) => (n.id === sel ? { ...n, style: { ...n.style, width: w, height: h } } : n)))
  const del = () => {
    setNodes((ns) => ns.filter((n) => n.id !== sel))
    setSel(null)
  }
  const bringForward = () =>
    setNodes((ns) => {
      const i = ns.findIndex((n) => n.id === sel)
      if (i < 0 || i === ns.length - 1) return ns
      const copy = [...ns]
      const [x] = copy.splice(i, 1)
      copy.push(x)
      return copy
    })
  const sendBackward = () =>
    setNodes((ns) => {
      const i = ns.findIndex((n) => n.id === sel)
      if (i <= 0) return ns
      const copy = [...ns]
      const [x] = copy.splice(i, 1)
      copy.unshift(x)
      return copy
    })
  const duplicateEl = () => {
    const n = nodes.find((x) => x.id === sel)
    if (!n) return
    const clone: UiNode = {
      ...n,
      id: uid('ui'),
      position: { x: n.position.x + 16, y: n.position.y + 16 },
      selected: false,
      data: { ...n.data },
    }
    setNodes((ns) => [...ns, clone])
    setSel(clone.id)
  }
  // Duplicate a frame and the elements it contains as a responsive variant beside it.
  const createVariant = () => {
    const frame = nodes.find((n) => n.id === sel && n.data.kind === 'frame')
    if (!frame) return
    const fx = frame.position.x
    const fy = frame.position.y
    const fw = dimVal(frame.style?.width, UI_CATALOG.frame.w)
    const fh = dimVal(frame.style?.height, UI_CATALOG.frame.h)
    const contained = nodes.filter((n) => {
      if (n.id === frame.id || n.data.kind === 'frame') return false
      const w = dimVal(n.style?.width, UI_CATALOG[n.data.kind].w)
      const h = dimVal(n.style?.height, UI_CATALOG[n.data.kind].h)
      const cx = n.position.x + w / 2
      const cy = n.position.y + h / 2
      return cx >= fx && cx <= fx + fw && cy >= fy && cy <= fy + fh
    })
    const dx = fw + 80
    const newFrame: UiNode = {
      ...frame,
      id: uid('ui'),
      position: { x: fx + dx, y: fy },
      selected: true,
      data: { ...frame.data, label: `${frame.data.label} (variante)` },
    }
    const clones: UiNode[] = contained.map((n) => ({
      ...n,
      id: uid('ui'),
      position: { x: n.position.x + dx, y: n.position.y },
      selected: false,
      data: { ...n.data },
    }))
    setNodes((ns) => [newFrame, ...ns.map((x) => ({ ...x, selected: false })), ...clones])
    setSel(newFrame.id)
  }

  // Edit-mode shortcuts: duplicate (Ctrl+D), copy/paste (Ctrl+C / Ctrl+V).
  useEffect(() => {
    if (mode !== 'edit') return
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const k = e.key.toLowerCase()
      if (k === 'd' && sel) {
        e.preventDefault()
        duplicateEl()
      } else if (k === 'c' && sel) {
        e.preventDefault()
        const n = nodes.find((x) => x.id === sel)
        if (n) wireClipboard = [{ ...n, data: { ...n.data } }]
      } else if (k === 'v' && wireClipboard.length) {
        e.preventDefault()
        const clones = wireClipboard.map((n) => ({
          ...n,
          id: uid('ui'),
          position: { x: n.position.x + 16, y: n.position.y + 16 },
          selected: false,
          data: { ...n.data },
        }))
        setNodes((ns) => [...ns, ...clones])
        setSel(clones[clones.length - 1]?.id ?? null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, sel, nodes])

  const frames = nodes.filter((n) => n.data.kind === 'frame')

  const segBtn = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-1 rounded text-sm font-medium transition ${
      active ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
    }`

  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      {/* Mode toggle */}
      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-md bg-slate-100 dark:bg-slate-800 p-0.5">
          <button className={segBtn(mode === 'edit')} onClick={() => setMode('edit')}>
            <Pencil size={14} /> Modifica
          </button>
          <button className={segBtn(mode === 'preview')} onClick={() => setMode('preview')}>
            <Play size={14} /> Anteprima
          </button>
        </div>
        {mode === 'preview' && (
          <span className="text-[11px] text-slate-400">
            Interagisci con la pagina: scrivi negli input, attiva toggle/checkbox/tab, i bottoni
            con link navigano tra gli schermi.
          </span>
        )}
      </div>

      {mode === 'preview' ? (
        <div className="flex-1 min-h-0">
          <WireframePreview nodes={nodes} />
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 gap-3">
          {/* Palette */}
          <div className="w-40 shrink-0 overflow-y-auto">
            <p className="text-[11px] text-slate-400 mb-2">Trascina o clicca</p>
            <div className="flex flex-col gap-1.5">
              {UI_ORDER.map((kind) => {
                const m = UI_CATALOG[kind]
                const Icon = m.icon
                return (
                  <button
                    key={kind}
                    draggable
                    onDragStart={(e) => onDragStart(e, kind)}
                    onClick={() => addAt(kind, { x: 80 + nodes.length * 18, y: 80 + nodes.length * 14 })}
                    className="flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-left hover:border-slate-300 dark:hover:border-slate-600 cursor-grab active:cursor-grabbing"
                  >
                    <span style={{ color: m.accent }}>
                      <Icon size={15} />
                    </span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      {m.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Canvas */}
          <div
            className="relative flex-1 min-w-0 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              connectionMode={ConnectionMode.Loose}
              elementsSelectable
              elevateNodesOnSelect={false}
              deleteKeyCode={['Backspace', 'Delete']}
              minZoom={0.3}
              maxZoom={2}
              fitView
            >
              <Background variant={BackgroundVariant.Lines} gap={24} size={1} color="var(--dot)" />
              <HelperLines horizontal={helperH} vertical={helperV} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>

          {/* Inspector */}
          <div className="w-64 shrink-0 overflow-y-auto">
            {selected ? (
              <ElementInspector
                node={selected}
                frames={frames}
                patch={patch}
                setDevice={setDevice}
                onForward={bringForward}
                onBackward={sendBackward}
                onDuplicate={duplicateEl}
                onCreateVariant={createVariant}
                onDelete={del}
              />
            ) : (
              <div className="text-sm text-slate-400 p-3 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                Parti da uno <b>Schermo / Frame</b>, poi trascina gli elementi. Seleziona un
                elemento per modificarne testo e <b>caratteristiche</b> (numero di righe,
                varianti, link…). Passa ad <b>Anteprima</b> per provarlo.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Per-kind inspector -------------------------------------------------------
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-[11px] font-medium text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  )
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
        className={inputCls}
      />
    </Field>
  )
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 mb-3 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

function ElementInspector({
  node,
  frames,
  patch,
  setDevice,
  onForward,
  onBackward,
  onDuplicate,
  onCreateVariant,
  onDelete,
}: {
  node: UiNode
  frames: UiNode[]
  patch: (p: Partial<UiNodeData>) => void
  setDevice: (w: number, h: number) => void
  onForward: () => void
  onBackward: () => void
  onDuplicate: () => void
  onCreateVariant: () => void
  onDelete: () => void
}) {
  const d = node.data
  const meta = UI_CATALOG[d.kind]
  const linkTargets = frames.filter((f) => f.id !== node.id)

  return (
    <div>
      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">{meta.label}</div>

      <Field label={d.kind === 'frame' ? 'Titolo schermo' : 'Testo / etichetta'}>
        <input className={inputCls} value={d.label} onChange={(e) => patch({ label: e.target.value })} />
      </Field>

      <Field label="Colore">
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={d.color || meta.accent}
            onChange={(e) => patch({ color: e.target.value })}
            className="h-9 w-12 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer p-0.5"
          />
          <button
            className="inline-flex items-center px-2.5 h-9 rounded-md border border-slate-200 dark:border-slate-700 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            onClick={() => patch({ color: undefined })}
          >
            Default
          </button>
        </div>
      </Field>

      {d.kind === 'frame' && (
        <>
          <Field label="Breakpoint">
            <div className="flex gap-1.5">
              {BREAKPOINTS.map((bp) => (
                <button
                  key={bp.id}
                  onClick={() => {
                    setDevice(bp.w, bp.h)
                    patch({ breakpoint: bp.id })
                  }}
                  className={`flex-1 rounded-md border px-2 py-1 text-xs transition ${
                    d.breakpoint === bp.id
                      ? 'border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {bp.label}
                </button>
              ))}
            </div>
          </Field>
          <button
            className="inline-flex items-center gap-1.5 mb-3 rounded-md border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            onClick={onCreateVariant}
            title="Duplica lo schermo e i suoi elementi come variante affiancata"
          >
            <CopyPlus size={14} /> Crea variante responsive
          </button>
        </>
      )}

      {d.kind === 'navbar' && (
        <NumberField label="Voci menu" value={d.count ?? 3} min={0} max={6} onChange={(v) => patch({ count: v })} />
      )}

      {d.kind === 'heading' && (
        <Field label="Dimensione">
          <select className={inputCls} value={d.size ?? 'lg'} onChange={(e) => patch({ size: e.target.value as UiNodeData['size'] })}>
            <option value="sm">Piccolo</option>
            <option value="md">Medio</option>
            <option value="lg">Grande</option>
          </select>
        </Field>
      )}

      {d.kind === 'text' && (
        <NumberField label="Righe" value={d.lines ?? 3} min={1} max={8} onChange={(v) => patch({ lines: v })} />
      )}

      {(d.kind === 'button' || d.kind === 'badge') && (
        <Field label="Variante">
          <select className={inputCls} value={d.variant ?? 'solid'} onChange={(e) => patch({ variant: e.target.value as UiNodeData['variant'] })}>
            <option value="solid">Pieno</option>
            <option value="soft">Tenue</option>
            {d.kind === 'button' && <option value="outline">Contorno</option>}
          </select>
        </Field>
      )}

      {d.kind === 'input' && (
        <Field label="Tipo di campo">
          <select className={inputCls} value={d.inputType ?? 'text'} onChange={(e) => patch({ inputType: e.target.value as UiNodeData['inputType'] })}>
            <option value="text">Testo</option>
            <option value="email">Email</option>
            <option value="password">Password</option>
            <option value="search">Ricerca</option>
            <option value="number">Numero</option>
          </select>
        </Field>
      )}

      {d.kind === 'card' && (
        <>
          <NumberField label="Righe testo" value={d.lines ?? 3} min={0} max={8} onChange={(v) => patch({ lines: v })} />
          <Check label="Banda immagine in alto" checked={!!d.withImage} onChange={(v) => patch({ withImage: v })} />
        </>
      )}

      {d.kind === 'list' && (
        <>
          <NumberField label="Numero elementi" value={d.count ?? 3} min={1} max={8} onChange={(v) => patch({ count: v })} />
          <Check label="Mostra avatar per riga" checked={d.withAvatar ?? true} onChange={(v) => patch({ withAvatar: v })} />
        </>
      )}

      {d.kind === 'tabs' && (
        <>
          <NumberField label="Numero di tab" value={d.count ?? 3} min={2} max={5} onChange={(v) => patch({ count: v })} />
          <NumberField label="Tab attiva (default)" value={d.tab ?? 0} min={0} max={(d.count ?? 3) - 1} onChange={(v) => patch({ tab: v })} />
        </>
      )}

      {d.kind === 'checkbox' && (
        <Check label="Spuntato di default" checked={!!d.checked} onChange={(v) => patch({ checked: v })} />
      )}

      {d.kind === 'toggle' && (
        <Check label="Attivo di default" checked={!!d.on} onChange={(v) => patch({ on: v })} />
      )}

      {d.kind === 'sidebar' && (
        <NumberField label="Voci" value={d.count ?? 5} min={1} max={10} onChange={(v) => patch({ count: v })} />
      )}

      {d.kind === 'radio' && (
        <>
          <NumberField label="Opzioni" value={d.count ?? 3} min={1} max={8} onChange={(v) => patch({ count: v })} />
          <NumberField label="Selezionata (default)" value={d.tab ?? 0} min={0} max={(d.count ?? 3) - 1} onChange={(v) => patch({ tab: v })} />
        </>
      )}

      {d.kind === 'table' && (
        <>
          <NumberField label="Righe" value={d.count ?? 3} min={1} max={8} onChange={(v) => patch({ count: v })} />
          <NumberField label="Colonne" value={d.cols ?? 3} min={1} max={6} onChange={(v) => patch({ cols: v })} />
        </>
      )}

      {(d.kind === 'slider' || d.kind === 'progress') && (
        <NumberField
          label={d.kind === 'slider' ? 'Valore (default)' : 'Riempimento %'}
          value={d.percent ?? (d.kind === 'slider' ? 50 : 60)}
          min={0}
          max={100}
          onChange={(v) => patch({ percent: v })}
        />
      )}

      {(d.kind === 'breadcrumb' || d.kind === 'pagination') && (
        <NumberField
          label={d.kind === 'breadcrumb' ? 'Livelli' : 'Pagine'}
          value={d.count ?? (d.kind === 'breadcrumb' ? 3 : 5)}
          min={1}
          max={9}
          onChange={(v) => patch({ count: v })}
        />
      )}

      {/* Navigation link for interactive elements */}
      {d.kind !== 'frame' && d.kind !== 'divider' && (
        <Field label="Naviga a (in anteprima)">
          <select
            className={inputCls}
            value={d.link ?? ''}
            onChange={(e) => patch({ link: e.target.value || undefined })}
            disabled={linkTargets.length === 0}
          >
            <option value="">— nessuna —</option>
            {linkTargets.map((f) => (
              <option key={f.id} value={f.id}>
                {f.data.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Ordine & azioni">
        <div className="flex flex-wrap gap-1.5">
          <button
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            onClick={onBackward}
            title="Porta indietro"
          >
            <SendToBack size={14} /> Indietro
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            onClick={onForward}
            title="Porta avanti"
          >
            <BringToFront size={14} /> Avanti
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            onClick={onDuplicate}
            title="Duplica (Ctrl+D)"
          >
            <CopyPlus size={14} /> Duplica
          </button>
        </div>
      </Field>

      <p className="text-[11px] text-slate-400 mb-3">
        Ridimensiona trascinando i bordi quando l'elemento è selezionato.
      </p>
      <button className={dangerBtnCls} onClick={onDelete}>
        <Trash2 size={15} /> Elimina elemento
      </button>
    </div>
  )
}
