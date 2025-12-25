import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'

export type TicketStatus = 'pending' | 'issued' | 'failed' | 'redeemed' | 'cancelled'

function isStatusColumnError(error: PostgrestError | null): boolean {
  if (!error) return false
  const message = `${error.message} ${error.details || ''}`.toLowerCase()
  return message.includes('status') && message.includes('column')
}

export async function insertTicketWithStatus(
  client: SupabaseClient,
  row: Record<string, any>,
  status: TicketStatus = 'issued'
) {
  const rowWithStatus = { ...row, status }
  const insert = await client.from('tickets').insert([rowWithStatus]).select().single()
  if (insert.error) {
    if (isStatusColumnError(insert.error)) {
      const { status: _ignored, ...fallback } = rowWithStatus
      const retry = await client.from('tickets').insert([fallback]).select().single()
      if (retry.error) throw retry.error
      return retry.data
    }
    throw insert.error
  }
  return insert.data
}

export async function setTicketStatus(
  client: SupabaseClient,
  id: string,
  status: TicketStatus
) {
  const update = await client.from('tickets').update({ status }).eq('id', id)
  if (update.error && !isStatusColumnError(update.error)) {
    console.error('ticket status update failed', { id, status, error: update.error })
    throw update.error
  }
}
