import type { CSSProperties } from 'react'

/** Build a style object containing CSS custom properties (typed as CSSProperties). */
export const cssVars = (v: Record<string, string | number>): CSSProperties =>
  v as unknown as CSSProperties

/** Shared, theme-aware class strings for form controls and buttons. */

export const inputCls =
  'w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40'

export const btnCls =
  'inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition'

export const primaryBtnCls =
  'inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition'

export const dangerBtnCls =
  'inline-flex items-center gap-1.5 rounded-md border border-red-200 dark:border-red-900/60 px-2.5 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition'
