// Lightweight room store using Vercel KV if configured, with in-memory fallback for local dev
// Data model kept simple for matchmaking/presence; realtime gameplay still uses P2P

type Role = 'host' | 'guest'

export interface Participant {
  id: string
  name: string
  role: Role
  lastSeen: number
}

export interface Room {
  pin: string
  createdAt: number
  boardSize: number
  status: 'open' | 'full'
  participants: Participant[]
}

const TTL_SECONDS = 60 * 60 * 2 // 2 hours

let memory = new Map<string, Room>()

function hasKV() {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN
}

async function kvClient() {
  if (!hasKV()) return null as any
  try {
    // lazy import to avoid bundling for frontend
    const mod = await import('@vercel/kv')
    return mod
  } catch (e) {
    return null as any
  }
}

export async function getRoom(pin: string): Promise<Room | null> {
  if (hasKV()) {
    const kv = await kvClient()
    const data = await kv.kv.get<Room>(`room:${pin}`)
    return (data as any) || null
  }
  return memory.get(pin) || null
}

export async function saveRoom(room: Room): Promise<void> {
  if (hasKV()) {
    const kv = await kvClient()
    await kv.kv.set(`room:${room.pin}`, room, { ex: TTL_SECONDS })
    return
  }
  memory.set(room.pin, room)
}

export async function deleteRoom(pin: string): Promise<void> {
  if (hasKV()) {
    const kv = await kvClient()
    await kv.kv.del(`room:${pin}`)
    return
  }
  memory.delete(pin)
}

export function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export function now(): number { return Date.now() }

