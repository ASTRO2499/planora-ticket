## Security Testing Guide - Organizer Portal

This document provides step-by-step instructions for testing the new security features.

---

## Test 1: Rate Limiting Verification

### Objective
Verify that the rate limiting blocks requests after 10 attempts in a 1-minute window.

### Prerequisites
- A valid organizer secret (5+ characters)
- Event ID for the organizer
- curl or Postman installed

### Steps

#### A. Make 12 Rapid Requests (Should Fail on 11-12)
```bash
#!/bin/bash
ORGANIZER_SECRET="test-secret-1234"
EVENT_ID="your-event-id"

echo "Making 12 rapid requests to /api/organizer/events..."
for i in {1..12}; do
  echo -n "Attempt $i: "
  curl -s -o /dev/null -w "HTTP %{http_code}\n" \
    -H "x-organizer-secret: $ORGANIZER_SECRET" \
    "https://yourapp.com/api/organizer/events"
  sleep 0.1
done
```

### Expected Results
```
Attempt 1: HTTP 200    ✓
Attempt 2: HTTP 200    ✓
...
Attempt 10: HTTP 200   ✓
Attempt 11: HTTP 429   ✓ (Too Many Requests - Rate Limited)
Attempt 12: HTTP 429   ✓ (Still Rate Limited)
```

#### B. Wait 1 Minute and Retry (Should Succeed)
```bash
echo "Waiting 60 seconds for rate limit window to reset..."
sleep 60

echo "Making request after rate limit window..."
curl -s -w "HTTP %{http_code}\n" \
  -H "x-organizer-secret: $ORGANIZER_SECRET" \
  "https://yourapp.com/api/organizer/events"
```

### Expected Results
```
HTTP 200   ✓ (Rate limit window reset, request succeeds)
```

---

## Test 2: Multiple IP Address Testing

### Objective
Verify that rate limits are per-IP, not global.

### Prerequisites
- VPN or proxy to test from different IP
- Same organizer secret
- Event ID

### Steps

#### A. Request from IP1 (should be allowed)
```bash
# From IP 192.168.1.100
curl -s -H "x-organizer-secret: test-secret-1234" \
  "https://yourapp.com/api/organizer/events"
# Expected: HTTP 200
```

#### B. Request from IP2 (should also be allowed)
```bash
# From IP 192.168.1.101 (different IP via VPN)
curl -s -H "x-organizer-secret: test-secret-1234" \
  "https://yourapp.com/api/organizer/events"
# Expected: HTTP 200
```

### Expected Results
Both requests succeed because they come from different IPs.

---

## Test 3: Authentication Failure Logging

### Objective
Verify that failed authentication attempts are logged with details.

### Prerequisites
- Access to application logs
- Invalid secret to test with

### Steps

#### A. Make Request with No Credentials
```bash
curl -s -i "https://yourapp.com/api/organizer/events"
```

#### B. Check Logs
```bash
tail -f /path/to/logs | grep "ORGANIZER_AUTH"
```

### Expected Log Output
```
[ORGANIZER_AUTH_FAILURE] 2024-01-15 10:30:45.123 {
  ip: "YOUR_IP",
  endpoint: "/api/organizer/events",
  reason: "no_credentials",
  method: "GET"
}
```

#### C. Make Request with Invalid Secret
```bash
curl -s -H "x-organizer-secret: invalid" \
  "https://yourapp.com/api/organizer/events?eventId=test"
```

#### D. Check Logs Again
```bash
# Should see auth failure or event not found (depends on implementation)
tail -f /path/to/logs | grep "ORGANIZER_AUTH"
```

---

## Test 4: Track Console Authentication Redirect

### Objective
Verify that unauthenticated users are redirected from `/track/console`.

### Prerequisites
- Browser with localStorage clear
- No valid organizer credentials

### Steps

#### A. Visit Track Console Without Auth
1. Clear browser localStorage
2. Navigate to `https://yourapp.com/track/console`
3. Observe error toast: "No organizer credentials found. Access denied."
4. Wait 2 seconds
5. Verify redirect to homepage

### Expected Behavior
```
1. Page loads briefly
2. Error toast appears: "No organizer credentials found. Access denied."
3. After 2 seconds, redirect to "https://yourapp.com/"
4. URL changes to homepage
```

#### B. Visit With Valid Credentials
1. Add valid organizer secret to localStorage
2. Navigate to `https://yourapp.com/track/console`
3. Observe events load successfully

### Expected Behavior
```
1. Page loads
2. No error toast shown
3. Events list displays
4. User can interact with track console
```

---

## Test 5: Successful Authentication Logging

