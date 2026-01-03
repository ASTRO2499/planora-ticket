## Critical Security Fixes - Organizer Portal Access Control

### Vulnerability Summary

The track console (`/track/console`) and organizer API endpoints were vulnerable to brute-force attacks and potential unauthorized access due to insufficient validation of organizer secrets.

### Root Cause

The authentication system was using `organizer_id` field directly from the events table as a lookup key without:
1. **Rate limiting** on secret guessing attempts
2. **Comprehensive logging** of authentication attempts
3. **Cryptographic validation** of the secret

This meant an attacker could:
- Attempt unlimited organizer secret guesses
- Monitor API responses to find valid secrets
- Gain access to any organizer's events and data

### Changes Made

#### 1. **New Shared Authentication Utility** (`lib/organizerAuth.ts`)
- Created centralized `getOrganizerSecret()` function with 5-character minimum validation
- Implemented `checkOrganizerRateLimit()` with:
  - 10 attempts per minute per IP + secret prefix
  - In-memory cache (TODO: Replace with Redis for multi-process deployments)
  - IP address tracking for audit trails
- Added `logAuthAttempt()` for comprehensive security logging
- Extracted `requireOrganizerToken()` and `getClientIp()` utilities

#### 2. **Rate Limiting Applied to All Organizer Endpoints**
```
/api/organizer/events       - GET/PUT event management
/api/organizer/tickets      - GET/PUT ticket management  
/api/organizer/analytics    - GET analytics data
/api/organizer/templates    - POST/GET template management
/api/organizer/certificates - POST certificate generation
/api/organizer/form-settings - POST form configuration
/api/organizer/certificate-template - GET/POST certificate templates
/api/organizer/send-certificates - POST email sending
/api/organizer/subevents - GET/POST/PUT/DELETE sub-event management
```

Each endpoint now:
1. ✅ Validates organizer credentials (bearer token OR secret)
2. ✅ Enforces rate limiting (max 10 attempts/minute per IP)
3. ✅ Logs all authentication attempts (success, failure, rate_limit)
4. ✅ Returns 429 (Too Many Requests) when rate limited
5. ✅ Validates organizer owns the requested event

#### 3. **Track Console Security** (`pages/track/console.tsx`)
- Added authentication redirect: Users without credentials are redirected to homepage after 2 seconds
- Shows error toast: "No organizer credentials found. Access denied."
- Implements client-side guard before calling organizer API endpoints

### Security Logging Format

All authentication attempts are logged with the following format:
```typescript
[ORGANIZER_AUTH_SUCCESS] <timestamp> {
  ip: "192.168.x.x",
  endpoint: "/api/organizer/events",
  method: "GET" | "secret" | "bearer",
  eventCount?: number
}

[ORGANIZER_AUTH_FAILURE] <timestamp> {
  ip: "192.168.x.x",
  endpoint: "/api/organizer/events",
  reason: "no_credentials" | "forbidden" | "no_valid_auth"
}

[ORGANIZER_AUTH_RATE_LIMIT] <timestamp> {
  ip: "192.168.x.x",
  endpoint: "/api/organizer/events"
}
```

### Remaining Recommendations

#### Immediate (Production Readiness)
1. **Replace in-memory cache with Redis/database** for distributed deployments
   - Current implementation assumes single-process Node.js server
   - Multiple processes won't share rate limit state

2. **Add database-level validation** of organizer secrets
   - Current system validates field existence only
   - Should hash secrets and verify against stored hash

3. **Implement request logging/alerting**
   - Monitor console for authentication failures
   - Alert on multiple rate-limit triggers from same IP
   - Create dashboard for security event visualization

#### Medium-term (Security Hardening)
1. **Migrate to JWT-based authentication** for organizer role
   - Reduces reliance on per-event secrets
   - Provides better token lifecycle management
   - Enables fine-grained permission scoping

2. **Implement API key authentication** with:
   - Separate admin/organizer key management
   - Key rotation policies
   - Per-endpoint permission scoping

3. **Add request signing** with HMAC-SHA256
   - Validate signature of requests using organizer secret
   - Prevents replay attacks
   - Better than plain bearer token comparison

#### Long-term (Architecture)
1. **Separate admin and organizer authentication completely**
   - Admin: Session-based (cookies) via session endpoint
   - Organizer: Token-based (bearer tokens) via Supabase Auth
   - Remove all cross-contamination between auth types

2. **Add OAuth2/OpenID Connect support**
   - Leverage existing identity provider integrations
   - Reduce custom authentication code
   - Better audit trail compliance

### Testing the Fixes

**Rate Limiting Test:**
```bash
# Attempt organizer API call 15 times rapidly
for i in {1..15}; do
  curl -H "x-organizer-secret: test-secret" \
       https://yourapp.com/api/organizer/events
done
# Expected: First 10 succeed, calls 11-15 return 429 (Too Many Requests)
```

**Authentication Logging:**
```bash
# Check logs for authentication attempts
tail -f /var/log/app.log | grep "ORGANIZER_AUTH"
# Should show success, failure, and rate_limit entries with IP tracking
```

### Deployment Checklist

- [x] Applied rate limiting to all organizer endpoints
- [x] Added comprehensive security logging
- [x] Updated track console authentication redirect
- [x] Validated all files compile without errors
- [ ] Deploy to staging for testing
- [ ] Monitor authentication logs for anomalies
- [ ] Plan Redis migration for distributed deployments
- [ ] Add database validation of organizer secrets

### Files Modified

1. **lib/organizerAuth.ts** - NEW shared utility module
2. **pages/api/organizer/events.ts** - Rate limiting + logging
3. **pages/api/organizer/tickets.ts** - Rate limiting + logging
4. **pages/api/organizer/analytics.ts** - Rate limiting + logging
5. **pages/api/organizer/templates.ts** - Rate limiting + logging
6. **pages/api/organizer/certificates.ts** - Rate limiting + logging
7. **pages/api/organizer/form-settings.ts** - Rate limiting + logging
8. **pages/api/organizer/certificate-template.ts** - Rate limiting + logging
9. **pages/api/organizer/send-certificates.ts** - Rate limiting + logging
10. **pages/api/organizer/subevents.ts** - Rate limiting + logging
11. **pages/track/console.tsx** - Authentication redirect

### Conclusion

These changes significantly reduce the attack surface by:
1. **Preventing brute-force attacks** through rate limiting (10 attempts/minute)
2. **Enabling security monitoring** through comprehensive logging
3. **Protecting user sessions** with authentication redirects
4. **Standardizing auth logic** across all organizer endpoints

However, this is a **partial fix**. Production deployment requires implementing Redis-backed rate limiting and database-level secret validation as recommended above.
