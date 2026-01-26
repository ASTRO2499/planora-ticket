# 🔍 Screenshot Not Showing - Quick Diagnostic

## 5-Second Diagnosis

Follow these steps in order:

### Step 1: Open Browser DevTools
- Press **F12**
- Go to **Console** tab
- Keep it open

### Step 2: Go to Organizer Dashboard
- Navigate to `/organizer`
- Select your event
- Go to **UPI Payments** tab

### Step 3: Look at Console
**Find logs starting with:**
- `[UPI PAYMENTS DEBUG]` ← Should show first
- Then click "📸 View Screenshot"
- Look for `[SCREENSHOT DEBUG]` log

### Step 4: Analyze the Log

**Copy the entire console output and check these values:**

```
[UPI PAYMENTS DEBUG] {
  paymentCount: ?,           // How many payments?
  firstPayment: {
    hasScreenshot: ?,        // true or false? ← KEY!
    screenshotUrlLength: ?   // Any number? ← KEY!
  }
}
```

---

## What the Values Mean

### Scenario A: `hasScreenshot: false`
```javascript
[UPI PAYMENTS DEBUG] {
  paymentCount: 1,
  firstPayment: {
    hasScreenshot: false,    // ← PROBLEM HERE
    screenshotUrlLength: 0
  }
}
```
**Problem**: Screenshot not uploaded by delegate
**Solution**: Delegate needs to re-submit with screenshot

---

### Scenario B: `hasScreenshot: true` but image doesn't display
```javascript
[UPI PAYMENTS DEBUG] {
  paymentCount: 1,
  firstPayment: {
    hasScreenshot: true,     // ← Present
    screenshotUrlLength: 45000 // ← Has data
  }
}

// When you click "📸 View Screenshot":
[SCREENSHOT DEBUG] {
  hasScreenshotUrl: true,
  screenshotUrl: "data:image/png;base64,iVBORw0KGgo...",
  // ... modal opens but image shows nothing
}
```
**Check Browser Console for**:
```
Image load error: ...
```

**Common Fixes**:
1. Base64 string might be corrupted
2. Image file might be too large
3. Check database directly:
   ```sql
   SELECT screenshot_url FROM upi_payments LIMIT 1;
   ```
   - If starts with `data:image` → Should display
   - If URL format → May need CORS fix
   - If NULL/empty → Database issue

---

## Action Items Based on What You See

### If you see neither log:
1. Refresh page
2. Make sure event is selected
3. Make sure you're in UPI Payments tab
4. Open console BEFORE clicking button

### If `hasScreenshot: false`:
1. Have delegate submit payment again with screenshot
2. Make sure file is under 5MB
3. Make sure it's an image file

### If `hasScreenshot: true` but image fails:
1. Check console for `Image load error`
2. Look at database:
   ```sql
   SELECT 
     id, 
     name, 
     LENGTH(screenshot_url) as url_length,
     SUBSTRING(screenshot_url, 1, 50) as url_start
   FROM upi_payments 
   LIMIT 1;
   ```
3. If URL length is 0 → Use test image URL instead
4. If URL starts with `data:image` → Should work
5. If URL is storage URL → Check Supabase Storage settings

---

## Test with Known-Working Screenshot

**If modal opens but image doesn't show, test with a direct URL:**

1. Right-click test image online
2. Copy image URL
3. In organizer dashboard, edit payment record:
   ```sql
   UPDATE upi_payments 
   SET screenshot_url = 'https://via.placeholder.com/600x400'
   LIMIT 1;
   ```
4. Refresh and try viewing again
5. If this works → Issue is with your screenshot URLs

---

## Console Output to Send Me

Run this in console and share output:

```javascript
console.log('Payment:', {
  hasScreenshot: !!payment?.screenshot_url,
  urlLength: payment?.screenshot_url?.length,
  urlStart: payment?.screenshot_url?.substring(0, 100),
  urlEnd: payment?.screenshot_url?.substring(-50),
  isBase64: payment?.screenshot_url?.startsWith('data:'),
  isSupabaseUrl: payment?.screenshot_url?.includes('supabase')
})
```

---

## 30-Second Fix Attempt

```javascript
// In console, copy-paste this:
const payment = (window as any).upiPayments?.[0];
if (payment?.screenshot_url) {
  console.log('✓ Screenshot URL exists:', payment.screenshot_url.substring(0, 100));
} else {
  console.log('✗ No screenshot URL found');
}
// Also check database directly for the payment record
```

---

## Still Not Working?

Send me:
1. **Screenshot of console output** (F12 → Console)
2. **Screenshot of the organizer dashboard** (showing payment card)
3. **Database query result**:
   ```sql
   SELECT * FROM upi_payments ORDER BY created_at DESC LIMIT 1;
   ```
4. **Server logs** (if using local dev server)

---

**Remember**: 
- ✅ Screenshot uploads when delegate submits
- ✅ URL stored in database
- ✅ URL fetched when loading payments
- ✅ Modal opens when button clicked
- ✅ Image displays if URL is valid

If any step fails, we fix that specific step! 🔧
