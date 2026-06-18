# Prepped 4 Prep — MVP Build Brief
### Behavioral rulebook for Antigravity CLI (`agy`)

This file is read automatically by Antigravity CLI as the project's context. Read it in full before writing any code. Run `agy inspect` after setup to confirm it's been picked up. Companion files: `SETUP_CHECKLIST.md` (external accounts/credentials needed), `ROADMAP.md` (build order), `POPIA_PRIVACY_NOTICE.md` (draft privacy notice), `.env.customer.example` / `.env.ops.example` (required environment variables per app).

> **Build constraints — read this first:**
> 1. **Never touch the live `prepped4prep.co.za` site or its DNS.** That domain currently serves Caron's existing site. Both apps below deploy to Render-provided subdomains for now; pointing the real domain at either is a separate, deliberate decision made later, not a default.
> 2. **The customer-facing app must never contain, link to, or expose the internal ops app.** No shared navigation, no guessable links, no internal API routes reachable from the customer codebase — they are two separate deployments precisely so a customer's browser never loads a single byte of warehouse/admin code.
> 3. **All accounting integration work happens against the QuickBooks Online developer sandbox**, not a real company's books. If this ever needs to connect to a real, live accounting system in production, that's a deliberate later decision made with Caron — not a default.

---

## 1. The Business

Prepped 4 Prep is a real, operating Durban-based SME (owners: Caron and Jess) that supplies back-to-school stationery, book-covering, and custom labeling to parents, schools, and corporate offices, currently servicing ~15 schools. Tagline: "Avoid the Fuss, Trust us!"

Today the business runs almost entirely manually: parents send stationery lists via WhatsApp or email, the owner transcribes every line item by hand to build a quote, and stock is ordered reactively only after a parent pays via EFT. This MVP exists to remove that manual bottleneck and automate the repetitive parts of the workflow — quoting, inventory, accounting entries, and order tracking.

## 2. What We're Building

**Two separately hosted applications, one shared database:**

### App 1 — Customer Portal (public)
- Landing page and brand presence.
- Browse by school + grade, auto-populate a cart from a pre-built template.
- **Smart List Import (AI)** — upload a PDF, take a photo, or paste a child's stationery list; AI extracts the items, builds a draft order, and suggests cheaper substitutions and relevant add-on services. See Section 7.
- Checkout and online payment (PayFast).
- Account / order history / order tracking.

### App 2 — Internal Ops (staff-only, never publicly linked)
- Owner/Admin dashboard: schools, templates, products, suppliers, orders, BI, low-stock alerts.
- Warehouse packing queue with barcode-scan verification.
- Driver-facing delivery confirmation / proof-of-delivery.
- **QuickBooks Online sync** — completed orders are automatically pushed as real invoices, demonstrating live, automated communication with an external system. See Section 8.

Both apps read and write the **same** Postgres database via a shared Prisma package, so a parent's checkout instantly shows up in the warehouse queue with zero manual re-entry — but they are two independent codebases, two independent deployments, and two independent URLs. A bug in one app's routing can never expose the other app's pages, because the other app's pages simply don't exist in that codebase.

## 3. Repo Structure (Monorepo)

```
/apps
  /customer        → Next.js app, deploys as its own Render service
  /ops              → Next.js app, deploys as its own Render service
/packages
  /db               → Prisma schema, migrations, generated client — imported by both apps
  /shared           → brand theme tokens, shared TypeScript types, shared utils
```

Use pnpm workspaces (simple, no need for Turborepo at this scale). Each app has its own `package.json`, its own `.env`, and is deployed on Render with its own Root Directory (`apps/customer` / `apps/ops`) so the two have completely independent build/runtime artifacts. Build this structure from Phase 0 — there's no single-app stage to refactor out of later.

## 4. Users & Roles (RBAC)

