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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Entry Pass - Planora</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, ${brandPrimary} 0%, ${brandAccent} 100%);
      color: white;
      padding: 48px 24px;
      text-align: center;
    }
    .header-tag {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      opacity: 0.9;
      margin-bottom: 8px;
    }
    .header-title {
      font-size: 32px;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 4px;
    }
    .header-subtitle {
      font-size: 13px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 24px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    .greeting .name {
      color: ${brandPrimary};
    }
    .intro-text {
      font-size: 14px;
      color: #555;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .section {
      margin-bottom: 28px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #999;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #f0f0f0;
    }
    .event-card {
      background: linear-gradient(135deg, rgba(${hexToRgb(brandPrimary)}, 0.08) 0%, rgba(${hexToRgb(brandAccent)}, 0.08) 100%);
      border: 1px solid rgba(${hexToRgb(brandPrimary)}, 0.2);
      border-radius: 12px;
      padding: 20px;
    }
    .event-name {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 12px;
    }
    .event-detail {
      font-size: 13px;
      color: #666;
      margin-bottom: 6px;
      display: flex;
      align-items: flex-start;
    }
    .event-detail-label {
      font-weight: 600;
      color: #999;
      min-width: 70px;
    }
    .event-detail-value {
      color: #333;
      flex: 1;
    }
    .ticket-info-card {
      background: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .ticket-info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .ticket-info-row:last-child {
      border-bottom: none;
    }
    .ticket-info-label {
      font-size: 12px;
      font-weight: 600;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .ticket-info-value {
      font-size: 13px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .ticket-info-value.id {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: ${brandPrimary};
      word-break: break-all;
    }
    .qr-section {
      text-align: center;
      background: rgba(${hexToRgb(brandAccent)}, 0.1);
      border: 2px dashed ${brandAccent};
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .qr-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 12px;
      letter-spacing: 0.5px;
    }
    .qr-image {
      width: 180px;
      height: 180px;
      margin: 0 auto 12px;
      background: white;
      padding: 8px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .qr-instruction {
      font-size: 12px;
      color: #666;
      line-height: 1.5;
      font-weight: 500;
    }
    .action-buttons {
      display: flex;
      gap: 12px;
      margin: 28px 0;
    }
    .btn {
      flex: 1;
      display: inline-block;
      padding: 14px 20px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
      text-align: center;
      transition: all 0.3s ease;
    }
    .btn-primary {
      background: linear-gradient(135deg, ${brandPrimary} 0%, ${brandAccent} 100%);
      color: white;
    }
    .btn-secondary {
      background: white;
      border: 1px solid ${brandPrimary};
      color: ${brandPrimary};
    }
    .checklist {
      background: #f9f9f9;
      border-left: 4px solid ${brandPrimary};
      padding: 16px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .checklist-title {
      font-size: 13px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    .checklist-item {
      font-size: 12px;
      color: #555;
      margin-bottom: 6px;
      padding-left: 20px;
      position: relative;
      line-height: 1.5;
    }
    .checklist-item:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: 700;
    }
    .footer {
      background: #f9f9f9;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer-text {
      font-size: 12px;
      color: #999;
      line-height: 1.6;
      margin: 0 0 8px 0;
    }
    .footer-link {
      color: ${brandPrimary};
      text-decoration: none;
      font-weight: 600;
    }
    .divider {
      height: 1px;
      background: #e0e0e0;
      margin: 24px 0;
    }
    @media (max-width: 600px) {
      .wrapper {
        border-radius: 0;
      }
      .header {
        padding: 32px 16px;
      }
      .header-title {
        font-size: 24px;
      }
      .content {
        padding: 24px 16px;
      }
      .action-buttons {
        flex-direction: column;
      }
      .btn {
        min-width: 100%;
      }
      .event-detail {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- HEADER -->
    <div class="header">
      <div class="header-tag">Registration Confirmed</div>
      <div class="header-title">${escapeHtml(headerTitle)}</div>
      <div class="header-subtitle">Your spot is reserved!</div>
    </div>

    <!-- CONTENT -->
    <div class="content">
      <!-- GREETING -->
      <p class="greeting">Hi <span class="name">${escapeHtml(name)}</span>,</p>
      <p class="intro-text">Thank you for registering for <strong>${escapeHtml(eventTitle)}</strong>. Your registration has been confirmed and we're excited to have you attend!</p>

      <!-- EVENT DETAILS -->
      <div class="section">
        <div class="section-title">Event Details</div>
        <div class="event-card">
          <div class="event-name">${escapeHtml(eventTitle)}</div>
          ${eventDate ? `<div class="event-detail"><span class="event-detail-label">📅 Date:</span><span class="event-detail-value">${escapeHtml(eventDate)}</span></div>` : ''}
          ${eventLocation ? `<div class="event-detail"><span class="event-detail-label">📍 Location:</span><span class="event-detail-value">${escapeHtml(eventLocation)}</span></div>` : ''}
          ${eventDescription ? `<div class="event-detail" style="margin-top: 8px;"><span class="event-detail-label">📝 Details:</span><span class="event-detail-value">${escapeHtml(eventDescription.substring(0, 150))}${eventDescription.length > 150 ? '...' : ''}</span></div>` : ''}
        </div>
      </div>

      <!-- TICKET INFO -->
      <div class="section">
        <div class="section-title">Ticket Information</div>
        <div class="ticket-info-card">
          <div class="ticket-info-row">
            <span class="ticket-info-label">Full Name</span>
            <span class="ticket-info-value">${escapeHtml(name)}</span>
          </div>
          <div class="ticket-info-row">
            <span class="ticket-info-label">Email</span>
            <span class="ticket-info-value">${escapeHtml(email)}</span>
          </div>
          <div class="ticket-info-row">
            <span class="ticket-info-label">Ticket ID</span>
            <span class="ticket-info-value id">${escapeHtml(ticketId.substring(0, 12).toUpperCase())}</span>
          </div>
        </div>
      </div>

      <!-- QR CODE -->
      ${qrCodeUrl ? `
      <div class="section">
        <div class="qr-section">
          <div class="qr-label">Scan for Check-in</div>
          <img src="${qrCodeUrl}" alt="QR Code" class="qr-image">
          <div class="qr-instruction">📱 Show this QR code at the entrance for quick check-in</div>
        </div>
      </div>
      ` : ''}

      <!-- CHECKLIST -->
      <div class="section">
        <div class="checklist">
          <div class="checklist-title">What's Next?</div>
          <div class="checklist-item">Save this email or download the PDF</div>
          <div class="checklist-item">Arrive 15 minutes early</div>
          <div class="checklist-item">Bring any required materials</div>
          <div class="checklist-item">Have your ID ready</div>
        </div>
      </div>

      <!-- ACTION BUTTONS -->
      <div class="action-buttons">
        <a href="${escapeHtml(viewTicketUrl)}" class="btn btn-primary">View Ticket</a>
        <a href="${escapeHtml(pdfDownloadUrl)}" class="btn btn-secondary">Download PDF</a>
      </div>

      <div class="divider"></div>

      <!-- FOOTER CTA -->
      <p class="intro-text" style="margin-bottom: 0;">Have questions? We're here to help! Reach out to our support team anytime.</p>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <p class="footer-text">🎉 See you at the event!</p>
      <p class="footer-text">&copy; ${new Date().getFullYear()} Planora Ticketing. All rights reserved.</p>
      <p class="footer-text">
        <a href="mailto:support@planora.app" class="footer-link">Contact Support</a>
      </p>
    </div>
  </div>
</body>
</html>`
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
          color: #f1f5f9;
        }
        .otp-box {
          background: linear-gradient(135deg, rgba(${hexToRgb(brandPrimary)}, 0.15) 0%, rgba(${hexToRgb(brandAccent)}, 0.15) 100%);
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
          color: #e2e8f0;
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
          color: #cbd5e1;
          margin-top: 12px;
        }
        .info-text {
          color: #e2e8f0;
          font-size: 14px;
          line-height: 1.7;
          margin: 16px 0;
        }
        .footer {
          background-color: #0f172a;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px 24px;
          text-align: center;
        }
        .footer-text {
          font-size: 12px;
          color: #cbd5e1;
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

/**
 * Generate track/sub-event registration confirmation email
 */
export function generateTrackRegistrationEmail(options: {
  name: string
  email: string
  registrationId: string
  trackTitle: string
  trackType?: string
  trackDescription?: string
  startTime?: string
  endTime?: string
  location?: string
  paymentStatus: string
  speakerName?: string
  speakerEmail?: string
  qrCodeCid?: string
  viewUrl: string
  brandPrimary?: string
  brandAccent?: string
}): string {
  const {
    name,
    email,
    registrationId,
    trackTitle,
    trackType,
    trackDescription,
    startTime,
    endTime,
    location,
    paymentStatus,
    speakerName,
    speakerEmail,
    qrCodeCid,
    viewUrl,
    brandPrimary = '#667eea',
    brandAccent = '#764ba2'
  } = options

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Track Registration Confirmed - Planora</title>
      <style>
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #111827;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          background-size: 200% 200%;
          animation: gradientShift 12s ease infinite;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
          background: linear-gradient(135deg, ${brandPrimary} 0%, ${brandAccent} 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header p {
          font-size: 14px;
          opacity: 0.95;
        }
        .success-badge {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #111827;
          font-size: 22px;
          margin-bottom: 15px;
          font-weight: 700;
        }
        .content p {
          color: #374151;
          margin-bottom: 20px;
          line-height: 1.8;
        }
        .details {
          background: linear-gradient(to right, #f9fafb 0%, #f3f4f6 100%);
          border-left: 4px solid ${brandPrimary};
          padding: 24px;
          border-radius: 8px;
          margin: 30px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #d1d5db;
          align-items: flex-start;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          color: #6b7280;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex: 0 0 35%;
        }
        .detail-value {
          color: #111827;
          font-weight: 600;
          font-size: 14px;
          text-align: right;
          flex: 1;
        }
        .detail-value.mono {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          word-break: break-all;
        }
        .detail-value.status {
          color: #10b981;
          text-transform: capitalize;
        }
        .qr-section {
          text-align: center;
          padding: 30px 0;
          margin: 30px 0;
          background: linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%);
          border-radius: 12px;
          border: 2px dashed ${brandPrimary};
        }
        .qr-section h3 {
          color: #111827;
          margin-bottom: 15px;
          font-size: 16px;
          font-weight: 700;
        }
        .qr-code {
          display: inline-block;
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .qr-code img {
          width: 240px;
          height: 240px;
          display: block;
        }
        .qr-hint {
          color: #6b7280;
          font-size: 13px;
          margin-top: 12px;
          font-weight: 500;
        }
        .info-box {
          background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
          border-left: 4px solid #3b82f6;
          padding: 20px;
          border-radius: 8px;
          margin: 30px 0;
        }
        .info-box h4 {
          color: #111827;
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 700;
        }
        .info-box ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .info-box li {
          color: #374151;
          font-size: 13px;
          padding: 6px 0;
          line-height: 1.6;
        }
        .info-box li:before {
          content: "✓ ";
          color: #10b981;
          font-weight: 700;
          margin-right: 8px;
        }
        .actions {
          margin: 30px 0;
          text-align: center;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, ${brandPrimary} 0%, ${brandAccent} 100%);
          color: white;
          padding: 14px 32px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          margin: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }
        .btn-outline {
          background: white;
          color: ${brandPrimary};
          border: 2px solid ${brandPrimary};
        }
        .btn-outline:hover {
          background: #f9fafb;
        }
        .footer {
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          padding: 30px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
        .footer a {
          color: ${brandPrimary};
          text-decoration: none;
          font-weight: 600;
        }
        .footer a:hover {
          text-decoration: underline;
        }
        @media (max-width: 600px) {
          .content { padding: 25px 20px; }
          .header h1 { font-size: 22px; }
          .qr-code img { width: 200px; height: 200px; }
          .btn { display: block; margin: 10px 0; }
          .detail-row { flex-direction: column; }
          .detail-label { margin-bottom: 4px; }
          .detail-value { text-align: left; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Registration Confirmed</h1>
          <p>Your spot is reserved!</p>
        </div>
        
        <div class="content">
          <div style="text-align: center;">
            <span class="success-badge">Registration Successful</span>
          </div>
          
          <h2>Hello ${escapeHtml(name)}!</h2>
          <p>
            Thank you for registering for <strong>${escapeHtml(trackTitle)}</strong>. 
            Your registration has been confirmed and we're excited to have you attend!
          </p>
          
          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Track/Session</span>
              <span class="detail-value">${escapeHtml(trackTitle)}</span>
            </div>
            ${trackType ? `
            <div class="detail-row">
              <span class="detail-label">Type</span>
              <span class="detail-value">${escapeHtml(trackType)}</span>
            </div>
            ` : ''}
            ${startTime ? `
            <div class="detail-row">
              <span class="detail-label">Start Time</span>
              <span class="detail-value">${new Date(startTime).toLocaleString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</span>
            </div>
            ` : ''}
            ${endTime ? `
            <div class="detail-row">
              <span class="detail-label">End Time</span>
              <span class="detail-value">${new Date(endTime).toLocaleString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</span>
            </div>
            ` : ''}
            ${location ? `
            <div class="detail-row">
              <span class="detail-label">Location</span>
              <span class="detail-value">${escapeHtml(location)}</span>
            </div>
            ` : ''}
            ${speakerName ? `
            <div class="detail-row">
              <span class="detail-label">Speaker</span>
              <span class="detail-value">${escapeHtml(speakerName)}${speakerEmail ? ` (${escapeHtml(speakerEmail)})` : ''}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Registration ID</span>
              <span class="detail-value mono">${escapeHtml(registrationId)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value">${escapeHtml(email)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Status</span>
              <span class="detail-value status">${escapeHtml(paymentStatus)}</span>
            </div>
          </div>
          
          ${qrCodeCid ? `
          <div class="qr-section">
            <h3>📱 Your Check-in QR Code</h3>
            <div class="qr-code">
              <img src="cid:${qrCodeCid}" alt="Check-in QR Code" />
            </div>
            <p class="qr-hint">Show this code at the event for quick check-in</p>
          </div>
          ` : ''}
          
          <div class="info-box">
            <h4>📋 What's Next?</h4>
            <ul>
              <li>Save this email or download the attached PDF</li>
              <li>Arrive 15 minutes early for smooth entry</li>
              <li>Bring any required materials or prerequisites</li>
              <li>Come prepared with questions for the speaker</li>
              <li>Have fun and enjoy the session!</li>
            </ul>
          </div>
          
          <div class="actions">
            <a href="${viewUrl}" class="btn">View Registration Details</a>
            <a href="${viewUrl.split('?')[0].replace('/track-success', '/events')}" class="btn btn-outline">Explore More Events</a>
          </div>
          
          <p style="color: #6b7280; font-size: 13px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <strong>Need help?</strong> If you have any questions or need assistance, please reach out to the event organizer.
          </p>
        </div>
        
        <div class="footer">
          <p style="margin-bottom: 10px; font-size: 14px; color: #111827;">
            🎉 <strong>See you at the event!</strong>
          </p>
          <p>&copy; ${new Date().getFullYear()} Planora Ticketing. All rights reserved.</p>
          <p style="margin-top: 10px;">
            <a href="mailto:support@planora.app">Contact Support</a> | 
            <a href="#">Privacy Policy</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
