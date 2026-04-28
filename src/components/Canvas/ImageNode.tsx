import React, { useEffect, useRef } from 'react'
import { Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import type { ImageElement } from '../../types/canvas'

interface Props {
  element: ImageElement
  isSelected: boolean
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void
  onDblClick: () => void
  draggable: boolean
  nodeRef: React.RefObject<Konva.Image>
}

const ImageNode: React.FC<Props> = ({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onDblClick,
  draggable,
  nodeRef,
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [image, setImage] = React.useState<HTMLImageElement | null>(null)

  useEffect(() => {
    const img = new window.Image()
    img.src = element.src
    img.onload = () => {
      imgRef.current = img
      setImage(img)
    }
    return () => {
      img.onload = null
    }
  }, [element.src])

  if (!image) return null

  return (
    <KonvaImage
      ref={nodeRef}
      id={element.id}
      image={image}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      opacity={element.opacity}
      cornerRadius={element.cornerRadius}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
      onDblClick={onDblClick}
      shadowColor="rgba(0,0,0,0.15)"
      shadowBlur={isSelected ? 0 : 8}
      shadowOffsetX={0}
      shadowOffsetY={2}
    />
  )
}

export default React.memo(ImageNode)
