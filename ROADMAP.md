# Build Roadmap

Each phase should leave both apps in a demoable state. Tell Antigravity CLI which phase you're starting (e.g. "Let's build Phase 3") so it scopes the session correctly instead of trying to do everything at once.

## Phase 0 — Foundations
Set up the pnpm workspace monorepo from `AGENTS.md` Section 3: `apps/customer`, `apps/ops`, `packages/db`, `packages/shared`. Connect Prisma (in `packages/db`) to a Supabase Postgres database. Define the Tailwind theme using the brand colors and Libre Franklin font in `packages/shared`. Drop the logo/mascot/box-note assets into the shared package. Deploy "hello world" versions of both apps to two separate Render Web Services under their free subdomains. The real `prepped4prep.co.za` domain stays untouched. Goal: two empty but real, deployed, on-brand shells, correctly wired to the same database.

## Phase 1 — Data Model & Seed Data
Implement the full Prisma schema from `AGENTS.md` Section 9 in `packages/db`. Seed the database with a handful of real-feeling sample schools, grades, templates, products (including a few `category = "Service"` rows like Book Covering and Labeling), and suppliers. Build a tiny internal seed script rather than hardcoding sample data into either app's UI.

## Phase 2 — Customer Storefront (Browse & Cart)
In `apps/customer`: pick a school, pick a grade, see the template auto-populate a cart, adjust quantities, see optional vs required items. Account creation/login (Supabase Auth, `customer` role only) tied to the `Customer` and `Student` tables. No payment yet — checkout ends in an "order placed" page with `paymentStatus = pending`.

## Phase 3 — Real Payments (PayFast)
Sandbox merchant account is already set up. Wire it into `apps/customer`: redirect to PayFast at checkout, handle the ITN (webhook) callback to confirm payment, update `SalesOrder.paymentStatus`, and trigger inventory deduction on `Product.qtyOnHand`. Test the full loop end to end in sandbox — live keys only get swapped in at go-live.

## Phase 4 — Admin Dashboard
In `apps/ops`: Caron's view — manage schools/templates/products/suppliers (CRUD), see all orders with filters, see a low-stock alert list driven by `reorderThreshold`, and a basic BI view (orders per day, revenue, top schools). This is where the RBAC table in `AGENTS.md` Section 4 gets tested for the first time against a real second role.

## Phase 5 — Warehouse Packing View
In `apps/ops`: a queue of orders ("To Pack" → "Packing" → "Packed & Verified" → "Dispatched"), tablet-friendly. Each order line shows the item to scan; a focused input field listens for the rapid-keystrokes-then-Enter pattern from a handheld barcode scanner (no special SDK needed) and checks the scanned SKU against the expected `OrderLine`, flashing an alert on mismatch and flipping `isPacked` once everything matches.

## Phase 6 — Customer Notifications
Resend email from `apps/customer` at each status change (order received, packed, ready for collection/out for delivery, delivered).

## Phase 7 — Delivery & Proof of Delivery
In `apps/ops`: driver-facing mobile view to scan the order barcode on delivery, capture timestamp (and GPS if the driver's device allows it), write to `Delivery.proofOfDeliveryUrl`, and fire the "delivered" email notification.

## Phase 8 — QuickBooks Online Accounting Sync
In `apps/ops`, the feature described in `AGENTS.md` Section 8: OAuth2 connect flow against the QuickBooks sandbox (see `SETUP_CHECKLIST.md`), push completed orders as real invoices, pull payment status back, store the QuickBooks invoice ID against the order, and surface sync status in the dashboard. This is the integration to actually demo — real, working, automated.

## Phase 9 — AI Smart List Import
In `apps/customer`, the feature described in `AGENTS.md` Section 7: upload UI (PDF/photo/paste text), a server-side route calling the Anthropic API to extract and match items against the `Product` catalogue, substitution and service-upsell suggestions, and a review screen before anything is added to the cart. Rate-limit the endpoint and don't persist raw uploads.

## Phase 10 — Security & POPIA Hardening
Verify RBAC actually blocks cross-role access at the API level in `apps/ops` (not just hidden buttons), confirm Supabase RLS policies actually work (test with a non-admin DB role, don't just assume), add the audit log table, encrypt sensitive columns at rest, double-check the consent flow, and load-test the checkout path ahead of the October–January peak.

## Phase 11 — Go Live
Gated on explicit sign-off from Caron, not just code readiness:
- Swap sandbox PayFast keys for live ones.
- Swap QuickBooks sandbox credentials for a real connected company, if and when that's actually decided — not a default.
- Decide and execute the domain cutover strategy with Caron for both subdomains — don't default, ask.
- Set a spend limit/alert on the Anthropic API account before real customer traffic hits Smart List Import.
- Train Caron and warehouse staff on the actual Ops interface, finalize the POPIA privacy notice, and soft-launch with one school before the full roster.

---

**Suggested first message to Antigravity CLI in the repo root:** *"Read AGENTS.md, SETUP_CHECKLIST.md, and ROADMAP.md. Let's start Phase 0."*
