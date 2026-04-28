import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
}

const shortcuts = [
  { keys: 'Ctrl + Z', desc: '撤销' },
  { keys: 'Ctrl + Shift + Z', desc: '重做' },
  { keys: 'Delete / Backspace', desc: '删除选中元素' },
  { keys: 'Ctrl + C', desc: '复制选中元素' },
  { keys: 'Ctrl + V', desc: '粘贴元素' },
  { keys: 'Ctrl + A', desc: '全选' },
  { keys: 'Esc', desc: '取消选中' },
  { keys: 'H', desc: '切换手型工具' },
  { keys: 'V', desc: '切换选择工具' },
  { keys: 'Space + 拖拽', desc: '临时平移画布' },
  { keys: '滚轮', desc: '缩放画布' },
  { keys: '中键拖拽', desc: '平移画布' },
  { keys: '方向键', desc: '微移元素 1px' },
  { keys: 'Shift + 方向键', desc: '微移元素 10px' },
  { keys: 'Shift + 点击', desc: '多选元素' },
  { keys: '双击空白', desc: '快速添加便签' },
  { keys: '双击文本/便签', desc: '进入编辑模式' },
  { keys: '?', desc: '显示快捷键帮助' },
]

const ShortcutsHelp: React.FC<Props> = ({ onClose }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">⌨️ 快捷键</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1">
            {shortcuts.map(({ keys, desc }) => (
              <div key={keys} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-600">{desc}</span>
                <kbd className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-mono border border-gray-200">
                  {keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShortcutsHelp
