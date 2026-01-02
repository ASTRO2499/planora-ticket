# Sub-Events Feature - Implementation Checklist

## 📋 Overview
This checklist guides you through setting up and testing the new sub-events feature for Planora Ticketing System.

---

## ✅ Phase 1: Database Setup

### Step 1: Apply SQL Migration
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Copy the entire content from `supabase/migrations/012_create_subevents.sql`
- [ ] Paste into SQL Editor
- [ ] Click "Run" to execute
- [ ] Verify no errors appear
- [ ] Check that both tables are created:
  ```sql
  SELECT * FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name IN ('sub_events', 'sub_event_registrations');
  ```

### Step 2: Verify Database Tables
- [ ] `sub_events` table exists with all columns
- [ ] `sub_event_registrations` table exists
- [ ] All indexes are created
- [ ] RLS (Row Level Security) policies are enabled
- [ ] Foreign key constraints are working

### Step 3: Test Initial Data
- [ ] Insert a sample sub-event:
  ```sql
  INSERT INTO public.sub_events (
    event_id, title, type, location, start_time, end_time, is_published
  ) VALUES (
    'test-event-123',
    'Test Workshop',
    'workshop',
    'Room 101',
    now() + interval '1 day',
    now() + interval '1 day 2 hours',
    true
  );
  ```
- [ ] Verify the record was inserted
- [ ] Delete the test record

---

## ✅ Phase 2: Backend API Setup

### Step 1: Verify API File
- [ ] File exists: `pages/api/organizer/subevents.ts`
- [ ] File has all required functions:
  - [ ] requireOrganizer()
  - [ ] getOrganizerSecret()
  - [ ] GET handler
  - [ ] POST handler
  - [ ] PUT handler
  - [ ] DELETE handler
- [ ] No syntax errors (checked by ESLint)

### Step 2: Test API Endpoints
#### Test GET
```bash
curl -X GET "http://localhost:3000/api/organizer/subevents?eventId=event-123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```
- [ ] Returns empty array or existing sub-events
- [ ] No 401 error (authentication works)

#### Test POST
```bash
curl -X POST "http://localhost:3000/api/organizer/subevents?eventId=event-123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Workshop",
    "type": "workshop",
    "description": "Test description",
    "start_time": "2024-01-15T10:00:00Z",
    "end_time": "2024-01-15T12:00:00Z",
    "location": "Room 101"
  }'
```
- [ ] Returns 201 status
- [ ] New sub-event is created
- [ ] Database confirms insertion

#### Test PUT
```bash
curl -X PUT "http://localhost:3000/api/organizer/subevents?eventId=event-123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "sub-event-uuid-here",
    "title": "Updated Title"
  }'
```
- [ ] Returns 200 status
- [ ] Sub-event is updated in database

#### Test DELETE
```bash
curl -X DELETE "http://localhost:3000/api/organizer/subevents?eventId=event-123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "sub-event-uuid-here"}'
```
- [ ] Returns 200 status
- [ ] Sub-event is deleted from database

### Step 3: Test Authentication
- [ ] Test with valid Bearer token → Works
- [ ] Test with invalid token → 401 error
- [ ] Test with organizer secret header → Works
- [ ] Test with no auth → 401 error
- [ ] Test with expired token → 401 error

### Step 4: Test Error Handling
- [ ] Missing eventId → 400 error
- [ ] Missing title in POST → 400 error
- [ ] Invalid event ID → 404 error
- [ ] Non-existent sub-event update → 404 error
- [ ] Unauthorized organizer → 403 error (for ownership check)

---

## ✅ Phase 3: Frontend UI Setup

### Step 1: Verify Components
- [ ] File modified: `pages/organizer.tsx`
- [ ] New state variables added:
  - [ ] `subEvents`
  - [ ] `showSubEventsModal`
  - [ ] `subEventsLoading`
  - [ ] `newSubEvent`
  - [ ] `editingSubEventId`
- [ ] New functions added:
  - [ ] `fetchSubEvents()`
  - [ ] `createOrUpdateSubEvent()`
  - [ ] `deleteSubEvent()`
  - [ ] `editSubEvent()`
  - [ ] `cancelEditSubEvent()`

### Step 2: Check UI Components
- [ ] "Create Sub Events" button appears next to "Save Changes"
- [ ] Button is properly styled (variant="outline")
- [ ] Modal opens when button is clicked
- [ ] Modal closes with ✕ button
- [ ] Modal closes with "Close" button

