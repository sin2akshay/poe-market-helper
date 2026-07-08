# Authorization: OAuth 2.1

Source: https://www.pathofexile.com/developer/docs/authorization

PoE's API uses **OAuth 2.1 only** — no static API keys.

## Client types

| | Confidential Client | Public Client |
|---|---|---|
| Runs on | Secure backend server | User's device (browser/desktop, no secret storage) |
| Redirect URI | HTTPS, registered domain, no localhost/IP | Local only, e.g. `http://127.0.0.1:8080/callback` |
| Grant types | All (auth code, client credentials, refresh) | Authorization Code **with PKCE only** |
| `service:*` scopes | ✅ Allowed | ❌ Not allowed |
| Access token life | 28 days | 10 hours |
| Refresh token life | 90 days | 7 days |
| Rate limits | Per-client (individual) | **Shared across all public clients** |
| UX | — | User sees an "authenticity warning" during authorization |

Implication: a browser-only / static SPA / mobile app with no backend = public
client = **cannot** touch `service:*` endpoints (leagues service data, ladders,
PvP, Public Stash feed, Currency Exchange) and shares a crowded rate-limit bucket.
For anything beyond a personal account viewer, plan on a backend.

## Scopes

### Account scopes (user-specific — via Authorization Code grant)
| Scope | Grants |
|---|---|
| `account:profile` | Basic profile info |
| `account:leagues` | View available leagues, including private ones |
| `account:stashes` | Access stash tabs/items (PoE1 only) |
| `account:characters` | View characters and inventories |
| `account:league_accounts` | See allocated atlas passives (PoE1 only) |
| `account:item_filter` | Manage item filters |
| `account:guild:stashes` | Guild stashes (PoE1 only; **granted only on special request**) |

### Service scopes (app-wide data — Client Credentials grant, confidential clients only)
| Scope | Grants |
|---|---|
| `service:leagues` | League data |
| `service:leagues:ladder` | League ladders |
| `service:pvp_matches` | PvP match data (PoE1 only) |
| `service:pvp_matches:ladder` | PvP ladders (PoE1 only) |
| `service:psapi` | Public Stash API feed (PoE1 only) |
| `service:cxapi` | Currency Exchange API |

### Token-management scopes
| Scope | Grants |
|---|---|
| `oauth:revoke` | Call `/oauth/token/revoke` |
| `oauth:introspect` | Call `/oauth/token/introspect` |

## Grant types

### Authorization Code (with PKCE)
Use when acting **on behalf of a user** (their own stashes/characters/filters).
PKCE is mandatory for public clients, encouraged for confidential ones (per the
3.21.0 changelog entry — check current docs, this may now be mandatory for all).

**Flow:**
1. Generate a PKCE `code_verifier` + `code_challenge` (`S256`).
2. Redirect user to:
   ```
   GET /oauth/authorize
     ?client_id={id}
     &response_type=code
     &scope={space separated scopes}
     &state={random tracking value}
     &redirect_uri={registered redirect}
     &code_challenge={challenge}
     &code_challenge_method=S256
   ```
3. User approves → redirected to `redirect_uri?code={code}&state={state}`.
   **Verify `state` matches** before proceeding.
4. Exchange the code (valid only **30 seconds**) for tokens:
   ```
   POST /oauth/token
   Content-Type: application/x-www-form-urlencoded
   grant_type=authorization_code
   client_id=...
   (client_secret=... if confidential)
   code=...
   code_verifier=...
   redirect_uri=...
   scope=...
   ```
5. Receive `access_token` (+ `refresh_token` if requested/allowed).

### Client Credentials
For **service-level** access with no user involved. Confidential clients only.
Resulting token's identity = the app's registered owner account. Tokens from
this grant **don't expire** on a timer but remain revocable via
`/oauth/token/revoke`.

### Refresh Token
Exchange a still-valid or recently-expired refresh token for a new access token
without re-prompting the user. New refresh tokens inherit the *original*
window's expiry (they don't reset the clock indefinitely) — the previous
refresh token is immediately invalidated on use (rotation, not reuse).

## Using tokens

```
Authorization: Bearer {access_token}
```

- `401 Unauthorized` → token expired or revoked.
- `403 Forbidden` → token valid but missing required scope.

## Token lifecycle endpoints

- `POST /oauth/token/revoke` — requires `oauth:revoke` scope.
- `POST /oauth/token/introspect` — requires `oauth:introspect` scope.

Refresh tokens must be stored securely, **server-side only** — never in a
browser, mobile local storage without encryption, or a distributed binary.

## Practical implications for planning

- "View my own build/stash/filters" tools → Authorization Code + PKCE,
  `account:*` scopes. Can be a public client (no backend secrets needed) if you
  don't also need service data.
- "Market/ladder/trade tooling" → Client Credentials, `service:*` scopes,
  **must** be a confidential client with a backend that guards the client secret.
- A tool that does both (e.g., "personalized trade assistant using my stash +
  live market data") needs **both grant types wired up**, and functionally
  needs a backend regardless, since `service:*` can't live in a public client.
