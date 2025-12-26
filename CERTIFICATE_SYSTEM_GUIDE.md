# Certificate System Guide

## Overview
The certificate system allows event organizers to generate and issue certificates of participation to attendees who checked in at events.

## Features
- **Automatic Certificate Generation**: Bulk generate certificates for all checked-in attendees
- **Professional PDF Design**: Landscape A4 format with decorative borders
- **Attendee Access**: Attendees can download their certificates from My Tickets page
- **Event Branding**: Certificates use your event's custom branding colors

## Setup Instructions

### 1. Apply Database Migration
First, you need to apply the certificate migration to your Supabase database:

**Option A: Using Supabase CLI (Recommended)**
```bash
# Make sure you have Supabase CLI installed
npx supabase db push
```

**Option B: Manual SQL Execution**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/009_add_certificates.sql`
4. Click "Run"

### 2. Verify Migration
Check that the following were created:
- New table: `certificates`
- New column: `tickets.certificate_issued` (boolean)
- Indexes: `idx_certificates_ticket_id`, `idx_certificates_event_id`, `idx_certificates_email`

## How to Use

### For Event Organizers

1. **After Your Event Completes**:
   - Go to Organizer Dashboard (`/organizer`)
   - Select your event from the dropdown

2. **Verify Attendees**:
   - Use the QR scanner (`/verify`) to check in attendees during the event
   - This marks their tickets as `used = true`

3. **Generate Certificates**:
   - In the Organizer Dashboard, scroll to the "Certificates" section
   - You'll see stats:
     - **Total Attended**: Number of checked-in attendees
     - **Issued**: Number of certificates already generated
     - **Pending**: Number of attendees eligible for certificates
   - Click "Generate Certificates" button
   - Certificates will be created for all checked-in attendees who don't have one yet

4. **Bulk Operations**:
   - The system automatically creates certificates for ALL checked-in attendees in one click
   - You can regenerate certificates anytime (existing ones won't be duplicated)

### For Attendees

1. **Check If Eligible**:
   - Attendees must have physically checked in at the event (QR code scanned)
   - Organizer must have clicked "Generate Certificates"

2. **Download Certificate**:
   - Go to "My Tickets" page (`/my-tickets`)
   - Enter email and verify with OTP
   - Find your ticket
   - If eligible, you'll see a green "Download Certificate" button
   - Click to download your personalized PDF certificate

3. **Alternative Access**:
   - Check the ticket success page after email verification
   - Certificates also available there if issued

## Certificate Design

### Layout
- **Format**: Landscape A4 (842 x 595 points)
- **Style**: Professional with decorative borders
- **Colors**: Uses event's custom branding (brandPrimary, brandAccent, brandDark)

### Content
Each certificate includes:
- "CERTIFICATE OF PARTICIPATION" heading
- Attendee's full name (large, prominent)
- Event name and details
- Unique certificate ID
- Issue date
- Decorative border and design elements

### Customization
Certificates automatically inherit your event's design template settings:
- Primary brand color for borders
- Accent color for decorative elements
- Dark brand color for text shadows

## API Endpoints

### Certificate PDF Generation
```
GET /api/certificate-pdf?ticketId={uuid}
```
- Generates or retrieves certificate PDF
- Requires valid ticket ID
- Only works for checked-in attendees (used=true)
- Returns PDF download

### Bulk Certificate Generation (Organizers)
```
POST /api/organizer/certificates
Authorization: Bearer {token}
Content-Type: application/json

{
  "eventId": "event-id-here"
}
```
- Creates certificates for all checked-in attendees
- Requires organizer authentication
- Returns count of new and existing certificates

### Certificate Stats (Organizers)
```
GET /api/organizer/certificates?eventId={id}
Authorization: Bearer {token}
```
- Returns statistics:
  - `total_attended`: Number of checked-in tickets
  - `certificates_issued`: Number of certificates created
  - `pending`: Difference (attended - issued)

## Database Schema

### certificates table
```sql
- id: UUID (primary key)
- ticket_id: UUID (foreign key to tickets)
- event_id: TEXT (event identifier)
- attendee_name: TEXT
- attendee_email: TEXT
- issued_at: TIMESTAMP (when certificate was issued)
- certificate_data: JSONB (optional metadata)
- created_at: TIMESTAMP
```

### tickets table update
```sql
- certificate_issued: BOOLEAN (flag to track if certificate exists)
```

## Workflow Diagram

```
Event Creation → Ticket Sales → Event Day → Post-Event
                                     ↓
                            QR Code Scanning
                          (marks ticket.used = true)
                                     ↓
                    Organizer Dashboard: Generate Certificates
                                     ↓
                    API creates certificate records
                                     ↓
                  Attendees download from My Tickets page
```

## Troubleshooting

### "Generate Certificates" button is disabled
- **Cause**: No pending certificates (all checked-in attendees already have certificates)
- **Solution**: Check that attendees have been marked as checked-in (used=true)

### Certificate download button not showing
- **Causes**:
  1. Ticket not checked in (used=false)
  2. Certificate not generated yet (certificate_issued=false)
  3. Database migration not applied
- **Solutions**:
  1. Scan ticket QR code at event entry
  2. Organizer needs to click "Generate Certificates"
  3. Apply migration from `supabase/migrations/009_add_certificates.sql`

### Certificate PDF shows error
- **Causes**:
  1. Invalid ticket ID
  2. Ticket not checked in
  3. Database permissions issue
- **Solutions**:
  1. Verify ticket ID is valid UUID
  2. Check ticket.used = true in database
  3. Verify Supabase service role key is set in environment variables

## Environment Variables

Ensure these are set in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Best Practices

1. **Timing**: Generate certificates after event completion, not during
2. **Verification**: Always verify attendees have checked in before generating
3. **Communication**: Email attendees to inform them certificates are available
4. **Branding**: Set up event design template before generating certificates
5. **Testing**: Test certificate generation on a small test event first

## Future Enhancements

Potential improvements:
- Email certificates directly to attendees
- Custom certificate templates per event
- Certificate preview before bulk generation
- Attendee name editing/corrections
- Certificate revocation system
- Analytics: download tracking

## Support

For issues or questions:
- Check database migration status
- Verify environment variables
- Review server logs for API errors
- Contact support at support@planora.app
