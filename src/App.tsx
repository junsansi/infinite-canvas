import React, { useState, useCallback } from 'react'
import InfiniteCanvas from './components/Canvas/InfiniteCanvas'
import Toolbar from './components/Toolbar/Toolbar'
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel'
import ContextMenu from './components/ContextMenu/ContextMenu'
import ShortcutsHelp from './components/ShortcutsHelp/ShortcutsHelp'
import { useCanvasStore } from './store/canvasStore'
import { useKeyboard } from './hooks/useKeyboard'

interface CtxMenu {
  x: number
  y: number
  targetId: string | null
}

const App: React.FC = () => {
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const selectedIds = useCanvasStore((s) => s.selectedIds)
  const elements = useCanvasStore((s) => s.elements)
  const clearCanvas = useCanvasStore((s) => s.clearCanvas)

  const selectedElement = selectedIds.length === 1
    ? elements.find((e) => e.id === selectedIds[0]) ?? null
    : null

  const handleContextMenu = useCallback((e: React.MouseEvent, targetId: string | null) => {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY, targetId })
  }, [])

  const handleShowShortcuts = useCallback(() => setShowShortcuts(true), [])

  useKeyboard(handleShowShortcuts)

  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      {/* Canvas */}
      <InfiniteCanvas onContextMenu={handleContextMenu} />

      {/* Toolbar */}
      <Toolbar
        onShowShortcuts={handleShowShortcuts}
        onClearCanvas={() => setShowClearConfirm(true)}
      />

      {/* Properties panel */}
      {selectedElement && !selectedElement.locked && (
        <PropertiesPanel key={selectedElement.id} element={selectedElement} />
      )}

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          targetId={ctxMenu.targetId}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* Shortcuts help */}
      {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}

      {/* Clear confirm dialog */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 mx-4">
            <h3 className="text-base font-semibold text-gray-800 mb-2">清空画布</h3>
            <p className="text-sm text-gray-500 mb-5">确定要清空所有元素吗？此操作可以通过撤销恢复。</p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                onClick={() => setShowClearConfirm(false)}
              >
                取消
              </button>
              <button
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                onClick={() => { clearCanvas(); setShowClearConfirm(false) }}
              >
                清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
