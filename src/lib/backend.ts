export interface CreateRoomResponse {
  ok: true
  pin: string
  role: 'host'
  me: { id: string; name: string; role: 'host' }
  room: any
}

export interface JoinRoomResponse {
  ok: true
  pin: string
  role: 'guest'
  me: { id: string; name: string; role: 'guest' }
  room: any
}

async function api(path: string, init?: RequestInit) {
  const base = '' // same origin
  const res = await fetch(`${base}/api/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  if (!res.ok) {
    let msg: any
    try { msg = await res.json() } catch { msg = { error: 'http_error', status: res.status } }
    throw new Error(msg?.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function createRoom(name: string, pin?: string, boardSize?: number) {
  return api('rooms/create', { method: 'POST', body: JSON.stringify({ name, pin, boardSize }) }) as Promise<CreateRoomResponse>
}

export async function joinRoom(name: string, pin: string) {
  return api('rooms/join', { method: 'POST', body: JSON.stringify({ name, pin }) }) as Promise<JoinRoomResponse>
}

export async function leaveRoom(me: string, pin: string) {
  try { await api('rooms/leave', { method: 'POST', body: JSON.stringify({ me, pin }) }) } catch {}
}

