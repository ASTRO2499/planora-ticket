/**
 * Professional Email Templates for Planora Ticketing
 * Provides reusable, themed email templates for ticket confirmations
 */

interface EmailTemplateOptions {
  name: string
  email: string
  eventTitle: string
  ticketId: string
  qrCodeUrl?: string
  viewTicketUrl: string
  pdfDownloadUrl: string
  eventDate?: string
  eventLocation?: string
  eventDescription?: string
  brandPrimary?: string
  brandAccent?: string
  brandDark?: string
  headerTitle?: string
}

/**
 * Generate professional ticket confirmation email
 */
export function generateTicketConfirmationEmail(options: EmailTemplateOptions): string {
  const {
    name,
    email,
    eventTitle,
    ticketId,
    qrCodeUrl,
    viewTicketUrl,
    pdfDownloadUrl,
    eventDate,
    eventLocation,
    eventDescription,
    brandPrimary = '#7C3AED',
    brandAccent = '#EC4899',
    brandDark = '#0F172A',
    headerTitle = 'ENTRY PASS'
  } = options

  const eventInfo = [eventDate, eventLocation].filter(Boolean).join(' • ')

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Entry Pass - Planora</title>
      <style>
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #0b1220 0%, #0f172a 50%, #0b1220 100%);
          background-size: 200% 200%;
          animation: gradientShift 12s ease infinite;
        }
        .email-container {
          max-width: 640px;
          margin: 24px auto;
          background: rgba(17, 24, 39, 0.92);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .email-header {
          background: radial-gradient(circle at 15% 20%, rgba(124, 58, 237, 0.35), transparent 45%),
                      radial-gradient(circle at 80% 10%, rgba(236, 72, 153, 0.32), transparent 40%),
                      linear-gradient(135deg, ${brandPrimary} 0%, ${brandAccent} 100%);
          color: #ffffff;
          padding: 32px 24px;
          text-align: center;
        }
        .email-header-title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin: 0 0 8px 0;
          opacity: 0.9;
        }
        .email-header-subtitle {
          font-size: 24px;
          font-weight: 800;
          margin: 0;
        }
        .email-content {
          padding: 32px 24px;
          background: radial-gradient(circle at 80% 10%, rgba(236,72,153,0.08), transparent 35%),
                      radial-gradient(circle at 20% 20%, rgba(124,58,237,0.10), transparent 40%),
                      #0b1220;
          color: #e5e7eb;
        }
        .greeting {
          color: #e5e7eb;
          font-size: 16px;
          margin: 0 0 12px 0;
        }
        .greeting strong {
          color: ${brandPrimary};
          font-weight: 700;
        }
        .confirmation-text {
          color: #cbd5e1;
          font-size: 14px;
          margin: 0 0 24px 0;
          line-height: 1.7;
        }
        .ticket-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(124, 58, 237, 0.35);
          border-radius: 10px;
          padding: 20px;
          margin: 24px 0;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
        }
        .ticket-info-grid {
          display: table;
          width: 100%;
          border-collapse: collapse;
        }
        .ticket-info-row {
          display: table-row;
        }
        .ticket-info-cell {
          display: table-cell;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          vertical-align: top;
        }
        .ticket-info-row:last-child .ticket-info-cell {
          border-bottom: none;
        }
        .ticket-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #94a3b8;
          letter-spacing: 0.6px;
          margin-bottom: 4px;
        }
        .ticket-value {
          font-size: 14px;
          font-weight: 600;
          color: #e5e7eb;
          word-break: break-word;
        }
        .ticket-value.accent {
          color: ${brandAccent};
          font-family: 'Courier New', monospace;
          font-weight: 700;
        }
        .qr-section {
          text-align: center;
          margin: 24px 0;
          padding: 20px;
          background-color: rgba(${hexToRgb(brandAccent)}, 0.10);
          border: 2px solid ${brandAccent};
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        }
        .qr-label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: #cbd5e1;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }
        .qr-code-image {
          width: 160px;
          height: 160px;
          display: inline-block;
          border-radius: 10px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
        }
        .qr-instruction {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 12px;
          line-height: 1.6;
        }
        .event-details {
          background: rgba(255, 255, 255, 0.03);
          border-left: 4px solid ${brandPrimary};
          padding: 16px;
          margin: 24px 0;
          border-radius: 6px;
        }
        .event-title {
          font-size: 14px;
          font-weight: 800;
          color: #f8fafc;
          margin: 0 0 4px 0;
        }
        .event-meta {
          font-size: 12px;
          color: #cbd5e1;
          margin: 0;
        }
        .event-description {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 8px;
          line-height: 1.6;
        }
        .button-group {
          margin: 24px 0;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .button {
          display: inline-block;
          padding: 12px 20px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.3s ease;
          text-align: center;
        }
        .button-primary {
          background: linear-gradient(135deg, ${brandPrimary} 0%, ${brandAccent} 100%);
          color: #ffffff;
          flex: 1;
          min-width: 180px;
        }
        .button-primary:hover {
          opacity: 0.95;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        .button-secondary {
          background-color: rgba(255, 255, 255, 0.08);
          color: #e5e7eb;
          border: 1px solid rgba(255, 255, 255, 0.14);
          min-width: 150px;
        }
        .button-secondary:hover {
          background-color: rgba(255, 255, 255, 0.14);
        }
        .info-box {
          background-color: rgba(124, 58, 237, 0.12);
          border-left: 4px solid ${brandPrimary};
          padding: 12px 16px;
          margin: 16px 0;
          border-radius: 4px;
          font-size: 12px;
          color: #e0e7ff;
          line-height: 1.5;
        }
        .footer {
          background-color: #0f172a;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding: 24px;
          text-align: center;
        }
        .footer-text {
          font-size: 12px;
          color: #cbd5e1;
          margin: 0 0 8px 0;
          line-height: 1.6;
        }
        .footer-support {
          font-size: 11px;
          color: #94a3b8;
          margin: 0;
        }
        .footer-support a {
          color: ${brandAccent};
          text-decoration: none;
          font-weight: 600;
        }
        @media (max-width: 600px) {
          .email-container {
            margin: 0;
            border-radius: 0;
          }
          .email-header {
            padding: 24px 16px;
          }
          .email-content {
            padding: 20px 16px;
          }
          .button {
            width: 100%;
            box-sizing: border-box;
          }
          .button-group {
            flex-direction: column;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="email-header">
          <div class="email-header-title">Welcome to Planora</div>
          <div class="email-header-subtitle">${headerTitle}</div>
        </div>

        <!-- Main Content -->
        <div class="email-content">
          <!-- Greeting -->
          <p class="greeting">Hi <strong>${escapeHtml(name)}</strong>,</p>
          <p class="confirmation-text">
            Thank you for registering! Your entry pass has been confirmed and is ready to use. 
            Keep this email safe—you'll need your QR code to enter the event.
          </p>

          <!-- Event Details -->
          ${eventTitle ? `
            <div class="event-details">
              <div class="event-title">${escapeHtml(eventTitle)}</div>
              ${eventInfo ? `<div class="event-meta">${escapeHtml(eventInfo)}</div>` : ''}
              ${eventDescription ? `<div class="event-description">${escapeHtml(eventDescription.substring(0, 120))}</div>` : ''}
            </div>
          ` : ''}

          <!-- Ticket Information -->
          <div class="ticket-card">
            <div class="ticket-info-grid">
              <div class="ticket-info-row">
                <div class="ticket-info-cell">
                  <div class="ticket-label">Full Name</div>
                  <div class="ticket-value">${escapeHtml(name)}</div>
                </div>
              </div>
              <div class="ticket-info-row">
                <div class="ticket-info-cell">
                  <div class="ticket-label">Email</div>
                  <div class="ticket-value">${escapeHtml(email)}</div>
                </div>
              </div>
              <div class="ticket-info-row">
                <div class="ticket-info-cell">
                  <div class="ticket-label">Ticket ID</div>
                  <div class="ticket-value accent">${ticketId.substring(0, 12).toUpperCase()}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- QR Code Section -->
          ${qrCodeUrl ? `
            <div class="qr-section">
              <div class="qr-label">Scan to Verify at Entry</div>
              <img src="${qrCodeUrl}" alt="QR Code" class="qr-code-image">
              <div class="qr-instruction">
                📱 Show this QR code at the entrance. Do not share publicly or screenshot before the event.
              </div>
            </div>
          ` : ''}

          <!-- Action Buttons -->
          <div class="button-group">
            <a href="${viewTicketUrl}" class="button button-primary">View Full Ticket</a>
            <a href="${pdfDownloadUrl}" class="button button-secondary">Download PDF</a>
          </div>

          <!-- Important Information -->
          <div class="info-box">
            <strong>Important:</strong> This pass is valid for <strong>one entry</strong> only. Photo ID may be required. 
            Please arrive 10-15 minutes early.
          </div>

          <!-- Additional Info -->
          <p class="confirmation-text" style="margin-top: 24px;">
            Keep this ticket safe. If you lose it, you can always view your ticket by visiting your account or requesting another copy via email.
          </p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">
            Have questions? We're here to help.
          </p>
          <p class="footer-support">
            📧 <a href="mailto:support@planora.app">support@planora.app</a> 
            <br>
            Or visit our <a href="https://planora.app">website</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate OTP verification email
 */
export function generateOtpVerificationEmail(options: {
  name?: string
  otpCode: string
  brandPrimary?: string
  brandAccent?: string
}): string {
  const { name, otpCode, brandPrimary = '#7C3AED', brandAccent = '#EC4899' } = options

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Planora</title>
      <style>
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(${hexToRgb(brandAccent)}, 0.2); }
          70% { box-shadow: 0 0 0 12px rgba(${hexToRgb(brandAccent)}, 0); }
          100% { box-shadow: 0 0 0 0 rgba(${hexToRgb(brandAccent)}, 0); }
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #0b1220 0%, #0f172a 50%, #0b1220 100%);
        }
        .email-container {
          max-width: 480px;
          margin: 24px auto;
          background-color: rgba(17, 24, 39, 0.92);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 10px 36px rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .email-header {
          background: radial-gradient(circle at 15% 20%, rgba(124, 58, 237, 0.35), transparent 45%),
                      radial-gradient(circle at 80% 10%, rgba(236, 72, 153, 0.32), transparent 40%),
                      linear-gradient(135deg, ${brandPrimary} 0%, ${brandAccent} 100%);
          color: #ffffff;
          padding: 24px;
          text-align: center;
        }
        .email-header-title {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin: 0 0 8px 0;
          opacity: 0.9;
        }
        .email-header-text {
          font-size: 19px;
          font-weight: 800;
          margin: 0;
        }
        .email-content {
          padding: 24px;
          background: radial-gradient(circle at 80% 0%, rgba(236,72,153,0.08), transparent 40%),
                      radial-gradient(circle at 20% 20%, rgba(124,58,237,0.10), transparent 40%),
                      #0b1220;
          color: #e5e7eb;
        }
        .otp-box {
          background: linear-gradient(135deg, rgba(${hexToRgb(brandPrimary)}, 0.12) 0%, rgba(${hexToRgb(brandAccent)}, 0.12) 100%);
          border: 2px solid ${brandPrimary};
          border-radius: 10px;
          padding: 24px;
          text-align: center;
          margin: 24px 0;
          animation: pulseGlow 3s ease-in-out infinite;
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        }
        .otp-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #cbd5e1;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .otp-code {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: 4px;
          color: ${brandAccent};
          font-family: 'Courier New', monospace;
          margin: 0;
          word-spacing: 8px;
        }
        .otp-expiry {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 12px;
        }
        .info-text {
          color: #cbd5e1;
          font-size: 14px;
          line-height: 1.7;
          margin: 16px 0;
        }
        .footer {
          background-color: #0f172a;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding: 16px 24px;
          text-align: center;
        }
        .footer-text {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
          line-height: 1.5;
        }
        @media (max-width: 600px) {
          .email-container {
            margin: 0;
            border-radius: 0;
          }
          .otp-code {
            font-size: 24px;
            letter-spacing: 2px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="email-header-title">Planora</div>
          <div class="email-header-text">Verify Your Email</div>
        </div>

        <div class="email-content">
          <p class="info-text">
            ${name ? `Hi ${escapeHtml(name)},<br><br>` : ''}
            Enter this code to verify your email and access your tickets:
          </p>

          <div class="otp-box">
            <div class="otp-label">One-Time Code</div>
            <div class="otp-code">${otpCode}</div>
            <div class="otp-expiry">Expires in 10 minutes</div>
          </div>

          <p class="info-text" style="color: #9ca3af; font-size: 12px;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>

        <div class="footer">
          <p class="footer-text">
            © Planora Ticketing. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Utility: Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

/**
 * Utility: Convert hex color to RGB
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '124, 58, 237'
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)].join(', ')
}
