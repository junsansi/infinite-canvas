import { useEffect } from 'react'
import { useCanvasStore } from '../store/canvasStore'

export function useKeyboard(onShowShortcuts: () => void) {
  const store = useCanvasStore

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      // don't intercept when typing in inputs
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return

      const ctrl = e.ctrlKey || e.metaKey
      const shift = e.shiftKey
      const key = e.key

      const {
        selectedIds,
        elements,
        deleteSelected,
        copySelected,
        paste,
        undo,
        redo,
        selectAll,
        clearSelection,
        setTool,
        tool,
        updateElements,
        pushHistory,
      } = store.getState()

      // Ctrl+Z
      if (ctrl && !shift && key === 'z') { e.preventDefault(); undo(); return }
      // Ctrl+Shift+Z
      if (ctrl && shift && key === 'Z') { e.preventDefault(); redo(); return }
      // Ctrl+Y (alternate redo)
      if (ctrl && key === 'y') { e.preventDefault(); redo(); return }
      // Ctrl+C
      if (ctrl && key === 'c') { e.preventDefault(); copySelected(); return }
      // Ctrl+V
      if (ctrl && key === 'v') { e.preventDefault(); paste(); return }
      // Ctrl+A
      if (ctrl && key === 'a') { e.preventDefault(); selectAll(); return }
      // Delete / Backspace
      if (key === 'Delete' || key === 'Backspace') { e.preventDefault(); deleteSelected(); return }
      // Escape
      if (key === 'Escape') { clearSelection(); return }
      // H - pan tool
      if (key === 'h' || key === 'H') { setTool(tool === 'pan' ? 'select' : 'pan'); return }
      // V - select tool
      if (key === 'v' || key === 'V') { setTool('select'); return }
      // ? - shortcuts help
      if (key === '?') { onShowShortcuts(); return }

      // Arrow keys - nudge
      const NUDGE = shift ? 10 : 1
      let dx = 0, dy = 0
      if (key === 'ArrowLeft') dx = -NUDGE
      else if (key === 'ArrowRight') dx = NUDGE
      else if (key === 'ArrowUp') dy = -NUDGE
      else if (key === 'ArrowDown') dy = NUDGE

      if ((dx !== 0 || dy !== 0) && selectedIds.length > 0) {
        e.preventDefault()
        const patches = selectedIds
          .map((id) => elements.find((el) => el.id === id))
          .filter((el): el is NonNullable<typeof el> => !!el && !el.locked)
          .map((el) => ({ id: el.id, patch: { x: el.x + dx, y: el.y + dy } }))
        updateElements(patches)
        pushHistory()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onShowShortcuts, store])
}
