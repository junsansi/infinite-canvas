import React, { useEffect, useRef } from 'react'
import {
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
  StickyNote,
  Maximize2,
  ClipboardPaste,
} from 'lucide-react'
import { useCanvasStore } from '../../store/canvasStore'

interface Props {
  x: number
  y: number
  targetId: string | null
  onClose: () => void
}

const ContextMenu: React.FC<Props> = ({ x, y, targetId, onClose }) => {
  const ref = useRef<HTMLDivElement>(null)

  const elements = useCanvasStore((s) => s.elements)
  const clipboard = useCanvasStore((s) => s.clipboard)
  const deleteById = useCanvasStore((s) => s.deleteById)
  const copySelected = useCanvasStore((s) => s.copySelected)
  const paste = useCanvasStore((s) => s.paste)
  const bringForward = useCanvasStore((s) => s.bringForward)
  const sendBackward = useCanvasStore((s) => s.sendBackward)
  const toggleLock = useCanvasStore((s) => s.toggleLock)
  const addStickyNote = useCanvasStore((s) => s.addStickyNote)
  const setView = useCanvasStore((s) => s.setView)
  const view = useCanvasStore((s) => s.view)
  const selectIds = useCanvasStore((s) => s.selectIds)

  const targetEl = targetId ? elements.find((e) => e.id === targetId) : null

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', escHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', escHandler)
    }
  }, [onClose])

  // adjust position to stay in viewport
  const menuW = 200
  const menuH = 300
  const adjustedX = x + menuW > window.innerWidth ? x - menuW : x
  const adjustedY = y + menuH > window.innerHeight ? y - menuH : y

  const Item: React.FC<{
    icon: React.ReactNode
    label: string
    shortcut?: string
    onClick: () => void
    danger?: boolean
    disabled?: boolean
  }> = ({ icon, label, shortcut, onClick, danger, disabled }) => (
    <button
      disabled={disabled}
      onClick={() => { if (!disabled) { onClick(); onClose() } }}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors text-left
        ${disabled ? 'opacity-40 cursor-not-allowed' : danger ? 'hover:bg-red-500/20 text-red-300' : 'hover:bg-white/10 text-gray-200'}`}
    >
      <span className="w-4 flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-xs text-gray-500">{shortcut}</span>}
    </button>
  )

  const Divider = () => <div className="h-px bg-white/10 my-1" />

  return (
    <div
      ref={ref}
      className="context-menu-enter fixed z-[9999] py-1.5 px-1.5 rounded-xl shadow-2xl border border-white/10 min-w-[180px]"
      style={{
        left: adjustedX,
        top: adjustedY,
        background: 'rgba(30,30,35,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {targetEl ? (
        <>
          <Item
            icon={<Copy size={14} />}
            label="复制"
            shortcut="Ctrl+C"
            onClick={() => { selectIds([targetEl.id]); copySelected() }}
          />
          <Item
            icon={<Trash2 size={14} />}
            label="删除"
            shortcut="Del"
            onClick={() => deleteById(targetEl.id)}
            danger
          />
          <Divider />
          <Item
            icon={<ChevronUp size={14} />}
            label="上移一层"
            onClick={() => bringForward(targetEl.id)}
          />
          <Item
            icon={<ChevronDown size={14} />}
            label="下移一层"
            onClick={() => sendBackward(targetEl.id)}
          />
          <Divider />
          <Item
            icon={targetEl.locked ? <Unlock size={14} /> : <Lock size={14} />}
            label={targetEl.locked ? '解锁元素' : '锁定元素'}
            onClick={() => toggleLock(targetEl.id)}
          />
        </>
      ) : (
        <>
          <Item
            icon={<ClipboardPaste size={14} />}
            label="粘贴"
            shortcut="Ctrl+V"
            disabled={!clipboard || clipboard.length === 0}
            onClick={() => paste()}
          />
          <Item
            icon={<StickyNote size={14} />}
            label="添加便签"
            onClick={() => {
              const cx = (x - view.x) / view.scale
              const cy = (y - view.y) / view.scale
              addStickyNote(cx - 100, cy - 80)
            }}
          />
          <Divider />
          <Item
            icon={<Maximize2 size={14} />}
            label="重置视图"
            onClick={() => setView({ x: 0, y: 0, scale: 1 })}
          />
        </>
      )}
    </div>
  )
}

export default ContextMenu
