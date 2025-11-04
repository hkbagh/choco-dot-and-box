import { GameState, Move, availableMoves, applyMove, moveKey, sidesPerBox } from './rules'

export function randomMove(state: GameState): Move | null {
  const moves = availableMoves(state)
  if (moves.length === 0) return null
  const idx = Math.floor(Math.random() * moves.length)
  return moves[idx]!
}

export function safeMoves(state: GameState): Move[] {
  const counts = sidesPerBox(state)
  const N = state.boardSize
  const moves = availableMoves(state)
  const safe: Move[] = []
  for (const m of moves) {
    let dangerous = false
    const ids = boxesForMoveKeys(m, N)
    for (const id of ids) {
      const c = counts[id] ?? 0
      // If playing this move would make a box have 3 sides, it's dangerous
      if (c === 2) {
        dangerous = true
        break
      }
    }
    if (!dangerous) safe.push(m)
  }
  return safe
}

function boxesForMoveKeys(m: Move, boardSize: number): string[] {
  const ids: string[] = []
  if (m.o === 'h') {
    if (m.r > 0) ids.push(`${m.r - 1}:${m.c}`)
    if (m.r < boardSize) ids.push(`${m.r}:${m.c}`)
  } else {
    if (m.c > 0) ids.push(`${m.r}:${m.c - 1}`)
    if (m.c < boardSize) ids.push(`${m.r}:${m.c}`)
  }
  return ids
}

export function capturingMoves(state: GameState): Move[] {
  const counts = sidesPerBox(state)
  const moves = availableMoves(state)
  return moves.filter((m) => {
    const ids = boxesForMoveKeys(m, state.boardSize)
    return ids.some((id) => (counts[id] ?? 0) === 3)
  })
}

export function mediumMove(state: GameState): Move | null {
  // Prefer capturing moves
  const caps = capturingMoves(state)
  if (caps.length > 0) return caps[0]!

  // Avoid creating third sides if possible
  const safe = safeMoves(state)
  if (safe.length > 0) {
    const idx = Math.floor(Math.random() * safe.length)
    return safe[idx]!
  }

  // If forced to create 3rd side, pick the one that minimizes new 3rd sides
  const moves = availableMoves(state)
  let best: Move | null = null
  let bestPenalty = Infinity
  for (const m of moves) {
    let penalty = 0
    const ids = boxesForMoveKeys(m, state.boardSize)
    for (const id of ids) {
      const c = (sidesPerBox(state)[id] ?? 0) + 1
      if (c === 3) penalty += 1
    }
    if (penalty < bestPenalty) {
      bestPenalty = penalty
      best = m
    }
  }
  return best
}

// Simple chain-aware heuristic and minimax with alpha-beta pruning
export function hardMove(state: GameState): Move | null {
  const moves = availableMoves(state)
  if (moves.length === 0) return null

  // Order moves: capturing first, then safe, then others
  const caps = new Set(capturingMoves(state).map(moveKey))
  const safe = new Set(safeMoves(state).map(moveKey))
  const ordered = [
    ...moves.filter((m) => caps.has(moveKey(m))),
    ...moves.filter((m) => !caps.has(moveKey(m)) && safe.has(moveKey(m))),
    ...moves.filter((m) => !caps.has(moveKey(m)) && !safe.has(moveKey(m))),
  ]

  let bestScore = -Infinity
  let best: Move | null = null
  const depth = Math.min(5, 2 + Math.floor(state.boardSize / 2))
  for (const m of ordered) {
    const { next, captured } = applyMove(m, state)
    const score = -negamax(next, depth - (captured > 0 ? 0 : 1), -Infinity, Infinity)
    if (score > bestScore) {
      bestScore = score
      best = m
    }
  }
  return best
}

function negamax(state: GameState, depth: number, alpha: number, beta: number): number {
  // Terminal
  const avail = availableMoves(state)
  if (depth <= 0 || avail.length === 0) {
    return evaluate(state)
  }
  let best = -Infinity
  // Captures first
  const caps = new Set(capturingMoves(state).map(moveKey))
  const safe = new Set(safeMoves(state).map(moveKey))
  const ordered = [
    ...avail.filter((m) => caps.has(moveKey(m))),
    ...avail.filter((m) => !caps.has(moveKey(m)) && safe.has(moveKey(m))),
    ...avail.filter((m) => !caps.has(moveKey(m)) && !safe.has(moveKey(m))),
  ]
  for (const m of ordered) {
    const { next, captured } = applyMove(m, state)
    const childDepth = depth - (captured > 0 ? 0 : 1)
    const val = -negamax(next, childDepth, -beta, -alpha)
    best = Math.max(best, val)
    alpha = Math.max(alpha, val)
    if (alpha >= beta) break
  }
  return best
}

function evaluate(state: GameState): number {
  // Positive is good for current player
  const me = state.currentPlayer
  const opp = me === 0 ? 1 : 0
  const scoreDiff = (state.scores[me] ?? 0) - (state.scores[opp] ?? 0)

  // Chain heuristic: count boxes with 2 sides (links), 3 sides (danger)
  const counts = Object.values(sidesPerBox(state))
  const links = counts.filter((c) => c === 2).length
  const dangers = counts.filter((c) => c === 3).length

  const safes = safeMoves(state).length

  // Weighted sum
  return scoreDiff * 10 + safes * 0.2 - dangers * 0.6 - links * 0.05
}
