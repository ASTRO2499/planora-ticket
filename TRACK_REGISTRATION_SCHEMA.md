# Track Registration Schema & Features Guide

## New Schema (Migration 015)

The `sub_event_registrations` table has been redesigned with comprehensive features for form editing and tracking.

### Core Registration Fields
- `id` - UUID primary key
- `created_at` - Registration creation timestamp
- `sub_event_id` - References the sub-event (foreign key)

### Attendee Information
- `name` - Attendee's full name (required)
- `email` - Attendee's email (required, unique per sub-event)
- `phone` - Contact number (optional)
- `college` - Educational institution (optional)
- `notes` - Special requirements or notes (optional)

### Payment Tracking
- `payment_method` - 'online' or 'offline' (default: 'offline')
- `payment_status` - 'pending', 'completed', 'failed', 'not_required' (default: 'not_required')
- `payment_id` - Razorpay or payment gateway transaction ID

### Attendance & Feedback
- `registered_at` - When user submitted the form
- `checked_in` - Boolean flag for event check-in status (default: false)
- `checked_in_at` - Timestamp of check-in
- `rating` - Event rating (1-5, optional)
- `feedback` - Event feedback text (optional)

### Extra 5 Columns for Form Editing Functions

1. **`edit_count`** (INTEGER, default: 0)
   - Tracks how many times the form was edited before submission
   - Useful for analytics and understanding user behavior
   - Increments each time any field is modified

2. **`last_edited_at`** (TIMESTAMPTZ)
   - Timestamp of the last form modification
   - NULL for submitted forms
   - Set for draft registrations
   - Helps identify stale drafts

3. **`is_draft`** (BOOLEAN, default: false)
   - Flags whether registration is in draft state
   - Draft = incomplete, not counted in capacity
   - Can be updated later to submitted status
   - Allows users to save progress

4. **`submission_status`** (TEXT, default: 'submitted')
   - Tracks registration state: 'draft', 'submitted', 'confirmed'
   - 'draft' = incomplete form
   - 'submitted' = form completed but may update
   - 'confirmed' = confirmed attendance
   - Validates: must be one of the three values

5. **`form_version`** (INTEGER, default: 1)
   - Version control for form data structure
   - Useful for schema migrations
   - Tracks which version of the form was used
   - Helps handle form field changes over time

---

## Feature Implementations

### 1. Draft Save Functionality

Users can now save their registration as a draft without submitting.

**Frontend Changes** (`pages/track/[id]/register.tsx`):
- Added "Save Draft" button alongside "Register" button
- Draft registrations don't count toward capacity
- Users see "Draft saved successfully!" toast

**Backend Logic** (`pages/api/subevents/register.ts`):
- Checks `isDraft` parameter
- Skips capacity validation for drafts
- Sets `is_draft = true` and `submission_status = 'draft'`
- Doesn't increment registration counter

**Use Cases**:
- Users can fill form at their own pace
- Can save partial information
- Can come back and complete later
- No commitment until final submission

---

### 2. Edit Tracking

The system automatically tracks form modifications.

**How It Works**:
- Each field change increments `edit_count`
- `last_edited_at` updates on every modification
- Data captured: form changes before submission

**Frontend Implementation**:
```tsx
onChange={(e) => {
  setFormData({ ...formData, name: e.target.value })
  setEditCount(editCount + 1)  // Increment on change
}}
```

**Use Cases**:
- Analytics: understand user behavior
- Quality metrics: fewer edits = better UX
- Support: identify users who struggled
- Form optimization: which fields get edited most

---

### 3. Draft to Submitted Transition

When a user has an existing draft and submits the form:

**Backend Logic**:
- Checks if registration exists with same email
- If draft exists, update it to submitted status
- Increment capacity counter only on transition
- Update all fields and timestamps

**Benefits**:
- Prevents duplicate registrations
- Allows users to continue from draft
- Maintains edit history
- Proper capacity tracking

---

### 4. Form Version Control

Each registration records which form version was used.

**Current**: All new registrations use `form_version = 1`

**Future Use**:
- When form fields change, increment version
- Query old registrations: `WHERE form_version = 1`
- Handle backward compatibility
- Migrate data between versions

**SQL Query Example**:
```sql
-- Get all v1 registrations
SELECT * FROM sub_event_registrations 
WHERE form_version = 1 AND submission_status = 'submitted';

-- Count by version
SELECT form_version, COUNT(*) 
FROM sub_event_registrations 
GROUP BY form_version;
```

---

### 5. Submission Status Workflow

Three distinct states for registration lifecycle:

```
┌─────────────────────────────────────────┐
│  Initial Form Load                      │
│  (is_draft = false, edit_count = 0)     │
└──────────┬──────────────────────────────┘
           │
           ├──────────────────┐
           │                  │
           ▼                  ▼
    ┌──────────────┐   ┌──────────────┐
    │ DRAFT STATE  │   │ SUBMITTED    │
    │ (Save Draft) │   │ (Register)   │
    │ is_draft=T   │   │ is_draft=F   │
    │ status=draft │   │ status=subm. │
    └──────┬───────┘   └──────────────┘
           │
           │ (User edits draft)
           │ edit_count++
           │ last_edited_at = now()
           │
           │ (User submits draft)
           ▼
    ┌──────────────┐
    │ SUBMITTED    │
    │ (from Draft) │
    │ is_draft=F   │
    │ status=subm. │
    └──────────────┘
```

---

## Database Setup

### SQL Migration (015_recreate_subevents_registrations.sql)

Run this to create the new schema:

```bash
supabase migration up 015
```

