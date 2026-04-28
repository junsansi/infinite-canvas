import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Stage, Layer, Rect } from 'react-konva'
import type Konva from 'konva'
import { useCanvasStore } from '../../store/canvasStore'
import GridBackground from './GridBackground'
import CanvasElements from './CanvasElements'
import TextEditorOverlay from '../TextEditor/TextEditorOverlay'
import type { TextEditState } from '../../types/canvas'
import type { TextElement, StickyNoteElement } from '../../types/canvas'

const MIN_SCALE = 0.1
const MAX_SCALE = 5

interface Props {
  onContextMenu: (e: React.MouseEvent, targetId: string | null) => void
}

const InfiniteCanvas: React.FC<Props> = ({ onContextMenu }) => {
  const stageRef = useRef<Konva.Stage>(null)
  const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [textEdit, setTextEdit] = useState<TextEditState | null>(null)

  const view = useCanvasStore((s) => s.view)
  const setView = useCanvasStore((s) => s.setView)
  const tool = useCanvasStore((s) => s.tool)
  const clearSelection = useCanvasStore((s) => s.clearSelection)
  const selectedIds = useCanvasStore((s) => s.selectedIds)
  const selectIds = useCanvasStore((s) => s.selectIds)
  const elements = useCanvasStore((s) => s.elements)
  const updateElement = useCanvasStore((s) => s.updateElement)
  const addStickyNote = useCanvasStore((s) => s.addStickyNote)
  const pushHistory = useCanvasStore((s) => s.pushHistory)

  // ── resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => setStageSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── pan state ─────────────────────────────────────────────────────────────
  const isPanning = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const spaceDown = useRef(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        spaceDown.current = true
        document.body.style.cursor = 'grab'
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceDown.current = false
        document.body.style.cursor = ''
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // ── wheel zoom ────────────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault()
      const stage = stageRef.current
      if (!stage) return

      const oldScale = view.scale
      const pointer = stage.getPointerPosition()
      if (!pointer) return

      const scaleBy = 1.08
      const direction = e.evt.deltaY < 0 ? 1 : -1
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, direction > 0 ? oldScale * scaleBy : oldScale / scaleBy))

      const mousePointTo = {
        x: (pointer.x - view.x) / oldScale,
        y: (pointer.y - view.y) / oldScale,
      }

      setView({
        scale: newScale,
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      })
    },
    [view, setView]
  )

  // ── mouse pan ─────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const isMiddle = e.evt.button === 1
      const isSpacePan = spaceDown.current && e.evt.button === 0
      const isPanTool = tool === 'pan' && e.evt.button === 0

      if (isMiddle || isSpacePan || isPanTool) {
        e.evt.preventDefault()
        isPanning.current = true
        lastPos.current = { x: e.evt.clientX, y: e.evt.clientY }
        document.body.style.cursor = 'grabbing'
        return
      }

      // click on empty stage → deselect
      if (e.target === e.target.getStage()) {
        clearSelection()
      }
    },
    [tool, clearSelection]
  )

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isPanning.current) return
      const dx = e.evt.clientX - lastPos.current.x
      const dy = e.evt.clientY - lastPos.current.y
      lastPos.current = { x: e.evt.clientX, y: e.evt.clientY }
      setView({ x: view.x + dx, y: view.y + dy })
    },
    [view, setView]
  )

  const handleMouseUp = useCallback(() => {
    if (isPanning.current) {
      isPanning.current = false
      document.body.style.cursor = spaceDown.current ? 'grab' : ''
    }
  }, [])

  // ── double-click on empty canvas → add sticky note ────────────────────────
  const handleDblClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // only fire on the stage background (no id = not a canvas element)
      if (e.target !== e.target.getStage()) return
      const stage = stageRef.current
      if (!stage) return
      const pos = stage.getPointerPosition()
      if (!pos) return
      const canvasX = (pos.x - view.x) / view.scale
      const canvasY = (pos.y - view.y) / view.scale
      addStickyNote(canvasX - 100, canvasY - 80)
    },
    [view, addStickyNote]
  )

  // ── context menu ──────────────────────────────────────────────────────────
  const handleContextMenu = useCallback(
    (e: Konva.KonvaEventObject<PointerEvent>, targetId: string | null) => {
      e.evt.preventDefault()
      const nativeEvent = e.evt as unknown as React.MouseEvent
      onContextMenu(nativeEvent, targetId)
    },
    [onContextMenu]
  )

  const handleStageContextMenu = useCallback(
    (e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault()
      if (e.target === e.target.getStage()) {
        const nativeEvent = e.evt as unknown as React.MouseEvent
        onContextMenu(nativeEvent, null)
      }
    },
    [onContextMenu]
  )

  // ── text editing ──────────────────────────────────────────────────────────
  const handleDblClickElement = useCallback(
    (id: string) => {
      const el = elements.find((e) => e.id === id)
      if (!el || (el.type !== 'text' && el.type !== 'sticky-note')) return
      const stage = stageRef.current
      if (!stage) return

      const absPos = {
        x: el.x * view.scale + view.x,
        y: el.y * view.scale + view.y,
      }

      if (el.type === 'text') {
        const t = el as TextElement
        setTextEdit({
          id,
          x: absPos.x,
          y: absPos.y,
          width: t.width * view.scale,
          height: Math.max(40, t.height * view.scale),
          fontSize: t.fontSize * view.scale,
          fontFamily: t.fontFamily,
          text: t.text,
          align: t.align,
          bold: t.bold,
          italic: t.italic,
          fill: t.fill,
        })
      } else {
        const s = el as StickyNoteElement
        setTextEdit({
          id,
          x: absPos.x + 12 * view.scale,
          y: absPos.y + 12 * view.scale,
          width: (s.width - 24) * view.scale,
          height: (s.height - 24) * view.scale,
          fontSize: s.fontSize * view.scale,
          fontFamily: s.fontFamily,
          text: s.text,
          align: 'left',
          bold: false,
          italic: false,
          fill: s.fill,
          backgroundColor: s.backgroundColor,
        })
      }
    },
    [elements, view]
  )

  const handleTextEditSave = useCallback(
    (id: string, text: string) => {
      updateElement(id, { text } as Partial<TextElement>)
      pushHistory()
      setTextEdit(null)
    },
    [updateElement, pushHistory]
  )

  // ── touch gestures ────────────────────────────────────────────────────────
  const lastDist = useRef(0)
  const lastCenter = useRef({ x: 0, y: 0 })

  const handleTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      e.evt.preventDefault()
      const touches = e.evt.touches
      if (touches.length === 2) {
        const t1 = touches[0]
        const t2 = touches[1]
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        const center = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        }

        if (lastDist.current > 0) {
          const scaleChange = dist / lastDist.current
          const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale * scaleChange))
          const dx = center.x - lastCenter.current.x
          const dy = center.y - lastCenter.current.y
          const mousePointTo = {
            x: (center.x - view.x) / view.scale,
            y: (center.y - view.y) / view.scale,
          }
          setView({
            scale: newScale,
            x: center.x - mousePointTo.x * newScale + dx,
            y: center.y - mousePointTo.y * newScale + dy,
          })
        }

        lastDist.current = dist
        lastCenter.current = center
      }
    },
    [view, setView]
  )

  const handleTouchEnd = useCallback(() => {
    lastDist.current = 0
  }, [])

  const cursorStyle = tool === 'pan' ? 'grab' : 'default'

  return (
    <div style={{ width: '100%', height: '100%', cursor: cursorStyle, background: '#f8fafc' }}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        x={view.x}
        y={view.y}
        scaleX={view.scale}
        scaleY={view.scale}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDblClick={handleDblClick}
        onContextMenu={handleStageContextMenu}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ display: 'block' }}
      >
        <GridBackground
          viewX={view.x}
          viewY={view.y}
          scale={view.scale}
          width={stageSize.width}
          height={stageSize.height}
        />
        <CanvasElements
          onDblClickElement={handleDblClickElement}
          onContextMenu={handleContextMenu}
        />
      </Stage>

      {textEdit && (
        <TextEditorOverlay
          state={textEdit}
          onSave={handleTextEditSave}
          onClose={() => setTextEdit(null)}
        />
      )}
    </div>
  )
}

export default InfiniteCanvas
