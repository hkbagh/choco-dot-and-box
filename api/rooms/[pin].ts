import { withCORS } from '../_lib/cors'
import { getRoom } from '../_lib/roomsStore'

export default withCORS(async (req, res) => {
  if (req.method !== 'GET') { res.status(405).json({ error: 'method_not_allowed' }); return }
  const pin = (req.query?.pin || '').toString()
  if (!/^\d{4}$/.test(pin)) { res.status(400).json({ error: 'invalid_pin' }); return }
  const room = await getRoom(pin)
  if (!room) { res.status(404).json({ error: 'room_not_found' }); return }
  res.status(200).json({ ok: true, room })
})

