# Bug Report - Planora Ticketing Project

## Critical Issues Found

### 1. **Missing SUPABASE_SERVICE_KEY in .env.local** ⚠️ CRITICAL
**Severity:** Critical | **File:** `.env.local`

The application requires `SUPABASE_SERVICE_KEY` for server-side operations, but it's not defined in `.env.local`. This will cause the following API routes to fail:
- `/api/verify-payment.ts` - Line 12
- `/api/ticket-pdf.ts` - Line 5
- `/api/admin/tickets.ts` - Line 3
- `/api/ticket/[id].ts` - Line 5

**Error Message:** `createClient()` will receive an empty string, causing authentication failures.

**Fix:** Add to `.env.local`:
```bash
SUPABASE_SERVICE_KEY=your_service_key_here
```

---

### 2. **Missing SUPABASE_URL (non-public) in API Routes** ⚠️ CRITICAL
**Severity:** Critical | **Files:** 
- `pages/api/verify-payment.ts` - Line 12
- `pages/api/ticket-pdf.ts` - Line 5
- `pages/api/admin/tickets.ts` - Line 3
- `pages/api/ticket/[id].ts` - Line 5

The code uses `process.env.SUPABASE_URL` (without `NEXT_PUBLIC_` prefix) but the `.env.local` only defines `NEXT_PUBLIC_SUPABASE_URL`. Server-side code should use the non-public version.

**Current Issue:** Using public key for server-side operations (security risk and may fail)

**Fix:** Add to `.env.local`:
```bash
SUPABASE_URL=https://awtyyaayqyyocxeoyhsk.supabase.co
SUPABASE_SERVICE_KEY=your_actual_service_key
```

---

### 3. **Hardcoded Ticket Price** ⚠️ MODERATE
**Severity:** Moderate | **File:** `pages/api/create-order.ts` - Line 15

```typescript
const amount = 9900 // ₹99.00
```

The ticket price is hardcoded. Should be configurable via environment variable.

**Fix:** 
```typescript
const amount = Number(process.env.TICKET_PRICE_PAISE || '9900')
// Add to .env.local: TICKET_PRICE_PAISE=9900
```

---

### 4. **QR Code Data URL Validation Missing** ⚠️ MODERATE
**Severity:** Moderate | **Files:** 
- `pages/api/ticket-pdf.ts` - Line 31-39
- `pages/api/verify-payment.ts` - Line 119-122
- `pages/ticket/[id].tsx` - Line 18

Code checks `if (imgData.startsWith('data:image'))` but doesn't validate if the base64 decode succeeds or if the buffer is valid.

**Fix:** Add proper error handling and validation:
```typescript
if (imgData.startsWith('data:image')) {
  try {
    const base64 = imgData.split(',')[1]
    if (!base64) throw new Error('Invalid base64 data')
    const img = Buffer.from(base64, 'base64')
    if (img.length === 0) throw new Error('Empty image data')
    doc.image(img, { fit: [200, 200], align: 'center' })
  } catch (e) {
    logError('pdf image error', { error: e })
  }
}
```

---

### 5. **Inadequate Error Handling in verify-ticket.ts** ⚠️ MODERATE
**Severity:** Moderate | **File:** `pages/api/verify-ticket.ts` - Line 7-8

```typescript
const [id, email] = String(data).split('|')
```

If the QR data doesn't contain a pipe character, `email` will be undefined, but there's no validation.

**Fix:**
```typescript
const parts = String(data).split('|')
if (parts.length !== 2) {
  return res.status(400).json({ error: 'invalid_qr_format' })
}
const [id, email] = parts
```

---

### 6. **Silent Failures in Ticket Status Updates** ⚠️ MODERATE
**Severity:** Moderate | **File:** `lib/ticketStatus.ts` - Line 35-37

```typescript
export async function setTicketStatus(
  client: SupabaseClient,
  id: string,
  status: TicketStatus
) {
  const update = await client.from('tickets').update({ status }).eq('id', id)
  if (update.error && !isStatusColumnError(update.error)) {
    console.error('ticket status update failed', { id, status, error: update.error })
  }
}
```

Errors are logged but silently ignored. The status update could fail without any indication to the caller.

