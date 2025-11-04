import { useMemo } from 'react'
import { GameState, Move } from '../utils/rules'
import { hardMove, mediumMove, randomMove } from '../utils/ai'

export function useAI(level: 'easy' | 'medium' | 'hard') {
  const chooseMove = useMemo(() => {
    return (state: GameState): Move | null => {
      switch (level) {
        case 'easy':
          return randomMove(state)
        case 'medium':
          return mediumMove(state)
        case 'hard':
          return hardMove(state)
      }
    }
  }, [level])

  return { chooseMove }
}

