import nodemailer from 'nodemailer'

const provider = process.env.EMAIL_PROVIDER || 'smtp'

function buildSmtpTransport() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT || 465)
  const secure = port === 465
  const user = process.env.SMTP_USER || ''
  const pass = process.env.SMTP_PASS || ''
  if (!user || !pass) {
    throw new Error('SMTP credentials missing. Set SMTP_USER and SMTP_PASS.')
  }
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } })
}

function buildResendTransport() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY missing')
  }
  return nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 587,
    secure: false,
    auth: { user: 'resend', pass: apiKey },
  })
}

export function getTransport() {
  if (provider === 'resend') return buildResendTransport()
  return buildSmtpTransport()
}
