# Sub-Events Feature - Visual Guide & Component Structure

## 🎨 UI Component Hierarchy

```
OrganizerDashboard
├── Header
│   ├── "Manage Events" Title
│   └── [Edit Form] Button (if selected)
│
├── Main Grid (2 columns on desktop)
│   ├── Left Column
│   │   └── Card: Your Events
│   │       ├── Event List
│   │       └── [Refresh] Button
│   │
│   └── Right Column
│       └── Card: Event Details & Actions
│           ├── Tab: Details (✨ NEW BUTTON HERE ✨)
│           │   ├── Title Input
│           │   ├── Description Input
│           │   ├── DateTime & Location
│           │   ├── Price Input
│           │   ├── Cover Image Upload
│           │   ├── [Save Changes] Button
│           │   └── [Create Sub Events] Button ⭐ NEW
│           │   └── Ticket Template Section
│           │
│           └── Tab: Certificates
│               ├── Stats Display
│               ├── [Generate Certificates] Button
│               └── Email Configuration
│
├── Analytics Card (if selected)
│   ├── Stats Grid
│   ├── Top Colleges
│   └── Daily Registrations Chart
│
├── Attendees Card (if selected)
│   ├── Search & Filter
│   ├── Attendees Table
│   └── [Export CSV] Button
│
├── Floating Certificate Button
│   └── [⚡] Award Icon
│
└── Modals
    ├── Form Builder Modal
    └── Sub-Events Modal ⭐ NEW
        ├── Create/Edit Sub-Event Form
        └── Sub-Events List
```

---

## 📋 Sub-Events Modal Structure

```
┌─────────────────────────────────────────────────────────────┐
│ ✕ Manage Sub-Events                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Create New Sub-Event / Edit Sub-Event                    │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ Title: [AI Workshop                                ]      │ │
│ │ Type:  [Workshop          ▼]                             │ │
│ │                                                           │ │
│ │ Description:                                              │ │
│ │ [Learn artificial intelligence basics with hands-on      │ │
│ │  examples and practical exercises...                ] │ │
│ │                                                           │ │
│ │ Start Time: [2024-01-15T10:00  ]  End Time: [2024-01-15 │ │
│ │ Location: [Room 101        ]  Max Capacity: [30    ]   │ │
│ │ Speaker: [Dr. Jane Smith   ]  Email: [jane@example.com ] │ │
│ │                                                           │ │
│ │                                   [Create Sub-Event]     │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Sub-Events List                                           │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ ┌──────────────────────────────────────────────────┐    │ │
│ │ │ AI Workshop [workshop]                           │    │ │
│ │ │ Learn artificial intelligence basics...          │    │ │
│ │ │ 📅 Jan 15, 2024, 10:00 AM - 12:00 PM            │    │ │
│ │ │ 📍 Room 101  👤 Dr. Jane Smith                   │    │ │
│ │ │                              [Edit] [Delete]    │    │ │
│ │ └──────────────────────────────────────────────────┘    │ │
│ │                                                          │ │
│ │ ┌──────────────────────────────────────────────────┐    │ │
│ │ │ Panel Discussion [panel]                         │    │ │
│ │ │ Industry experts share insights on the future... │    │ │
│ │ │ 📅 Jan 15, 2024, 2:00 PM - 3:30 PM             │    │ │
│ │ │ 📍 Main Hall  👤 Prof. John Doe                 │    │ │
│ │ │                              [Edit] [Delete]    │    │ │
│ │ └──────────────────────────────────────────────────┘    │ │
│ │                                                          │ │
│ │ ┌──────────────────────────────────────────────────┐    │ │
│ │ │ Networking Session [networking]                  │    │ │
│ │ │ Connect with industry professionals...           │    │ │
│ │ │ 📅 Jan 15, 2024, 5:00 PM - 6:30 PM             │    │ │
│ │ │ 📍 Lounge                                        │    │ │
│ │ │                              [Edit] [Delete]    │    │ │
│ │ └──────────────────────────────────────────────────┘    │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│                                              [Close]        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────┐
│  Organizer      │
│  Portal         │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Select Event from Sidebar          │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  fetchSubEvents() called            │
│  GET /api/organizer/subevents       │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Supabase Database Query            │
│  SELECT * FROM sub_events           │
│  WHERE event_id = ?                 │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  API Response                       │
│  { subEvents: [...] }               │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  State Update                       │
│  setSubEvents(data)                 │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Render Sub-Events List             │
│  In Modal Dialog                    │
└─────────────────────────────────────┘


    CREATE NEW SUB-EVENT FLOW:

┌──────────────────────┐
│ Fill Form Fields     │
│ - Title              │
│ - Type               │
│ - Details            │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Click "Create Sub-Event"         │
│ createOrUpdateSubEvent()          │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ POST /api/organizer/subevents    │
│ { title, type, ... }              │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Validate & Insert into Database  │
│ INSERT INTO sub_events VALUES ()  │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Success Response                 │
│ { subEvent: {...}, message }      │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Update Local State               │
│ setSubEvents([...new item])       │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Show Success Toast               │
│ "Sub-event created"              │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Re-render List with New Item     │
│ Modal stays open for more items  │
└──────────────────────────────────┘
```

