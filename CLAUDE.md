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
  - Sub-pages: `pages` table + `sections.page_id` (NULL = home page); public at `/page/<slug>`. `tools/pages.js` (old-site content) is imported once into any database by `eid_import_pages` (guarded by the `pages_imported` setting).
- Gift page «أغلى هدية» at `/gift` (`client/src/site/GiftPage.jsx`, card in `GiftCard.jsx`): texts and occasions come from the home page's `gift` section (added once by `eid_add_gift`), projects are the `/donate` campaigns. The recipient opens `/gift/card?g=<base64url JSON>`; nothing is stored server-side.
- Forms («تطوع معنا» `/page/volunteer`, «كن شريكًا» `/page/partnerships`): section type `form`, its items are the fields. Visitors post to `/api/forms/<section id>`; entries go to the `form_entries` table and show in `/admin#/entries` (الطلبات الواردة), with an optional e-mail via `notify_email`.
- Hosting: HostMonster shared cPanel (no Node.js). Site lives at `https://eid.hifzalnaema.com` (document root `/home3/hifzalna/eid.hifzalnaema.com/`).

## Workflow
1. Edit on `main`. Run `npm test` (PHP API tests, SQLite) before pushing.
2. Push to `main` → GitHub Actions tests, builds, and publishes `production` branch (`public/` + `.cpanel.yml`).
3. Owner deploys in cPanel: Git Version Control → Manage → Pull or Deploy → Update from Remote → (F5) → Deploy HEAD Commit.

## Rules
- Content changes (texts, images, menu, sections) are done by the owner in `/admin` — no code needed.
- Placeholder links (empty or `#`) are hidden on the site (`live()` in `client/src/site/lang.jsx`): menu/footer/top-bar links and buttons disappear, cards stay but are not clickable. They show up once the owner sets a link. Labels that have a page or a donations search are filled by `eid_link_pages` (map in `eid_page_link_map`); a new pass needs a new guard setting (e.g. `pages_linked_2`).
- Items with an empty image show a default illustration from `client/public/placeholders/` (topic picked by keywords in `client/src/site/placeholder.jsx`) with a tiny "AI-generated illustrative image" note. The illustrations show no people (keep it that way: content must be Islamically appropriate). A real image set in /admin replaces it.
- Never remove or rename existing JSON content keys without migrating data; the live database already has content.
- Keep API responses and routes backward compatible with the deployed admin.
- Accessibility: gold text on light backgrounds uses `GT` (#7E6124); gold on dark backgrounds uses `G` (#B69D67); keep 44px touch targets and visible focus.

## Brand identity
- Source: brand guide PDF ("identty eid charity ENG.pdf"). Palette: Maroon #8A0047, Old Gold #9B782D, White; text navy #003049.
- Logos in `client/public/`: `logo.svg` (main lockup), `logo-light.svg` (white text, for dark backgrounds), `logo-mark.svg` (symbol only, favicon/admin).
- Fonts: brand fonts are Lusail (Arabic) and Neue Regrade (Latin); the site uses `var(--font)` (set in `client/index.html`) with Readex Pro as the web fallback.
