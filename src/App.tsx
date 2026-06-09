import { useEffect, useRef, useState, type DragEvent } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { Upload } from 'lucide-react'
import { Toolbar } from './components/panels/Toolbar'
import { NodePalette } from './components/panels/NodePalette'
import { Inspector } from './components/panels/Inspector'
import { StatusBar } from './components/panels/StatusBar'
import { FlowCanvas } from './components/canvas/FlowCanvas'
import { DetailView } from './components/detail/DetailView'
import { useDiagramStore } from './store/useDiagramStore'
import { useUiStore } from './store/useUiStore'
import { readDiagramFile } from './lib/io'

const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files')

function isEditableTarget(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null
  if (!node) return false
  const tag = node.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    node.isContentEditable === true
  )
}

function App() {
  const hydrated = useDiagramStore((s) => s.hydrated)
  const undo = useDiagramStore((s) => s.undo)
  const redo = useDiagramStore((s) => s.redo)
  const selectAll = useDiagramStore((s) => s.selectAll)
  const copySelection = useDiagramStore((s) => s.copySelection)
  const paste = useDiagramStore((s) => s.paste)
  const loadDiagram = useDiagramStore((s) => s.loadDiagram)
  const theme = useUiStore((s) => s.theme)
  const showPalette = useUiStore((s) => s.showPalette)
  const showInspector = useUiStore((s) => s.showInspector)
  const pushEvent = useUiStore((s) => s.pushEvent)

  // --- Drag & drop import: drop a .json diagram anywhere to open it ---
  const [fileDragging, setFileDragging] = useState(false)
  const dragDepth = useRef(0)
  const onDragEnter = (e: DragEvent) => {
    if (!hasFiles(e)) return
    dragDepth.current += 1
    setFileDragging(true)
  }
  const onDragOver = (e: DragEvent) => {
    if (hasFiles(e)) e.preventDefault()
  }
  const onDragLeave = (e: DragEvent) => {
    if (!hasFiles(e)) return
    dragDepth.current -= 1
    if (dragDepth.current <= 0) {
      dragDepth.current = 0
      setFileDragging(false)
    }
  }
  const onDrop = async (e: DragEvent) => {
    if (!hasFiles(e)) return
    e.preventDefault()
    dragDepth.current = 0
    setFileDragging(false)
    const f = e.dataTransfer.files[0]
    if (!f) return
    try {
      const file = await readDiagramFile(f)
      loadDiagram(file.diagram)
      pushEvent('success', `Importato: ${file.diagram.name}`)
    } catch (err) {
      pushEvent('error', `Import fallito: ${(err as Error).message}`)
    }
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Global shortcuts: undo/redo, select-all, copy/paste. Native behavior wins in form fields.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // The detail view owns its own canvas state; ignore global shortcuts under it.
      if (useUiStore.getState().detailNodeId) return
      if (!(e.ctrlKey || e.metaKey)) return
      if (isEditableTarget(e.target)) return
      const k = e.key.toLowerCase()
      if (k === 'z') {
        e.preventDefault()
        e.shiftKey ? redo() : undo()
      } else if (k === 'y') {
        e.preventDefault()
        redo()
      } else if (k === 'a') {
        e.preventDefault()
        selectAll()
      } else if (k === 'c') {
        const ids = useDiagramStore.getState().selectedNodeIds
        if (ids.length) {
          e.preventDefault()
          copySelection(ids)
        }
      } else if (k === 'v') {
        e.preventDefault()
        paste()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, selectAll, copySelection, paste])

  return (
    <ReactFlowProvider>
      <div
        className="relative flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {fileDragging && (
          <div className="absolute inset-0 z-[60] grid place-items-center bg-blue-500/10 backdrop-blur-[1px] pointer-events-none">
            <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-blue-400 bg-white/90 dark:bg-slate-800/90 px-8 py-6 text-blue-600 dark:text-blue-300 shadow-xl">
              <Upload size={28} />
              <span className="font-semibold">Rilascia il file .json per importarlo</span>
            </div>
          </div>
        )}
        <Toolbar />
        <div className="flex flex-1 min-h-0">
          {showPalette && <NodePalette />}
          <main className="relative flex-1 min-w-0" style={{ background: 'var(--canvas-bg)' }}>
            {hydrated ? (
              <FlowCanvas />
            ) : (
              <div className="grid place-items-center h-full text-sm text-slate-400">
                Caricamento del diagramma…
              </div>
            )}
          </main>
          {showInspector && <Inspector />}
        </div>
        <StatusBar />
      </div>
      <DetailView />
    </ReactFlowProvider>
  )
}

export default App