---

## 🎯 Event Types & Icons

```
┌─────────────────┬──────────────────────────────────┐
│ Type            │ Description                      │
├─────────────────┼──────────────────────────────────┤
│ workshop        │ Hands-on practical session       │
│                 │ 🛠️ Tools & techniques           │
├─────────────────┼──────────────────────────────────┤
│ talk            │ Presentation by a speaker        │
│                 │ 🎤 Knowledge sharing             │
├─────────────────┼──────────────────────────────────┤
│ panel           │ Multiple speakers discussing     │
│                 │ 🎙️ Round-table discussion        │
├─────────────────┼──────────────────────────────────┤
│ breakout        │ Small group breakout session     │
│                 │ 👥 Focused discussion             │
├─────────────────┼──────────────────────────────────┤
│ networking      │ Informal networking opportunity  │
│                 │ 🤝 Connections & socializing     │
├─────────────────┼──────────────────────────────────┤
│ other           │ Custom session type              │
│                 │ 🎯 Not in above categories       │
└─────────────────┴──────────────────────────────────┘
```

---

## 📊 State Management

### Component State Variables
```typescript
// Sub-events related
const [subEvents, setSubEvents] = useState<any[]>([])
const [showSubEventsModal, setShowSubEventsModal] = useState(false)
const [subEventsLoading, setSubEventsLoading] = useState(false)

// Form state
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

// Edit mode
const [editingSubEventId, setEditingSubEventId] = useState<string | null>(null)
```

### State Transitions
```
Initial
  │
  ├─→ [Open Modal] → showSubEventsModal = true
  │                    fetchSubEvents() called
  │
  ├─→ [Fill Form] → newSubEvent state updated
  │
  ├─→ [Create] → subEventsLoading = true
  │               POST request sent
  │               subEventsLoading = false
  │               subEvents list updated
  │               Success toast shown
  │
  ├─→ [Edit] → editingSubEventId = id
  │             newSubEvent populated with data
  │
  ├─→ [Update] → PUT request sent
  │               subEvents list updated
  │
  ├─→ [Delete] → DELETE request sent
  │               Item removed from list
  │
  └─→ [Close Modal] → showSubEventsModal = false
                      editingSubEventId = null
                      newSubEvent reset
```

---

## 🔐 Authentication Flow

```
┌──────────────────┐
│  User Logs In    │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Check Role                       │
│ Must be 'organizer'              │
└────────┬─────────────────────────┘
         │
    ┌────┴─────────────────────────────┐
    │                                  │
    ▼                                  ▼
┌─────────────┐              ┌──────────────────┐
│ Valid       │              │ Invalid Role     │
│ Organizer   │              │ Show Error       │
└────────┬────┘              └──────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Get Access Token             │
│ OR                           │
│ Get Organizer Secret         │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Add to Request Headers       │
│ Authorization: Bearer TOKEN  │
│ or                           │
│ x-organizer-secret: SECRET   │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Make API Request             │
│ /api/organizer/subevents     │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ API Validates Auth           │
└────────┬─────────────────────┘
         │
    ┌────┴──────────┐
    │               │
    ▼               ▼
┌────────────┐  ┌──────────┐
│ Authorized │  │ Rejected │
│ 200 OK     │  │ 401/403  │
└────────────┘  └──────────┘
```

