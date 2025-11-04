import { withCORS, readJson } from '../_lib/cors'
import { Room, Participant, getRoom, saveRoom, now } from '../_lib/roomsStore'

export default withCORS(async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return }
  const body = await readJson(req)
  const name = String(body?.name || '').trim()
  const pin = String(body?.pin || '').trim()
  if (!name) { res.status(400).json({ error: 'invalid_name' }); return }
  if (!/^\d{4}$/.test(pin)) { res.status(400).json({ error: 'invalid_pin' }); return }

  const room = await getRoom(pin)
  if (!room) { res.status(404).json({ error: 'room_not_found' }); return }
  if (room.participants.length >= 2) { res.status(409).json({ error: 'room_full' }); return }

  const me: Participant = {
    id: (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2),
    name, role: 'guest', lastSeen: now(),
  }
  room.participants.push(me)
  room.status = room.participants.length >= 2 ? 'full' : 'open'
  await saveRoom(room)
  res.status(200).json({ ok: true, pin, me, role: me.role, room })
})

