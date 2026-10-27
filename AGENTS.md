# Rules for AI agents working in this site

The single source of rules for EVERY coding agent (Claude Code, Codex, Gemini, Cursor…).
`CLAUDE.md` and `GEMINI.md` only import this file: edit here, never there.

This repo is ONE **static** website: Astro 7, every page prerendered to plain files
(`output: 'static'`, no adapter). No server code, no backend, no database, no secrets, no client
JavaScript but Astro's prefetch module. It stands alone: its pages, words and posts all live in this repo. It already has a
home, about, contact, a Markdown blog (list, posts, tag pages, RSS), a sitemap, robots.txt and
a 404 page. Extend it; don't rebuild it.

Placeholders written as double braces around an UPPER_CASE name are filled in by the platform.
The filled-in copy, which wins over this file when they differ, is what the editor
gives you (`/etc/claude-code/CLAUDE.md`, `{{DOCS_DIR}}/`); outside the editor,
`npm run platform -- docs` saves it to `.platform/docs/` (start with `core.md`).

## Topic docs: read the one that fits BEFORE that work
`docs/agent/<topic>.md` (live: `{{DOCS_URL}}/<topic>.md` on this site's address):

| Doc | Read it before |
| --- | --- |
| `performance.md` | any page, image, font, script, dependency or style change |
| `accessibility.md` | any markup, colour, link, button, form or motion change |
| `seo.md` | a new page, a title or description, URLs, social cards, a blog post |
| `security.md` | any script, embed, external link, header, CSP or dependency; before "done" |
| `publishing.md` | git, scripts, dependencies, config, the Preview, going live |

## What is where
| Path | What | Code |
| --- | --- | --- |
| `/` | home, in sections | `src/pages/index.astro` |
| `/about/`, `/contact/` | content pages | `src/pages/about.astro`, `contact.astro` |
| `/blog/`, `/blog/<slug>/` | blog list and posts, from Markdown | `src/content/blog/*.md`, `src/pages/blog/`, `src/content.config.ts` |
| `/blog/tags/<tag>/` | one page per tag in use | `src/pages/blog/tags/[tag].astro` |
| `/rss.xml` | the blog's RSS feed (20 newest) | `src/pages/rss.xml.ts` |
| `/sitemap.xml`, `/robots.txt` | for search engines; every page is listed automatically | `src/pages/sitemap.xml.ts`, `robots.txt.ts` |
| `404.html` | every missing path | `src/pages/404.astro` |
| — | all words, nav, contact email, `SITE.url` | `src/content/site.ts` |
| — | `<head>` (title, description, canonical, Open Graph, Twitter), header, footer | `src/layouts/Base.astro` |
| — | the site's public address at build time | `src/lib/site-url.ts` |
| — | blog helpers (posts, tags, dates) | `src/lib/posts.ts` |
| — | optimised images (covers): AVIF/WebP, widths, lazy | `src/components/Cover.astro`, files in `src/assets/` |
| — | styles (tokens, light + dark), inlined into every page | `src/styles/global.css` |
| — | headers for every file | `public/_headers` |

Never create anything under `{{API_PREFIX}}` (the platform serves it on this host) or `/site-api`.

## Static rules (NON-NEGOTIABLE)
- Every page is built ONCE and served as a file to everyone. No `export const prerender =
  false`, no adapter, no middleware that runs per request, no `Astro.cookies`,
  `Astro.session`, `Astro.request.headers` beyond build time. A `src/pages/**/*.ts` endpoint
  is allowed ONLY as a build-time file (`GET` returning a fixed body, like `rss.xml.ts`):
  never one that reads the request, takes a POST or expects to run per visit.
- No secrets anywhere: everything in this repo and in `dist/` is public. Never put a key,
  token or password in code, a committed `.env`, `PUBLIC_*` vars or HTML. You cannot add secrets.
- Content lives in the repo and is built into pages: words in `src/content/site.ts`, posts in
  `src/content/blog/`. There is no CMS or blog API: never fetch posts or pages at runtime.
- No sign-in links, account pages or member areas: a static site has no visitors' accounts.
- A missing page is `404.html`; keep `src/pages/404.astro`.

## The blog: to add a post, add a Markdown file
1. Create `src/content/blog/<slug>.md` (lowercase, dashes): the file name is the URL
   (`/blog/<slug>/`). Never rename a published post's file (its URL would break).
2. Front matter (checked at build by `src/content.config.ts`; a mistake fails the build):
   ```md
   ---
   title: A clear title            # required, ≤ 120
   description: One or two sentences.  # required, ≤ 200 (list, meta description)
   publishedAt: 2026-10-19         # required
   author: Jane Doe                # optional
   cover: ../../assets/blog/my-post.jpg  # optional, PREFERRED: a file in src/assets/ (optimised
                                   #   at build); or /images/x.webp in public/, or an https URL
   coverAlt: What the image shows  # optional, "" for decorative
   tags: [guide]                   # optional: each gets /blog/tags/<tag>/
   draft: true                     # optional: only in `npm run dev`, never published
   ---
   ```
3. Write Markdown below it. Headings start at `##` (the title is the page's `<h1>`). Images in
   the post: `![Alt text](../../assets/blog/photo.jpg)` (optimised at build) or `/images/…` in
   `public/` (resized before committing), always with alt text. An `<iframe>` only from the
   hosts in `frame-src`.
4. The list, the post page, its tag pages, the RSS feed, the sitemap and the home page's
   "latest" update at the next Publish.
Markdown is trusted repo content and rendered as HTML: never paste HTML from an untrusted source
(a visitor, an email, a third-party widget) into a post.

## What a static site cannot do (then propose the app template)
Sign-in or accounts, member-only pages, storing anything (form submissions, bookings, orders,
comments, likes), sending email, payments, search over private data, per-visitor pages, an admin
dashboard, webhooks, anything that needs a secret. When the owner asks for one of these, say
plainly that this site is static and that switching to the **Astro app** template (the database
toggle, "make it an app", in the dashboard) adds a backend, a Site Database and accounts; do not
fake it in the browser (no localStorage "accounts", no third-party form scripts, no keys in JS).
A contact form today = a `mailto:` link or `CONTACT.formUrl` (a form the owner hosts elsewhere).

## The short version of each topic
- **Navigation** (`performance.md`): every page is a prerendered file reached by a plain
  `<a href>`; `<ClientRouter />` (in `Base.astro`, keep it) swaps the next page in without a
  reload and prefetch (on hover, header nav on view) fetches it first. Any script you add runs
  on `astro:page-load` (`performance.md` "JavaScript"). Never a SPA router or `fetch()` +
  `innerHTML` pages.
- **Performance** (`performance.md`): no JavaScript but Astro's prefetch and client router, images through
  `astro:assets` (`Cover`, `<Picture>`/`<Image>` from `src/assets/`) with `sizes` and lazy loading, system
  fonts, one small inlined stylesheet. Mobile Lighthouse ≥ 95 in all four categories.
- **Accessibility** (`accessibility.md`): one `<h1>`, headings in order, landmarks, the skip
  link, keyboard and focus, contrast ≥ 4.5:1 in light AND dark, `prefers-reduced-motion`.
- **SEO** (`seo.md`): a unique `title` + `description` per page through `<Base>`; canonical,
  Open Graph and sitemap URLs come from `src/lib/site-url.ts` (`SITE.url`, else the address
  the platform sets at Publish); real text in the HTML; `noindex` on the 404; JSON-LD through
  `src/lib/json-ld.ts` (`<Base jsonLd>`).
- **Security** (`security.md`): no secrets (there are none to have), the CSP in
  `astro.config.mjs` stays strict (no `'unsafe-inline'`, no inline handlers, no third-party
  scripts), `public/_headers` stays, no `innerHTML`/`set:html` with outside data. There is no
  input to validate and no session to protect: anything that needs input validation, CSRF
  protection or rate limits (forms that store, sign-in) is the app template's job.

## Machine limits (the editor)
You share the editor sandbox with the Preview dev server the owner is watching. Check `nproc`
and `free -m` before heavy work; ONE dev server ever (the editor's; never start `astro dev` or
`npm run preview` yourself); kill what you start; one heavy command at a time; bounded commands
(no `find /`, no grep over `node_modules`).

## Recipes
- **A new page**: `src/pages/<name>.astro` (lowercase, dashes) with `<Base title description>`,
  words in `src/content/site.ts`, add it to `NAV` if it belongs in the menu. It is static,
  prefetched and listed in `/sitemap.xml` automatically; link to it with a plain `<a href>`. A page that must stay out of search: `<Base noindex>`
  AND its path in `EXCLUDE` in `src/pages/sitemap.xml.ts`.
- **A blog post**: a Markdown file (see "The blog" above).
- **A list of things that changes now and then** (team, services, FAQ, menu items): another
  content collection, rendered at build time like the blog. Not a fetch:
  ```ts
  // src/content.config.ts: add beside `blog`, and to `collections`
  const team = defineCollection({
    loader: file('src/content/team.json'),          // [{"id": "maya", "name": "Maya", …}]
    schema: ({image}) => z.object({name: z.string().max(80), role: z.string().max(80), photo: image().optional()}),
  });
  export const collections = {blog, team};
  ```
  (`import {file, glob} from 'astro/loaders'`.) Create the data file (`src/content/team.json`)
  FIRST, then the collection: one added while the Preview runs, before its file exists, stays
  empty there until the dev server restarts. Then `await getCollection('team')` in a page's
  frontmatter. A wrong field fails the build with the file name: fix the data, never loosen the
  schema to `z.any()`. An `image()` field takes a path relative to the data file
  (`"photo": "../assets/maya.jpg"` for `src/content/team.json`).
- **An image on a page**: put it in `src/assets/`, `import photo from '../assets/photo.jpg'`,
  render `<Picture src={photo} formats={['avif', 'webp']} widths={[…]} sizes="…" alt="…" />`
  from `astro:assets` (or `Cover`). Eager + `fetchpriority="high"` for the one hero image only.
- **Contact**: set `CONTACT.email`; for a hosted form set `CONTACT.formUrl` (https only).
- **Restyle**: change tokens in `:root` (and the dark block) first; `DESIGN.md` at the root, when
  present, is the design system: read it before UI work.

## Never
- An adapter, `prerender = false`, middleware, or an endpoint that runs per request.
- A secret, key or token anywhere (code, Markdown, `.env`, `PUBLIC_*`, HTML).
- Client-side "features" that fake a backend: localStorage accounts, third-party form or chat
  scripts, keys in JavaScript. Propose the app template instead.
- `'unsafe-inline'`, inline handlers, `style=""`, third-party `<script src>`, `set:html` with
  outside content.
- Removing `<ClientRouter />`, another client-side router, or your own JavaScript that swaps
  pages (the ClientRouter already does it, with focus, titles and history right).
- A runtime fetch for content, a UI kit or framework for one widget, a web font from another
  origin, an image without `width`/`height`, a multi-MB photo.
- Renaming a published post's file, deleting `404.astro`, `sitemap.xml.ts` or `robots.txt.ts`,
  `Disallow: /` or `noindex` on real pages unless the owner asks for exactly that.
- Anything under `{{API_PREFIX}}` or `/site-api`; a second lockfile or package manager.

## How changes go live (details: `publishing.md`)
You edit a working copy; the OWNER publishes from the editor (Prepare → Build:
`npm ci`, `npm run build` → Deploy of `dist/` as plain files). You cannot deploy. Keep
`npm run dev` working at `/`; before saying "done", `npm run build` passes and the Preview shows
every changed page. No wrangler config, no `base`, no `.github/workflows`, npm with one
committed lockfile.