The migration includes:
- Table creation with all constraints
- Email validation regex
- Payment status validation
- Submission status validation
- Rating validation (1-5)
- Unique constraint: (sub_event_id, email)
- Indexes on common queries

### Sample Data Included

Three test records are inserted:
1. John Doe - Completed registration with 5-star feedback
2. Jane Smith - Basic submission without rating
3. Bob Wilson - Draft in progress (is_draft = true)

---

## API Updates

### POST /api/subevents/register

#### Request Body
```json
{
  "subEventId": "uuid",
  "eventId": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 98765 43210",
  "college": "MIT",
  "notes": "No special requirements",
  "paymentMethod": "online" | "offline",
  "isDraft": false,
  "editCount": 5
}
```

#### Response
```json
{
  "success": true,
  "registrationId": "uuid",
  "message": "Registered successfully" | "Draft saved successfully"
}
```

---

## Frontend Form Component

### Updated Features

**New Buttons**:
- "Save Draft" - Saves form without submission
- "Register" - Final submission (original behavior)

**Auto-tracking**:
- Each field change increments edit counter
- No manual tracking needed
- Transparent to user

**Form State**:
```tsx
const [formData, setFormData] = useState({
  name: '',
  email: '',
  phone: '',
  college: '',
  notes: ''
})
const [isDraft, setIsDraft] = useState(false)
const [editCount, setEditCount] = useState(0)
const [registrationId, setRegistrationId] = useState<string | null>(null)
```

---

## Database Queries

### Common Queries

#### Get all drafts for a sub-event
```sql
SELECT * FROM sub_event_registrations 
WHERE sub_event_id = '{sub_event_id}' 
AND is_draft = true;
```

#### Get submitted registrations
```sql
SELECT * FROM sub_event_registrations 
WHERE sub_event_id = '{sub_event_id}' 
AND submission_status = 'submitted'
ORDER BY registered_at DESC;
```

#### Find stale drafts (not edited in 7 days)
```sql
SELECT * FROM sub_event_registrations 
WHERE is_draft = true 
AND last_edited_at < now() - interval '7 days';
```

#### Count edits distribution
```sql
SELECT 
  edit_count,
  COUNT(*) as registrations
FROM sub_event_registrations
WHERE submission_status = 'submitted'
GROUP BY edit_count
ORDER BY edit_count;
```

#### Get registrations by payment status
```sql
SELECT 
  payment_status,
  COUNT(*) as count
FROM sub_event_registrations
WHERE sub_event_id = '{sub_event_id}'
GROUP BY payment_status;
```

#### Get top-rated sessions
```sql
SELECT 
  sr.sub_event_id,
  se.title,
  AVG(sr.rating) as avg_rating,
  COUNT(sr.rating) as review_count
FROM sub_event_registrations sr
JOIN sub_events se ON sr.sub_event_id = se.id
WHERE sr.rating IS NOT NULL
GROUP BY sr.sub_event_id, se.title
ORDER BY avg_rating DESC;
```

---

## Organizer Admin Features (Future Enhancements)

### Admin Table Should Display
- Name, Email, Phone, College
- Payment Method, Payment Status
- Registration Date, Check-in Status
- Edit Count, Form Version
- Draft/Submitted Status

### Admin Actions
- View registration details
- Check-in attendees
- Add ratings/feedback
- Export to CSV with all fields
- Filter by payment status
- Filter by draft status
- View edit history

---

## Testing Checklist

- [ ] Create account and navigate to session registration
- [ ] Fill partial form and click "Save Draft"
- [ ] Verify draft appears in database with `is_draft = true`
- [ ] Return and continue from draft
- [ ] Submit draft - verify `is_draft = false` and capacity updated
- [ ] Check `edit_count` increments correctly
- [ ] Verify `last_edited_at` updates on each change
- [ ] Test with payment method selection
- [ ] Test capacity limits (drafts don't count)
- [ ] View sample data in database

---

## Schema Summary Table

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | gen_random_uuid() | Primary key |
| created_at | TIMESTAMPTZ | now() | Creation time |
| sub_event_id | UUID | - | Foreign key |
| name | TEXT | - | Required |
| email | TEXT | - | Required, unique per sub_event |
| phone | TEXT | NULL | Optional |
| college | TEXT | NULL | Optional |
| notes | TEXT | NULL | Optional |
| payment_method | TEXT | 'offline' | 'online'\|'offline' |
| payment_status | TEXT | 'not_required' | 'pending'\|'completed'\|'failed'\|'not_required' |
| payment_id | TEXT | NULL | Optional |
| registered_at | TIMESTAMPTZ | now() | Submission time |
| checked_in | BOOLEAN | false | Check-in flag |
| checked_in_at | TIMESTAMPTZ | NULL | Check-in time |
| rating | INTEGER | NULL | 1-5, optional |
| feedback | TEXT | NULL | Optional |
| **edit_count** | **INTEGER** | **0** | **Extra field 1** |
| **last_edited_at** | **TIMESTAMPTZ** | **NULL** | **Extra field 2** |
| **is_draft** | **BOOLEAN** | **false** | **Extra field 3** |
| **submission_status** | **TEXT** | **'submitted'** | **Extra field 4** |
| **form_version** | **INTEGER** | **1** | **Extra field 5** |

---

## Compilation Status

✅ All TypeScript files compile without errors
✅ Form component updated with draft functionality
✅ API endpoint handles draft/submitted logic
✅ Database schema created with proper constraints
✅ Sample data inserted for testing

---

## Next Steps

1. Run migration: `supabase migration up 015`
2. Test draft save functionality
3. Verify data in database
4. Update admin console to display new fields
5. Update CSV export to include all fields
6. Add UI to manage draft registrations
