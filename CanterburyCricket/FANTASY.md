# Member Login & Fantasy League

Members sign in at **/member-login**. Signing in unlocks **/fantasy** (the league) and, for committee
admins, **/fantasy/admin**. The navbar's "Member Only" link becomes "Fantasy League" once signed in.

Built on the site's existing stack: Vite + React SPA, Vercel serverless functions in `api/`, zod.
No new npm dependencies.

## How it works

| Piece | Where |
|---|---|
| API (one Vercel function, `?action=` router) | `api/fantasy.js` |
| Storage — one JSON doc in Upstash Redis, atomic compare-and-set writes | `api/_lib/fantasy/store.js` |
| Auth — scrypt passwords, signed HttpOnly cookie, rate limiting | `api/_lib/fantasy/auth.js` |
| Approval emails (reuses the Contact form's SMTP settings) | `api/_lib/fantasy/notify.js` |
| Game rules as pure state transitions (approvals, picks, scoring) | `api/_lib/fantasy/ledger.js` |
| Scoring matrix + zod schemas (shared by browser and API) | `src/fantasy/shared/` |
| Session context, route guard, API client | `src/fantasy/MemberContext.jsx`, `RequireMember.jsx`, `api.js` |
| CricHeroes scorecard → stats (dismissal parsing, name matching, result) | `src/fantasy/shared/scorecard.js` |
| Scorecard reader (Claude reads the uploaded PDF/screenshots) | `api/_lib/fantasy/extract.js` |
| UI | `src/pages/MemberLogin.jsx`, `Fantasy.jsx`, `FantasyAdmin.jsx`, `src/fantasy/components/*` |

Folders under `api/` that start with `_` aren't deployed as functions, so this adds exactly one function.

## Who can join (squad claim, email confirmation, admin approval)

Players are shown in a simple **Canterbury jersey** (navy with gold trim and their squad-sheet jersey number, or
their initial if there's no number). Your Fantasy XI appears as a small team sheet of jerseys; the captain wears
gold. The squad syncs from the club squad sheet automatically (when the league is empty, then at most every
12 hours), and Admin → Squad → **Sync now** forces it.

Registering at /member-login:

1. **Which squad player are you?** Pick yourself from the squad list (players who already have an approved account
   aren't listed).
2. **Full name must match the squad sheet**: same first and last name; middle names/initials are optional,
   case, accents, apostrophes and quoted nicknames (`Ehsan "Easy" Khan`) are ignored. The form checks as you type;
   the server enforces it.
3. **Pick a username** (3–20 letters/numbers/`.`/`-`/`_`). It's what shows on the leaderboard.
   It must be unique, can't be reserved (admin, moderator, canterbury, official, …) and can't spell another squad
   player's name.
4. **Confirm your email** from the link we send (48 hours; unconfirmed registrations are deleted after that).
   Nothing reaches the admins until this happens, so nobody can register someone else's address.
5. **Admin approval**: both admins get an email showing the claimed squad player, whether the name matches, the
   username, and a warning if that player already belongs to someone. **Approve** / **Reject** buttons open a
   one-tap confirm page (link scanners can't trigger them; signed, 7 days, first decision wins).

Anti-impersonation rules: one approved account per squad player; approving a second claim on the same player is
refused until one is rejected; the claim can't be changed afterwards except by an admin rejecting the account.

- `ADMIN_EMAILS`: the first one (the club Gmail) is the **moderator** account: no squad player, no username, shown
  as **ADMIN**, can't make picks. It registers via "Registering the club's admin account?" and is signed in as
  soon as it confirms its email. The backup admin claims their squad player like everyone else, is an admin as
  soon as they confirm, and plays.
- "Pre-approve emails" skips step 5 (but never overrides a squad player someone else already holds).
- Accounts created before squad claims are asked "who are you?" (squad player + username) on /fantasy before
  they can make picks.
- Signing in before confirming sends a fresh link (max 3 an hour). Pending or rejected people can't sign in.
- Admin → Members: approve a rejected person, or remove an approved one (which signs them out).

## Sign in with Google, Microsoft or Yahoo

The login page offers **Continue with Google**, **Continue with Microsoft** (Hotmail, Outlook, Live) and
**Continue with Yahoo** (Yahoo, ymail). Email and password stays available for every other address.

- **New player:** the provider proves the email, so there's no confirm-your-email step. They pick their squad
  player (full name must match the sheet) and a username, and the admins get the approval email as usual.
- **Existing member:** the provider sign-in is linked to the account with the same email automatically. If they
  never clicked their confirm link, signing in with the provider confirms it.
- **Club account:** signing in with Google as cricketcanterbury@gmail.com goes straight in as ADMIN.
- Accounts made with a provider have no password; they always sign in with that provider.

Security: authorization-code flow with `state` + `nonce` (+ PKCE for Google and Microsoft) in a signed 10-minute
HttpOnly cookie; the code is exchanged server-to-server with the client secret; the ID token's issuer, audience,
expiry and nonce are checked. Only provider-verified emails are accepted: Google/Yahoo `email_verified`, and
Microsoft **personal accounts only** (work/school tenants can assert unverified emails, the "nOAuth" problem).
Accounts are matched by provider + subject first, then by that verified email.

### Turning a provider on (once each, ~10 minutes)

A button appears only when both its env vars are set in Vercel (Production). Callback URLs must match exactly:

| Provider | Create the app at | Callback (redirect) URL | Env vars |
|---|---|---|---|
| Google | console.cloud.google.com → APIs & Services → OAuth consent screen (External, app name "Canterbury CC", scopes: openid, email, profile → Publish), then Credentials → Create OAuth client ID → Web application | `https://canterburycricketclub.com/auth/google/callback` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Microsoft | entra.microsoft.com → App registrations → New registration → **Personal Microsoft accounts only** → Web redirect URI; then Certificates & secrets → New client secret | `https://canterburycricketclub.com/auth/microsoft/callback` | `MICROSOFT_CLIENT_ID` (Application ID), `MICROSOFT_CLIENT_SECRET` (secret **value**) |
| Yahoo | developer.yahoo.com/apps/create → Web application → OpenID Connect permissions: **Email** and **Profile** | `https://canterburycricketclub.com/auth/yahoo/callback` | `YAHOO_CLIENT_ID`, `YAHOO_CLIENT_SECRET` |

Paste the values into Vercel → Settings → Environment Variables (Production, mark the secrets Sensitive) and
redeploy. Preview deployments can't use these buttons (providers need each URL registered exactly), so leave the
vars off Preview. Microsoft client secrets expire (max 24 months): set a calendar reminder to renew.

## Security (OWASP Top 10 review, Nov 19, 2026)

| OWASP 2021 | What protects the login, registration and email flows |
|---|---|
| A01 Broken access control | Every admin action re-checks the role on the server; pending/rejected accounts get no session; email Approve/Reject links are signed per person and decision, expire in 7 days, and only act while the person is still waiting |
| A01 CSRF | SameSite=Lax cookie + writes must be JSON + browser `Sec-Fetch-Site`/`Origin` must be this site |
| A02 Cryptographic failures | scrypt N=2^17, r=8, p=1 (OWASP), unique salt; older hashes upgrade at next sign-in; HMAC-SHA256 signed sessions; HTTPS + HSTS |
| A03 Injection | All input validated with zod; names limited to letters/space/'.-; React escapes output; email HTML escaped; no SQL |
| A04 Insecure design | Registering an existing email looks identical to a new one (no member enumeration); same timing; generic "Incorrect email or password"; email ownership proven before an admin sees a registration; one account per squad player |
| A05 Security misconfiguration | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` (no clickjacking), COOP, Permissions-Policy, nosniff; generic error messages |
| A06 Vulnerable components | `npm audit`: 0 known vulnerabilities; no new dependencies |
| A07 Authentication failures | Rate limits (8 tries per email / 30 per IP per 10 min); common, name-based and email-based passwords refused; `__Host-` Secure HttpOnly cookie; admin sessions 7 days, members 30; sign-out revokes the session on the server |
| A08 Integrity failures | Atomic compare-and-set writes; signed tokens; lockfile-pinned dependencies |
| A09 Logging & monitoring | `fantasy-audit` events in Vercel logs (sign-ins, failures, throttles, approvals, blocked requests; emails masked, no secrets). Note: the Hobby plan keeps logs 1 hour. Approvals are also stored on each member (`approvedBy`/`rejectedBy`) |
| A10 SSRF / host-header | Email links come from Vercel's site URL, never the request's Host header; no user-supplied URLs are fetched |

Not built yet: password reset ("forgot password"). An admin can't reset a password today.

## Rules
Pick 5 from the official Playing XI (≥2 batters/keepers, ≥2 bowlers/all-rounders) and one captain (×2).
50+ runs +10 · 100+ runs +25 (replaces the 50) · wicket +15 each · 3+ wickets +10 · catch/stumping +5 each ·
Canterbury win +5 · Man of the Match +10. Picks lock at the match start time. Other members' picks are only
revealed after the match is scored.

## How points get added after each weekend

1. In the **CricHeroes app**: open the match → Scorecard → Share → **PDF** (or screenshot both innings).
2. On your phone: **/fantasy/admin → Enter result → "Read the CricHeroes scorecard"** → upload the PDF/screenshots
   (or paste the scorecard text) → **Read scorecard**.
3. The form fills itself:
   - **Runs** from Canterbury's batting card
   - **Wickets** from Canterbury's bowlers in the opposition innings
   - **Catches & stumpings** worked out from how each opposition batter got out (`c X b Y`, `c & b Y`, `st X b Y`, `c sub (X)`); run-outs earn nothing under the scoring rules
   - **Result** (win / loss / tie / no result) and **Man of the Match** (only if he's in the Canterbury XI)
4. Any CricHeroes name that doesn't clearly match a Playing XI player (spelling differences, nicknames, two players
   sharing a surname) is listed with a dropdown: assign it, or leave it as "Not ours". Warnings appear for anything
   unclear (unreadable parts, MOTM from the other team, missing result).
5. Check the numbers, then **Save & score**. Every member's prediction is scored in one atomic write. Re-running
   after a correction is safe.

Claude only *transcribes* the scorecard. Working out catches, who won and who gets what is plain code
(`scorecard.js`, unit-tested), and nothing is saved until an admin confirms.

**Why upload instead of pasting a CricHeroes link?** cricheroes.com is behind a Cloudflare "verify you are human"
check, so a server can't fetch scorecard pages reliably. The app's PDF/screenshot share works every time.

## Setup (once)

1. **Connect Upstash Redis.** In Vercel → this project → Storage / Marketplace → Upstash Redis (free tier is plenty).
   It injects `KV_REST_API_URL` + `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` + `_TOKEN`).
2. **Add env vars** (Vercel → Settings → Environment Variables):
   - `FANTASY_SESSION_SECRET` — a long random string (`openssl rand -base64 48`)
   - `ADMIN_EMAILS` — comma-separated committee emails; they become admins when they register
   - `ANTHROPIC_API_KEY` — from console.anthropic.com; used only when an admin taps "Read scorecard"
     (one short request per match — a few cents). Optional `FANTASY_EXTRACT_MODEL` (default `claude-sonnet-5-5`).
   - `SQUAD_API_URL` / `SQUAD_API_KEY` — already set for the Our Squad page; reused for "Import from club squad sheet"
3. **Deploy.** Then register with an admin email at /member-login and open **/fantasy/admin**:
   approve waiting players → import the squad → create a match → tick the Playing XI.
4. **After each game**, follow "How points get added" above.

## Local development
`vite dev` doesn't run `api/` functions. Use `npx vercel dev` instead. Without Redis env vars it stores data
in `.data/fantasy.json` (git-ignored).

## Tests
`npm run test:fantasy` — scoring rules, validation, and an end-to-end run of the API
(whitelist, login, cookie tampering, cross-site blocking, picks, atomic scoring, re-processing, scorecard reading
with a stubbed Claude response), plus the CricHeroes parser (dismissals, short names, results).
