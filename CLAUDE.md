# Eid Charity website — notes for Claude

Dynamic charity website with an admin dashboard. Owner communicates in Egyptian Arabic; reply in Arabic, keep steps simple (non-technical user).

## Stack
- `client/` — React 19 + Vite. Public site (`src/site/`) and admin dashboard at `/admin` (`src/admin/`).
  - `src/shared/sectionTypes.js` — section types and their admin form fields (single source of truth).
  - `src/site/sections.jsx` — one React component per section type (`SECTION_COMPONENTS`).
- `php/` — backend, plain PHP 7.4+ with PDO/MySQL, no dependencies. `php/api/index.php` holds all routes.
  - Tables are created automatically (`eid_ensure_schema` in `php/api/db.php`); first-run installer at `/admin` writes `api/config.php`.
  - Content is JSON in `sections.content` / `section_items.content` — new fields usually need no schema change.
  - `tools/seed.js` → `php/api/seed.json` (only used for an empty database).
- Hosting: HostMonster shared cPanel (no Node.js). Site lives at `https://eid.hifzalnaema.com` (document root `/home3/hifzalna/eid.hifzalnaema.com/`).

## Workflow
1. Edit on `main`. Run `npm test` (PHP API tests, SQLite) before pushing.
2. Push to `main` → GitHub Actions tests, builds, and publishes `production` branch (`public/` + `.cpanel.yml`).
3. Owner deploys in cPanel: Git Version Control → Manage → Pull or Deploy → Update from Remote → (F5) → Deploy HEAD Commit.

## Rules
- Content changes (texts, images, menu, sections) are done by the owner in `/admin` — no code needed.
- Never remove or rename existing JSON content keys without migrating data; the live database already has content.
- Keep API responses and routes backward compatible with the deployed admin.
- Accessibility: gold text on light backgrounds uses `GT` (#8A6A20); keep 44px touch targets and visible focus.