| Role | Lives in | Sees | Cannot see |
|---|---|---|---|
| Parent/Customer | **Customer app** | Own orders, own child(ren), own order history/tracking | Any other customer's data, anything in the Ops app (it isn't reachable from here at all) |
| Owner/Admin (Caron) | **Ops app** | Everything — templates, orders, finances, BI, supplier POs | — |
| Finance/Admin Staff | **Ops app** | Orders, payment status, supplier POs, financial reports | Full customer PII beyond billing name, system config |
| Warehouse Staff | **Ops app** | Packing queue: child name, school, item list, pack/dispatch status | Pricing, payment data, customer addresses, financial reports |

Within the Ops app, still enforce real route/query-level authorization between Admin/Finance/Warehouse roles.

**Database-level defense in depth:** because both apps connect to the same Postgres instance, app-level access control isn't the only safety net. Use Supabase Row-Level Security (RLS) policies on `Customer`, `Student`, `SalesOrder`, and `OrderLine` so a bug in the Customer app's queries can't return another customer's row, and so the Customer app's database role has no path to staff-only tables (`Supplier` cost data, write access to `Product.qtyOnHand`, audit logs) at all.

## 5. Brand Identity

**Colors** (from the Pomelli brand book):
- Pure White `#FFFFFF`
- Papaya Orange `#F8C83E` — primary brand color
- Jet Black `#000000`
- Caramel Brown `#C4A344`
- Vermillion Red `#E03C31` — use sparingly, for alerts/errors only

**Typography**: Libre Franklin (Google Fonts) as the primary typeface throughout, both apps.

**Voice & tone**: friendly, trustworthy, professional, helpful. Aesthetic: child-friendly, playful, authentically mom-led, clean, community-centric. Customer-app copy should sound like a reassuring parent-to-parent message, not corporate SaaS copy. Ops-app copy can be plainer/more functional — it's a staff tool, not a brand touchpoint.

**Assets** (already provided — copy into `packages/shared` or each app's `/public/brand/`):
- `logo-wordmark.svg` / `.png` — the teal/purple/yellow "PREPPED4PREP" wordmark
- `preppi-mascot.png` — the pencil character mascot ("Preppi") — also the natural face of the Smart List Import feature (consider branding it "Ask Preppi" or "Preppi's List Scanner")
- `box-note-template.png` — the personalized note inserted into every child's box (used in the Ops app's packing flow)

Domain on file: `prepped4prep.co.za`, contact `admin@prepped4prep.co.za`.

## 6. Tech Stack & Architecture Decisions

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14+ (App Router), TypeScript, in both apps | Fast to build and iterate; identical conventions in both apps |
| Monorepo tooling | pnpm workspaces | One repo, two deployable apps, shared `packages/db` and `packages/shared` |
| Styling | Tailwind CSS | Speed, consistent with brand tokens defined once in `packages/shared` |
| Database | PostgreSQL via Supabase | Managed Postgres, auth, storage, and RLS — shared by both apps |
| ORM | Prisma, in `packages/db` | Type-safe schema matching the ERD below, single source of truth for both apps |
| Auth | Supabase Auth, custom `role` claim | Customer app only ever issues/accepts the `customer` role; Ops app only accepts `admin`/`finance`/`warehouse` |
| Payments | PayFast (South African gateway) | Native EFT/card support for SA customers; sandbox already in use |
| AI (Smart List Import) | Anthropic API (Claude), called server-side only from the Customer app | Vision + document understanding to parse uploaded lists; see Section 7. API key never reaches the browser |
| Customer notifications | Resend (email) | Simple, reliable transactional email for order status updates |
| Accounting sync | QuickBooks Online API, OAuth2, lives in the **Ops app only** | Free, self-serve developer sandbox with no approval wait — see Section 8. Implemented through a small, isolated sync module so the integration logic stays easy to test and swap later if ever needed |
| Hosting | Two Render Web Services (one per app) + Supabase (DB/auth/storage) | Persistent Node services, not serverless — simpler, predictable webhook handling (PayFast ITN, QuickBooks webhooks). Each app gets its own Render subdomain for now |

