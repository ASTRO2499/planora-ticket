# Authentication Separation Policy

**CRITICAL: Admin and Organizer authentication MUST remain completely separated.**

## Admin Authentication

### Endpoints
- `/api/admin/session` - Login/logout/check
- `/api/admin/tickets` - Ticket management
- `/api/admin/stats` - Analytics

### Authentication Method
- **ONLY** admin session cookies (`ADMIN_SESSION_COOKIE`)
- Validates via `verifyAdminSessionToken()` from `lib/adminSession.ts`
- Uses `ADMIN_SECRET` environment variable

### Strictly Forbidden
- ❌ Bearer tokens
- ❌ Organizer secrets (`x-organizer-secret`)
- ❌ Supabase Auth integration
- ❌ Any organizer credentials

---

## Organizer Authentication

### Endpoints
- `/api/organizer/events` - Event management
- `/api/organizer/tickets` - Attendee list
- `/api/organizer/templates` - Template uploads
- `/api/organizer/analytics` - Event metrics

### Authentication Methods (Either/Or)
1. **Bearer Token**: Supabase Auth with `role: 'organizer'` in user_metadata
2. **Organizer Secret**: Per-event secret via `x-organizer-secret` header

### Strictly Forbidden
- ❌ Admin session cookies
- ❌ Admin secrets (`ADMIN_SECRET`)
- ❌ Admin portal access
- ❌ Any admin credentials

---

## Implementation Rules

### For Admin APIs
```typescript
/**
 * ADMIN AUTHENTICATION ONLY
 * DO NOT accept bearer tokens or organizer secrets.
 */
function checkAuth(req: NextApiRequest) {
  const token = req.cookies?.[ADMIN_SESSION_COOKIE]
  return verifyAdminSessionToken(token)
}

// CRITICAL: Only admin session auth - reject all organizer credentials
if (!checkAuth(req)) return res.status(403).json({ error: 'unauthorized' })
```

### For Organizer APIs
```typescript
/**
 * ORGANIZER AUTHENTICATION ONLY
 * DO NOT accept admin session cookies or admin secrets.
 */
async function requireOrganizer(req: NextApiRequest) {
  // Bearer token validation with organizer role check
}

function getOrganizerSecret(req: NextApiRequest) {
  // x-organizer-secret header validation
}

// CRITICAL: Only organizer auth - reject admin session cookies
if (!organizer && !organizerSecret) return res.status(401).json({ error: 'unauthorized' })
```

---

## Rationale

1. **Security Isolation**: Admin has full system access; organizers have event-scoped access
2. **Credential Separation**: Different auth tokens prevent privilege escalation
3. **Access Control**: Admin can see all events; organizers see only their events
4. **Audit Trail**: Separate auth paths enable proper logging and tracking

---

## Enforcement

- All API files include explicit documentation blocks
- Code comments mark CRITICAL separation points
- Any PR merging authentication paths must be rejected
- Regular audits to verify separation remains intact

---

**Last Updated**: December 20, 2025  
**Enforced By**: Authentication policy in all `/api/admin/*` and `/api/organizer/*` files
