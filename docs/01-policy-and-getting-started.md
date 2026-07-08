# Third-Party Policy, Registration & Guidelines

Source: https://www.pathofexile.com/developer/docs/index

## Application types

**Allowed, encouraged:**
- Websites / web apps — "little to no risk for end users," can secure OAuth
  credentials server-side and cache content broadly.

**Allowed, not encouraged:**
- Independent executables — must use **public** OAuth clients (see
  [02-authorization.md](02-authorization.md)) and follow strict macro rules below.

**Strictly prohibited (→ immediate account termination):**
- Executables that interact with the game or game files directly. Violates PoE
  Terms of Use §7b, §7c, §7i.

## Automation / macro rules (for independent executables)

If an executable does keystroke automation at all:
- Must be **manually invoked by the user** — no timers, no file-change triggers,
  no screen-reading triggers.
- Each invocation = **one set function**, no action-cycling.
- Must perform **only one action** that interacts with the game (e.g. one chat
  message = one action).
- Reading the game log file is fine, as long as users know their data is being used
  that way.

Violations can terminate both the developer's and the end-user's accounts — a real
constraint if you're prototyping anything resembling a helper bot.

## Getting Started — registering an app

Before applying you should already understand:
- What OAuth is and what it enables.
- The client types and grant types (confidential vs public; auth-code vs
  client-credentials — see [02-authorization.md](02-authorization.md)).
- Which scopes you actually need and why.

**Submit to:** `oauth@grindinggear.com` (subject: "OAuth Application") with:
1. PoE account name **including the 4-digit discriminator** (e.g. `Name#1234`)
2. Application name
3. Client type: confidential or public
4. Required grant type(s)
5. Specific scopes requested **+ justification for each one**
6. Redirect URI — secure HTTPS domain (confidential) or local
   `http://127.0.0.1:PORT/callback` (public)

> ⚠️ GGG explicitly states: "Due to the large volume of recent requests, we will
> immediately reject any low-effort or LLM-generated requests." Write the
> application by hand, with a genuinely specific rationale per scope, before
> submitting.

## Available Resources

Only endpoints documented in the API Reference or Data Exports pages are
accessible. Reverse-engineering or hitting undocumented internal endpoints
violates ToU §7i and requests for extra access will be denied. Don't design an
idea around scraping internal APIs.

## Developer Guidelines (mandatory)

- Never share your app's OAuth credentials.
- Never commit application keys/credentials into source code.
- Never embed keys/credentials in a distributed binary (matters for open-source
  desktop tools / browser extensions — need a backend proxy for secrets instead).
- One product per registered application (don't reuse a single registration
  across unrelated tools).
- Every request must send an identifying **User-Agent** header:
  ```
  User-Agent: OAuth {clientId}/{version} (contact: {contact})
  ```
  Example:
  ```
  User-Agent: OAuth mypoeapp/1.0.0 (contact: mypoeapp@gmail.com)
  ```
- Publicly distributed apps must display: *"This product isn't affiliated with or
  endorsed by Grinding Gear Games in any way."*

## Practical implications for planning

- Any idea that's a **pure client-side web/mobile app hitting only account-scoped
  data** (e.g., "view my own stash/characters/filters in a nicer UI") is the
  friendliest category to get approved and build.
- Any idea needing **service-scoped data** (market tools using Currency Exchange
  or Public Stash feed, ladder trackers) needs a **confidential** client — i.e.
  a real backend holding secrets — plus a specific justification GGG will read
  before approving.
- Desktop automation / overlay tools that click or send keys into the game are
  off the table except for very constrained, manually-triggered, single-action
  macros — not a good foundation for a "helper bot" idea.