### Step 3: Test Form Elements
- [ ] Title input field works
- [ ] Type dropdown shows all options:
  - [ ] Workshop
  - [ ] Talk
  - [ ] Panel Discussion
  - [ ] Breakout Session
  - [ ] Networking
  - [ ] Other
- [ ] Description textarea works
- [ ] Start time picker works
- [ ] End time picker works
- [ ] Location input works
- [ ] Max capacity input works (number only)
- [ ] Speaker name input works
- [ ] Speaker email input works

### Step 4: Test List Display
- [ ] Sub-events appear in list after creation
- [ ] List shows:
  - [ ] Title
  - [ ] Type badge/label
  - [ ] Description (if available)
  - [ ] Start time
  - [ ] Location (if available)
  - [ ] Speaker name (if available)
- [ ] Edit button appears for each item
- [ ] Delete button appears for each item
- [ ] Empty state message shows when no sub-events

### Step 5: Test CRUD Operations
- [ ] **Create:**
  - [ ] Fill in form fields
  - [ ] Click "Create Sub-Event"
  - [ ] Loading state shows
  - [ ] Success toast appears
  - [ ] Sub-event appears in list
  - [ ] Modal stays open for more entries

- [ ] **Read:**
  - [ ] Select an event
  - [ ] Click "Create Sub Events"
  - [ ] Existing sub-events load
  - [ ] List displays correctly

- [ ] **Update:**
  - [ ] Click "Edit" on a sub-event
  - [ ] Form populates with data
  - [ ] Modify fields
  - [ ] Click "Update Sub-Event"
  - [ ] Loading state shows
  - [ ] Success toast appears
  - [ ] List updates immediately

- [ ] **Delete:**
  - [ ] Click "Delete" on a sub-event
  - [ ] Confirmation dialog appears
  - [ ] Confirm deletion
  - [ ] Loading state shows
  - [ ] Success toast appears
  - [ ] Item removed from list

### Step 6: Test Form Validation
- [ ] Cannot create without title → Error message
- [ ] Cannot create without type → Error message
- [ ] Invalid capacity (non-numeric) → Should be rejected or coerced
- [ ] Start time after end time → No validation currently (future enhancement)

### Step 7: Test Modal Behavior
- [ ] Modal scrolls if content overflows
- [ ] Modal backdrop closes modal when clicked (check if implemented)
- [ ] "Cancel" button clears form and exits edit mode
- [ ] Form resets after successful creation
- [ ] Form prepares for new entry after creation

---

## ✅ Phase 4: Integration Testing

### Step 1: Event Selection Integration
- [ ] Select event from list
- [ ] Sub-events load automatically
- [ ] Switch between events → Sub-events update correctly
- [ ] Select null/no event → Sub-events cleared

### Step 2: Authentication Integration
- [ ] Login with email/password (organizer role)
- [ ] Use organizer secret
- [ ] Both auth methods work with sub-events
- [ ] Logout and re-login → Still works

### Step 3: Data Persistence
- [ ] Create sub-event
- [ ] Refresh page
- [ ] Sub-event still exists
- [ ] Edit sub-event
- [ ] Refresh page
- [ ] Changes persisted
- [ ] Delete sub-event
- [ ] Refresh page
- [ ] Sub-event gone

### Step 4: Multi-User Testing
- [ ] Create sub-events as Organizer 1
- [ ] Organizer 2 cannot see them (if using organizer secrets for different events)
- [ ] Both organizers can manage their own events

---

## ✅ Phase 5: Edge Cases & Error Scenarios

### Network Issues
- [ ] Disable network → Error toast appears
- [ ] Reconnect network → Retry works
- [ ] Slow network → Loading state shows appropriately

### Duplicate Prevention
- [ ] Same sub-event title allowed (no uniqueness constraint needed)
- [ ] Duplicate registrations prevented by sub_event_registrations table

### Capacity Management
- [ ] Can set max_capacity to null
- [ ] Can set max_capacity to 0 (no attendees)
- [ ] Can set max_capacity to large number
- [ ] current_registrations increments correctly (when registration feature added)

### Time Validation
- [ ] Start time in past is allowed (no validation currently)
- [ ] End time before start time allowed (no validation currently)
- [ ] Same start and end time allowed

