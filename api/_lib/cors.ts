export function withCORS(handler: (req: any, res: any) => Promise<void> | void) {
  return async (req: any, res: any) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') {
      res.status(200).end()
      return
    }
    try {
      await handler(req, res)
    } catch (e: any) {
      res.status(500).json({ error: 'internal_error', message: String(e?.message || e) })
    }
  }
}

export async function readJson(req: any) {
  if (req.body && typeof req.body === 'object') return req.body
  const chunks: any[] = []
  for await (const c of req) chunks.push(c)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

