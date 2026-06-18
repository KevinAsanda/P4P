# Setup Checklist — Accounts & Credentials

Work through this roughly in order — it lines up with the phases in `ROADMAP.md`. Nothing here requires deep technical skill, but a couple of items need Caron specifically.

## 1. Hosting & Database

- [ ] Create a Render account — two Web Services will be needed (one per app), each with its own Root Directory (`apps/customer` / `apps/ops`) in the Render dashboard once the monorepo exists.
- [ ] Create a Supabase account and project — same database, used by both services.
- [ ] Note: `prepped4prep.co.za` already serves Caron's live site — both apps deploy to free Render subdomains for now. DNS cutover is a separate, later decision.

## 2. PayFast (Payments)

- [x] Sandbox merchant account already registered — Merchant ID + Merchant Key available for development.
- [ ] Set a PayFast "passphrase" in the sandbox dashboard (used to verify webhook authenticity) if not already done.
- [ ] Live merchant account under Prepped 4 Prep's real business/banking details — only needed at go-live, not before.

## 3. Resend (Email Notifications)

- [x] Resend account already created (free tier) — sufficient for MVP order-confirmation volume.
- [ ] Verify the sending domain (`prepped4prep.co.za`) inside Resend so emails don't land in spam — this can be done without affecting the live site, it's just a DNS TXT/CNAME record add.

## 4. QuickBooks Online (Accounting Sync)

- [ ] Sign up for a free account at developer.intuit.com.
- [ ] Create an app (select "QuickBooks Online and Payments") — Intuit auto-provisions a sandbox company pre-loaded with sample data, no manual setup needed.
- [ ] Grab the Client ID and Client Secret from the app's **Development** Keys & Credentials page (not Production — that's for later).
- [ ] Set a Redirect URI matching your OAuth callback route (e.g. `https://prepped4prep-ops.onrender.com/api/quickbooks/callback` once deployed; `http://localhost:3000/api/quickbooks/callback` for local dev).
- [ ] The Realm ID (sandbox company ID) appears after the first OAuth connection — not needed until that point.

## 5. Anthropic API (Smart List Import)

- [ ] Create an account at console.anthropic.com if not already done, and generate an API key.
- [ ] Set up billing — this is pay-per-use. Before going live, **set a spend limit or usage alert** in the console so an unexpected spike in uploads (or abuse) doesn't run up an unbounded bill.
- [ ] The key goes in `apps/customer`'s environment only — server-side secret, never exposed to the browser, and the Ops app doesn't need it.

## 6. Legal / Compliance

- [x] Draft POPIA privacy notice provided — see `POPIA_PRIVACY_NOTICE.md`. It's a starting point, not legal advice; review (ideally by someone qualified, given children's data is involved) before publishing, and fill in the placeholders (Information Officer details, retention periods).
- [ ] POPIA requires every organisation to designate an **Information Officer** registered with the Information Regulator (inforegulator.org.za) — flagged as a to-do inside the notice itself.

## 7. Brand Assets

- [x] All brand assets on hand (logo, mascot, box-note template, brand book) — ready to drop into the shared package or each app's `/public/brand/`.

## 8. Antigravity CLI Itself

- [ ] Install Antigravity CLI (the `agy` command) from antigravity.google for your OS (macOS/Linux/Windows).
- [ ] Authenticate with a Google account.
- [ ] From the repo root, run `agy` — it should auto-detect `AGENTS.md`. Run `agy inspect` afterward to confirm what context it loaded (this is the fastest way to verify it's reading the right files before you start prompting).

---

**Nothing here blocks starting Phase 0.** Account setup for QuickBooks and Anthropic can happen in parallel with the first foundational work, which doesn't need either yet.
