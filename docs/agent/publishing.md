---
title: How changes go live, and the Preview
read-when: before git push, when the owner asks how changes go live, when the Preview misbehaves, or before changing scripts, dependencies or config
---
## Going live
- You edit a working copy. Nothing visitors see changes until the OWNER publishes from the
  the editor (typed "publish"). You cannot publish or deploy: there are no platform
  credentials here, and you never ask for any.
- Publish → Deployment: Prepare (detect the framework: Astro, no adapter = a static site) →
  Build (`npm ci`, `npm run build`) → Deploy (`dist/` served as plain files, `404.html` for
  every miss) → Live. Redeploy of an earlier deployment is the rollback.
- The site answers on its free address (`{{SITE_ORIGIN_PATTERN}}`) and on any custom domain the
  owner connects in the site's Domains tab. `{{API_PREFIX}}/*` on every one of those hosts is the
  platform's, never this site's.
- Before telling the owner it is ready: `npm run build` passes, the Preview shows every changed
  page, and `security.md`'s checklist holds.

## What the platform expects (Prepare refuses otherwise)
- `astro` in `package.json` with NO adapter and `output: 'static'`. `@astrojs/node|vercel|
  netlify` are refused; `@astrojs/cloudflare` turns the site into a server app, which is the
  Astro app template's job, not this one's. Never another framework beside Astro.
- npm with ONE lockfile (`package-lock.json`, committed); `allowScripts` lists approved install
  scripts. No `wrangler.*` files (the platform writes the deploy config), no `.github/workflows`.
- No `base` path, no per-request endpoints (build-time ones like `rss.xml.ts`,
  `sitemap.xml.ts`, `robots.txt.ts` are files and fine), no secrets in files.
- The Build gets ONE variable, `SITE_URL` (the site's address, read only through
  `src/lib/site-url.ts` for canonical URLs, the sitemap and RSS). Nothing else from the
  environment reaches a static build, and nothing secret ever does.
- The project sits at the repository root. `node_modules`, `dist`, `.astro`, `.env` are never
  committed (`.gitignore`).

## Preview (the editor)
- The editor runs `npm run dev` for the Preview pane: keep it working and serving at `/`. Never
  start a second dev server; never `npm run preview`.
- The Preview is the dev server, not the built files: drafts (`draft: true`) show there and
  never in a Publish. Only `npm run build` proves the build.
- The Preview is framed by the editor; the live site sends `X-Frame-Options: DENY`. Never rely on
  being framed.

## Template upgrades
- `template.json` records the template and its version. `npm run platform -- check` says if a
  newer one exists; `npm run platform -- upgrade` (clean git tree, owner's OK) replaces the
  MANAGED paths (`docs/agent/**`, `scripts/platform.mjs`, `CHANGELOG.md`) and 3-way merges
  everything else. Then read `CHANGELOG.md`, resolve conflicts, `npm install`, `npm run build`.
- `npm run platform -- docs` (or `--site <this site's address>`) saves the platform's live
  agent docs to `.platform/docs/`; when they differ from `docs/agent/`, the live ones win.

## Git
- Commit small, reviewable changes with clear messages. Push with plain `git push` to `origin`
  only when the owner set up a repository; never `--force`, `--all` or `--tags`.
