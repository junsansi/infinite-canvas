import React, { useRef, useCallback } from 'react'
import {
  MousePointer2,
  Hand,
  Type,
  StickyNote,
  Square,
  Circle,
  ImageIcon,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Keyboard,
} from 'lucide-react'
import { useCanvasStore } from '../../store/canvasStore'

interface Props {
  onShowShortcuts: () => void
  onClearCanvas: () => void
}

const Toolbar: React.FC<Props> = ({ onShowShortcuts, onClearCanvas }) => {
  const tool = useCanvasStore((s) => s.tool)
  const setTool = useCanvasStore((s) => s.setTool)
  const view = useCanvasStore((s) => s.view)
  const setView = useCanvasStore((s) => s.setView)
  const undo = useCanvasStore((s) => s.undo)
  const redo = useCanvasStore((s) => s.redo)
  const past = useCanvasStore((s) => s.past)
  const future = useCanvasStore((s) => s.future)
  const addText = useCanvasStore((s) => s.addText)
  const addStickyNote = useCanvasStore((s) => s.addStickyNote)
  const addRectangle = useCanvasStore((s) => s.addRectangle)
  const addCircle = useCanvasStore((s) => s.addCircle)
  const addImage = useCanvasStore((s) => s.addImage)
  const exportJSON = useCanvasStore((s) => s.exportJSON)
  const importJSON = useCanvasStore((s) => s.importJSON)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const centerPos = useCallback(() => {
    return {
      x: (window.innerWidth / 2 - view.x) / view.scale,
      y: (window.innerHeight / 2 - view.y) / view.scale,
    }
  }, [view])

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const src = ev.target?.result as string
        const img = new window.Image()
        img.onload = () => {
          const maxW = 400
          const ratio = img.naturalWidth / img.naturalHeight
          const w = Math.min(maxW, img.naturalWidth)
          const h = w / ratio
          const pos = centerPos()
          addImage(src, pos.x - w / 2, pos.y - h / 2, w, h)
        }
        img.src = src
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    },
    [addImage, centerPos]
  )

  const handleExport = useCallback(() => {
    const json = exportJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'canvas-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [exportJSON])

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const json = ev.target?.result as string
        importJSON(json)
      }
      reader.readAsText(file)
      e.target.value = ''
    },
    [importJSON]
  )

  const zoomPercent = Math.round(view.scale * 100)

  const btnBase =
    'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-95 tooltip'
  const btnActive = 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700'
  const divider = <div className="w-px h-6 bg-gray-200 mx-1" />

  const addAtCenter = useCallback(
    (fn: (x: number, y: number) => void) => {
      const pos = centerPos()
      fn(pos.x - 80, pos.y - 40)
    },
    [centerPos]
  )

  return (
    <div
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-3 py-2 rounded-2xl shadow-lg border border-gray-200/80"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Logo */}
      <span className="text-sm font-semibold text-gray-800 mr-2 select-none whitespace-nowrap">
        🎨 Infinite Canvas
      </span>

      {divider}

      {/* Tool mode */}
      <button
        className={`${btnBase} ${tool === 'select' ? btnActive : ''}`}
        data-tip="选择 (V)"
        onClick={() => setTool('select')}
      >
        <MousePointer2 size={16} />
      </button>
      <button
        className={`${btnBase} ${tool === 'pan' ? btnActive : ''}`}
        data-tip="平移 (H)"
        onClick={() => setTool('pan')}
      >
        <Hand size={16} />
      </button>

      {divider}

      {/* Add elements */}
      <button
        className={btnBase}
        data-tip="添加文本"
        onClick={() => addAtCenter((x, y) => addText(x, y))}
      >
        <Type size={16} />
      </button>
      <button
        className={btnBase}
        data-tip="添加便签"
        onClick={() => addAtCenter((x, y) => addStickyNote(x, y))}
      >
        <StickyNote size={16} />
      </button>
      <button
        className={btnBase}
        data-tip="添加矩形"
        onClick={() => addAtCenter((x, y) => addRectangle(x, y))}
      >
        <Square size={16} />
      </button>
      <button
        className={btnBase}
        data-tip="添加圆形"
        onClick={() => addAtCenter((x, y) => addCircle(x, y))}
      >
        <Circle size={16} />
      </button>
      <button
        className={btnBase}
        data-tip="上传图片"
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageIcon size={16} />
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {divider}

      {/* Undo / Redo */}
      <button
        className={`${btnBase} ${past.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
        data-tip="撤销 (Ctrl+Z)"
        onClick={undo}
        disabled={past.length === 0}
      >
        <Undo2 size={16} />
      </button>
      <button
        className={`${btnBase} ${future.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
        data-tip="重做 (Ctrl+Shift+Z)"
        onClick={redo}
        disabled={future.length === 0}
      >
        <Redo2 size={16} />
      </button>

      {divider}

      {/* Zoom */}
      <button
        className={btnBase}
        data-tip="缩小"
        onClick={() => setView({ scale: Math.max(0.1, view.scale / 1.2) })}
      >
        <ZoomOut size={16} />
      </button>
      <span className="text-xs font-medium text-gray-600 w-10 text-center select-none">
        {zoomPercent}%
      </span>
      <button
        className={btnBase}
        data-tip="放大"
        onClick={() => setView({ scale: Math.min(5, view.scale * 1.2) })}
      >
        <ZoomIn size={16} />
      </button>
      <button
        className={btnBase}
        data-tip="重置视图"
        onClick={() => setView({ x: 0, y: 0, scale: 1 })}
      >
        <Maximize2 size={16} />
      </button>

      {divider}

      {/* Export / Import */}
      <button className={btnBase} data-tip="导出 JSON" onClick={handleExport}>
        <Download size={16} />
      </button>
      <button className={btnBase} data-tip="导入 JSON" onClick={() => importInputRef.current?.click()}>
        <Upload size={16} />
      </button>
      <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

      {/* Clear */}
      <button
        className={`${btnBase} hover:bg-red-50 hover:text-red-500`}
        data-tip="清空画布"
        onClick={onClearCanvas}
      >
        <Trash2 size={16} />
      </button>

      {/* Shortcuts */}
      <button className={btnBase} data-tip="快捷键 (?)" onClick={onShowShortcuts}>
        <Keyboard size={16} />
      </button>
    </div>
  )
}

export default Toolbar
