import React from 'react'
import { ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Lock, Unlock } from 'lucide-react'
import { useCanvasStore } from '../../store/canvasStore'
import type {
  CanvasElement,
  TextElement,
  StickyNoteElement,
  ShapeElement,
  ImageElement,
} from '../../types/canvas'

const STICKY_COLORS = ['#FEF08A', '#FCA5A5', '#93C5FD', '#86EFAC', '#F9A8D4', '#C4B5FD']
const FONT_FAMILIES = ['Inter', 'Arial', 'Georgia', 'Courier New', 'Times New Roman', 'Verdana']

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{children}</label>
)

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <Label>{label}</Label>
    {children}
  </div>
)

const inputCls = 'w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white'
const numInputCls = `${inputCls} w-20`

interface Props {
  element: CanvasElement
}

const PropertiesPanel: React.FC<Props> = ({ element }) => {
  const updateElement = useCanvasStore((s) => s.updateElement)
  const bringForward = useCanvasStore((s) => s.bringForward)
  const sendBackward = useCanvasStore((s) => s.sendBackward)
  const bringToFront = useCanvasStore((s) => s.bringToFront)
  const sendToBack = useCanvasStore((s) => s.sendToBack)
  const toggleLock = useCanvasStore((s) => s.toggleLock)
  const pushHistory = useCanvasStore((s) => s.pushHistory)

  const update = (patch: Partial<CanvasElement>) => {
    updateElement(element.id, patch)
  }

  const updateWithHistory = (patch: Partial<CanvasElement>) => {
    updateElement(element.id, patch)
    pushHistory()
  }

  return (
    <div
      className="fixed right-3 top-16 w-72 rounded-2xl shadow-xl border border-gray-200/80 overflow-y-auto panel-enter"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        maxHeight: 'calc(100vh - 80px)',
        zIndex: 40,
      }}
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800 capitalize">
            {element.type === 'sticky-note' ? '便签' :
             element.type === 'text' ? '文本' :
             element.type === 'rectangle' ? '矩形' :
             element.type === 'circle' ? '圆形' : '图片'}
          </span>
          <button
            onClick={() => toggleLock(element.id)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            {element.locked ? <Lock size={13} /> : <Unlock size={13} />}
            {element.locked ? '已锁定' : '锁定'}
          </button>
        </div>

        <hr className="border-gray-100" />

        {/* Position & Size */}
        <Row label="位置 & 尺寸">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-gray-400">X</span>
              <input
                type="number"
                className={inputCls}
                value={Math.round(element.x)}
                onChange={(e) => update({ x: Number(e.target.value) })}
                onBlur={() => pushHistory()}
              />
            </div>
            <div>
              <span className="text-xs text-gray-400">Y</span>
              <input
                type="number"
                className={inputCls}
                value={Math.round(element.y)}
                onChange={(e) => update({ y: Number(e.target.value) })}
                onBlur={() => pushHistory()}
              />
            </div>
            <div>
              <span className="text-xs text-gray-400">宽</span>
              <input
                type="number"
                className={inputCls}
                value={Math.round(element.width)}
                onChange={(e) => update({ width: Math.max(20, Number(e.target.value)) })}
                onBlur={() => pushHistory()}
              />
            </div>
            <div>
              <span className="text-xs text-gray-400">高</span>
              <input
                type="number"
                className={inputCls}
                value={Math.round(element.height)}
                onChange={(e) => update({ height: Math.max(20, Number(e.target.value)) })}
                onBlur={() => pushHistory()}
              />
            </div>
          </div>
        </Row>

        {/* Rotation & Opacity */}
        <div className="grid grid-cols-2 gap-3">
          <Row label="旋转">
            <input
              type="number"
              className={inputCls}
              value={Math.round(element.rotation)}
              onChange={(e) => update({ rotation: Number(e.target.value) })}
              onBlur={() => pushHistory()}
            />
          </Row>
          <Row label="透明度">
            <input
              type="number"
              className={inputCls}
              min={0}
              max={1}
              step={0.05}
              value={element.opacity}
              onChange={(e) => update({ opacity: Math.min(1, Math.max(0, Number(e.target.value))) })}
              onBlur={() => pushHistory()}
            />
          </Row>
        </div>

        <hr className="border-gray-100" />

        {/* Type-specific */}
        {(element.type === 'text') && <TextProps el={element as TextElement} update={update} updateWithHistory={updateWithHistory} />}
        {(element.type === 'sticky-note') && <StickyProps el={element as StickyNoteElement} update={update} updateWithHistory={updateWithHistory} />}
        {(element.type === 'rectangle' || element.type === 'circle') && <ShapeProps el={element as ShapeElement} update={update} updateWithHistory={updateWithHistory} />}
        {(element.type === 'image') && <ImageProps el={element as ImageElement} update={update} updateWithHistory={updateWithHistory} />}

        <hr className="border-gray-100" />

        {/* Layer order */}
        <Row label="图层顺序">
          <div className="grid grid-cols-4 gap-1">
            {[
              { icon: <ChevronsUp size={14} />, label: '置顶', fn: () => bringToFront(element.id) },
              { icon: <ChevronUp size={14} />, label: '上移', fn: () => bringForward(element.id) },
              { icon: <ChevronDown size={14} />, label: '下移', fn: () => sendBackward(element.id) },
              { icon: <ChevronsDown size={14} />, label: '置底', fn: () => sendToBack(element.id) },
            ].map(({ icon, label, fn }) => (
              <button
                key={label}
                onClick={fn}
                title={label}
                className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors text-xs"
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </Row>
      </div>
    </div>
  )
}

// ── sub-panels ────────────────────────────────────────────────────────────────

const TextProps: React.FC<{ el: TextElement; update: (p: Partial<CanvasElement>) => void; updateWithHistory: (p: Partial<CanvasElement>) => void }> = ({ el, update, updateWithHistory }) => (
  <div className="space-y-3">
    <Row label="字体">
      <select className={inputCls} value={el.fontFamily} onChange={(e) => updateWithHistory({ fontFamily: e.target.value } as Partial<TextElement>)}>
        {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>
    </Row>
    <div className="grid grid-cols-2 gap-3">
      <Row label="字号">
        <input type="number" className={inputCls} min={8} max={200} value={el.fontSize}
          onChange={(e) => update({ fontSize: Number(e.target.value) } as Partial<TextElement>)}
          onBlur={() => updateWithHistory({})} />
      </Row>
      <Row label="颜色">
        <input type="color" className="w-full h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" value={el.fill}
          onChange={(e) => update({ fill: e.target.value } as Partial<TextElement>)}
          onBlur={() => updateWithHistory({})} />
      </Row>
    </div>
    <Row label="样式">
      <div className="flex gap-2">
        <button
          className={`flex-1 py-1.5 rounded-lg text-sm font-bold border transition-colors ${el.bold ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          onClick={() => updateWithHistory({ bold: !el.bold } as Partial<TextElement>)}
        >B</button>
        <button
          className={`flex-1 py-1.5 rounded-lg text-sm italic border transition-colors ${el.italic ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          onClick={() => updateWithHistory({ italic: !el.italic } as Partial<TextElement>)}
        >I</button>
        {(['left', 'center', 'right'] as const).map((a) => (
          <button
            key={a}
            className={`flex-1 py-1.5 rounded-lg text-xs border transition-colors ${el.align === a ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            onClick={() => updateWithHistory({ align: a } as Partial<TextElement>)}
          >{a === 'left' ? '左' : a === 'center' ? '中' : '右'}</button>
        ))}
      </div>
    </Row>
  </div>
)

const StickyProps: React.FC<{ el: StickyNoteElement; update: (p: Partial<CanvasElement>) => void; updateWithHistory: (p: Partial<CanvasElement>) => void }> = ({ el, update, updateWithHistory }) => (
  <div className="space-y-3">
    <Row label="背景颜色">
      <div className="flex gap-2 flex-wrap">
        {STICKY_COLORS.map((c) => (
          <button
            key={c}
            className={`color-swatch ${el.backgroundColor === c ? 'selected' : ''}`}
            style={{ background: c }}
            onClick={() => updateWithHistory({ backgroundColor: c } as Partial<StickyNoteElement>)}
          />
        ))}
      </div>
    </Row>
    <div className="grid grid-cols-2 gap-3">
      <Row label="字号">
        <input type="number" className={inputCls} min={8} max={100} value={el.fontSize}
          onChange={(e) => update({ fontSize: Number(e.target.value) } as Partial<StickyNoteElement>)}
          onBlur={() => updateWithHistory({})} />
      </Row>
      <Row label="文字颜色">
        <input type="color" className="w-full h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" value={el.fill}
          onChange={(e) => update({ fill: e.target.value } as Partial<StickyNoteElement>)}
          onBlur={() => updateWithHistory({})} />
      </Row>
    </div>
  </div>
)

const ShapeProps: React.FC<{ el: ShapeElement; update: (p: Partial<CanvasElement>) => void; updateWithHistory: (p: Partial<CanvasElement>) => void }> = ({ el, update, updateWithHistory }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <Row label="填充色">
        <input type="color" className="w-full h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" value={el.fill}
          onChange={(e) => update({ fill: e.target.value } as Partial<ShapeElement>)}
          onBlur={() => updateWithHistory({})} />
      </Row>
      <Row label="边框色">
        <input type="color" className="w-full h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" value={el.stroke}
          onChange={(e) => update({ stroke: e.target.value } as Partial<ShapeElement>)}
          onBlur={() => updateWithHistory({})} />
      </Row>
    </div>
    <Row label="边框宽度">
      <input type="range" min={0} max={20} value={el.strokeWidth}
        className="w-full accent-blue-500"
        onChange={(e) => update({ strokeWidth: Number(e.target.value) } as Partial<ShapeElement>)}
        onMouseUp={() => updateWithHistory({})} />
      <span className="text-xs text-gray-400">{el.strokeWidth}px</span>
    </Row>
    {el.type === 'rectangle' && (
      <Row label="圆角">
        <input type="range" min={0} max={60} value={el.cornerRadius ?? 0}
          className="w-full accent-blue-500"
          onChange={(e) => update({ cornerRadius: Number(e.target.value) } as Partial<ShapeElement>)}
          onMouseUp={() => updateWithHistory({})} />
        <span className="text-xs text-gray-400">{el.cornerRadius ?? 0}px</span>
      </Row>
    )}
  </div>
)

const ImageProps: React.FC<{ el: ImageElement; update: (p: Partial<CanvasElement>) => void; updateWithHistory: (p: Partial<CanvasElement>) => void }> = ({ el, update, updateWithHistory }) => (
  <div className="space-y-3">
    <Row label="圆角">
      <input type="range" min={0} max={80} value={el.cornerRadius}
        className="w-full accent-blue-500"
        onChange={(e) => update({ cornerRadius: Number(e.target.value) } as Partial<ImageElement>)}
        onMouseUp={() => updateWithHistory({})} />
      <span className="text-xs text-gray-400">{el.cornerRadius}px</span>
    </Row>
  </div>
)

export default PropertiesPanel
