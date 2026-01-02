import type { NextApiRequest, NextApiResponse } from 'next'
import QRCode from 'qrcode'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { registrationId, subEventId, email } = req.body

    if (!registrationId || !subEventId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Generate QR code data with registration info
    const qrData = JSON.stringify({
      registrationId,
      subEventId,
      email,
      timestamp: new Date().toISOString()
    })

    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return res.status(200).json({
      success: true,
      qrCodeUrl
    })
  } catch (error: any) {
    console.error('QR code generation error:', error)
    res.status(500).json({ error: 'Failed to generate QR code' })
  }
}
