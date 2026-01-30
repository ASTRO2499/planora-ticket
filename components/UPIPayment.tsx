import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card } from './ui/Card'
import QRCode from 'qrcode'

interface UPIPaymentProps {
  eventId: string
  ticketId: string
  amount: number
  name: string
  email: string
  phone: string
  college?: string
  ieee?: string
  upiId: string
  onSuccess: (paymentId: string) => void
  onError: (error: string) => void
}

export default function UPIPayment({
  eventId,
  ticketId,
  amount,
  name,
  email,
  phone,
  college = '',
  ieee = '',
  upiId,
  onSuccess,
  onError
}: UPIPaymentProps) {
  const [transactionId, setTransactionId] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string>('')
  const [qrCode, setQrCode] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  // Generate UPI QR code on component mount
  useEffect(() => {
    const generateQrCode = async () => {
      try {
        // UPI unified payment interface format
        // upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&tn=DESCRIPTION
        const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&tn=Event%20Registration`
        const qrCodeUrl = await QRCode.toDataURL(upiString, {
          errorCorrectionLevel: 'H',
          type: 'image/jpeg',
          width: 250,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrCode(qrCodeUrl)
      } catch (err) {
        console.error('Error generating QR code:', err)
      }
    }

    if (upiId && amount > 0) {
      generateQrCode()
    }
  }, [upiId, amount, name])

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Screenshot must be less than 5MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    setScreenshot(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!transactionId.trim()) {
      toast.error('Please enter transaction ID')
      return
    }

    if (!screenshot) {
      toast.error('Please upload payment screenshot')
      return
    }

    setSubmitting(true)
    try {
      // Convert screenshot to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const screenshotBase64 = reader.result as string

          const response = await fetch('/api/upi-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId,
              ticketId,
              name,
              email,
              phone,
              college,
              ieee,
              amount_inr: amount,
              upi_id: upiId,
              transaction_id: transactionId,
              screenshotBase64,
              mimeType: screenshot?.type || 'image/jpeg'
            })
          })

          if (response.ok) {
            const data = await response.json()
            toast.success('Payment submitted! Waiting for confirmation from organizer.')
            onSuccess(data.payment_id)
          } else {
            const error = await response.json()
            toast.error(error.error || 'Failed to submit payment')
            onError(error.error || 'Payment submission failed')
          }
        } catch (err) {
          console.error('Payment submission error:', err)
          toast.error('Error processing payment')
          onError('Error processing payment')
        } finally {
          setSubmitting(false)
        }
      }
      reader.readAsDataURL(screenshot)
    } catch (err) {
      console.error('Error:', err)
      toast.error('An error occurred')
      onError('An error occurred')
      setSubmitting(false)
    }
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Pay via UPI</h3>
          <p className="text-sm text-slate-300 mb-3">
            Send ₹{amount} to <span className="font-mono font-bold text-blue-400">{upiId}</span>
          </p>
          <p className="text-xs text-slate-400">
            Then submit your payment screenshot below for verification.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* UPI ID Display */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">UPI Address</div>
            <div className="text-white font-mono break-all text-sm">{upiId}</div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(upiId)
                toast.success('UPI ID copied!')
              }}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300"
            >
              📋 Copy UPI ID
            </button>
          </div>

          {/* QR Code and Pay Button */}
          {/* Quick Pay Button and QR Code */}
          <div className="space-y-3">
            {/* Main Pay Button */}
            <button
              type="button"
              onClick={() => {
                const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&tn=Event%20Registration`
                window.location.href = upiString
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 hover:shadow-lg text-lg"
            >
              💳 Pay ₹{amount} Now
            </button>
            <p className="text-xs text-slate-400 text-center">
              Fastest way - Opens your UPI app with amount pre-filled
            </p>

            {/* QR Code Option */}
            {qrCode && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col items-center">
                <div className="text-xs text-slate-400 mb-3">Or Scan QR Code</div>
                <div className="bg-white p-3 rounded-lg">
                  <Image
                    src={qrCode}
                    alt="UPI Payment QR Code"
                    width={200}
                    height={200}
                    className="w-40 h-40"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-3 text-center">
                  Scan with any UPI app
                </p>
              </div>
            )}
          </div>

          {/* Transaction ID */}
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Transaction ID / Reference Number *</label>
            <Input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g., UTR or transaction reference from your bank"
              required
              disabled={submitting}
            />
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Payment Screenshot *</label>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-4">
              {screenshotPreview ? (
                <div className="space-y-2">
                  <Image
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    width={400}
                    height={300}
                    className="max-h-40 mx-auto rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshot(null)
                      setScreenshotPreview('')
                    }}
                    className="text-xs text-slate-400 hover:text-slate-300"
                  >
                    Change screenshot
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    disabled={submitting}
                    className="block w-full text-sm text-slate-400"
                  />
                  <p className="text-xs text-slate-500">
                    Upload a screenshot of your payment confirmation (PNG, JPG, max 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={submitting}
            disabled={!transactionId.trim() || !screenshot}
          >
            Submit Payment for Verification
          </Button>

          <p className="text-xs text-slate-500 text-center">
            Your payment will be verified by the organizer. You&apos;ll receive your ticket once approved.
          </p>
        </form>
      </div>
    </Card>
  )
}
