import {defineMiddleware} from 'astro:middleware';

import {SELF_FETCH_HEADER} from './platform/api';
import {applySecurityHeaders} from './platform/headers';
import {inRequestScope} from './platform/request-scope';

/**
 * Runs before every on-demand page and every `/site-api` call:
 *
 * 1. Opens the request's memo (`src/platform/request-scope.ts`), so the
 *    visitor and the Site Database client are made once per request.
 * 2. Stops a page from fetching ITSELF forever: on your own machine there is
 *    no platform behind `/api`, so a server-side fetch there would land on
 *    this site's 404 page, which fetches the brand again… Every server-side
 *    platform fetch carries `SELF_FETCH_HEADER`, and such a request is
 *    answered here with a bare 404.
 * 3. Adds the security headers (`src/platform/headers.ts`).
 */
export const onRequest = defineMiddleware((context, next) =>
  inRequestScope(async () => {
    if (context.url.pathname.startsWith('/api/') && context.request.headers.has(SELF_FETCH_HEADER)) {
      return new Response(JSON.stringify({error: 'not_found'}), {
        status: 404,
        headers: {'content-type': 'application/json'},
      });
    }
    return applySecurityHeaders(await next(), context.url);
  })
);
