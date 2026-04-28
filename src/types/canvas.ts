export type ElementType = 'text' | 'sticky-note' | 'rectangle' | 'circle' | 'image'

export interface BaseElement {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  locked: boolean
  zIndex: number
}

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
  fill: string
  bold: boolean
  italic: boolean
  align: 'left' | 'center' | 'right'
}

export interface StickyNoteElement extends BaseElement {
  type: 'sticky-note'
  text: string
  fontSize: number
  fontFamily: string
  fill: string
  backgroundColor: string
}

export interface ShapeElement extends BaseElement {
  type: 'rectangle' | 'circle'
  fill: string
  stroke: string
  strokeWidth: number
  cornerRadius?: number
}

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string
  cornerRadius: number
}

export type CanvasElement = TextElement | StickyNoteElement | ShapeElement | ImageElement

export interface ViewState {
  x: number
  y: number
  scale: number
}

export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  targetId: string | null
}

export interface TextEditState {
  id: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  fontFamily: string
  text: string
  align: 'left' | 'center' | 'right'
  bold: boolean
  italic: boolean
  fill: string
  backgroundColor?: string
}
