# 🎨 Infinite Canvas

一个基于 React + react-konva 构建的无限画布创意空间，支持自由添加、编辑、移动、缩放各种视觉元素。

## 快速启动

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`

## 构建生产版本

```bash
npm run build
npm run preview
```

## 功能列表

### 画布操作
- 🖱️ 滚轮缩放（以鼠标位置为中心），范围 10%~500%
- ✋ 空格+拖拽 或 中键拖拽 平移画布
- 🔄 一键重置视图到原点 100%
- 📍 点状网格背景，随缩放自适应

### 元素类型
- **文本**：可编辑多行文本，支持字体、大小、颜色、粗体、斜体、对齐
- **便签**：圆角卡片，预设 6 种颜色，带阴影
- **矩形**：可调填充色、边框色、边框宽度、圆角
- **圆形**：可调填充色、边框色、边框宽度
- **图片**：本地上传，保持比例，可调圆角

### 交互
- 单击选中，Shift+点击多选
- 拖拽移动，角点缩放，顶部旋转
- 双击文本/便签进入编辑模式
- 双击空白区域快速添加便签
- 右键上下文菜单

### 属性面板
- 位置、尺寸、旋转、透明度
- 各类型专属属性编辑
- 图层顺序调整（置顶/置底/上移/下移）
- 元素锁定/解锁

### 数据
- 自动保存到 localStorage（防抖 500ms）
- 导出/导入 JSON
- 清空画布（带确认）

## 示例截图
![screenshot1](screenshot01.png?raw=true)

![screenshot2](screenshot02.png?raw=true)

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Z` | 撤销 |
| `Ctrl+Shift+Z` | 重做 |
| `Delete` / `Backspace` | 删除选中 |
| `Ctrl+C` | 复制 |
| `Ctrl+V` | 粘贴 |
| `Ctrl+A` | 全选 |
| `Esc` | 取消选中 |
| `H` | 切换手型工具 |
| `V` | 切换选择工具 |
| `Space+拖拽` | 临时平移 |
| `方向键` | 微移 1px |
| `Shift+方向键` | 微移 10px |
| `?` | 显示快捷键帮助 |

## 技术栈

- **React 18** + TypeScript
- **react-konva** / Konva.js — 画布渲染
- **Zustand** — 状态管理
- **Tailwind CSS** — 样式
- **Vite** — 构建工具
- **nanoid** — 唯一 ID
- **lucide-react** — 图标
