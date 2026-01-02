// =====================================================
// SUB-EVENTS API USAGE EXAMPLES
// Copy and paste these examples into your code
// =====================================================

// =====================================================
// 1. FETCH ALL SUB-EVENTS FOR AN EVENT
// =====================================================

async function fetchSubEvents(eventId: string, accessToken: string) {
  try {
    const response = await fetch(
      `/api/organizer/subevents?eventId=${encodeURIComponent(eventId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Sub-events:', data.subEvents)
    return data.subEvents
  } catch (error) {
    console.error('Error fetching sub-events:', error)
    throw error
  }
}

// Usage:
// const subEvents = await fetchSubEvents('event-123', 'your-access-token')


// =====================================================
// 2. CREATE A NEW SUB-EVENT
// =====================================================

async function createSubEvent(
  eventId: string,
  subEventData: {
    title: string
    type: 'workshop' | 'talk' | 'panel' | 'breakout' | 'networking' | 'other'
    description?: string
    start_time?: string  // ISO format: '2024-01-15T10:00:00Z'
    end_time?: string    // ISO format: '2024-01-15T12:00:00Z'
    location?: string
    max_capacity?: number
    speaker_name?: string
    speaker_email?: string
    speaker_bio?: string
  },
  accessToken: string
) {
  try {
    const response = await fetch(
      `/api/organizer/subevents?eventId=${encodeURIComponent(eventId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(subEventData)
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create sub-event')
    }

    const data = await response.json()
    console.log('Sub-event created:', data.subEvent)
    return data.subEvent
  } catch (error) {
    console.error('Error creating sub-event:', error)
    throw error
  }
}

// Usage:
/*
const newSubEvent = await createSubEvent(
  'event-123',
  {
    title: 'AI Workshop',
    type: 'workshop',
    description: 'Learn artificial intelligence basics',
    start_time: '2024-01-15T10:00:00Z',
    end_time: '2024-01-15T12:00:00Z',
    location: 'Room 101',
    max_capacity: 30,
    speaker_name: 'Dr. Jane Smith',
    speaker_email: 'jane@example.com'
  },
  'your-access-token'
)
*/


// =====================================================
// 3. UPDATE AN EXISTING SUB-EVENT
// =====================================================

async function updateSubEvent(
  eventId: string,
  subEventId: string,
  updates: Partial<{
    title: string
    type: string
    description: string
    start_time: string
    end_time: string
    location: string
    max_capacity: number
    speaker_name: string
    speaker_email: string
    speaker_bio: string
    status: 'active' | 'cancelled' | 'completed'
    is_published: boolean
  }>,
  accessToken: string
) {
  try {
    const response = await fetch(
      `/api/organizer/subevents?eventId=${encodeURIComponent(eventId)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          id: subEventId,
          ...updates
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update sub-event')
    }

    const data = await response.json()
    console.log('Sub-event updated:', data.subEvent)
    return data.subEvent
  } catch (error) {
    console.error('Error updating sub-event:', error)
    throw error
  }
}

// Usage:
/*
const updated = await updateSubEvent(
  'event-123',
  'sub-event-uuid',
  {
    title: 'Updated Title',
    max_capacity: 50,
    status: 'active'
  },
  'your-access-token'
)
*/


// =====================================================
// 4. DELETE A SUB-EVENT
// =====================================================

async function deleteSubEvent(
  eventId: string,
  subEventId: string,
  accessToken: string
) {
  try {
    const response = await fetch(
      `/api/organizer/subevents?eventId=${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ id: subEventId })
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete sub-event')
    }

    const data = await response.json()
    console.log('Sub-event deleted:', data.message)
    return true
  } catch (error) {
    console.error('Error deleting sub-event:', error)
    throw error
  }
}

// Usage:
/*
await deleteSubEvent('event-123', 'sub-event-uuid', 'your-access-token')
*/


// =====================================================
// 5. USING WITH ORGANIZER SECRET (Alternative Auth)
// =====================================================

async function fetchSubEventsWithSecret(
  eventId: string,
  organizerSecret: string
) {
  try {
    const response = await fetch(
      `/api/organizer/subevents?eventId=${encodeURIComponent(eventId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-organizer-secret': organizerSecret  // Use secret instead of token
        }
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.subEvents
  } catch (error) {
    console.error('Error fetching sub-events:', error)
    throw error
  }
}


// =====================================================
// 6. COMPLETE EXAMPLE: SUB-EVENTS MANAGER CLASS
// =====================================================

class SubEventsManager {
  private eventId: string
  private accessToken: string
  private organizerSecret?: string

  constructor(
    eventId: string,
    accessToken?: string,
    organizerSecret?: string
  ) {
    this.eventId = eventId
    this.accessToken = accessToken || ''
    this.organizerSecret = organizerSecret
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (this.organizerSecret) {
      headers['x-organizer-secret'] = this.organizerSecret
    } else if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    return headers
  }

  async getAll() {
    const response = await fetch(
      `/api/organizer/subevents?eventId=${encodeURIComponent(this.eventId)}`,
      { method: 'GET', headers: this.getHeaders() }
    )

    if (!response.ok) throw new Error('Failed to fetch sub-events')
    const data = await response.json()
    return data.subEvents
  }

  async create(subEventData: any) {
    const response = await fetch(
      `/api/organizer/subevents?eventId=${encodeURIComponent(this.eventId)}`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(subEventData)
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create sub-event')
    }

    const data = await response.json()
    return data.subEvent
  }

  async update(subEventId: string, updates: any) {
    const response = await fetch(
      `/api/organizer/subevents?eventId=${encodeURIComponent(this.eventId)}`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ id: subEventId, ...updates })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update sub-event')
    }

    const data = await response.json()
    return data.subEvent
  }

  async delete(subEventId: string) {
    const response = await fetch(
      `/api/organizer/subevents?eventId=${encodeURIComponent(this.eventId)}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
        body: JSON.stringify({ id: subEventId })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete sub-event')
    }

    return true
  }

  async getActiveSubEvents() {
    const all = await this.getAll()
    return all.filter((se: any) => se.status === 'active' && se.is_published)
  }

  async getUpcomingSubEvents() {
    const active = await this.getActiveSubEvents()
    const now = new Date()
    return active.filter((se: any) => new Date(se.start_time) > now)
  }
}

// Usage:
/*
const manager = new SubEventsManager('event-123', 'access-token')

// Get all sub-events
const all = await manager.getAll()

// Get only upcoming events
const upcoming = await manager.getUpcomingSubEvents()

// Create a new sub-event
const newEvent = await manager.create({
  title: 'Workshop',
  type: 'workshop',
  start_time: '2024-01-15T10:00:00Z',
  end_time: '2024-01-15T12:00:00Z'
})

// Update a sub-event
const updated = await manager.update(subEventId, { title: 'New Title' })

// Delete a sub-event
await manager.delete(subEventId)
*/


// =====================================================
// 7. REACT HOOK FOR SUB-EVENTS
// =====================================================

import { useState, useEffect, useCallback } from 'react'

function useSubEvents(eventId: string, accessToken: string) {
  const [subEvents, setSubEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSubEvents = useCallback(async () => {
    if (!eventId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/organizer/subevents?eventId=${encodeURIComponent(eventId)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch sub-events')

      const data = await response.json()
      setSubEvents(data.subEvents || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [eventId, accessToken])

  useEffect(() => {
    fetchSubEvents()
  }, [fetchSubEvents])

  const create = useCallback(
    async (subEventData: any) => {
      try {
        const response = await fetch(
          `/api/organizer/subevents?eventId=${encodeURIComponent(eventId)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(subEventData)
          }
        )

        if (!response.ok) throw new Error('Failed to create sub-event')

        const data = await response.json()
        setSubEvents([...subEvents, data.subEvent])
        return data.subEvent
      } catch (err: any) {
        setError(err.message)
        throw err
      }
    },
    [eventId, accessToken, subEvents]
  )

  const update = useCallback(
    async (subEventId: string, updates: any) => {
      try {
        const response = await fetch(
          `/api/organizer/subevents?eventId=${encodeURIComponent(eventId)}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ id: subEventId, ...updates })
          }
        )

        if (!response.ok) throw new Error('Failed to update sub-event')

        const data = await response.json()
        setSubEvents(
          subEvents.map((se) => (se.id === subEventId ? data.subEvent : se))
        )
        return data.subEvent
      } catch (err: any) {
        setError(err.message)
        throw err
      }
    },
    [eventId, accessToken, subEvents]
  )

  const delete_ = useCallback(
    async (subEventId: string) => {
      try {
        const response = await fetch(
          `/api/organizer/subevents?eventId=${encodeURIComponent(eventId)}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ id: subEventId })
          }
        )

        if (!response.ok) throw new Error('Failed to delete sub-event')

        setSubEvents(subEvents.filter((se) => se.id !== subEventId))
        return true
      } catch (err: any) {
        setError(err.message)
        throw err
      }
    },
    [eventId, accessToken, subEvents]
  )

  return {
    subEvents,
    loading,
    error,
    fetchSubEvents,
    create,
    update,
    delete: delete_
  }
}

// Usage in component:
/*
function MyComponent() {
  const { subEvents, loading, create, update, delete: deleteSubEvent } = useSubEvents(
    'event-123',
    'access-token'
  )

  return (
    <div>
      {loading && <p>Loading...</p>}
      {subEvents.map(event => (
        <div key={event.id}>{event.title}</div>
      ))}
    </div>
  )
}
*/


// =====================================================
// 8. ERROR HANDLING BEST PRACTICES
// =====================================================

async function createSubEventWithErrorHandling(
  eventId: string,
  subEventData: any,
  accessToken: string
) {
  try {
    if (!subEventData.title || !subEventData.type) {
      throw new Error('Title and type are required')
    }

    const response = await fetch(
      `/api/organizer/subevents?eventId=${encodeURIComponent(eventId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(subEventData)
      }
    )

    // Handle different HTTP statuses
    if (response.status === 401) {
      throw new Error('Unauthorized. Please log in again.')
    }

    if (response.status === 403) {
      throw new Error('Forbidden. This is not your event.')
    }

    if (response.status === 404) {
      throw new Error('Event not found.')
    }

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.subEvent
  } catch (error) {
    console.error('Create sub-event error:', error)
    // Re-throw or handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('NetworkError')) {
        throw new Error('Network error. Please check your connection.')
      }
    }
    throw error
  }
}
