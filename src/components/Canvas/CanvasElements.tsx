import React, { useRef, useCallback, useEffect } from 'react'
import { Layer, Rect, Text, Circle, Group, Transformer, Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import type {
  CanvasElement,
  TextElement,
  StickyNoteElement,
  ShapeElement,
  ImageElement,
} from '../../types/canvas'
import { useCanvasStore } from '../../store/canvasStore'

// ── image cache ───────────────────────────────────────────────────────────────
const imageCache = new Map<string, HTMLImageElement>()

function useHTMLImage(src: string): HTMLImageElement | null {
  const [img, setImg] = React.useState<HTMLImageElement | null>(() => imageCache.get(src) ?? null)
  useEffect(() => {
    if (imageCache.has(src)) {
      setImg(imageCache.get(src)!)
      return
    }
    const el = new window.Image()
    el.onload = () => {
      imageCache.set(src, el)
      setImg(el)
    }
    el.src = src
  }, [src])
  return img
}

// ── element wrappers ──────────────────────────────────────────────────────────

interface ElemProps<T extends Konva.Node> {
  el: CanvasElement
  draggable: boolean
  nodeRef: (node: T | null) => void
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void
  onDblClick: () => void
  onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => void
}

const TextNode = React.memo(({ el, draggable, nodeRef, onSelect, onDragEnd, onTransformEnd, onDblClick, onContextMenu }: ElemProps<Konva.Text>) => {
  const t = el as TextElement
  return (
    <Text
      ref={nodeRef}
      id={t.id}
      x={t.x}
      y={t.y}
      width={t.width}
      text={t.text}
      fontSize={t.fontSize}
      fontFamily={t.fontFamily}
      fill={t.fill}
      fontStyle={[t.bold ? 'bold' : '', t.italic ? 'italic' : ''].filter(Boolean).join(' ') || 'normal'}
      align={t.align}
      rotation={t.rotation}
      opacity={t.opacity}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
      onDblClick={onDblClick}
      onContextMenu={onContextMenu}
      wrap="word"
    />
  )
})

const StickyNoteNode = React.memo(({ el, draggable, nodeRef, onSelect, onDragEnd, onTransformEnd, onDblClick, onContextMenu }: ElemProps<Konva.Group>) => {
  const s = el as StickyNoteElement
  return (
    <Group
      ref={nodeRef}
      id={s.id}
      x={s.x}
      y={s.y}
      width={s.width}
      height={s.height}
      rotation={s.rotation}
      opacity={s.opacity}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
      onDblClick={onDblClick}
      onContextMenu={onContextMenu}
    >
      <Rect
        width={s.width}
        height={s.height}
        fill={s.backgroundColor}
        cornerRadius={12}
        shadowColor="rgba(0,0,0,0.12)"
        shadowBlur={10}
        shadowOffsetX={0}
        shadowOffsetY={3}
      />
      <Text
        x={12}
        y={12}
        width={s.width - 24}
        height={s.height - 24}
        text={s.text}
        fontSize={s.fontSize}
        fontFamily={s.fontFamily}
        fill={s.fill}
        wrap="word"
        listening={false}
      />
    </Group>
  )
})

const RectNode = React.memo(({ el, draggable, nodeRef, onSelect, onDragEnd, onTransformEnd, onContextMenu }: ElemProps<Konva.Rect>) => {
  const s = el as ShapeElement
  return (
    <Rect
      ref={nodeRef}
      id={s.id}
      x={s.x}
      y={s.y}
      width={s.width}
      height={s.height}
      fill={s.fill}
      stroke={s.stroke}
      strokeWidth={s.strokeWidth}
      cornerRadius={s.cornerRadius ?? 0}
      rotation={s.rotation}
      opacity={s.opacity}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
      onContextMenu={onContextMenu}
    />
  )
})

const CircleNode = React.memo(({ el, draggable, nodeRef, onSelect, onDragEnd, onTransformEnd, onContextMenu }: ElemProps<Konva.Circle>) => {
  const s = el as ShapeElement
  return (
    <Circle
      ref={nodeRef}
      id={s.id}
      x={s.x + s.width / 2}
      y={s.y + s.height / 2}
      radiusX={s.width / 2}
      radiusY={s.height / 2}
      fill={s.fill}
      stroke={s.stroke}
      strokeWidth={s.strokeWidth}
      rotation={s.rotation}
      opacity={s.opacity}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
      onContextMenu={onContextMenu}
    />
  )
})

const ImageNodeInner = React.memo(({ el, draggable, nodeRef, onSelect, onDragEnd, onTransformEnd, onDblClick, onContextMenu }: ElemProps<Konva.Image>) => {
  const img = el as ImageElement
  const htmlImg = useHTMLImage(img.src)
  if (!htmlImg) return null
  return (
    <KonvaImage
      ref={nodeRef}
      id={img.id}
      image={htmlImg}
      x={img.x}
      y={img.y}
      width={img.width}
      height={img.height}
      rotation={img.rotation}
      opacity={img.opacity}
      cornerRadius={img.cornerRadius}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
      onDblClick={onDblClick}
      onContextMenu={onContextMenu}
      shadowColor="rgba(0,0,0,0.15)"
      shadowBlur={8}
      shadowOffsetX={0}
      shadowOffsetY={2}
    />
  )
})

// ── main ──────────────────────────────────────────────────────────────────────

interface Props {
  onDblClickElement: (id: string) => void
  onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>, id: string) => void
}

