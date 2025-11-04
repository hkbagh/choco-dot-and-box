import React from 'react'

interface ScoreboardProps {
  scores: number[]
  currentPlayer: number
  mode: 'pvp' | 'pvai'
}

export default function Scoreboard({ scores, currentPlayer, mode }: ScoreboardProps) {
  const p2Label = mode === 'pvai' ? 'AI' : 'P2'
  return (
    <div className="panel scoreboard" aria-label="Scoreboard">
      <div className={`score ${currentPlayer === 0 ? 'active' : ''}`}>
        <span>
          <span className="badge p1">P1</span>
          &nbsp;Player 1
        </span>
        <strong className="p1">{scores[0]}</strong>
      </div>
      <div className={`score ${currentPlayer === 1 ? 'active' : ''}`}>
        <span>
          <span className="badge p2">P2</span>
          &nbsp;{p2Label}
        </span>
        <strong className="p2">{scores[1]}</strong>
      </div>
    </div>
  )
}

