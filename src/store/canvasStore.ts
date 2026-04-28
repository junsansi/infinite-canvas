import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type {
  CanvasElement,
  TextElement,
  StickyNoteElement,
  ShapeElement,
  ImageElement,
  ViewState,
} from '../types/canvas'

const STORAGE_KEY = 'infinite-canvas-data'
const MAX_HISTORY = 50

// ── helpers ──────────────────────────────────────────────────────────────────

function loadFromStorage(): CanvasElement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
function debouncedSave(elements: CanvasElement[]) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(elements))
    } catch {
      // storage full or unavailable
    }
  }, 500)
}

function nextZIndex(elements: CanvasElement[]): number {
  if (elements.length === 0) return 1
  return Math.max(...elements.map((e) => e.zIndex)) + 1
}

// ── store types ───────────────────────────────────────────────────────────────

interface CanvasStore {
  // state
  elements: CanvasElement[]
  selectedIds: string[]
  view: ViewState
  clipboard: CanvasElement[] | null
  past: CanvasElement[][]
  future: CanvasElement[][]
  tool: 'select' | 'pan'

  // view
  setView: (v: Partial<ViewState>) => void
  setTool: (t: 'select' | 'pan') => void

  // selection
  selectIds: (ids: string[]) => void
  clearSelection: () => void
  selectAll: () => void

  // elements CRUD
  addElement: (el: CanvasElement) => void
  updateElement: (id: string, patch: Partial<CanvasElement>) => void
  updateElements: (patches: { id: string; patch: Partial<CanvasElement> }[]) => void
  deleteSelected: () => void
  deleteById: (id: string) => void

  // clipboard
  copySelected: () => void
  paste: (offsetX?: number, offsetY?: number) => void

  // layer order
  bringForward: (id: string) => void
  sendBackward: (id: string) => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void

  // lock
  toggleLock: (id: string) => void

  // history
  undo: () => void
  redo: () => void
  pushHistory: () => void

  // persistence
  clearCanvas: () => void
  exportJSON: () => string
  importJSON: (json: string) => void

  // quick-add helpers
  addText: (x?: number, y?: number) => void
  addStickyNote: (x?: number, y?: number, color?: string) => void
  addRectangle: (x?: number, y?: number) => void
  addCircle: (x?: number, y?: number) => void
  addImage: (src: string, x?: number, y?: number, w?: number, h?: number) => void
}

