import { useReducer } from 'react'
import { GameState, Move, SerializedState, applyMove, cloneState, createInitialState, isGameOver, isValidMove, reviveState } from '../utils/rules'

export type Mode = 'pvp' | 'pvai'
export type Level = 'easy' | 'medium' | 'hard'

export type Action =
  | { type: 'PLACE_EDGE'; move: Move }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET' }
  | { type: 'SET_BOARD_SIZE'; size: number }
  | { type: 'SET_MODE'; mode: Mode }
  | { type: 'SET_AI_LEVEL'; level: Level }
  | { type: 'SET_HINT'; edgeKey: string | null }

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'PLACE_EDGE': {
      const move = action.move
      if (!isValidMove(move, state) || isGameOver(state)) return state
      const snapshot: SerializedState = cloneState(state)
      const { next } = applyMove(move, state)
      next.history = [...state.history, snapshot]
      next.future = []
      return next
    }
    case 'UNDO': {
      if (state.history.length === 0) return state
      const prev = state.history[state.history.length - 1]!
      const futureSnap = cloneState(state)
      const revived = reviveState(prev)
      revived.history = state.history.slice(0, -1)
      revived.future = [futureSnap, ...state.future]
      return revived
    }
    case 'REDO': {
      if (state.future.length === 0) return state
      const nextSnap = state.future[0]!
      const currSnap = cloneState(state)
      const revived = reviveState(nextSnap)
      revived.history = [...state.history, currSnap]
      revived.future = state.future.slice(1)
      return revived
    }
    case 'RESET': {
      const s = createInitialState(state.boardSize, state.mode, state.aiLevel)
      return s
    }
    case 'SET_BOARD_SIZE': {
      const size = action.size
      const s = createInitialState(size, state.mode, state.aiLevel)
      return s
    }
    case 'SET_MODE': {
      return { ...state, mode: action.mode, history: [], future: [], hint: null }
    }
    case 'SET_AI_LEVEL': {
      return { ...state, aiLevel: action.level, hint: null }
    }
    case 'SET_HINT': {
      return { ...state, hint: action.edgeKey }
    }
    default:
      return state
  }
}

export function useGameState(initialSize = 5, initialMode: Mode = 'pvp', initialLevel: Level = 'easy') {
  const [state, dispatch] = useReducer(reducer, createInitialState(initialSize, initialMode, initialLevel))
  return { state, dispatch }
}