**Fix:** Either throw the error or return it to the caller:
```typescript
export async function setTicketStatus(
  client: SupabaseClient,
  id: string,
  status: TicketStatus
) {
  const update = await client.from('tickets').update({ status }).eq('id', id)
  if (update.error && !isStatusColumnError(update.error)) {
    logError('ticket status update failed', { id, status, error: update.error })
    throw update.error // or return false
  }
  return true
}
```

---

### 7. **Unused Test File** ⚠️ LOW
**Severity:** Low | **File:** `__tests__/ticket-pdf.test.ts`

The test file is a placeholder with only a dummy test that always passes.

**Fix:** Either implement real tests or remove the file. Consider adding tests for:
- PDF generation
- QR code handling
- Error scenarios

---

### 8. **Race Condition in Stream Buffer Collection** ⚠️ LOW-MODERATE
**Severity:** Low-Moderate | **File:** `pages/api/verify-payment.ts` - Line 119-125

```typescript
const stream = new PassThrough()
const buffers: any[] = []
doc.pipe(stream)
// ... document content ...
doc.end()

stream.on('data', (chunk) => buffers.push(chunk))
await new Promise<void>((resolve) => stream.on('end', () => resolve()))
const pdfBuffer = Buffer.concat(buffers)
```

The `stream.on('data')` listener is added AFTER piping starts, which could miss chunks if the data event fires before the listener is attached.

**Fix:**
```typescript
const buffers: any[] = []
const stream = new PassThrough()

// Set up listeners BEFORE piping
stream.on('data', (chunk) => buffers.push(chunk))

doc.pipe(stream)
// ... document content ...
doc.end()

await new Promise<void>((resolve) => stream.on('end', () => resolve()))
const pdfBuffer = Buffer.concat(buffers)
```

---

### 9. **No Validation of Admin Session TTL** ⚠️ LOW
**Severity:** Low | **File:** `lib/adminSession.ts` - Line 3

```typescript
const DEFAULT_TTL_SECONDS = Number(process.env.ADMIN_SESSION_TTL || 3600)
```

If `ADMIN_SESSION_TTL` is set to an invalid value (like a string), `Number()` returns `NaN`, which could cause issues.

**Fix:**
```typescript
const DEFAULT_TTL_SECONDS = (() => {
  const ttl = Number(process.env.ADMIN_SESSION_TTL || 3600)
  return Number.isFinite(ttl) && ttl > 0 ? ttl : 3600
})()
```

---

### 10. **Missing Email Configuration Check** ⚠️ MODERATE
**Severity:** Moderate | **File:** `pages/api/verify-payment.ts` - Line 38

```typescript
const transporter = getTransport()
```

This is called at module load time. If email is misconfigured, the entire API will fail at import time rather than at runtime with a clear error message.

**Fix:** Lazy-load the transporter:
```typescript
let transporter: any = null

function getTransport() {
  if (transporter) return transporter
  transporter = mailer.getTransport()
  return transporter
}
```

---

## Summary Table

| Bug | File | Severity | Impact |
|-----|------|----------|--------|
| Missing SUPABASE_SERVICE_KEY | .env.local | 🔴 Critical | All server APIs fail |
| Wrong SUPABASE_URL usage | Multiple API routes | 🔴 Critical | Auth failures |
| Hardcoded ticket price | create-order.ts | 🟡 Moderate | Can't change price |
| Missing QR validation | ticket-pdf.ts, verify-payment.ts | 🟡 Moderate | Potential crashes |
| Invalid QR format not handled | verify-ticket.ts | 🟡 Moderate | Logic errors |
| Silent status failures | ticketStatus.ts | 🟡 Moderate | Inconsistent data |
| Stream buffer race condition | verify-payment.ts | 🟡 Moderate | Possible PDF corruption |
| Placeholder tests | ticket-pdf.test.ts | 🟢 Low | No test coverage |
| Invalid TTL not handled | adminSession.ts | 🟢 Low | NaN issues possible |
| Email config at module load | verify-payment.ts | 🟡 Moderate | Bad error messages |

---

## Environment Variables Checklist

✅ RAZORPAY_KEY_ID
✅ RAZORPAY_KEY_SECRET
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
❌ **SUPABASE_URL** (MISSING - needed for server)
❌ **SUPABASE_SERVICE_KEY** (MISSING - needed for server)
✅ ADMIN_SECRET
✅ BASE_URL
✅ SMTP_USER
✅ SMTP_PASS
✅ EMAIL_FROM
