import { useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { Toolbar } from './components/panels/Toolbar'
import { NodePalette } from './components/panels/NodePalette'
import { Inspector } from './components/panels/Inspector'
import { StatusBar } from './components/panels/StatusBar'
import { FlowCanvas } from './components/canvas/FlowCanvas'
import { DetailView } from './components/detail/DetailView'
import { useDiagramStore } from './store/useDiagramStore'
import { useUiStore } from './store/useUiStore'

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
  const theme = useUiStore((s) => s.theme)
  const showPalette = useUiStore((s) => s.showPalette)
  const showInspector = useUiStore((s) => s.showInspector)

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
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
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
