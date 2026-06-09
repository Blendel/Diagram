import type { ComponentType } from 'react'
import {
  Frame,
  PanelTop,
  Heading,
  Type,
  RectangleHorizontal,
  TextCursorInput,
  Image,
  Square,
  List,
  Minus,
  CircleUser,
  Tag,
  AppWindow,
  SquareCheck,
  ToggleLeft,
  Sidebar,
  PanelBottom,
  WrapText,
  SquareChevronDown,
  CircleDot,
  SlidersHorizontal,
  Table2,
  BarChart3,
  LoaderCircle,
  Route,
  Ellipsis,
  Star,
  SquareDashed,
  SquareStack,
} from 'lucide-react'
import type { UiKind } from '../types/diagram'

export type IconComponent = ComponentType<{
  size?: number | string
  className?: string
  strokeWidth?: number
  color?: string
}>

export interface UiKindMeta {
  kind: UiKind
  label: string
  icon: IconComponent
  accent: string
  /** Default size when the element is dropped on the page. */
  w: number
  h: number
}

export const UI_CATALOG: Record<UiKind, UiKindMeta> = {
  frame: { kind: 'frame', label: 'Schermo / Frame', icon: Frame, accent: '#475569', w: 340, h: 560 },
  navbar: { kind: 'navbar', label: 'Navbar', icon: PanelTop, accent: '#2563eb', w: 300, h: 46 },
  heading: { kind: 'heading', label: 'Titolo', icon: Heading, accent: '#0f172a', w: 240, h: 44 },
  text: { kind: 'text', label: 'Testo', icon: Type, accent: '#64748b', w: 240, h: 84 },
  button: { kind: 'button', label: 'Bottone', icon: RectangleHorizontal, accent: '#2563eb', w: 140, h: 40 },
  input: { kind: 'input', label: 'Campo input', icon: TextCursorInput, accent: '#0d9488', w: 240, h: 42 },
  image: { kind: 'image', label: 'Immagine', icon: Image, accent: '#7c3aed', w: 220, h: 150 },
  card: { kind: 'card', label: 'Card', icon: Square, accent: '#0891b2', w: 240, h: 170 },
  list: { kind: 'list', label: 'Lista', icon: List, accent: '#d97706', w: 240, h: 170 },
  divider: { kind: 'divider', label: 'Divisore', icon: Minus, accent: '#94a3b8', w: 240, h: 12 },
  avatar: { kind: 'avatar', label: 'Avatar', icon: CircleUser, accent: '#7c3aed', w: 56, h: 56 },
  badge: { kind: 'badge', label: 'Badge', icon: Tag, accent: '#16a34a', w: 92, h: 26 },
  tabs: { kind: 'tabs', label: 'Tabs', icon: AppWindow, accent: '#2563eb', w: 280, h: 40 },
  checkbox: { kind: 'checkbox', label: 'Checkbox', icon: SquareCheck, accent: '#0d9488', w: 180, h: 28 },
  toggle: { kind: 'toggle', label: 'Toggle', icon: ToggleLeft, accent: '#2563eb', w: 120, h: 28 },
  sidebar: { kind: 'sidebar', label: 'Sidebar', icon: Sidebar, accent: '#475569', w: 160, h: 360 },
  footer: { kind: 'footer', label: 'Footer', icon: PanelBottom, accent: '#475569', w: 320, h: 56 },
  textarea: { kind: 'textarea', label: 'Area di testo', icon: WrapText, accent: '#0d9488', w: 240, h: 90 },
  select: { kind: 'select', label: 'Select / Dropdown', icon: SquareChevronDown, accent: '#0d9488', w: 220, h: 40 },
  radio: { kind: 'radio', label: 'Radio group', icon: CircleDot, accent: '#0d9488', w: 200, h: 96 },
  slider: { kind: 'slider', label: 'Slider', icon: SlidersHorizontal, accent: '#2563eb', w: 220, h: 32 },
  table: { kind: 'table', label: 'Tabella', icon: Table2, accent: '#d97706', w: 320, h: 180 },
  chart: { kind: 'chart', label: 'Grafico', icon: BarChart3, accent: '#0891b2', w: 280, h: 180 },
  progress: { kind: 'progress', label: 'Progress', icon: LoaderCircle, accent: '#16a34a', w: 220, h: 20 },
  breadcrumb: { kind: 'breadcrumb', label: 'Breadcrumb', icon: Route, accent: '#64748b', w: 260, h: 28 },
  pagination: { kind: 'pagination', label: 'Pagination', icon: Ellipsis, accent: '#475569', w: 220, h: 36 },
  icon: { kind: 'icon', label: 'Icona', icon: Star, accent: '#d97706', w: 48, h: 48 },
  container: { kind: 'container', label: 'Contenitore', icon: SquareDashed, accent: '#94a3b8', w: 320, h: 220 },
  modal: { kind: 'modal', label: 'Modal / Dialog', icon: SquareStack, accent: '#1e293b', w: 320, h: 200 },
}

export const UI_ORDER: UiKind[] = [
  // layout
  'frame',
  'navbar',
  'sidebar',
  'footer',
  'container',
  'modal',
  // typography
  'heading',
  'text',
  'breadcrumb',
  // form
  'input',
  'textarea',
  'select',
  'radio',
  'checkbox',
  'toggle',
  'slider',
  'button',
  // data / media
  'table',
  'list',
  'chart',
  'image',
  'icon',
  'avatar',
  // misc
  'tabs',
  'card',
  'badge',
  'progress',
  'pagination',
  'divider',
]
