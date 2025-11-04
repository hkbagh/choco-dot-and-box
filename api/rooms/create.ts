import { withCORS, readJson } from '../_lib/cors'
import { Room, Participant, generatePin, getRoom, saveRoom, now } from '../_lib/roomsStore'

export default withCORS(async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return }
  const body = await readJson(req)
  const name = String(body?.name || '').trim()
  let pin = body?.pin ? String(body.pin) : ''
  const boardSize = Number.isFinite(body?.boardSize) ? Number(body.boardSize) : 5
  if (!name) { res.status(400).json({ error: 'invalid_name' }); return }

  // find unique pin
  let attempts = 0
  while (!pin || pin.length !== 4) {
    pin = generatePin()
    const existing = await getRoom(pin)
    if (!existing) break
    attempts++
    if (attempts > 10) { res.status(500).json({ error: 'pin_generation_failed' }); return }
  }

  // create room
  const me: Participant = {
    id: (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2),
    name, role: 'host', lastSeen: now(),
  }
  const room: Room = {
    pin, createdAt: now(), boardSize, status: 'open', participants: [me]
  }
  await saveRoom(room)
  res.status(200).json({ ok: true, pin, me, role: me.role, room })
})

