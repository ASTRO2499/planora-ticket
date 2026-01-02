# Sub-Events Feature Implementation Guide

## Overview
This document describes the new sub-events feature added to the Planora Ticketing system. Sub-events allow organizers to create workshops, talk sessions, panel discussions, and other types of sessions under a main event.

---

## 1. Database Setup

### SQL Migration File
**Location:** `supabase/migrations/012_create_subevents.sql`

This migration creates two new tables:

#### `sub_events` Table
Stores information about sub-events/sessions.

**Columns:**
- `id` (UUID, Primary Key)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `event_id` (Text, Foreign Key to events table)
- `title` (Text) - Name of the sub-event (e.g., "AI Workshop")
- `description` (Text) - Detailed description
- `type` (Text) - Category: 'workshop', 'talk', 'session', 'panel', 'networking', etc.
- `start_time` (Timestamp) - When the sub-event starts
- `end_time` (Timestamp) - When the sub-event ends
- `location` (Text) - Where it's held
- `max_capacity` (Integer) - Maximum attendees allowed (optional)
- `current_registrations` (Integer) - How many have registered
- `speaker_name` (Text) - Speaker/facilitator name
- `speaker_email` (Text) - Speaker contact email
- `speaker_bio` (Text) - Speaker biography/credentials
- `image_url` (Text) - Banner/thumbnail image
- `status` (Text) - 'active', 'cancelled', 'completed'
- `is_published` (Boolean) - Visibility control
- `metadata` (JSONB) - Additional custom data

**Indexes:**
- `idx_sub_events_event_id` - Fast lookup by event
- `idx_sub_events_status` - Filter by status
- `idx_sub_events_published` - Filter by published status

#### `sub_event_registrations` Table
Tracks which attendees are registered for which sub-events.

**Columns:**
- `id` (UUID, Primary Key)
- `created_at` (Timestamp)
- `sub_event_id` (UUID, Foreign Key to sub_events)
- `ticket_id` (UUID, Foreign Key to tickets)
- `status` (Text) - 'registered', 'cancelled', 'attended'
- `attended_at` (Timestamp) - When they attended
- `checked_in_at` (Timestamp) - Check-in time
- `rating` (Integer) - 1-5 star rating
- `feedback` (Text) - Attendee feedback

**Constraints:**
- Unique constraint on (sub_event_id, ticket_id) to prevent duplicate registrations

**Indexes:**
- `idx_sub_event_registrations_sub_event_id` - Find registrations for a sub-event
- `idx_sub_event_registrations_ticket_id` - Find sub-events for a ticket
- `idx_sub_event_registrations_status` - Filter by status

### To Apply the Migration
```bash
# Using Supabase CLI
supabase migration up

# Or run the SQL directly in Supabase dashboard SQL editor
```

---

## 2. API Endpoint

### Sub-Events Management API
**Location:** `pages/api/organizer/subevents.ts`

**Endpoint:** `/api/organizer/subevents?eventId={eventId}`

**Authentication:**
- Bearer token with 'organizer' role, OR
- x-organizer-secret header

### Supported Methods

#### GET - Fetch all sub-events for an event
```bash
GET /api/organizer/subevents?eventId=event-id-123
```

**Response:**
```json
{
  "subEvents": [
    {
      "id": "uuid",
      "event_id": "event-id-123",
      "title": "AI Workshop",
      "type": "workshop",
      "description": "...",
      "start_time": "2024-01-15T10:00:00Z",
      "end_time": "2024-01-15T12:00:00Z",
      "location": "Room 101",
      "max_capacity": 30,
      "current_registrations": 25,
      "speaker_name": "Dr. Jane Smith",
      "speaker_email": "jane@example.com",
      "status": "active",
      "is_published": true
    }
  ]
}
```

#### POST - Create a new sub-event
```bash
POST /api/organizer/subevents?eventId=event-id-123
Content-Type: application/json

{
  "title": "AI Workshop",
  "type": "workshop",
  "description": "Learn AI fundamentals",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T12:00:00Z",
  "location": "Room 101",
  "max_capacity": 30,
  "speaker_name": "Dr. Jane Smith",
  "speaker_email": "jane@example.com",
  "status": "active",
  "is_published": true
}
```

#### PUT - Update a sub-event
```bash
PUT /api/organizer/subevents?eventId=event-id-123
Content-Type: application/json

{
  "id": "sub-event-uuid",
  "title": "Updated Title",
  "type": "talk",
  ...
}
```

#### DELETE - Delete a sub-event
```bash
DELETE /api/organizer/subevents?eventId=event-id-123
Content-Type: application/json

{
  "id": "sub-event-uuid"
}
```

---

## 3. Frontend UI

### Location
**File:** `pages/organizer.tsx`

### New State Variables
```typescript
const [subEvents, setSubEvents] = useState<any[]>([])
const [showSubEventsModal, setShowSubEventsModal] = useState(false)
const [subEventsLoading, setSubEventsLoading] = useState(false)
const [newSubEvent, setNewSubEvent] = useState({
  title: '',
  type: 'workshop',
  description: '',
  start_time: '',
  end_time: '',
  location: '',
  max_capacity: '',
  speaker_name: '',
  speaker_email: ''
})
const [editingSubEventId, setEditingSubEventId] = useState<string | null>(null)
```