### Special Characters
- [ ] Title with special characters: "Workshop #1 (Advanced)"
- [ ] Description with quotes: "This is a "cool" workshop"
- [ ] HTML/script tags in fields: `<script>alert('test')</script>` - should be safe

---

## ✅ Phase 6: Performance Testing

### Load Testing
- [ ] Load page with 1 event → Fast
- [ ] Load page with 10+ events → Still responsive
- [ ] Event with 50+ sub-events → List scrolls smoothly
- [ ] Create 100 sub-events → API handles without timeout

### Memory Testing
- [ ] Open/close modal 10 times → No memory leak
- [ ] Switch events 10 times → Memory stable

### API Performance
- [ ] GET /api/organizer/subevents → < 500ms for 50 items
- [ ] POST /api/organizer/subevents → < 1000ms
- [ ] PUT /api/organizer/subevents → < 1000ms
- [ ] DELETE /api/organizer/subevents → < 500ms

---

## ✅ Phase 7: Documentation & Code Quality

### Code Quality
- [ ] No console.error messages in production
- [ ] No unhandled promise rejections
- [ ] TypeScript types are correct
- [ ] ESLint passes with no warnings
- [ ] No unused variables or imports

### Documentation
- [ ] SUBEVENTS_FEATURE_GUIDE.md created ✓
- [ ] SQL_QUICK_REFERENCE.sql created ✓
- [ ] SUB_EVENTS_API_EXAMPLES.ts created ✓
- [ ] README updated with feature description
- [ ] Code comments where needed

### File Structure
- [ ] `pages/api/organizer/subevents.ts` ✓
- [ ] `supabase/migrations/012_create_subevents.sql` ✓
- [ ] `pages/organizer.tsx` modified ✓
- [ ] Migration executed ✓

---

## ✅ Phase 8: Browser Compatibility

- [ ] Chrome (latest) ✓
- [ ] Firefox (latest) ✓
- [ ] Safari (latest) ✓
- [ ] Edge (latest) ✓
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## ✅ Phase 9: Accessibility

- [ ] Modal has proper focus management
- [ ] Form inputs have labels
- [ ] Buttons have descriptive text
- [ ] Error messages are descriptive
- [ ] Loading states are announced
- [ ] Keyboard navigation works

---

## ✅ Phase 10: Deployment

### Pre-Deployment
- [ ] All tests pass
- [ ] No console errors
- [ ] Database backup taken
- [ ] Migration tested on staging

### Deployment Steps
1. [ ] Run migration: `supabase migration up`
2. [ ] Deploy API: Update `pages/api/organizer/subevents.ts`
3. [ ] Deploy UI: Update `pages/organizer.tsx`
4. [ ] Clear browser cache
5. [ ] Test in production
6. [ ] Monitor error logs for 24 hours

### Post-Deployment
- [ ] Create test sub-event in production
- [ ] Verify in database
- [ ] Verify in UI
- [ ] Test edit and delete
- [ ] Performance monitoring

---

## 🎉 Completion Checklist

- [ ] All phases completed
- [ ] All tests passed
- [ ] Documentation reviewed
- [ ] Team notified of new feature
- [ ] User training provided (if applicable)
- [ ] Feature tracked in issue tracking system
- [ ] Backup of database created
- [ ] Rollback plan ready (if needed)

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue: "Unauthorized" error**
- Solution: Check Bearer token or organizer secret
- Check: Are you logged in as an organizer?

**Issue: Sub-events don't appear**
- Solution: Verify event ID matches
- Solution: Check database for sub-events
- Check: Are sub-events published (is_published = true)?

**Issue: Modal doesn't open**
- Solution: Check browser console for JS errors
- Solution: Verify "Create Sub Events" button is rendered

**Issue: API returns 404**
- Solution: Verify event exists
- Solution: Verify organizer owns the event

**Issue: Form doesn't submit**
- Solution: Check required fields (title, type)
- Solution: Check browser console for errors
- Solution: Verify network connection

---

## 📝 Notes

- Keep this checklist updated as features evolve
- Archive completed checklists for reference
- Share feedback with the development team
- Plan for Phase 2 enhancements (registrations, attendance tracking)

---

**Last Updated:** January 2, 2026
**Version:** 1.0
**Status:** Ready for Implementation
