import React from 'react'
import Board from './components/Board'
import Controls from './components/Controls'
import Scoreboard from './components/Scoreboard'
import OnlinePanel from './components/Online'
import { useGameState } from './hooks/useGameState'
import { Move, GameState, isGameOver, moveKey, cloneState, reviveState } from './utils/rules'
import { useAI } from './hooks/useAI'
import { useRoom, type RoomMessage } from './online/useRoom'

export default function App() {
  const { state, dispatch } = useGameState(5, 'pvp', 'easy')
  const { chooseMove } = useAI(state.aiLevel)
  const [aiThinking, setAiThinking] = React.useState(false)
  const [pin, setPin] = React.useState('')
  const [name, setName] = React.useState('')
  const meIdRef = React.useRef<string | null>(null)
  const room = useRoom((msg: RoomMessage) => {
    switch (msg.type) {
      case 'move': {
        dispatch({ type: 'PLACE_EDGE', move: msg.move })
        break
      }
      case 'sync': {
        dispatch({ type: 'LOAD', snapshot: msg.state })
        break
      }
      case 'reset': {
        dispatch({ type: 'RESET' })
        break
      }
      case 'set_board_size': {
        dispatch({ type: 'SET_BOARD_SIZE', size: msg.size })
        break
      }
      case 'undo': {
        dispatch({ type: 'UNDO' })
        break
      }
      case 'redo': {
        dispatch({ type: 'REDO' })
        break
      }
    }
  })

  const over = isGameOver(state)

  const onPlace = (m: Move) => {
    if (state.mode === 'online') {
      if (room.me !== state.currentPlayer) return
      dispatch({ type: 'PLACE_EDGE', move: m })
      room.send({ type: 'move', move: m })
      return
    }
    dispatch({ type: 'PLACE_EDGE', move: m })
  }

  // AI turn
  React.useEffect(() => {
    if (state.mode !== 'pvai') return
    if (state.currentPlayer !== 1) return
    if (isGameOver(state)) return
    let cancelled = false
    setAiThinking(true)
    const t = setTimeout(() => {
      if (cancelled) return
      const mv = chooseMove(state)
      if (mv) dispatch({ type: 'PLACE_EDGE', move: mv })
      setAiThinking(false)
    }, 250)
    return () => { cancelled = true; clearTimeout(t) }
  }, [state, chooseMove, dispatch])

  const onNew = () => {
    if (state.mode === 'online') {
      if (room.role !== 'host') return
      dispatch({ type: 'RESET' })
      room.send({ type: 'reset' })
      room.send({ type: 'sync', state: cloneState({ ...state, edges: new Set(), boxes: {} as any, scores: [0,0], currentPlayer: 0 }) })
      return
    }
    dispatch({ type: 'RESET' })
  }
  const onUndo = () => {
    if (state.mode === 'online' && room.role !== 'host') return
    dispatch({ type: 'UNDO' })
    if (state.mode === 'online') room.send({ type: 'undo' })
  }
  const onRedo = () => {
    if (state.mode === 'online' && room.role !== 'host') return
    dispatch({ type: 'REDO' })
    if (state.mode === 'online') room.send({ type: 'redo' })
  }
  const onBoardSize = (n: number) => {
    if (state.mode === 'online' && room.role !== 'host') return
    dispatch({ type: 'SET_BOARD_SIZE', size: n })
    if (state.mode === 'online') room.send({ type: 'set_board_size', size: n })
  }
  const onMode = (m: 'pvp' | 'pvai' | 'online') => dispatch({ type: 'SET_MODE', mode: m })
  const onLevel = (l: 'easy' | 'medium' | 'hard') => dispatch({ type: 'SET_AI_LEVEL', level: l })

  const onHint = () => {
    // Use AI of current level to suggest move for current player
    const mv = chooseMove(state)
    if (mv) dispatch({ type: 'SET_HINT', edgeKey: moveKey(mv) })
  }

  const winner = React.useMemo(() => {
    if (!over) return null
    const s0 = state.scores[0] ?? 0
    const s1 = state.scores[1] ?? 0
    if (s0 > s1) return 'Player 1'
    if (state.mode === 'pvai' && s1 >= s0) return 'AI'
    if (s1 > s0) return 'Player 2'
    return 'Draw'
  }, [over, state.scores, state.mode])

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Dots & Boxes</h1>
        <div className="legend">
          {state.mode === 'pvai' ? (aiThinking ? 'AI thinking…' : 'Your turn') :
            state.mode === 'online' ? (room.status === 'connected' ? (room.me === state.currentPlayer ? 'Your turn' : 'Opponent turn') : 'Online') :
            'Local PvP'}
        </div>
      </header>
      <main className="container">
        <Controls
          boardSize={state.boardSize}
          mode={state.mode}
          aiLevel={state.aiLevel}
          canUndo={state.history.length > 0}
          canRedo={state.future.length > 0}
          onNew={onNew}
          onUndo={onUndo}
          onRedo={onRedo}
          onHint={onHint}
          onBoardSize={onBoardSize}
          onMode={onMode}
          onLevel={onLevel}
        />
        <OnlinePanel
          mode={state.mode}
          status={room.status}
          role={room.role}
          me={room.me}
          pin={pin}
          setPin={setPin}
          name={name}
          setName={setName}
          onCreate={async () => {
            if (!/^\d{4}$/.test(pin) || !name) return
            // call backend to create
            try {
              const res = await import('./lib/backend').then(m => m.createRoom(name, pin, state.boardSize))
              meIdRef.current = res.me.id
              room.create(pin)
            } catch (e) {
              console.error(e)
            }
          }}
          onJoin={async () => {
            if (!/^\d{4}$/.test(pin) || !name) return
            try {
              const res = await import('./lib/backend').then(m => m.joinRoom(name, pin))
              meIdRef.current = res.me.id
              room.join(pin)
            } catch (e) {
              console.error(e)
            }
          }}
          onLeave={() => room.leave()}
        />
        <div className="panel board-wrap">
          <Board state={state as GameState} onPlace={onPlace} />
        </div>
        <Scoreboard scores={state.scores} currentPlayer={state.currentPlayer} mode={state.mode} />
      </main>
      <footer className="header" style={{ justifyContent: 'center' }}>
        <span className="legend">Blue is Player 1; Orange is {state.mode === 'pvai' ? 'AI' : 'Player 2'}</span>
      </footer>

      {over && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Game over">
          <div className="modal-card">
            <h2>Game Over</h2>
            <p style={{ margin: '8px 0 16px' }}>
              {winner === 'Draw' ? 'It\'s a draw!' : `${winner} wins!`}
            </p>
            <div className="row">
              <button className="btn" onClick={onNew}>Play Again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
