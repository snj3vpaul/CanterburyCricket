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
| Game rules as pure state transitions (whitelist, picks, scoring) | `api/_lib/fantasy/ledger.js` |
| Scoring matrix + zod schemas (shared by browser and API) | `src/fantasy/shared/` |
| Session context, route guard, API client | `src/fantasy/MemberContext.jsx`, `RequireMember.jsx`, `api.js` |
| CricHeroes scorecard → stats (dismissal parsing, name matching, result) | `src/fantasy/shared/scorecard.js` |
| Scorecard reader (Claude reads the uploaded PDF/screenshots) | `api/_lib/fantasy/extract.js` |
| UI | `src/pages/MemberLogin.jsx`, `Fantasy.jsx`, `FantasyAdmin.jsx`, `src/fantasy/components/*` |

Folders under `api/` that start with `_` aren't deployed as functions, so this adds exactly one function.

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
   whitelist member emails → import the squad → create a match → tick the Playing XI.
4. **After each game**, follow "How points get added" above.

## Local development
`vite dev` doesn't run `api/` functions. Use `npx vercel dev` instead. Without Redis env vars it stores data
in `.data/fantasy.json` (git-ignored).

## Tests
`npm run test:fantasy` — scoring rules, validation, and an end-to-end run of the API
(whitelist, login, cookie tampering, cross-site blocking, picks, atomic scoring, re-processing, scorecard reading
with a stubbed Claude response), plus the CricHeroes parser (dismissals, short names, results).
