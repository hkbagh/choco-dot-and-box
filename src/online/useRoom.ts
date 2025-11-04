import { useCallback, useEffect, useRef, useState } from 'react'
import Peer, { DataConnection } from 'peerjs'
import type { Move, SerializedState } from '../utils/rules'

export type RoomStatus = 'idle' | 'connecting' | 'connected' | 'error'
export type RoomRole = 'host' | 'guest'

export type RoomMessage =
  | { type: 'move'; move: Move }
  | { type: 'sync'; state: SerializedState }
  | { type: 'reset' }
  | { type: 'set_board_size'; size: number }
  | { type: 'undo' }
  | { type: 'redo' }

export interface UseRoom {
  status: RoomStatus
  role: RoomRole | null
  me: 0 | 1 | null
  error: string | null
  create: (pin: string) => void
  join: (pin: string) => void
  leave: () => void
  send: (msg: RoomMessage) => void
}

export function useRoom(onMessage: (msg: RoomMessage) => void): UseRoom {
  const [status, setStatus] = useState<RoomStatus>('idle')
  const [role, setRole] = useState<RoomRole | null>(null)
  const [me, setMe] = useState<0 | 1 | null>(null)
  const [error, setError] = useState<string | null>(null)

  const peerRef = useRef<Peer | null>(null)
  const connRef = useRef<DataConnection | null>(null)
  const cbRef = useRef(onMessage)
  cbRef.current = onMessage

  const cleanup = useCallback(() => {
    try { connRef.current?.close() } catch {}
    try { peerRef.current?.destroy() } catch {}
    connRef.current = null
    peerRef.current = null
  }, [])

  const leave = useCallback(() => {
    cleanup()
    setStatus('idle')
    setRole(null)
    setMe(null)
    setError(null)
  }, [cleanup])

  useEffect(() => () => { cleanup() }, [cleanup])

  const handleConnection = useCallback((conn: DataConnection) => {
    connRef.current = conn
    conn.on('data', (d: any) => {
      cbRef.current(d as RoomMessage)
    })
    conn.on('open', () => setStatus('connected'))
    conn.on('close', () => setStatus('idle'))
    conn.on('error', (err) => { setError(String(err)); setStatus('error') })
  }, [])

  const create = useCallback((pin: string) => {
    leave()
    setStatus('connecting')
    const id = `room-${pin}`
    const peer = new Peer(id)
    peerRef.current = peer
    setRole('host')
    setMe(0)
    peer.on('open', () => setStatus('connected'))
    peer.on('connection', (conn) => {
      handleConnection(conn)
    })
    peer.on('error', (err) => { setError(String(err)); setStatus('error') })
    peer.on('disconnected', () => setStatus('idle'))
  }, [handleConnection, leave])

  const join = useCallback((pin: string) => {
    leave()
    setStatus('connecting')
    const peer = new Peer()
    peerRef.current = peer
    setRole('guest')
    setMe(1)
    peer.on('open', () => {
      const target = `room-${pin}`
      const conn = peer.connect(target)
      handleConnection(conn)
    })
    peer.on('error', (err) => { setError(String(err)); setStatus('error') })
    peer.on('disconnected', () => setStatus('idle'))
  }, [handleConnection, leave])

  const send = useCallback((msg: RoomMessage) => {
    const conn = connRef.current
    if (conn && conn.open) {
      conn.send(msg)
    } else {
      // If host without a guest, broadcast via peer connections if any arrive later
      connRef.current?.send?.(msg)
    }
  }, [])

  return { status, role, me, error, create, join, leave, send }
}

