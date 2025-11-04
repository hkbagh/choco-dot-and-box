import React from 'react'
import type { RoomRole, RoomStatus } from '../online/useRoom'

interface OnlineProps {
  mode: 'pvp' | 'pvai' | 'online'
  status: RoomStatus
  role: RoomRole | null
  me: 0 | 1 | null
  pin: string
  setPin: (v: string) => void
  onCreate: () => void
  onJoin: () => void
  onLeave: () => void
}

export default function OnlinePanel({ mode, status, role, me, pin, setPin, onCreate, onJoin, onLeave }: OnlineProps) {
  const disabled = mode !== 'online'
  const validPin = /^\d{4}$/.test(pin)
  return (
    <div className="panel controls" aria-label="Online" role="group">
      <div className="row space">
        <span className="legend">Online Room</span>
        {status === 'connected' ? (
          <button className="btn" onClick={onLeave}>Leave</button>
        ) : (
          <span className="legend">{disabled ? 'Switch mode to Online' : 'Enter PIN'}</span>
        )}
      </div>
      <div className="row space">
        <label htmlFor="pin">PIN</label>
        <input
          id="pin"
          className="select"
          inputMode="numeric"
          pattern="\\d{4}"
          placeholder="1234"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
          disabled={disabled || status === 'connected'}
        />
      </div>
      <div className="row">
        <button className="btn" onClick={onCreate} disabled={disabled || status === 'connected' || !validPin}>Create</button>
        <button className="btn" onClick={onJoin} disabled={disabled || status === 'connected' || !validPin}>Join</button>
      </div>
      <div className="row">
        <span className="legend">
          {status === 'idle' && 'Idle'}
          {status === 'connecting' && 'Connecting...'}
          {status === 'connected' && `Connected as ${role === 'host' ? 'Host (P1)' : 'Guest (P2)'} ${me != null ? `• You are P${me + 1}` : ''}`}
          {status === 'error' && 'Error connecting'}
        </span>
      </div>
    </div>
  )
}

