import nodemailer from 'nodemailer'

const provider = process.env.EMAIL_PROVIDER || 'smtp'

function buildSmtpTransport() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT || 465)
  const secure = port === 465
  const user = process.env.SMTP_USER || ''
  const pass = process.env.SMTP_PASS || ''
  
  if (!user || !pass) {
    console.warn('⚠️ SMTP credentials missing. Email functionality disabled. Set SMTP_USER and SMTP_PASS environment variables.')
    return null
  }
  
  try {
    const transporter = nodemailer.createTransport({ 
      host, 
      port, 
      secure, 
      auth: { user, pass },
      // Add connection timeout and retry options
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    })
    
    console.log('✅ SMTP transport configured:', { host, port, user: user.substring(0, 3) + '***' })
    return transporter
  } catch (error) {
    console.error('❌ Failed to create SMTP transport:', error instanceof Error ? error.message : String(error))
    return null
  }
}

function buildResendTransport() {
  const apiKey = process.env.RESEND_API_KEY
  
  if (!apiKey) {
    console.warn('⚠️ RESEND_API_KEY missing. Email functionality disabled.')
    return null
  }
  
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 587,
      secure: false,
      auth: { user: 'resend', pass: apiKey },
      connectionTimeout: 10000
    })
    
    console.log('✅ Resend transport configured')
    return transporter
  } catch (error) {
    console.error('❌ Failed to create Resend transport:', error instanceof Error ? error.message : String(error))
    return null
  }
}

export function getTransport() {
  try {
    if (provider === 'resend') {
      return buildResendTransport()
    }
    return buildSmtpTransport()
  } catch (error) {
    console.error('❌ Email transport initialization failed:', error instanceof Error ? error.message : String(error))
    return null
  }
}
