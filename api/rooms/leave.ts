import { withCORS, readJson } from '../_lib/cors'
import { deleteRoom, getRoom, saveRoom } from '../_lib/roomsStore'

export default withCORS(async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return }
  const body = await readJson(req)
  const pin = String(body?.pin || '').trim()
  const me = String(body?.me || '').trim()
  if (!/^\d{4}$/.test(pin)) { res.status(400).json({ error: 'invalid_pin' }); return }
  if (!me) { res.status(400).json({ error: 'invalid_me' }); return }

  const room = await getRoom(pin)
  if (!room) { res.status(200).json({ ok: true }) ; return }
  room.participants = room.participants.filter(p => p.id !== me)
  if (room.participants.length === 0) {
    await deleteRoom(pin)
    res.status(200).json({ ok: true })
    return
  }
  room.status = room.participants.length >= 2 ? 'full' : 'open'
  await saveRoom(room)
  res.status(200).json({ ok: true })
})

