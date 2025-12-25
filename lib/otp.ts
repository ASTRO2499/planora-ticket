import crypto from 'crypto'

const ALG = 'sha256'

export function signOtpToken(email: string, ttlSeconds: number = 600) {
  const secret = process.env.ADMIN_SECRET || 'default-secret'
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const payload = `${email}|${exp}`
  const hmac = crypto.createHmac(ALG, secret).update(payload).digest('hex')
  const token = Buffer.from(`${payload}|${hmac}`, 'utf-8').toString('base64url')
  return token
}

export function verifyOtpToken(token?: string) {
  if (!token) return { ok: false, email: null }
  try {
    const secret = process.env.ADMIN_SECRET || 'default-secret'
    const raw = Buffer.from(token, 'base64url').toString('utf-8')
    const [email, expStr, sig] = raw.split('|')
    if (!email || !expStr || !sig) return { ok: false, email: null }
    const payload = `${email}|${expStr}`
    const expected = crypto.createHmac(ALG, secret).update(payload).digest('hex')
    if (expected !== sig) return { ok: false, email: null }
    const exp = parseInt(expStr, 10)
    if (isNaN(exp) || exp < Math.floor(Date.now() / 1000)) return { ok: false, email: null }
    return { ok: true, email }
  } catch {
    return { ok: false, email: null }
  }
}
