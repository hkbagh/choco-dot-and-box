import React from 'react'
import Dot from './Dot'
import Edge from './Edge'
import Box from './Box'
import { GameState, Move, moveKey } from '../utils/rules'

interface BoardProps {
  state: GameState
  onPlace: (m: Move) => void
}

export default function Board({ state, onPlace }: BoardProps) {
  const N = state.boardSize
  const padding = 24
  const size = 560
  const step = size / N
  const total = size + padding * 2

  const handlePlace = React.useCallback((m: Move) => {
    onPlace(m)
  }, [onPlace])

  const dots: { x: number; y: number }[] = []
  for (let r = 0; r <= N; r++) {
    for (let c = 0; c <= N; c++) {
      dots.push({ x: padding + c * step, y: padding + r * step })
    }
  }

  return (
    <svg className="board" viewBox={`0 0 ${total} ${total}`} aria-label="Dots and Boxes board" role="group">
      {/* Boxes */}
      {Array.from({ length: N }).map((_, r) =>
        Array.from({ length: N }).map((_, c) => (
          <Box
            key={`b-${r}-${c}`}
            x={padding + c * step + 6}
            y={padding + r * step + 6}
            size={step - 12}
            owner={state.boxes[`${r}:${c}`] ?? null}
            label={`Box ${r + 1},${c + 1}`}
          />
        ))
      )}

      {/* Horizontal edges */}
      {Array.from({ length: N + 1 }).map((_, r) =>
        Array.from({ length: N }).map((_, c) => {
          const m: Move = { o: 'h', r, c }
          const k = moveKey(m)
          const placed = state.edges.has(k)
          const x1 = padding + c * step
          const y1 = padding + r * step
          const x2 = padding + (c + 1) * step
          const y2 = y1
          const isHint = state.hint === k
          return (
            <Edge
              key={`h-${r}-${c}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              placed={placed}
              isHint={isHint}
              label={`Edge horizontal ${r + 1},${c + 1}`}
              onClick={() => handlePlace(m)}
            />
          )
        })
      )}

      {/* Vertical edges */}
      {Array.from({ length: N }).map((_, r) =>
        Array.from({ length: N + 1 }).map((_, c) => {
          const m: Move = { o: 'v', r, c }
          const k = moveKey(m)
          const placed = state.edges.has(k)
          const x1 = padding + c * step
          const y1 = padding + r * step
          const x2 = x1
          const y2 = padding + (r + 1) * step
          const isHint = state.hint === k
          return (
            <Edge
              key={`v-${r}-${c}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              placed={placed}
              isHint={isHint}
              label={`Edge vertical ${r + 1},${c + 1}`}
              onClick={() => handlePlace(m)}
            />
          )
        })
      )}

      {/* Dots */}
      {dots.map((d, i) => (
        <Dot key={`d-${i}`} x={d.x} y={d.y} />
      ))}
    </svg>
  )
}