This deliberately departs from the original IS3 academic blueprint's WooCommerce/PHP/AWS-RDS/Sage stack — that was the right conceptual answer for a coursework assignment, but this stack is faster to build, cheaper to run, easier for one developer (using an AI coding agent) to maintain, and the two-app split plus a real working external integration give it a stronger story than the original blueprint had.

## 7. AI Smart List Import (Customer App Feature)

**The problem it solves:** today, a parent's stationery list arrives as a photo, PDF, or pasted text and has to be manually matched to products. This feature lets the parent skip browsing entirely.

**Flow:**
1. Parent uploads a PDF, takes/uploads a photo, or pastes raw text of their child's stationery list.
2. A server-side API route (never client-side — the Anthropic API key must never reach the browser) sends the content to Claude, asking for structured JSON output: a list of `{ itemName, quantity, brand? }`.
3. A second step — either the same call or a follow-up — gives Claude the relevant subset of the `Product` catalogue (e.g. filtered by the parent's selected school/grade if known, otherwise the full active catalogue) and asks it to return, in structured JSON:
   - `matchedItems`: each parsed item mapped to a `productId` with a confidence note.
   - `substitutions`: cheaper same-category alternatives for any matched item, with the price difference.
   - `upsells`: relevant add-on services based on what's in the list — e.g. if exercise books and covers are present but the "Book Covering" or "Labeling" service isn't, suggest it. (These are just `Product` rows with `category = "Service"` — no new schema needed, see Section 9.)
4. The parent sees an editable draft cart (matched items pre-filled, substitutions and upsells presented as suggestions, not auto-added) before confirming.

**Guardrails:**
- Rate-limit this endpoint per customer (it's a paid API call per use) and cap upload size.
- Don't persist the raw uploaded photo/PDF once parsed — POPIA data minimization; only the resulting structured order data needs to be kept.
- Show the parent exactly what was extracted before anything is added to their order — never silently auto-checkout from a scan.
- Treat extraction as fallible: always let the parent edit quantities/items before confirming.

## 8. QuickBooks Online Accounting Sync (Ops App Feature)

**The problem it solves:** demonstrating that this system can automatically communicate with a real external business system — no manual re-entry, no copy-pasting into accounting software.

**Setup:** free developer account at developer.intuit.com, an auto-provisioned sandbox company pre-loaded with sample data, instant OAuth2 Client ID/Secret — see `SETUP_CHECKLIST.md`.

**Flow:**
1. When a `SalesOrder`'s `paymentStatus` becomes `paid`, push it to QuickBooks as a real Invoice via the Accounting API (customer/contact created or matched first if needed).
2. Pull something back from QuickBooks — e.g. invoice payment status, or a confirmation the invoice was created with the correct totals — so this is a genuine two-way sync, not a one-way export.
3. Store the returned QuickBooks invoice ID against the `SalesOrder` so re-syncs don't create duplicates.
4. Surface sync status in the Ops dashboard (synced / failed / pending) so staff can see it working.

**Guardrails:**
- All QuickBooks calls happen server-side in the Ops app only — Client Secret never reaches any browser.
- Handle OAuth token refresh automatically (QuickBooks access tokens expire; don't let a stale token silently break syncing).
- Log sync failures clearly rather than failing silently — an order that didn't sync should be visibly flagged, not lost.

## 9. Data Model

Normalized to 3NF, lives in `packages/db`:

| Entity | Key fields | Purpose |
|---|---|---|
| `Customer` | id, firstName, lastName, email, phone, deliveryAddress, consentFlag, createdAt | Parent/guardian record. `consentFlag` is the POPIA opt-in, timestamped. |
| `Student` | id, customerId→Customer, schoolId→School, firstName, lastName, gradeLevel, academicYear | The child; drives label printing and template selection. |
| `School` | id, name, region, contactPerson, isActive | Master school registry; drives the template picker. |
| `SchoolTemplate` | id, schoolId→School, name, gradeLevel, academicYear, isActive, lastUpdated | A reusable per-grade stationery list. |
| `TemplateLine` | id, templateId→SchoolTemplate, productId→Product, quantityRequired, isOptional, displayOrder | One row per item on a school list; resolves the template↔product many-to-many. |
| `Product` | id, supplierId→Supplier, itemName, sku, brand, unitPrice, qtyOnHand, reorderThreshold, category | Master catalogue. `category = "Service"` rows (e.g. Book Covering, Labeling) power the Smart List Import upsell feature. `reorderThreshold` triggers low-stock alerts. |
| `Supplier` | id, name, contactName, phone, email, averageLeadTimeDays | Supplier directory for proactive procurement. |
| `SalesOrder` | id, customerId→Customer, studentId→Student, orderDate, totalAmount, paymentStatus, fulfillmentStatus, packedByStaffId, notes, quickbooksInvoiceId, quickbooksSyncStatus | Core transaction, created automatically on checkout. Last two fields support Section 8. |
| `OrderLine` | id, orderId→SalesOrder, productId→Product, quantityOrdered, unitPriceAtSale, lineSubTotal, isPacked | Resolves order↔product many-to-many; `isPacked` drives the warehouse view; `unitPriceAtSale` freezes price for audit integrity. |
| `Delivery` | id, orderId→SalesOrder (1:1), deliveryMethod, scheduledDate, actualDate, driverId, proofOfDeliveryUrl | Tracks physical dispatch and proof-of-delivery scan. |

Referential integrity matters: an `OrderLine` must never reference a nonexistent `Product`, and a `SalesOrder` must never exist without a valid `Customer`. Enforce with real foreign key constraints, not just application logic.

## 10. Security & Compliance (POPIA)

This system stores children's names/grades, parents' home addresses, and payment references — treat it as sensitive from day one:

- Explicit opt-in consent checkbox at checkout (writes the timestamped `consentFlag`), not a pre-checked box.
- Encrypt sensitive columns at rest (Supabase/Postgres column-level encryption or pgcrypto) for addresses and payment tokens.
- Never store card numbers — PayFast handles card data; the app only stores PayFast's transaction reference.
- Never persist raw Smart List Import uploads (Section 7) once parsed.
- All traffic over HTTPS/TLS (default on Render).
- Append-only audit log table recording who changed/exported what and when, tied to a real user ID — no shared logins, ever. Lives in the Ops app's domain since only staff actions get logged this way.
- Rate-limit and authenticate any API route that returns customer or order data in bulk, and any AI endpoint (cost control as much as security).
- Supabase RLS policies as a second layer between the two apps' database access — see Section 4.

## 11. Integrations — Current Status

- **PayFast**: sandbox account already registered. Build and test the full checkout flow against sandbox; live merchant credentials only get plugged in at go-live.
- **Resend**: free-tier account already created — the customer notification channel (order received, packed, ready/dispatched, delivered).
- **QuickBooks Online**: developer account + sandbox company to be set up per `SETUP_CHECKLIST.md` — this is the live, working accounting integration, built from the start, not a stand-in for anything else.
- **Anthropic API**: needed for Smart List Import (Section 7). Server-side only, in the Customer app. See `SETUP_CHECKLIST.md` for getting a key and setting spend limits.

## 12. Conventions

- Within each app: `/app` (routes), `/lib` (db client import, auth, integrations), `/components`, `/public/brand`. Shared Prisma client comes from `packages/db`; shared brand tokens/types from `packages/shared`.
- Define brand colors and font once as Tailwind theme tokens (`papaya`, `caramel`, `vermillion`) in `packages/shared` — never hardcode hex values in either app.
- Every feature touching `SalesOrder`, `OrderLine`, or `Customer` must respect the RBAC table in Section 4, and must respect which app it belongs in — no staff-only views "just for now" inside the Customer app.
- Commit small and often; after each roadmap phase, both apps should be independently deployable.

## 13. Start Here

Check `ROADMAP.md` for the current phase. This is a fresh build — start at Phase 0.

**Suggested first message to Antigravity CLI (`agy`) in the repo root:** *"Read AGENTS.md, SETUP_CHECKLIST.md, and ROADMAP.md. Let's start Phase 0."*
