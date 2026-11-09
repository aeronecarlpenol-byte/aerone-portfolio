# Categorized skills review — November 9, 2026

Read-only inspection of Axiom Studia at commit
`9766eba1f24bd0e94fe53bcac0c7e8da4a73d3d6`:
https://github.com/aeronecarlpenol-byte/axiomstudia/tree/9766eba1f24bd0e94fe53bcac0c7e8da4a73d3d6

## Source evidence

- `index.html`, `js/app.js`, the recursive repository tree and `package.json`:
  HTML, custom CSS, vanilla JavaScript ES modules; no React, Vue, Tailwind or
  other frontend framework is declared. PDF.js is loaded for PDF rendering.
- `js/cloudClient.js`: Supabase JavaScript SDK 2.57.4, separate anonymous visitor
  and admin clients, persistent visitor sessions and tab-scoped admin sessions.
- `js/cloudSync.js`: anonymous authentication, reading the user's workspace,
  revision-checked `save_workspace` RPC, and activity updates.
- `js/views/adminView.js`: password-based admin authentication, guarded
  `admin_overview` RPC and local-scope sign-out.
- `supabase/migrations/202610310001_cloud.sql`: Postgres JSONB workspace rows,
  Auth user references, row-level security, SQL/PLpgSQL functions, visitor records.
- `js/pdfStorage.js`, `js/db.js`, `CLOUD_SETUP.md`: PDF binaries in IndexedDB,
  localStorage recovery/outbox, workspace metadata synchronized to Postgres.
  Supabase Storage buckets/uploads are not implemented.
- `js/youtube.js`: YouTube iframe API for embedded playback, not an app backend.
- `serve.py`: loopback static-file development server, no application API or
  Python business backend. No Java source appears in the complete tree.
- GitHub hosts the inspected source and its version history. Documentation
  describes GitHub Pages as a possible host. No Vercel configuration or evidence
  of an Axiom Vercel deployment was found; the portfolio copy explicitly assigns
  Vercel to this portfolio. `@electric-sql/pglite` is a test-only dependency.

The cloud setup guide records prior hosted setup and verification; this task
inspected the implementation, not live Supabase infrastructure. No planned
framework, storage service, AI runtime API or Python/Java backend is presented
as an implemented Axiom technology. AI and engineering groups describe the
owner's requested broader tools; Java/Python remain a secondary learning group.
No Axiom Studia files were changed.

## Portfolio verification

Six semantic groups replace the large skills cards. Reserved stage dimensions
avoid image-loading shifts; two desktop columns become one on mobile. Brand
sources are recorded in `assets/brand/SOURCES.md`. Name tooltips support hover,
keyboard focus and active dragging. Original circle outlines and global dragging
remain intact. Each group launches independently from the actual scroll marker,
with stagger, rotation, an overshoot and settling; reduced motion and missing
observer/marker support reveal logos immediately without flights.

Automated checks cover independent groups, emblem origin, interrupted flights,
reduced motion, keyboard/pointer dragging and reset, hero-only assembly,
navigation, contact, project galleries, emblem rotation and trail. Syntax,
asset/link checks and the static build pass. Browser-rendered desktop/mobile
overlap and spacing were not verified in this pass; previous preview attempts
were stopped by browser URL verification. The hero, route and trail scripts
were not changed for this refinement.
