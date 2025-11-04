export type Orientation = 'h' | 'v'
export interface Move { o: Orientation; r: number; c: number }
export type Player = 0 | 1

export interface SerializedState {
  boardSize: number
  edges: string[]
  boxes: Record<string, number | null>
  currentPlayer: number
  scores: number[]
  mode: 'pvp' | 'pvai' | 'online'
  aiLevel: 'easy' | 'medium' | 'hard'
  hint: string | null
}

export interface GameState {
  boardSize: number
  edges: Set<string>
  boxes: Record<string, number | null>
  currentPlayer: number
  scores: number[]
  mode: 'pvp' | 'pvai' | 'online'
  aiLevel: 'easy' | 'medium' | 'hard'
  history: SerializedState[]
  future: SerializedState[]
  hint: string | null
}

export function moveKey(m: Move): string {
  return `${m.o}:${m.r}:${m.c}`
}

export function parseMoveKey(key: string): Move {
  const [o, rs, cs] = key.split(':')
  return { o: o as Orientation, r: Number(rs), c: Number(cs) }
}

export function allBoxes(boardSize: number): string[] {
  const ids: string[] = []
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      ids.push(`${r}:${c}`)
    }
  }
  return ids
}

export function initBoxes(boardSize: number): Record<string, number | null> {
  const b: Record<string, number | null> = {}
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      b[`${r}:${c}`] = null
    }
  }
  return b
}

export function getBoxEdges(r: number, c: number): string[] {
  return [
    moveKey({ o: 'h', r, c }),
    moveKey({ o: 'h', r: r + 1, c }),
    moveKey({ o: 'v', r, c }),
    moveKey({ o: 'v', r, c: c + 1 }),
  ]
}

export function boxesForMove(m: Move, boardSize: number): string[] {
  const ids: string[] = []
  if (m.o === 'h') {
    if (m.r > 0) ids.push(`${m.r - 1}:${m.c}`)
    if (m.r < boardSize) ids.push(`${m.r}:${m.c}`)
  } else {
    if (m.c > 0) ids.push(`${m.r}:${m.c - 1}`)
    if (m.c < boardSize) ids.push(`${m.r}:${m.c}`)
  }
  return ids.filter((id) => inBoundsBoxId(id, boardSize))
}

export function inBoundsMove(m: Move, boardSize: number): boolean {
  if (m.o === 'h') {
    return m.r >= 0 && m.r <= boardSize && m.c >= 0 && m.c < boardSize
  }
  return m.r >= 0 && m.r < boardSize && m.c >= 0 && m.c <= boardSize
}

export function inBoundsBoxId(id: string, boardSize: number): boolean {
  const [rs, cs] = id.split(':')
  const r = Number(rs), c = Number(cs)
  return r >= 0 && r < boardSize && c >= 0 && c < boardSize
}

export function isValidMove(m: Move, state: GameState): boolean {
  if (!inBoundsMove(m, state.boardSize)) return false
  const key = moveKey(m)
  return !state.edges.has(key)
}

export function cloneState(state: GameState): SerializedState {
  return {
    boardSize: state.boardSize,
    edges: Array.from(state.edges),
    boxes: { ...state.boxes },
    currentPlayer: state.currentPlayer,
    scores: [...state.scores],
    mode: state.mode,
    aiLevel: state.aiLevel,
    hint: state.hint,
  }
}

export function reviveState(s: SerializedState): GameState {
  return {
    boardSize: s.boardSize,
    edges: new Set(s.edges),
    boxes: { ...s.boxes },
    currentPlayer: s.currentPlayer,
    scores: [...s.scores],
    mode: s.mode,
    aiLevel: s.aiLevel,
    history: [],
    future: [],
    hint: s.hint,
  }
}

export function edgesForBoxCount(state: GameState, id: string): number {
  const [rs, cs] = id.split(':')
  const r = Number(rs), c = Number(cs)
  return getBoxEdges(r, c).reduce((acc, e) => acc + (state.edges.has(e) ? 1 : 0), 0)
}

export function applyMove(m: Move, state: GameState): { next: GameState; captured: number } {
  const key = moveKey(m)
  if (state.edges.has(key)) return { next: state, captured: 0 }
  const next: GameState = {
    ...state,
    edges: new Set(state.edges).add(key),
    boxes: { ...state.boxes },
    scores: [...state.scores],
  }
  let captured = 0
  const adj = boxesForMove(m, state.boardSize)
  for (const id of adj) {
    if (next.boxes[id] != null) continue
    const [rs, cs] = id.split(':')
    const r = Number(rs), c = Number(cs)
    const edges = getBoxEdges(r, c)
    if (edges.every((e) => next.edges.has(e))) {
      next.boxes[id] = state.currentPlayer
      next.scores[state.currentPlayer] = (next.scores[state.currentPlayer] ?? 0) + 1
      captured++
    }
  }
  if (captured === 0) {
    next.currentPlayer = state.currentPlayer === 0 ? 1 : 0
  }
  next.hint = null
  return { next, captured }
}

export function checkCompletedBoxes(state: GameState): string[] {
  return allBoxes(state.boardSize).filter((id) => state.boxes[id] != null)
}

export function isGameOver(state: GameState): boolean {
  const total = state.boardSize * state.boardSize
  let count = 0
  for (const id of Object.keys(state.boxes)) {
    if (state.boxes[id] != null) count++
  }
  return count === total
}

export function availableMoves(state: GameState): Move[] {
  const N = state.boardSize
  const moves: Move[] = []
  for (let r = 0; r <= N; r++) {
    for (let c = 0; c < N; c++) {
      const m: Move = { o: 'h', r, c }
      if (!state.edges.has(moveKey(m))) moves.push(m)
    }
  }
  for (let r = 0; r < N; r++) {
    for (let c = 0; c <= N; c++) {
      const m: Move = { o: 'v', r, c }
      if (!state.edges.has(moveKey(m))) moves.push(m)
    }
  }
  return moves
}

export function sidesPerBox(state: GameState): Record<string, number> {
  const N = state.boardSize
  const counts: Record<string, number> = {}
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const id = `${r}:${c}`
      counts[id] = edgesForBoxCount(state, id)
    }
  }
  return counts
}

export function createInitialState(boardSize = 5, mode: 'pvp' | 'pvai' = 'pvp', aiLevel: 'easy' | 'medium' | 'hard' = 'easy'): GameState {
  return {
    boardSize,
    edges: new Set<string>(),
    boxes: initBoxes(boardSize),
    currentPlayer: 0,
    scores: [0, 0],
    mode,
    aiLevel,
    history: [],
    future: [],
    hint: null,
  }
}
