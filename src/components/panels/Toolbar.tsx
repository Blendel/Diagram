import { useRef, type ChangeEvent } from 'react'
import {
  FilePlus,
  Download,
  Upload,
  Workflow,
  Moon,
  Sun,
  PanelLeft,
  PanelRight,
  FileImage,
  FileCode,
} from 'lucide-react'
import { useReactFlow } from '@xyflow/react'
import { useDiagramStore } from '../../store/useDiagramStore'
import { useUiStore } from '../../store/useUiStore'
import { downloadDiagram, readDiagramFile } from '../../lib/io'
import { exportImage } from '../../lib/exportImage'
import { btnCls } from '../../lib/ui'
import { DiagramsMenu } from './DiagramsMenu'

const iconBtn =
  'inline-flex items-center justify-center w-8 h-8 rounded-md border text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition'

export function Toolbar() {
  const name = useDiagramStore((s) => s.name)
  const setName = useDiagramStore((s) => s.setName)
  const newDiagram = useDiagramStore((s) => s.newDiagram)
  const loadDiagram = useDiagramStore((s) => s.loadDiagram)
  const toFile = useDiagramStore((s) => s.toFile)
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const pushEvent = useUiStore((s) => s.pushEvent)
  const showPalette = useUiStore((s) => s.showPalette)
  const showInspector = useUiStore((s) => s.showInspector)
  const togglePalette = useUiStore((s) => s.togglePalette)
  const toggleInspector = useUiStore((s) => s.toggleInspector)
  const { getNodes } = useReactFlow()
  const fileRef = useRef<HTMLInputElement>(null)

  const onExport = () => {
    downloadDiagram(toFile())
    pushEvent('success', 'Diagramma esportato (JSON)')
  }

  const onExportImage = async (format: 'png' | 'svg') => {
    try {
      await exportImage(format, getNodes(), theme === 'dark', name)
      pushEvent('success', `Esportato ${format.toUpperCase()}`)
    } catch {
      pushEvent('error', `Export ${format.toUpperCase()} fallito`)
    }
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

  const onNew = () => newDiagram()

  const activeBorder = (active: boolean) =>
    active ? 'border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700'

  return (
    <header className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 shrink-0">
      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
        <span className="grid place-items-center w-7 h-7 rounded-md bg-blue-600 text-white">
          <Workflow size={16} />
        </span>
        <span className="font-semibold hidden sm:inline">Architect</span>
      </div>

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

      <button
        className={`${iconBtn} ${activeBorder(showPalette)}`}
        onClick={togglePalette}
        title="Mostra/nascondi palette"
      >
        <PanelLeft size={15} />
      </button>

      <DiagramsMenu />

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome del diagramma"
        className="min-w-0 max-w-xs flex-1 rounded-md px-2 py-1 text-sm text-slate-700 dark:text-slate-200 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 focus:bg-slate-50 dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
      />

      <div className="ml-auto flex items-center gap-2">
        <button className={btnCls} onClick={toggleTheme} title={theme === 'dark' ? 'Tema chiaro' : 'Tema scuro'}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div className="hidden md:flex items-center gap-2">
          <button className={btnCls} onClick={() => onExportImage('png')} title="Esporta come immagine PNG">
            <FileImage size={15} /> PNG
          </button>
          <button className={btnCls} onClick={() => onExportImage('svg')} title="Esporta come vettoriale SVG">
            <FileCode size={15} /> SVG
          </button>
        </div>

        <button className={btnCls} onClick={onNew}>
          <FilePlus size={15} /> <span className="hidden lg:inline">Nuovo</span>
        </button>
        <button className={btnCls} onClick={() => fileRef.current?.click()}>
          <Upload size={15} /> <span className="hidden lg:inline">Importa</span>
        </button>
        <button className={btnCls} onClick={onExport}>
          <Download size={15} /> <span className="hidden lg:inline">Esporta</span>
        </button>

        <button
          className={`${iconBtn} ${activeBorder(showInspector)}`}
          onClick={toggleInspector}
          title="Mostra/nascondi inspector"
        >
          <PanelRight size={15} />
        </button>

        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
      </div>
    </header>
  )
}
