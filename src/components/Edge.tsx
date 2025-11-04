import React from 'react'

interface EdgeProps {
  x1: number
  y1: number
  x2: number
  y2: number
  placed: boolean
  isHint?: boolean
  label: string
  onClick?: () => void
}

export default function Edge({ x1, y1, x2, y2, placed, isHint, label, onClick }: EdgeProps) {
  const [hover, setHover] = React.useState(false)
  const strokeClass = placed ? 'edge-placed' : isHint ? 'edge-hint' : hover ? 'edge-hover' : 'edge-empty'
  const midx = (x1 + x2) / 2
  const midy = (y1 + y2) / 2
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className={strokeClass}
        aria-label={label}
        role="button"
      />
      {!placed && (
        <rect
          x={Math.min(x1, x2) - 10}
          y={Math.min(y1, y2) - 10}
          width={Math.max(Math.abs(x2 - x1), 1) + 20}
          height={Math.max(Math.abs(y2 - y1), 1) + 20}
          fill="transparent"
          tabIndex={0}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onClick?.()
            }
          }}
        />
      )}
      {/* Minor hit label for screen readers */}
      <title>{label}</title>
      {/* clickable dot for better focus target */}
      {!placed && (
        <circle cx={midx} cy={midy} r={4} fill="transparent" />
      )}
    </g>
  )
}

