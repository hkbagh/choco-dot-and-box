import React from 'react'

interface DotProps { x: number; y: number }

export default function Dot({ x, y }: DotProps) {
  return <circle className="dot" cx={x} cy={y} r={4} />
}