### Objective
Verify that successful authentications are logged with proper details.

### Prerequisites
- Valid organizer secret
- Access to logs
- Event ID

### Steps

#### A. Make Valid Request
```bash
curl -s -H "x-organizer-secret: valid-secret-xyz123" \
  "https://yourapp.com/api/organizer/events"
```

#### B. Check Logs
```bash
tail -f /path/to/logs | grep "ORGANIZER_AUTH_SUCCESS"
```

### Expected Log Output
```
[ORGANIZER_AUTH_SUCCESS] 2024-01-15 10:35:22.456 {
  ip: "192.168.1.100",
  endpoint: "/api/organizer/events",
  method: "GET",
  eventCount: 3
}
```

---

## Test 6: Minimum Length Validation

### Objective
Verify that secrets shorter than 5 characters are rejected.

### Prerequisites
- Testing environment

### Steps

#### A. Test 4-Character Secret (Should Fail)
```bash
curl -s -i -H "x-organizer-secret: abcd" \
  "https://yourapp.com/api/organizer/events"
```

### Expected Result
```
HTTP 401 Unauthorized
{"error":"unauthorized"}
```

#### B. Test 5-Character Secret (Should Succeed)
```bash
curl -s -i -H "x-organizer-secret: abcde" \
  "https://yourapp.com/api/organizer/events"
```

### Expected Result
```
HTTP 200 OK
{"events":[...]}
# OR if no matching events:
HTTP 200 OK
{"events":[]}
```

---

## Test 7: Bearer Token Authentication

### Objective
Verify that Bearer token authentication (from Supabase Auth) still works.

### Prerequisites
- Valid Supabase Auth token with organizer role
- Token with proper JWT structure

### Steps

#### A. Extract Valid Bearer Token
```bash
# From your application's login response or session
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### B. Make Request with Bearer Token
```bash
curl -s -i -H "Authorization: Bearer $TOKEN" \
  "https://yourapp.com/api/organizer/events"
```

### Expected Results
```
HTTP 200 OK
{"events":[...]}
```

#### C. Verify Rate Limiting Does NOT Apply
```bash
# Make 15 rapid requests with Bearer token
for i in {1..15}; do
  echo "Attempt $i: $(curl -s -o /dev/null -w 'HTTP %{http_code}' \
    -H "Authorization: Bearer $TOKEN" \
    'https://yourapp.com/api/organizer/events')"
done
```

### Expected Results
All 15 requests should return HTTP 200 (no rate limiting on Bearer token auth).

---

## Test 8: All Organizer Endpoints

### Objective
Verify all 9 organizer endpoints are protected with rate limiting.

### Prerequisites
- Valid organizer secret
- Event ID
- Valid Bearer token (optional)

### Endpoints to Test

```bash
ORGANIZER_SECRET="your-secret"

# 1. Events Management
curl -H "x-organizer-secret: $ORGANIZER_SECRET" \
  "https://yourapp.com/api/organizer/events"

# 2. Tickets
curl -H "x-organizer-secret: $ORGANIZER_SECRET" \
  "https://yourapp.com/api/organizer/tickets?eventId=EVENT_ID"

# 3. Analytics
curl -H "x-organizer-secret: $ORGANIZER_SECRET" \
  "https://yourapp.com/api/organizer/analytics?eventId=EVENT_ID"

# 4. Templates
curl -H "x-organizer-secret: $ORGANIZER_SECRET" \
  "https://yourapp.com/api/organizer/templates"

# 5. Certificates
curl -H "x-organizer-secret: $ORGANIZER_SECRET" \
  -X POST \
  "https://yourapp.com/api/organizer/certificates"

# 6. Form Settings
curl -H "x-organizer-secret: $ORGANIZER_SECRET" \
  "https://yourapp.com/api/organizer/form-settings"

# 7. Certificate Template
curl -H "x-organizer-secret: $ORGANIZER_SECRET" \
  "https://yourapp.com/api/organizer/certificate-template?eventId=EVENT_ID"

# 8. Send Certificates
curl -H "x-organizer-secret: $ORGANIZER_SECRET" \
  -X POST \
  "https://yourapp.com/api/organizer/send-certificates"

# 9. Subevents
curl -H "x-organizer-secret: $ORGANIZER_SECRET" \
  "https://yourapp.com/api/organizer/subevents?eventId=EVENT_ID"