// ── store ─────────────────────────────────────────────────────────────────────

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  elements: loadFromStorage(),
  selectedIds: [],
  view: { x: 0, y: 0, scale: 1 },
  clipboard: null,
  past: [],
  future: [],
  tool: 'select',

  // ── view ──────────────────────────────────────────────────────────────────
  setView: (v) => set((s) => ({ view: { ...s.view, ...v } })),
  setTool: (t) => set({ tool: t }),

  // ── selection ─────────────────────────────────────────────────────────────
  selectIds: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),
  selectAll: () =>
    set((s) => ({
      selectedIds: s.elements.filter((e) => !e.locked).map((e) => e.id),
    })),

  // ── history ───────────────────────────────────────────────────────────────
  pushHistory: () =>
    set((s) => {
      const snapshot = s.elements.map((e) => ({ ...e }))
      const past = [...s.past, snapshot].slice(-MAX_HISTORY)
      return { past, future: [] }
    }),

  undo: () =>
    set((s) => {
      if (s.past.length === 0) return {}
      const prev = s.past[s.past.length - 1]
      const past = s.past.slice(0, -1)
      const future = [s.elements.map((e) => ({ ...e })), ...s.future].slice(0, MAX_HISTORY)
      debouncedSave(prev)
      return { elements: prev, past, future, selectedIds: [] }
    }),

  redo: () =>
    set((s) => {
      if (s.future.length === 0) return {}
      const next = s.future[0]
      const future = s.future.slice(1)
      const past = [...s.past, s.elements.map((e) => ({ ...e }))].slice(-MAX_HISTORY)
      debouncedSave(next)
      return { elements: next, past, future, selectedIds: [] }
    }),

  // ── CRUD ──────────────────────────────────────────────────────────────────
  addElement: (el) =>
    set((s) => {
      const snapshot = s.elements.map((e) => ({ ...e }))
      const past = [...s.past, snapshot].slice(-MAX_HISTORY)
      const elements = [...s.elements, el]
      debouncedSave(elements)
      return { elements, past, future: [], selectedIds: [el.id] }
    }),

  updateElement: (id, patch) =>
    set((s) => {
      const elements = s.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as CanvasElement) : e))
      debouncedSave(elements)
      return { elements }
    }),

  updateElements: (patches) =>
    set((s) => {
      const patchMap = new Map(patches.map((p) => [p.id, p.patch]))
      const elements = s.elements.map((e) =>
        patchMap.has(e.id) ? ({ ...e, ...patchMap.get(e.id) } as CanvasElement) : e
      )
      debouncedSave(elements)
      return { elements }
    }),

  deleteSelected: () =>
    set((s) => {
      if (s.selectedIds.length === 0) return {}
      const snapshot = s.elements.map((e) => ({ ...e }))
      const past = [...s.past, snapshot].slice(-MAX_HISTORY)
      const elements = s.elements.filter((e) => !s.selectedIds.includes(e.id))
      debouncedSave(elements)
      return { elements, past, future: [], selectedIds: [] }
    }),

  deleteById: (id) =>
    set((s) => {
      const snapshot = s.elements.map((e) => ({ ...e }))
      const past = [...s.past, snapshot].slice(-MAX_HISTORY)
      const elements = s.elements.filter((e) => e.id !== id)
      debouncedSave(elements)
      return { elements, past, future: [], selectedIds: s.selectedIds.filter((i) => i !== id) }
    }),

  // ── clipboard ─────────────────────────────────────────────────────────────
  copySelected: () =>
    set((s) => {
      const copied = s.elements.filter((e) => s.selectedIds.includes(e.id))
      return { clipboard: copied.map((e) => ({ ...e })) }
    }),

  paste: (offsetX = 30, offsetY = 30) =>
    set((s) => {
      if (!s.clipboard || s.clipboard.length === 0) return {}
      const snapshot = s.elements.map((e) => ({ ...e }))
      const past = [...s.past, snapshot].slice(-MAX_HISTORY)
      let maxZ = nextZIndex(s.elements)
      const newEls = s.clipboard.map((e) => ({
        ...e,
        id: nanoid(),
        x: e.x + offsetX,
        y: e.y + offsetY,
        zIndex: maxZ++,
      }))
      const elements = [...s.elements, ...newEls]
      debouncedSave(elements)
      return { elements, past, future: [], selectedIds: newEls.map((e) => e.id) }
    }),

  // ── layer order ───────────────────────────────────────────────────────────
  bringForward: (id) =>
    set((s) => {
      const sorted = [...s.elements].sort((a, b) => a.zIndex - b.zIndex)
      const idx = sorted.findIndex((e) => e.id === id)
      if (idx === sorted.length - 1) return {}
      const snapshot = s.elements.map((e) => ({ ...e }))
      const past = [...s.past, snapshot].slice(-MAX_HISTORY)
      const above = sorted[idx + 1]
      const elements = s.elements.map((e) => {
        if (e.id === id) return { ...e, zIndex: above.zIndex }
        if (e.id === above.id) return { ...e, zIndex: sorted[idx].zIndex }
        return e
      })
      debouncedSave(elements)
      return { elements, past, future: [] }
    }),

  sendBackward: (id) =>
    set((s) => {
      const sorted = [...s.elements].sort((a, b) => a.zIndex - b.zIndex)
      const idx = sorted.findIndex((e) => e.id === id)
      if (idx === 0) return {}
      const snapshot = s.elements.map((e) => ({ ...e }))
      const past = [...s.past, snapshot].slice(-MAX_HISTORY)
      const below = sorted[idx - 1]
      const elements = s.elements.map((e) => {
        if (e.id === id) return { ...e, zIndex: below.zIndex }
        if (e.id === below.id) return { ...e, zIndex: sorted[idx].zIndex }
        return e
      })
      debouncedSave(elements)
      return { elements, past, future: [] }
    }),

  bringToFront: (id) =>
    set((s) => {
      const snapshot = s.elements.map((e) => ({ ...e }))
      const past = [...s.past, snapshot].slice(-MAX_HISTORY)
      const maxZ = nextZIndex(s.elements)
      const elements = s.elements.map((e) => (e.id === id ? { ...e, zIndex: maxZ } : e))
      debouncedSave(elements)
      return { elements, past, future: [] }
    }),

  sendToBack: (id) =>
    set((s) => {
      const snapshot = s.elements.map((e) => ({ ...e }))
      const past = [...s.past, snapshot].slice(-MAX_HISTORY)
      const minZ = Math.min(...s.elements.map((e) => e.zIndex)) - 1
      const elements = s.elements.map((e) => (e.id === id ? { ...e, zIndex: minZ } : e))
      debouncedSave(elements)
      return { elements, past, future: [] }
    }),

  // ── lock ──────────────────────────────────────────────────────────────────
  toggleLock: (id) =>
    set((s) => {
      const elements = s.elements.map((e) => (e.id === id ? { ...e, locked: !e.locked } : e))
      const selectedIds = s.selectedIds.filter((i) => i !== id)
      debouncedSave(elements)
      return { elements, selectedIds }
    }),

  // ── persistence ───────────────────────────────────────────────────────────
  clearCanvas: () =>
    set((s) => {
      const snapshot = s.elements.map((e) => ({ ...e }))
      const past = [...s.past, snapshot].slice(-MAX_HISTORY)
      localStorage.removeItem(STORAGE_KEY)
      return { elements: [], past, future: [], selectedIds: [] }
    }),

  exportJSON: () => {
    return JSON.stringify(get().elements, null, 2)
  },

  importJSON: (json) =>
    set((s) => {
      try {
        const parsed = JSON.parse(json)
        if (!Array.isArray(parsed)) throw new Error('Invalid format')
        const snapshot = s.elements.map((e) => ({ ...e }))
        const past = [...s.past, snapshot].slice(-MAX_HISTORY)
        debouncedSave(parsed)
        return { elements: parsed, past, future: [], selectedIds: [] }
      } catch {
        alert('导入失败：JSON 格式无效')
        return {}
      }
    }),

  // ── quick-add helpers ─────────────────────────────────────────────────────
  addText: (x = 400, y = 300) => {
    const el: TextElement = {
      id: nanoid(),
      type: 'text',
      x,
      y,
      width: 200,
      height: 40,
      rotation: 0,
      opacity: 1,
      locked: false,
      zIndex: nextZIndex(get().elements),
      text: '双击编辑文本',
      fontSize: 16,
      fontFamily: 'Inter',
      fill: '#333333',
      bold: false,
      italic: false,
      align: 'left',
    }
    get().addElement(el)
  },

  addStickyNote: (x = 400, y = 300, color = '#FEF08A') => {
    const el: StickyNoteElement = {
      id: nanoid(),
      type: 'sticky-note',
      x,
      y,
      width: 200,
      height: 160,
      rotation: 0,
      opacity: 1,
      locked: false,
      zIndex: nextZIndex(get().elements),
      text: '双击编辑便签',
      fontSize: 14,
      fontFamily: 'Inter',
      fill: '#333333',
      backgroundColor: color,
    }
    get().addElement(el)
  },

  addRectangle: (x = 400, y = 300) => {
    const el: ShapeElement = {
      id: nanoid(),
      type: 'rectangle',
      x,
      y,
      width: 160,
      height: 100,
      rotation: 0,
      opacity: 1,
      locked: false,
      zIndex: nextZIndex(get().elements),
      fill: '#93C5FD',
      stroke: '#3B82F6',
      strokeWidth: 2,
      cornerRadius: 8,
    }
    get().addElement(el)
  },

  addCircle: (x = 400, y = 300) => {
    const el: ShapeElement = {
      id: nanoid(),
      type: 'circle',
      x,
      y,
      width: 120,
      height: 120,
      rotation: 0,
      opacity: 1,
      locked: false,
      zIndex: nextZIndex(get().elements),
      fill: '#86EFAC',
      stroke: '#22C55E',
      strokeWidth: 2,
    }
    get().addElement(el)
  },

  addImage: (src, x = 400, y = 300, w = 300, h = 200) => {
    const el: ImageElement = {
      id: nanoid(),
      type: 'image',
      x,
      y,
      width: w,
      height: h,
      rotation: 0,
      opacity: 1,
      locked: false,
      zIndex: nextZIndex(get().elements),
      src,
      cornerRadius: 8,
    }
    get().addElement(el)
  },
}))
