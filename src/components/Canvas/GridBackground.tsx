import React, { useMemo } from 'react'
import { Layer, Circle, Line } from 'react-konva'

interface Props {
  viewX: number
  viewY: number
  scale: number
  width: number
  height: number
}

const DOT_SPACING = 30
const DOT_RADIUS = 1.2
const DOT_COLOR = '#d1d5db'

const GridBackground: React.FC<Props> = ({ viewX, viewY, scale, width, height }) => {
  const dots = useMemo(() => {
    // At very low zoom, increase effective spacing to avoid too many dots
    const effectiveSpacing = scale < 0.3 ? DOT_SPACING * 3 : scale < 0.6 ? DOT_SPACING * 2 : DOT_SPACING
    const spacing = effectiveSpacing * scale
    // offset so dots stay fixed relative to canvas origin
    const offsetX = ((viewX % spacing) + spacing) % spacing
    const offsetY = ((viewY % spacing) + spacing) % spacing

    const cols = Math.ceil(width / spacing) + 2
    const rows = Math.ceil(height / spacing) + 2

    const points: { x: number; y: number }[] = []
    for (let r = -1; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        points.push({
          x: offsetX + c * spacing,
          y: offsetY + r * spacing,
        })
      }
    }
    return points
  }, [viewX, viewY, scale, width, height])

  return (
    <Layer listening={false}>
      {dots.map((d, i) => (
        <Circle
          key={i}
          x={d.x}
          y={d.y}
          radius={DOT_RADIUS}
          fill={DOT_COLOR}
          listening={false}
        />
      ))}
    </Layer>
  )
}

export default React.memo(GridBackground)
