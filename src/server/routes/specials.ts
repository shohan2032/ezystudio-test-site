import {Hono} from 'hono';
import {validator} from 'hono/validator';

import type {Special} from '../../lib/types';
import {problem, requireAuth, requirePermission, withDb, withViewer} from '../../platform/guards';
import {PERMISSIONS} from '../permissions';

/**
 * Today's specials board (table `specials`): the home page and the menu page
 * read it in the browser; staff keep it current from `/portal/specials`.
 *
 * Public:
 *   GET /site-api/specials            the dishes on the board now (same for everyone: cached 60 s)
 *
 * Holders of `site:menu:manage`:
 *   GET    /site-api/specials/manage  every dish, on and off the board
 *   POST   /site-api/specials/manage
 *   PATCH  /site-api/specials/manage/:id
 *   DELETE /site-api/specials/manage/:id
 *
 * The board is small by nature: at most `MAX_SPECIALS` dishes are kept.
 */

const MAX_SPECIALS = 60;
const BOARD_SIZE = 8;
const select = {id: true, title: true, description: true, priceCents: true, available: true} as const;

const idOf = (value: string) => {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};

type SpecialInput = {title?: string; description?: string; priceCents?: number; available?: boolean};

/** The SAME limits as the portal form (`src/portal/screens/specials.tsx`). */
function specialBody(partial: boolean) {
  return validator('json', (value, c) => {
    const v = (value ?? {}) as Record<string, unknown>;
    const out: SpecialInput = {};
    const fields: Record<string, string> = {};
    if (v.title !== undefined || !partial) {
      const title = typeof v.title === 'string' ? v.title.trim() : '';
      if (!title || title.length > 100) fields.title = 'A dish needs a name of 1 to 100 characters.';
      else out.title = title;
    }
    if (v.description !== undefined || !partial) {
      const description = typeof v.description === 'string' ? v.description.trim() : '';
      if (description.length > 300) fields.description = 'Use at most 300 characters.';
      else out.description = description;
    }
    if (v.priceCents !== undefined || !partial) {
      const price = v.priceCents;
      if (typeof price !== 'number' || !Number.isInteger(price) || price < 0 || price > 100_000) {
        fields.priceCents = 'Enter a price between £0 and £1000, like 14.50.';
      } else out.priceCents = price;
    }
    if (v.available !== undefined) {
      if (typeof v.available !== 'boolean') fields.available = 'On the board is yes or no.';
      else out.available = v.available;
    }
    if (Object.keys(fields).length) return c.json({...problem('invalid_input', 'Check the dish details.'), fields}, 422);
    return out;
  });
}

const notFound = problem('not_found', 'No such dish.');
const MANAGE = PERMISSIONS.MENU_MANAGE;

export const specialRoutes = new Hono()
  // Never reads the visitor and is the same for everyone: a short public cache is fine.
  .get('/', withDb, async c => {
    const rows = await c.var.db.special.findMany({
      select,
      where: {available: true},
      orderBy: {id: 'asc'},
      take: BOARD_SIZE,
    });
    c.header('Cache-Control', 'public, max-age=60');
    const specials: Special[] = rows;
    return c.json({specials});
  })

  .get('/manage', withViewer, requireAuth, requirePermission(MANAGE), withDb, async c => {
    const rows = await c.var.db.special.findMany({select, orderBy: [{available: 'desc'}, {id: 'asc'}], take: MAX_SPECIALS});
    return c.json({specials: rows as Special[]});
  })

  .post('/manage', specialBody(false), withViewer, requireAuth, requirePermission(MANAGE), withDb, async c => {
    const input = c.req.valid('json');
    const existing = await c.var.db.special.findMany({select: {id: true}, take: MAX_SPECIALS});
    if (existing.length >= MAX_SPECIALS) {
      return c.json(problem('too_many', `The board keeps up to ${MAX_SPECIALS} dishes. Delete an old one first.`), 409);
    }
    const row = await c.var.db.special.create({
      data: {
        title: input.title!,
        description: input.description ?? '',
        priceCents: input.priceCents!,
        available: input.available ?? true,
      },
      select,
    });
    return c.json({special: row as Special}, 201);
  })

  .patch('/manage/:id', specialBody(true), withViewer, requireAuth, requirePermission(MANAGE), withDb, async c => {
    const id = idOf(c.req.param('id'));
    if (!id) return c.json(notFound, 404);
    const input = c.req.valid('json');
    try {
      const row = await c.var.db.special.update({
        where: {id},
        data: {
          ...(input.title !== undefined ? {title: input.title} : {}),
          ...(input.description !== undefined ? {description: input.description} : {}),
          ...(input.priceCents !== undefined ? {priceCents: input.priceCents} : {}),
          ...(input.available !== undefined ? {available: input.available} : {}),
        },
        select,
      });
      return c.json({special: row as Special});
    } catch (err) {
      if ((err as {code?: string}).code === 'P2025') return c.json(notFound, 404);
      throw err;
    }
  })

  .delete('/manage/:id', withViewer, requireAuth, requirePermission(MANAGE), withDb, async c => {
    const id = idOf(c.req.param('id'));
    if (!id) return c.json(notFound, 404);
    const {count} = await c.var.db.special.deleteMany({where: {id}});
    return count ? c.json({ok: true}) : c.json(notFound, 404);
  });
