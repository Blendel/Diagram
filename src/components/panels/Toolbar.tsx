import { useRef, type ChangeEvent } from 'react'
import { FilePlus, Download, Upload, Workflow, Moon, Sun } from 'lucide-react'
import { useDiagramStore } from '../../store/useDiagramStore'
import { useUiStore } from '../../store/useUiStore'
import { downloadDiagram, readDiagramFile } from '../../lib/io'
import { btnCls } from '../../lib/ui'

export function Toolbar() {
  const name = useDiagramStore((s) => s.name)
  const setName = useDiagramStore((s) => s.setName)
  const newDiagram = useDiagramStore((s) => s.newDiagram)
  const loadDiagram = useDiagramStore((s) => s.loadDiagram)
  const toFile = useDiagramStore((s) => s.toFile)
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const pushEvent = useUiStore((s) => s.pushEvent)
  const fileRef = useRef<HTMLInputElement>(null)

  const onExport = () => {
    downloadDiagram(toFile())
    pushEvent('success', 'Diagramma esportato')
  }

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const file = await readDiagramFile(f)
      loadDiagram(file.diagram)
      pushEvent('success', `Importato: ${file.diagram.name}`)
    } catch (err) {
      pushEvent('error', `Import fallito: ${(err as Error).message}`)
      alert(`Impossibile importare il file: ${(err as Error).message}`)
    } finally {
      e.target.value = ''
    }
  }

  const onNew = () => {
    if (confirm('Creare un nuovo diagramma? Le modifiche non esportate andranno perse.')) {
      newDiagram()
      pushEvent('info', 'Nuovo diagramma')
    }
  }

  return (
    <header className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 shrink-0">
      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
        <span className="grid place-items-center w-7 h-7 rounded-md bg-blue-600 text-white">
          <Workflow size={16} />
        </span>
        <span className="font-semibold">Architect</span>
      </div>

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome del diagramma"
        className="min-w-0 max-w-xs flex-1 rounded-md px-2 py-1 text-sm text-slate-700 dark:text-slate-200 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 focus:bg-slate-50 dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
      />

      <div className="ml-auto flex items-center gap-2">
        <button
          className={btnCls}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Tema chiaro' : 'Tema scuro'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <button className={btnCls} onClick={onNew}>
          <FilePlus size={15} /> Nuovo
        </button>
        <button className={btnCls} onClick={() => fileRef.current?.click()}>
          <Upload size={15} /> Importa
        </button>
        <button className={btnCls} onClick={onExport}>
          <Download size={15} /> Esporta
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onFile}
        />
      </div>
    </header>
  )
}
