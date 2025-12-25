import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// During `next build` the environment variables may not be set in the
// local dev environment. createClient will throw if url is falsy, which
// causes the build to fail when pages import this module at build-time.
//
// To keep the build safe we only create a real client when both values
// are present. Otherwise export a small no-op fallback that provides the
// methods the app calls client-side so runtime errors happen only when
// the user actually tries to use Supabase without configuring env vars.

let supabase: any
if (url && anon) {
	supabase = createClient(url, anon)
} else {
	// Minimal fallback used during build / dev when env vars are missing.
	// Methods return shapes compatible with supabase-js calls used in the app.
	supabase = {
		auth: {
			getUser: async () => ({ data: null, error: new Error('Supabase not configured') }),
			getSession: async () => ({ data: { session: null }, error: new Error('Supabase not configured') }),
			signOut: async () => ({ error: new Error('Supabase not configured') }),
			signInWithPassword: async () => ({ data: { session: null }, error: new Error('Supabase not configured') }),
			signUp: async () => ({ data: null, error: new Error('Supabase not configured') }),
			resetPasswordForEmail: async () => ({ data: null, error: new Error('Supabase not configured') }),
		},
		from: (_table: string) => ({
			select: async () => ({ data: null, error: null }),
			insert: async (_row: any) => ({ data: null, error: null }),
			update: async (_row: any) => ({ data: null, error: null }),
			eq: () => ({ select: async () => ({ data: null, error: null }) }),
		}),
	}
}

export { supabase }
export default supabase
