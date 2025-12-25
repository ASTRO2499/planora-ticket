# Email Template Examples & Testing Guide

## 📧 Ticket Confirmation Email - Visual Structure

```
┌─────────────────────────────────────────────┐
│  [GRADIENT HEADER - Brand Primary to Accent]│
│                                             │
│  WELCOME TO PLANORA                         │
│  ENTRY PASS                                 │
├─────────────────────────────────────────────┤
│                                             │
│  Hi [Name],                                 │
│                                             │
│  Thank you for registering! Your entry      │
│  pass has been confirmed and is ready to    │
│  use. Keep this email safe.                 │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ EVENT DETAILS                         │  │
│  │ Event Title                           │  │
│  │ Date • Location                       │  │
│  │ Event description preview...          │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ TICKET INFORMATION                    │  │
│  │                                       │  │
│  │ FULL NAME                             │  │
│  │ [Name]                                │  │
│  │                                       │  │
│  │ EMAIL                                 │  │
│  │ [Email]                               │  │
│  │                                       │  │
│  │ TICKET ID                             │  │
│  │ [ID]                                  │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │   SCAN TO VERIFY AT ENTRY             │  │
│  │                                       │  │
│  │          [QR CODE IMAGE]              │  │
│  │                                       │  │
│  │  📱 Show this QR code at entrance.    │  │
│  │     Do not share publicly.            │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  [VIEW FULL TICKET]  [DOWNLOAD PDF] │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ⚠️  Important: This pass is valid for ONE  │
│  entry only. Photo ID may be required.      │
│                                             │
├─────────────────────────────────────────────┤
│  Have questions? We're here to help.        │
│  📧 support@planora.app                     │
│  🌐 Visit our website                       │
│                                             │
│  © Planora Ticketing. All rights reserved.  │
└─────────────────────────────────────────────┘
```

## 🔐 OTP Verification Email - Visual Structure

```
┌─────────────────────────────────┐
│  [GRADIENT HEADER]              │
│                                 │
│  PLANORA                         │
│  Verify Your Email              │
├─────────────────────────────────┤
│                                 │
│  Enter this code to verify      │
│  your email and access your     │
│  tickets:                       │
│                                 │
│  ┌─────────────────────────────┐│
│  │   ONE-TIME CODE             ││
│  │   1 2 3 4 5 6               ││
│  │   Expires in 10 minutes     ││
│  └─────────────────────────────┘│
│                                 │
│  If you didn't request this     │
│  code, you can safely ignore    │
│  this email.                    │
│                                 │
├─────────────────────────────────┤
│  © Planora Ticketing            │
│  All rights reserved.           │
└─────────────────────────────────┘
```

## 🧪 Testing the Email Templates

### 1. Testing Ticket Confirmation Email

**Trigger:** Complete a test payment
```bash
# Navigate to any event and purchase a test ticket using Razorpay test keys
# Check the email address provided for the ticket confirmation email
```

**What to look for:**
- ✅ Event title displays correctly
- ✅ QR code image renders
- ✅ Action buttons are clickable
- ✅ Colors match brand theme
- ✅ Mobile view is readable
- ✅ All text is properly formatted

### 2. Testing OTP Verification Email

**Trigger:** Request email verification
```bash
# Go to /my-tickets
# Enter your email address
# Click "Send OTP"
# Check your email
```

**What to look for:**
- ✅ OTP code is clearly visible
- ✅ Expires in 10 minutes message shown
- ✅ Email renders correctly
- ✅ Code is easy to copy

### 3. Cross-Client Email Testing

Use these services to preview emails across clients:

