# Site — Astro static

A fast, simple **website**: every page is built once into plain files and served from the edge.
No server, no database, nothing to maintain.

- Home (sections), About, Contact (email link, or a link to a hosted form), a 404 page;
- a **Blog**: one Markdown file per post in `src/content/blog/`, each with its own page, tag
  pages and an RSS feed (`/rss.xml`);
- search-ready: a title, description, canonical URL and social card on every page,
  `/sitemap.xml` and `/robots.txt` built with the site;
- instant page-to-page navigation (Astro's ClientRouter + prefetch, the only JavaScript, over
  real prerendered pages), system fonts, one inlined stylesheet, images optimised at build
  (AVIF/WebP, several sizes, lazy), a strict Content-Security-Policy and security headers;
- it stands alone: every page, word and post lives in this repo and is built into plain HTML.

Need sign-in, a database, forms that store answers, bookings or payments? That is an **app**:
pick the **Astro app** template (the database toggle in the dashboard) instead.

## Put it live

Pick **Website** when you create a site in the dashboard, change what you like in the editor (or ask
your AI agent), then **Publish**. The platform installs with `npm ci`, runs `npm run build` and
serves `dist/`.

## Write a post

Add a Markdown file to `src/content/blog/` (the file name is the address: `my-post.md` →
`/blog/my-post/`) with a `title`, `description` and `publishedAt` at the top. A cover image
goes in `src/assets/blog/`. See `src/content/blog/how-to-add-a-post.md`. Publish, and it is
live, with the blog list, tag pages, RSS feed and sitemap.

## Change the words

Everything you read on the site is in `src/content/site.ts`: the name, navigation, home sections,
about text and the contact email. Colours are tokens at the top of `src/styles/global.css`.
Once you connect your own domain, set `SITE.url` there too (search engines then see that
address).

## Running it on your machine

```bash
npm install
npm run dev              # http://localhost:4321
npm run build            # the site, into dist/
```

## Staying up to date

```bash
npm run platform -- check     # is a newer template release out?
npm run platform -- upgrade   # apply it, keeping your changes (commit first)
npm run platform -- docs      # the platform's latest agent docs
```

Where releases come from: `repo` in `template.json`. Today it is `file:templates/astro-static`, the
template's folder in a platform checkout (there is no published template repository yet):
set `SITE_DIR` to that checkout, or pass `--from <path to templates/astro-static>`. A folder
holds one version, so for a real 3-way merge also pass `--base <a copy of your current
version>`; without it, `upgrade` adds new files, replaces the managed ones and lists the files
you changed for you to compare. A GitHub `owner/name` with `vX.Y.Z` tags works the same way
once the templates are published.

## Where things are

```
AGENTS.md              rules for AI agents (CLAUDE.md, GEMINI.md import it)
docs/agent/            topic docs: performance, accessibility, SEO, security, publishing
scripts/platform.mjs   npm run platform -- docs | check | upgrade
template.json          which template version this site is on
public/_headers        security and cache headers
src/content/site.ts    every word on the site
src/content/blog/      the blog posts (Markdown); schema in src/content.config.ts
src/assets/            images optimised at build (blog covers in src/assets/blog/)
src/pages/             index, about, contact, blog/ (+ tags/), 404, rss.xml, sitemap.xml, robots.txt
src/layouts/Base.astro <head> (SEO tags), header, footer
src/components/        PostCard, Cover (optimised images)
src/lib/posts.ts       blog helpers (build time)
src/lib/site-url.ts    the site's public address (canonical URLs, sitemap, RSS)
src/styles/global.css  the stylesheet (inlined into every page)
```
