import React from 'react'

interface ControlsProps {
  boardSize: number
  mode: 'pvp' | 'pvai'
  aiLevel: 'easy' | 'medium' | 'hard'
  canUndo: boolean
  canRedo: boolean
  onNew: () => void
  onUndo: () => void
  onRedo: () => void
  onHint: () => void
  onBoardSize: (n: number) => void
  onMode: (m: 'pvp' | 'pvai') => void
  onLevel: (l: 'easy' | 'medium' | 'hard') => void
}

export default function Controls(props: ControlsProps) {
  const { boardSize, mode, aiLevel, canUndo, canRedo, onNew, onUndo, onRedo, onHint, onBoardSize, onMode, onLevel } = props
  return (
    <div className="panel controls" aria-label="Game controls" role="group">
      <div className="row space">
        <span className="legend">Game</span>
        <button className="btn" onClick={onNew}>New Game</button>
      </div>
      <div className="row">
        <button className="btn" onClick={onUndo} disabled={!canUndo}>Undo</button>
        <button className="btn" onClick={onRedo} disabled={!canRedo}>Redo</button>
        <button className="btn" onClick={onHint}>Hint</button>
      </div>
      <div className="row space">
        <label htmlFor="boardSize">Board Size</label>
        <select id="boardSize" className="select" value={boardSize} onChange={(e) => onBoardSize(Number(e.target.value))}>
          <option value={3}>3×3</option>
          <option value={5}>5×5</option>
          <option value={7}>7×7</option>
        </select>
      </div>
      <div className="row space">
        <label htmlFor="mode">Mode</label>
        <select id="mode" className="select" value={mode} onChange={(e) => onMode(e.target.value as any)}>
          <option value="pvp">Player vs Player</option>
          <option value="pvai">Player vs AI</option>
        </select>
      </div>
      {mode === 'pvai' && (
        <div className="row space">
          <label htmlFor="level">Difficulty</label>
          <select id="level" className="select" value={aiLevel} onChange={(e) => onLevel(e.target.value as any)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      )}
    </div>
  )
}

