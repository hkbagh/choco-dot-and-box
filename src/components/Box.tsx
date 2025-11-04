import React from 'react'

interface BoxProps {
  x: number
  y: number
  size: number
  owner: number | null
  label: string
}

export default function Box({ x, y, size, owner, label }: BoxProps) {
  const fillClass = owner === 0 ? 'box-fill-p1' : owner === 1 ? 'box-fill-p2' : ''
  const initial = owner === 0 ? 'P1' : owner === 1 ? 'P2' : ''
  return (
    <g>
      {owner != null && (
        <rect x={x} y={y} width={size} height={size} className={fillClass} rx={6} ry={6} />
      )}
      {owner != null && (
        <text x={x + size / 2} y={y + size / 2 + 5} textAnchor="middle" className="box-label">
          {initial}
        </text>
      )}
      <title>{label}</title>
    </g>
  )}