```

### Expected Results
All endpoints should:
1. ✓ Accept valid secrets (HTTP 200 or appropriate response)
2. ✓ Reject invalid secrets (HTTP 401)
3. ✓ Implement rate limiting (HTTP 429 after 10 attempts)
4. ✓ Log authentication attempts

---

## Test 9: Load Testing (Advanced)

### Objective
Verify rate limiting works under load without causing performance issues.

### Prerequisites
- Apache Bench (ab) or wrk installed
- Valid organizer secret
- Production-like environment

### Steps

```bash
# Test 100 requests with 10 concurrent connections
ab -n 100 -c 10 \
  -H "x-organizer-secret: your-secret" \
  "https://yourapp.com/api/organizer/events"
```

### Expected Results
```
Requests per second: X.XX [#/sec] (mean)
Time per request: XX.XX [ms] (mean)
Failed requests: 0 (or minimal failures)
Non-2xx responses: ~80 (429 rate limited responses)
```

---

## Test 10: Security Logging Verification

### Objective
Verify that all security logs are being recorded properly.

### Prerequisites
- Access to application logs
- Log aggregation tool (ELK, Datadog, etc.)

### Steps

#### A. Generate Various Auth Events
```bash
# Success (valid secret)
curl -H "x-organizer-secret: valid-secret-123" \
  "https://yourapp.com/api/organizer/events"

# Failure (no auth)
curl "https://yourapp.com/api/organizer/events"

# Rate limit (10+ rapid requests)
for i in {1..15}; do
  curl -H "x-organizer-secret: another-secret-456" \
    "https://yourapp.com/api/organizer/events" &
done
```

#### B. Review Logs
```bash
# Check for all three types of log entries
grep -E "ORGANIZER_AUTH_(SUCCESS|FAILURE|RATE_LIMIT)" /path/to/app.log

# Or with structured logging
jq 'select(.log_type | contains("ORGANIZER_AUTH"))' /path/to/structured.log
```

### Expected Log Entries
```json
{"log_type":"ORGANIZER_AUTH_SUCCESS","ip":"192.168.1.100","endpoint":"/api/organizer/events"}
{"log_type":"ORGANIZER_AUTH_FAILURE","ip":"192.168.1.101","endpoint":"/api/organizer/events","reason":"no_credentials"}
{"log_type":"ORGANIZER_AUTH_RATE_LIMIT","ip":"192.168.1.102","endpoint":"/api/organizer/events"}
```

---

## Troubleshooting

### Issue: Rate Limit Always Fails
**Solution:** 
- Verify clock sync on server
- Check if server was restarted (cache lost)
- Verify using correct IP (check `x-forwarded-for` header)

### Issue: Bearer Token Gets Rate Limited
**Solution:**
- Bearer token auth should NOT be rate limited
- Only organizer secrets are rate limited
- Check if secret header is also being sent

### Issue: Logs Not Appearing
**Solution:**
- Verify log level is set to INFO or DEBUG
- Check log output destination
- Verify grep pattern matches log format

### Issue: Track Console Not Redirecting
**Solution:**
- Clear browser localStorage
- Check browser console for errors
- Verify redirect timeout is 2 seconds
- Check network tab for 401 response from API

---

## Monitoring in Production

### Key Metrics to Watch
```
1. Authentication Success Rate
   - Expected: >95% for legitimate users
   - Alert if: <90% for 5+ minutes

2. Rate Limit Triggers
   - Expected: 0-5 per day (normal users resetting)
   - Alert if: >50 per day (potential attack)

3. Failed Authentication Attempts
   - Expected: <10 per day
   - Alert if: >100 per day (brute force attempt)

4. API Response Time
   - Expected: <100ms per request
   - Alert if: >500ms (performance degradation)
```

### Recommended Alerts
```
- Rate limit events from same IP > 5 times per hour
- Failed auth attempts > 20 per hour from single IP
- Any 403 Forbidden responses (event ownership check)
- Authentication success rate < 85% for 10+ minutes
```

---

## Sign-Off Checklist

Before deploying to production:

- [ ] Test 1: Rate Limiting - PASSED
- [ ] Test 2: Multiple IP - PASSED
- [ ] Test 3: Auth Failure Logging - PASSED
- [ ] Test 4: Track Console Redirect - PASSED
- [ ] Test 5: Success Logging - PASSED
- [ ] Test 6: Min Length Validation - PASSED
- [ ] Test 7: Bearer Token Auth - PASSED
- [ ] Test 8: All 9 Endpoints - PASSED
- [ ] Test 9: Load Testing - PASSED (if applicable)
- [ ] Test 10: Security Logging - PASSED
- [ ] Logs reviewed by security team
- [ ] Performance impact assessed
- [ ] Monitoring and alerts configured

---

**Document Version:** 1.0
**Last Updated:** 2024-01-15
**Author:** Security Team
**Review Status:** ✅ Ready for Testing