const CanvasElements: React.FC<Props> = ({ onDblClickElement, onContextMenu }) => {
  const elements = useCanvasStore((s) => s.elements)
  const selectedIds = useCanvasStore((s) => s.selectedIds)
  const tool = useCanvasStore((s) => s.tool)
  const selectIds = useCanvasStore((s) => s.selectIds)
  const updateElement = useCanvasStore((s) => s.updateElement)
  const pushHistory = useCanvasStore((s) => s.pushHistory)

  const transformerRef = useRef<Konva.Transformer>(null)
  const nodeRefs = useRef<Map<string, Konva.Node>>(new Map())

  // sync transformer nodes
  useEffect(() => {
    if (!transformerRef.current) return
    const nodes = selectedIds
      .map((id) => nodeRefs.current.get(id))
      .filter((n): n is Konva.Node => !!n)
    transformerRef.current.nodes(nodes)
    transformerRef.current.getLayer()?.batchDraw()
  }, [selectedIds, elements])

  const handleSelect = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>, id: string) => {
      e.cancelBubble = true
      const el = elements.find((el) => el.id === id)
      if (el?.locked) return
      if (e.evt.shiftKey) {
        selectIds(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id])
      } else {
        if (!selectedIds.includes(id)) selectIds([id])
      }
    },
    [elements, selectedIds, selectIds]
  )

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
      const node = e.target
      const el = elements.find((el) => el.id === id)
      if (!el) return
      if (el.type === 'circle') {
        const s = el as ShapeElement
        updateElement(id, { x: node.x() - s.width / 2, y: node.y() - s.height / 2 })
      } else {
        updateElement(id, { x: node.x(), y: node.y() })
      }
      pushHistory()
    },
    [elements, updateElement, pushHistory]
  )

  const handleTransformEnd = useCallback(
    (e: Konva.KonvaEventObject<Event>, id: string) => {
      const node = e.target
      const el = elements.find((el) => el.id === id)
      if (!el) return
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()
      node.scaleX(1)
      node.scaleY(1)
      const newW = Math.max(20, node.width() * scaleX)
      const newH = Math.max(20, node.height() * scaleY)
      if (el.type === 'circle') {
        updateElement(id, {
          x: node.x() - newW / 2,
          y: node.y() - newH / 2,
          width: newW,
          height: newH,
          rotation: node.rotation(),
        })
      } else {
        updateElement(id, {
          x: node.x(),
          y: node.y(),
          width: newW,
          height: newH,
          rotation: node.rotation(),
        })
      }
      pushHistory()
    },
    [elements, updateElement, pushHistory]
  )

  const setRef = useCallback((id: string) => (node: Konva.Node | null) => {
    if (node) nodeRefs.current.set(id, node)
    else nodeRefs.current.delete(id)
  }, [])

  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex)

  return (
    <Layer>
      {sorted.map((el) => {
        const isSelected = selectedIds.includes(el.id)
        const draggable = tool === 'select' && !el.locked

        const commonProps = {
          el,
          draggable,
          isSelected,
          nodeRef: setRef(el.id),
          onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => handleSelect(e, el.id),
          onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(e, el.id),
          onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleTransformEnd(e, el.id),
          onDblClick: () => onDblClickElement(el.id),
          onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => onContextMenu(e, el.id),
        }

        switch (el.type) {
          case 'text':
            return <TextNode key={el.id} {...commonProps} />
          case 'sticky-note':
            return <StickyNoteNode key={el.id} {...commonProps} />
          case 'rectangle':
            return <RectNode key={el.id} {...commonProps} />
          case 'circle':
            return <CircleNode key={el.id} {...commonProps} />
          case 'image':
            return <ImageNodeInner key={el.id} {...commonProps} />
          default:
            return null
        }
      })}

      <Transformer
        ref={transformerRef}
        boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 || newBox.height < 20 ? oldBox : newBox)}
        anchorSize={8}
        anchorCornerRadius={4}
        borderStroke="#3B82F6"
        borderStrokeWidth={1.5}
        anchorStroke="#3B82F6"
        anchorFill="#ffffff"
        rotateAnchorOffset={20}
      />
    </Layer>
  )
}

export default React.memo(CanvasElements)
