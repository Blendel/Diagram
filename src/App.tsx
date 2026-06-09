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
  const theme = useUiStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Global undo/redo. Let native text undo win inside form fields.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // The detail view owns its own canvas state; don't undo the architecture under it.
      if (useUiStore.getState().detailNodeId) return
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') {
        // also support Ctrl+Y for redo
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !isEditableTarget(e.target)) {
          e.preventDefault()
          redo()
        }
        return
      }
      if (isEditableTarget(e.target)) return
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
        <Toolbar />
        <div className="flex flex-1 min-h-0">
          <NodePalette />
          <main className="relative flex-1 min-w-0" style={{ background: 'var(--canvas-bg)' }}>
            {hydrated ? (
              <FlowCanvas />
            ) : (
              <div className="grid place-items-center h-full text-sm text-slate-400">
                Caricamento del diagramma…
              </div>
            )}
          </main>
          <Inspector />
        </div>
        <StatusBar />
      </div>
      <DetailView />
    </ReactFlowProvider>
  )
}

export default App
