# Fix Supabase Storage Bucket Permissions

## Problem
Screenshots uploaded to Supabase are not accessible: 
`https://awtyyaayqyyocxeoyhsk.supabase.co/storage/v1/object/public/upi-screenshots/...`

## Solution

### Step 1: Go to Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project: **planora-ticket**
3. Go to **Storage** in the left sidebar

### Step 2: Find the upi-screenshots Bucket
1. Look for the **upi-screenshots** bucket in the list
2. If it doesn't exist, create it:
   - Click **New bucket**
   - Name: `upi-screenshots`
   - Click **Create bucket**

### Step 3: Make Bucket Public
1. Click on the **upi-screenshots** bucket
2. Look for **Settings** or **Policies** tab
3. Set the bucket to **Public** (not private)
   - Or set it to "Authenticated users" minimum
4. Save changes

### Step 4: Set CORS Policy (if needed)
1. In Storage settings, find **CORS configuration**
2. Add/verify these allowed origins:
   ```
   http://localhost:3000
   https://planora.io
   https://*.vercel.app
   *
   ```
3. Allowed methods: GET, POST, PUT, DELETE, HEAD
4. Allowed headers: *, Content-Type, Authorization

### Step 5: Verify with Test API Call
Once fixed, test by uploading a UPI screenshot. The screenshot URL should now be accessible in:
- Organizer dashboard (Screenshot preview)
- Email as viewable link
- Google Drive (as backup)

### Alternative: Use Authenticated Downloads
If you want to keep the bucket private but allow viewing, modify the API to generate signed URLs:

```typescript
// Instead of getPublicUrl() which requires public bucket
const { data } = await supabase.storage
  .from('upi-screenshots')
  .createSignedUrl(supabaseFileName, 3600) // Valid for 1 hour

screenshotUrl = data?.signedUrl || null
```

Then update organizer dashboard to handle signed URLs.