### UI Components

#### 1. Create Sub Events Button
Located next to the "Save Changes" button in the Edit Event section.

```
┌─────────────────────────────────────┐
│ Edit Event                          │
├─────────────────────────────────────┤
│ [Title input field]                 │
│ [Description field]                 │
│ ...other fields...                  │
│                                     │
│ [Save Changes] [Create Sub Events] │
└─────────────────────────────────────┘
```

#### 2. Sub-Events Modal
Opens a full dialog with:
- **Create/Edit Form** - Add or modify sub-events
- **List View** - See all sub-events with Edit/Delete buttons

**Features:**
- Type selector: Workshop, Talk, Panel, Breakout, Networking, Other
- Date/time pickers for start and end times
- Capacity management
- Speaker information
- Real-time list with edit/delete capability
- Search and filter ready

### User Workflow

1. **Select an event** from the left sidebar
2. **Click "Create Sub Events"** button
3. **Fill in sub-event details:**
   - Title (required)
   - Type (workshop, talk, etc.)
   - Description
   - Start/End times
   - Location
   - Max capacity
   - Speaker information
4. **Click "Create Sub-Event"** to add to database
5. **View list** of all sub-events for this event
6. **Edit** - Click Edit button to modify
7. **Delete** - Click Delete to remove

---

## 4. Integration with Existing Features

### Event Selection
When an event is selected, sub-events are automatically loaded:
```typescript
useEffect(() => {
  if (selected?.id) {
    fetchTickets(selected.id)
    fetchAnalytics(selected.id)
    fetchSubEvents(selected.id)  // New
  }
}, [selected?.id])
```

### Authentication
Uses the same organizer authentication as other endpoints:
- Bearer token (Supabase organizer role)
- x-organizer-secret (per-event secret)

---

## 5. Usage Examples

### JavaScript/TypeScript Frontend Example

```typescript
// Fetch sub-events
async function getSubEvents(eventId: string, accessToken: string) {
  const res = await fetch(`/api/organizer/subevents?eventId=${eventId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  return res.json()
}

// Create a sub-event
async function createSubEvent(eventId: string, subEventData: any, accessToken: string) {
  const res = await fetch(`/api/organizer/subevents?eventId=${eventId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      title: 'AI Workshop',
      type: 'workshop',
      description: 'Learn AI basics',
      start_time: '2024-01-15T10:00:00Z',
      end_time: '2024-01-15T12:00:00Z',
      location: 'Room 101',
      max_capacity: 30,
      speaker_name: 'Dr. Smith',
      speaker_email: 'smith@example.com'
    })
  })
  return res.json()
}

// Update a sub-event
async function updateSubEvent(eventId: string, subEventId: string, updates: any, accessToken: string) {
  const res = await fetch(`/api/organizer/subevents?eventId=${eventId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      id: subEventId,
      ...updates
    })
  })
  return res.json()
}

// Delete a sub-event
async function deleteSubEvent(eventId: string, subEventId: string, accessToken: string) {
  const res = await fetch(`/api/organizer/subevents?eventId=${eventId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ id: subEventId })
  })
  return res.json()
}
```

---

## 6. Future Enhancements

### Suggested Features to Add Later
1. **Attendee Registration for Sub-Events**
   - Allow ticket holders to register for specific sub-events
   - Track attendance using `sub_event_registrations` table

2. **Sub-Event Capacity Management**
   - Show capacity remaining
   - Prevent registration when full
   - Waitlist functionality

3. **Feedback & Ratings**
   - Collect post-session feedback
   - Track ratings (1-5 stars)
   - Generate reports

4. **Calendar View**
   - Timeline visualization of all sub-events
   - Avoid scheduling conflicts

5. **Speaker Management**
   - Dedicated speaker profiles
   - Auto-assign speaker information

6. **Email Notifications**
   - Notify attendees about new sub-events
   - Reminder emails before sessions

7. **Public Sub-Events Page**
   - Display available sub-events on event page
   - Show speaker details and descriptions

---

## 7. File Summary

### New Files Created
- `supabase/migrations/012_create_subevents.sql` - Database schema
- `pages/api/organizer/subevents.ts` - API endpoint

### Modified Files
- `pages/organizer.tsx` - Added UI and state management

### No Changes Needed
- Existing authentication mechanisms work as-is
- Existing events remain unaffected
- Backward compatible with current ticketing system

---

## 8. Testing Checklist

- [ ] SQL migration runs without errors
- [ ] API endpoint accepts GET requests
- [ ] API endpoint accepts POST requests (create)
- [ ] API endpoint accepts PUT requests (update)
- [ ] API endpoint accepts DELETE requests
- [ ] "Create Sub Events" button appears in organizer dashboard
- [ ] Modal opens when button is clicked
- [ ] Can create new sub-event with all fields
- [ ] Sub-events appear in list immediately
- [ ] Can edit existing sub-event
- [ ] Can delete sub-event with confirmation
- [ ] Sub-events persist after page reload
- [ ] Authentication validates organizer ownership
- [ ] Error messages display properly
- [ ] Loading states show while fetching/saving

---

## Support & Questions

For issues or questions about the sub-events feature, refer to:
1. API response error messages
2. Browser console for client-side errors
3. Server logs for backend errors
4. Database logs for migration issues
