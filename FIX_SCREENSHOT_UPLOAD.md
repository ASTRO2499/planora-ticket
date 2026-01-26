# 🔧 Fix Screenshot Upload Issues

## Issue 1: Screenshot URL Not Loading ❌
**Error:** Screenshot could not be loaded. URL: `https://awtyyaayqyyocxeoyhsk.supabase.co/storage/v1/object/public/upi-screenshots/...`

**Solution:** Make the Supabase storage bucket PUBLIC

### Steps:
1. Go to **Supabase Dashboard** → Your Project
2. Go to **Storage** (left sidebar)
3. Find **upi-screenshots** bucket
4. Click the bucket to open it
5. Click **Settings** (gear icon)
6. Find **Access** or **Policies** section
7. Change from **PRIVATE** to **PUBLIC**
8. Save changes

**Expected Result:**
- Screenshots uploaded after this change will be accessible
- Previously uploaded screenshots may still not work (reupload to test)

---

## Issue 2: Google Drive Upload Failing ❌
**Error:** `Invalid credentials: missing required fields (type, project_id, or private_key)`

**Root Cause:** The `GOOGLE_DRIVE_CREDENTIALS` environment variable might be improperly escaped

### Solution: Verify .env.local Format

The credential JSON in `.env.local` should look like:
```dotenv
GOOGLE_DRIVE_CREDENTIALS={"type":"service_account","project_id":"planorna-payments",...}
```

**NOT like this:**
```dotenv
GOOGLE_DRIVE_CREDENTIALS=\"{\"type\":...}\"    # Wrong - has extra quotes
```

### Quick Fix:
1. Open `.env.local`
2. Find the `GOOGLE_DRIVE_CREDENTIALS` line
3. Ensure it starts with `GOOGLE_DRIVE_CREDENTIALS={` (no leading quote)
4. Ensure it ends with `}` (no trailing quote)
5. Save and restart the dev server

### Alternative: Get Fresh Credentials
If the format looks wrong, download fresh credentials from Google Cloud:

1. Go to **Google Cloud Console** → Select "planorna-payments" project
2. Go to **Service Accounts** (Search bar or IAM & Admin → Service Accounts)
3. Find `planorapayment@planorna-payments.iam.gserviceaccount.com`
4. Click it → Go to **Keys** tab
5. Click **Add Key** → **Create new key** → **JSON**
6. This downloads a JSON file
7. Open it and copy the entire JSON content
8. Replace the `GOOGLE_DRIVE_CREDENTIALS` value in `.env.local` with this JSON
9. Restart dev server

---

## Testing After Fixes

After making these changes:

1. ✅ Stop the dev server (Ctrl+C)
2. ✅ Restart: `npm run dev`
3. ✅ Go to event registration with UPI payment enabled
4. ✅ Upload a test screenshot
5. ✅ Watch server logs for:
   - `[UPI PAYMENT] Screenshot uploaded to Supabase: https://...` (should now work)
   - `[GOOGLE DRIVE] Upload successful:` (should work if credentials fixed)
6. ✅ Go to organizer dashboard
7. ✅ Click approve on the payment
8. ✅ Check if screenshot is visible in the modal

---

## Debug Logs

Start dev server and watch the terminal for logs like:
```
[UPI PAYMENT] Screenshot uploaded to Supabase: https://awtyyaayqyyocxeoyhsk.supabase.co/storage/v1/object/public/upi-screenshots/...
[GOOGLE DRIVE] Input credentials type: string
[GOOGLE DRIVE] Parsed object keys: [type, project_id, private_key, ...]
[GOOGLE DRIVE] Upload successful: { fileId: 'xxx', fileName: 'Name - College.jpg', link: '...' }
```

If Google Drive still fails, post the error logs for further diagnosis.
