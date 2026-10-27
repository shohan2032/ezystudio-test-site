# Changelog

Template releases. `npm run platform -- check` says when a newer one is out;
`npm run platform -- upgrade` applies it (see `scripts/platform.mjs`).
Managed by the template: replaced on upgrade.

## 0.6.0

- **Client navigation.** `<ClientRouter />` (Astro) in `Base.astro`: a click swaps the next page
  in without a reload (prefetched first), focus moves and the new title is announced; every page
  is still a prerendered HTML file. A script of your own runs on `astro:page-load`
  (`docs/agent/performance.md` "JavaScript").


## 0.5.0

- **Neutral platform names.** Nothing in the site's code, variables or paths names the company
  that hosts it: the address variable is `SITE_URL` (was `EZYSTUDIO_SITE_URL`) and
  `npm run platform` reads `SITE_DIR`. Rename them in your own `.env`.

## 0.4.0

- **Instant navigation**: pages prefetch on hover (header links when they come into view) and
  change with a cross-document view transition (off with `prefers-reduced-motion`). Still zero
  JavaScript of the site's own: Astro's small prefetch module is the one allowed exception.
- JSON-LD: `WebSite` and `Organization` on every page, `BlogPosting` on posts.
- The platform variable is `SITE_URL` (was `EZY_SITE_URL`). Rename it in your own
  `.env`.

## 0.3.1

- Agent docs: the collection recipe in `AGENTS.md` says to create the data file before the
  collection (a `file()` collection added while the Preview runs, before its file exists, stays
  empty there until the dev server restarts) and that an `image()` path is relative to the data
  file. No code changes.

## 0.3.0

- SEO: `<Base>` writes a canonical URL, `og:site_name`, `og:url`, absolute `og:image` (+ alt),
  Twitter title/description/image and, on posts, `og:type=article` with published/modified
  times. The address comes from `src/lib/site-url.ts`: `SITE.url`, else `SITE_URL` (set by
  the platform during a Publish build, declared in `astro.config.mjs` `env.schema`).
- New build-time files: `/sitemap.xml` (every page found automatically, posts with `lastmod`,
  tag pages), `/robots.txt` (allow all + sitemap), `/rss.xml` (20 newest posts). `<head>` links
  the feed and the sitemap; the footer links the feed.
- Blog tags: `/blog/tags/<tag>/` pages, linked chips on posts and a topic list on `/blog/`.
- Images: covers may be files in `src/assets/` (now preferred), rendered by the new
  `src/components/Cover.astro` through `astro:assets` `<Picture>` (AVIF + WebP + JPEG, several
  widths, `sizes`, lazy except the LCP image); the welcome post ships an example cover.
  `/path` and https covers still work.
- Performance: the stylesheet is inlined (`build.inlineStylesheets: 'always'`), no
  render-blocking request; unused rules (spinner, notices, busy buttons) removed.
- Accessibility: post-card headings follow the page outline (`PostCard as="h2"` under an
  `<h1>`), the skip link moves focus to `<main>`, chips are lists of links.
- Agent docs: build-time endpoints allowed (never per request), collection and image recipes,
  a "Never" list; `seo.md`, `performance.md`, `publishing.md`, `accessibility.md` match the code.

## 0.2.0

- Topic docs for agents in `docs/agent/` (managed, replaced on upgrade): `performance.md`,
  `accessibility.md`, `seo.md`, `security.md`, `publishing.md`. `AGENTS.md` keeps the core rules
  and a summary per topic. The platform serves the same docs at
  `/api/public/site/v1/agent-docs`.
- Still a pure static site: the runtime "fetch the platform's public API" allowance is gone
  (content is built from the repo; no sign-in links or member areas).
- Template source: `template.json` `repo` is now `file:templates/astro-static` (a folder in an
  the platform checkout; no published repository yet). `npm run platform -- check|upgrade` read it
  (`$SITE_DIR`, `--from DIR`; `--base DIR` for a 3-way merge), `owner/name` GitHub repos
  still work. `docs/agent/**` joins the managed paths.
- Contact: `CONTACT.formUrl` is a form the owner hosts elsewhere.

## 0.1.0

- First release: Astro 7, every page prerendered (`output: 'static'`, no adapter).
- Home, About, Contact (`mailto:` or a hosted form link), `404.html`.
- Blog as an Astro content collection: Markdown files in `src/content/blog/`, front matter
  validated at build (`src/content.config.ts`), prerendered list and `/blog/<slug>/` pages,
  latest posts on the home page. No runtime fetch, no client JavaScript.
- Security: Astro CSP with hashes (`connect-src 'self'`), `public/_headers` (nosniff,
  Referrer-Policy, Permissions-Policy, COOP, X-Frame-Options, immutable `/_astro/*`).
- Performance: zero JavaScript, system fonts, sized lazy images.
- `AGENTS.md`: static rules, performance budgets, accessibility, SEO, security, and when to
  switch to the Astro app template.
