import React, { useEffect, useRef } from 'react'
import type { TextEditState } from '../../types/canvas'

interface Props {
  state: TextEditState
  onSave: (id: string, text: string) => void
  onClose: () => void
}

const TextEditorOverlay: React.FC<Props> = ({ state, onSave, onClose }) => {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    el.select()
  }, [])

  const handleBlur = () => {
    onSave(state.id, ref.current?.value ?? state.text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
    e.stopPropagation()
  }

  const fontStyle = [state.bold ? 'bold' : '', state.italic ? 'italic' : ''].filter(Boolean).join(' ') || 'normal'

  return (
    <textarea
      ref={ref}
      defaultValue={state.text}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        left: state.x,
        top: state.y,
        width: state.width,
        minHeight: state.height,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        fontWeight: state.bold ? 'bold' : 'normal',
        fontStyle: state.italic ? 'italic' : 'normal',
        color: state.fill,
        background: state.backgroundColor ?? 'transparent',
        border: '2px solid #3B82F6',
        borderRadius: 4,
        outline: 'none',
        resize: 'none',
        padding: '2px 4px',
        lineHeight: 1.4,
        zIndex: 9999,
        overflow: 'hidden',
        boxSizing: 'border-box',
        textAlign: state.align,
      }}
    />
  )
}

export default TextEditorOverlay