---

## 🚨 Error Handling

```
User Action
    │
    ▼
API Request
    │
    ├─→ Network Error → "Network error" Toast
    │
    ├─→ 400 Bad Request → Validation Error Toast
    │   (missing title, type, etc.)
    │
    ├─→ 401 Unauthorized → "Please log in" Toast
    │   (invalid/expired token)
    │
    ├─→ 403 Forbidden → "Not your event" Toast
    │   (organizer doesn't own event)
    │
    ├─→ 404 Not Found → "Event/Sub-event not found" Toast
    │   (resource doesn't exist)
    │
    ├─→ 500 Server Error → "Server error" Toast
    │   (database error, etc.)
    │
    └─→ 200 Success → Success Toast
        (operation completed)
```

---

## 🎨 Form Field Validation

```
Field          Type       Required  Validation
─────────────────────────────────────────────────
Title          Text       Yes       Non-empty
Type           Select     Yes       Valid option
Description    Textarea   No        None
Start Time     DateTime   No        None
End Time       DateTime   No        None
Location       Text       No        None
Max Capacity   Number     No        Integer ≥ 0
Speaker Name   Text       No        None
Speaker Email  Email      No        Valid email format
```

---

## 📱 Responsive Design

### Desktop (>768px)
```
┌──────────────────────────────────┐
│ Events (25%)    │ Edit Panel (75%) │
│                 │                  │
│                 │ [Save] [Create]  │
│                 │                  │
└──────────────────────────────────┘
```

### Tablet (640px - 768px)
```
┌──────────────────────────────────┐
│ Events    │ Edit Panel            │
│           │ [Save] [Create]       │
└──────────────────────────────────┘
```

### Mobile (<640px)
```
┌──────────────────────────────────┐
│ Events                           │
│ [Dropdown] Edit Panel            │
│ [Save] [Create]                  │
└──────────────────────────────────┘
```

---

## 🎯 Component Props & API

### Modal Props (if extracted to component)
```typescript
interface SubEventsModalProps {
  isOpen: boolean
  eventId: string
  accessToken?: string
  organizerSecret?: string
  onClose: () => void
  onRefresh?: () => void
}
```

### API Response Types
```typescript
interface SubEvent {
  id: string
  event_id: string
  title: string
  type: string
  description?: string
  start_time?: string
  end_time?: string
  location?: string
  max_capacity?: number
  current_registrations: number
  speaker_name?: string
  speaker_email?: string
  status: 'active' | 'cancelled' | 'completed'
  is_published: boolean
  created_at: string
  updated_at: string
}

interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}
```

---

## 🔄 Component Lifecycle

```
Component Mount
    │
    ├─→ Initialize State
    │
    └─→ Set up useEffect listeners
        │
        ├─→ On Event Selection
        │   └─→ fetchSubEvents()
        │
        ├─→ On Modal Open
        │   └─→ Focus on Title Input
        │
        └─→ On Component Unmount
            └─→ Cleanup Intervals/Timeouts

User Interactions
    │
    ├─→ Form Submit
    │   └─→ createOrUpdateSubEvent()
    │
    ├─→ Edit Button
    │   └─→ editSubEvent()
    │
    └─→ Delete Button
        └─→ deleteSubEvent()

Component Unmount
    │
    └─→ Clear All State & Listeners
```

---

## 📦 Export/Import Structure

```typescript
// organizer.tsx exports
export default function OrganizerDashboard() { ... }
function SimpleFormBuilder() { ... }

// subevents.ts exports
export default async function handler(req, res) { ... }

// Helper functions (internal)
async function requireOrganizer(req) { ... }
function getOrganizerSecret(req) { ... }
```

---

This visual guide complements the technical documentation and helps understand the UI structure, data flow, and component organization.