**Free Options:**
- [Litmus Spam Testing](https://spamtester.com) - Check spam score
- [Email on Acid](https://www.emailonacid.com) - 7 day free trial
- Gmail preview - Built into GSuite
- Outlook preview - Built into Microsoft 365

**Paid Options:**
- [Dyspatch](https://dyspatch.io)
- [Mailmodo](https://www.mailmodo.com)
- [Really Good Emails](https://www.reallygoodemails.com)

## 📊 Email Rendering Checklist

### Desktop View
- [ ] Header gradient renders correctly
- [ ] Colors match brand specifications
- [ ] Text is properly spaced
- [ ] Images (QR code) display correctly
- [ ] Links are clickable
- [ ] Button hover effects work (preview only)
- [ ] Maximum width is observed (640px)

### Mobile View
- [ ] Layout stacks vertically
- [ ] Text is readable without zooming
- [ ] Buttons are touch-friendly (48px minimum)
- [ ] Images scale appropriately
- [ ] No horizontal scrolling needed
- [ ] Padding is adequate for mobile

### Dark Mode (if supported)
- [ ] Text remains readable
- [ ] Backgrounds adjust appropriately
- [ ] Images don't disappear
- [ ] Links remain visible

## 🔍 Email Client Specific Issues

### Gmail
- ✅ Supports inline CSS
- ✅ Supports gradients
- ✅ Supports border-radius
- ✅ Supports box-shadow
- ⚠️ Max width: 600px

### Outlook
- ✅ Supports most CSS
- ⚠️ Limited gradient support
- ⚠️ Limited border-radius
- ⚠️ No box-shadow
- ✅ Good image support

### Apple Mail
- ✅ Excellent CSS support
- ✅ Supports all modern CSS
- ✅ Good mobile rendering
- ✅ Dark mode aware

### Yahoo Mail
- ✅ Good HTML support
- ⚠️ Limited CSS support
- ✅ Mobile friendly
- ⚠️ Dark mode issues possible

## 📝 Customization Testing

### Test with Different Brand Colors

Update `lib/emailTemplates.ts` and pass custom colors:

```typescript
const emailHtml = generateTicketConfirmationEmail({
  // ... other options
  brandPrimary: '#FF6B35',    // Test orange
  brandAccent: '#F7931E',     // Test warm accent
  brandDark: '#1A1A1A',       // Test dark
  headerTitle: 'VIP PASS'     // Test custom title
})
```

**Visual elements that change:**
- Header gradient
- Event card border
- Links and button colors
- Accent highlight colors
- Text colors

## 🎯 Performance Testing

### File Size Analysis
- Expected: 40-50KB per email
- Measured: Check email raw source in your mail client
- Goal: < 100KB for quick loading

### Load Time
- Expected: Instant (no external resources)
- Note: Only inline images used
- Benefit: Works offline in email clients

## 🚨 Common Issues & Solutions

### Issue: Images not loading
**Solution:** Ensure QR code is data URL format
```
✅ data:image/png;base64,iVBORw0KGgoAAAANS...
❌ https://cdn.example.com/qrcode.png
```

### Issue: Colors look wrong
**Solution:** Check browser/email client dark mode
- Most modern clients support dark mode
- Backgrounds should be white/light gray
- Text should be dark on light backgrounds

### Issue: Button links not working
**Solution:** Ensure URLs are absolute, not relative
```
✅ https://planora.app/ticket/123
❌ /ticket/123
```

### Issue: Mobile layout breaks
**Solution:** Test with responsive email client
- Use email client's mobile preview
- Or send test email to mobile device
- Check max-width media queries

## 📈 Monitoring & Analytics

### Track Email Success
1. Monitor bounce rates in email provider
2. Track link click-throughs in URL shortener
3. Monitor PDF download counts
4. Track "View Ticket" page traffic

### Email Metrics to Monitor
- Delivery rate
- Open rate (if using tracking)
- Click-through rate
- Bounce rate
- Spam complaints

## 🔄 Version Updates

When updating email templates:

1. **Update `lib/emailTemplates.ts`**
2. **Test across 3+ email clients**
3. **Test on mobile device**
4. **Update `EMAIL_TEMPLATES.md`**
5. **Deploy and monitor metrics**

## 📞 Support Testing

Test that support contact info is correct:
- [ ] support@planora.app link works
- [ ] Website URL is correct
- [ ] All phone numbers (if included) are correct
- [ ] Support hours (if included) are accurate

---

**Last Updated:** December 22, 2025
**Version:** 1.0
**Status:** Production Ready
