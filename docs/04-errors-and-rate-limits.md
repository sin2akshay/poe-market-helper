# Errors & Rate Limits

Source: https://www.pathofexile.com/developer/docs/index

## HTTP status codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 202 | Accepted (request accepted, not yet fully processed — e.g. item filter validation) |
| 400 | Bad Request — invalid format/arguments |
| 404 | Not Found |
| 429 | Too Many Requests — rate limited |
| 500 | Internal Server Error |

## Error response body

```json
{
  "error": {
    "code": 2,
    "message": "Invalid query"
  }
}
```

**Always branch on `code`, not `message`** — message text is not a stable
contract and may change.

| Code | Message | Meaning |
|---|---|---|
| 0 | Accepted | Request accepted |
| 1 | Resource not found | Endpoint/resource missing |
| 2 | Invalid query | Malformed request |
| 3 | Rate limit exceeded | Throttled |
| 4 | Internal error | Server error |
| 5 | Unexpected content type | Invalid response format |
| 6 | Forbidden | Access denied |
| 7 | Temporarily Unavailable | Service down |
| 8 | Unauthorized | Auth failure |
| 9 | Method not allowed | Wrong HTTP verb |
| 10 | Unprocessable Entity | Valid format, processing failed |

**Invalid-request threshold:** apps that generate too many 4xx responses
(401/403/429/etc.) over time risk having access restricted, independent of the
rate limiter itself. Design clients defensively — validate input before
sending, handle 401 by refreshing tokens rather than blindly retrying, etc.

## Rate limiting (dynamic, header-driven)

Limits are **not fixed constants** — they can change server-side at any time.
**Do not hardcode limits; parse headers on every response.**

### Example — healthy response
```
HTTP/1.1 200 OK
X-Rate-Limit-Policy: ladder-view
X-Rate-Limit-Rules: client
X-Rate-Limit-Client: 10:5:10
X-Rate-Limit-Client-State: 1:5:0
```

### Example — throttled response
```
HTTP/1.1 429 Too Many Requests
X-Rate-Limit-Policy: ladder-view
X-Rate-Limit-Rules: client
X-Rate-Limit-Client: 10:5:10
X-Rate-Limit-Client-State: 11:5:10
Retry-After: 10
```

### Header semantics

- `X-Rate-Limit-Policy` — name of the policy in force (one policy can cover
  multiple endpoints, so limits are shared across related calls).
- `X-Rate-Limit-Rules` — comma-separated list of which rule dimensions apply,
  typically some subset of `ip`, `account`, `client`.
- `X-Rate-Limit-{rule}` = `hits:period_seconds:penalty_seconds` — e.g.
  `10:5:10` = max 10 hits per 5-second window, and if you exceed it you're
  locked out for 10 seconds.
- `X-Rate-Limit-{rule}-State` = `current_hits:period_seconds:active_penalty_seconds`
  — e.g. `11:5:10` means you're currently over budget and serving a 10s penalty.
- `Retry-After` — seconds to wait (present on 429s).

### Implementation guidance for any client you build

1. Parse `X-Rate-Limit-*` and `X-Rate-Limit-*-State` on **every** response, not
   just 429s — policies can tighten without warning.
2. Track state per policy name, since different endpoints share different
   pools (e.g. `ladder-view` vs whatever governs Public Stash / Currency
   Exchange).
3. On 429, sleep for `Retry-After` before retrying, with exponential backoff
   as a fallback if the header is missing.
4. For polling-heavy ideas (market trackers hitting Public Stash / Currency
   Exchange), build in a scheduler that respects the *state* headers
   proactively — don't just wait to get throttled.
5. Repeated violations risk **application access revocation**, not just
   temporary throttling — treat this as a hard constraint, not a suggestion.
