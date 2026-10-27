import {Hono} from 'hono';
import {validator} from 'hono/validator';

import {checkEnquiry} from '../../lib/booking';
import {ENQUIRY_STATUSES, type EnquiriesPage, type Enquiry} from '../../lib/types';
import {problem, requireAuth, requirePermission, withAuthCore, withDb, withViewer} from '../../platform/guards';
import {requesterHash, tooManyRecent} from '../abuse';
import {PERMISSIONS} from '../permissions';

/**
 * Private dining and events enquiries (table `enquiries`), from `/events/`.
 *
 * Public:
 *   POST /site-api/enquiries
 *
 * Holders of `site:enquiry:manage` (`/portal/enquiries`):
 *   GET    /site-api/enquiries/manage?status=&before=   newest first; status '' = all
 *   PATCH  /site-api/enquiries/manage/:id {status}      new, replied, closed
 *   DELETE /site-api/enquiries/manage/:id               remove (their contact details go with it)
 */

const PAGE_SIZE = 20;
const HOURLY_LIMIT = 3;

const select = {
  id: true,
  name: true,
  email: true,
  phone: true,
  kind: true,
  guests: true,
  eventDate: true,
  message: true,
  status: true,
  createdAt: true,
} as const;

type Row = {
  id: number;
  name: string;
  email: string;
  phone: string;
  kind: string;
  guests: number;
  eventDate: Date | null;
  message: string;
  status: string;
  createdAt: Date;
};

const toEnquiry = (row: Row): Enquiry => ({
  ...row,
  eventDate: row.eventDate ? row.eventDate.toISOString().slice(0, 10) : null,
  createdAt: row.createdAt.toISOString(),
});

const idOf = (value: string) => {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};

const enquiryBody = validator('json', (value, c) => {
  const checked = checkEnquiry((value ?? {}) as Record<string, unknown>, new Date());
  if (!checked.ok) {
    return c.json({...problem('invalid_input', 'Some details need another look.'), fields: checked.fields}, 422);
  }
  return checked.value;
});

const manageQuery = validator('query', value => ({
  status: typeof value.status === 'string' && (ENQUIRY_STATUSES as string[]).includes(value.status) ? value.status : '',
  before: typeof value.before === 'string' ? value.before : '',
}));

const statusBody = validator('json', (value, c) => {
  const status = (value as {status?: unknown})?.status;
  if (typeof status !== 'string' || !(ENQUIRY_STATUSES as string[]).includes(status)) {
    return c.json(problem('invalid_input', 'Status is new, replied or closed.'), 422);
  }
  return {status};
});

const notFound = problem('not_found', 'No such enquiry.');

export const enquiryRoutes = new Hono()
  .post('/', enquiryBody, withAuthCore, async c => {
    const input = c.req.valid('json');
    const ipHash = await requesterHash(c, c.var.secret);
    if (await tooManyRecent(c.var.db, 'enquiry', ipHash, HOURLY_LIMIT)) {
      return c.json(problem('too_many', 'We have your enquiries. Give us a little time to reply, or call us.'), 429);
    }
    await c.var.db.enquiry.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        kind: input.kind,
        guests: input.guests,
        eventDate: input.eventDate ? new Date(`${input.eventDate}T00:00:00Z`) : null,
        message: input.message,
        ipHash,
      },
      select: {id: true},
    });
    return c.json({ok: true, message: 'Thank you. Sam reads every enquiry and will reply within two working days.'}, 201);
  })

  .get('/manage', manageQuery, withViewer, requireAuth, requirePermission(PERMISSIONS.ENQUIRY_MANAGE), withDb, async c => {
    const {status, before} = c.req.valid('query');
    const n = Number(before);
    const cursor = Number.isSafeInteger(n) && n > 0 ? n : undefined;
    // Index: enquiries(status, id); without a status, the primary key.
    const rows = await c.var.db.enquiry.findMany({
      select,
      where: {...(status ? {status} : {}), ...(cursor ? {id: {lt: cursor}} : {})},
      orderBy: {id: 'desc'},
      take: PAGE_SIZE + 1,
    });
    const enquiries = rows.slice(0, PAGE_SIZE).map(toEnquiry);
    const page: EnquiriesPage = {enquiries, nextBefore: rows.length > PAGE_SIZE ? enquiries.at(-1)!.id : null};
    return c.json(page);
  })

  .patch('/manage/:id', statusBody, withViewer, requireAuth, requirePermission(PERMISSIONS.ENQUIRY_MANAGE), withDb, async c => {
    const id = idOf(c.req.param('id'));
    if (!id) return c.json(notFound, 404);
    try {
      const row = await c.var.db.enquiry.update({where: {id}, data: {status: c.req.valid('json').status}, select});
      return c.json({enquiry: toEnquiry(row)});
    } catch (err) {
      if ((err as {code?: string}).code === 'P2025') return c.json(notFound, 404);
      throw err;
    }
  })

  .delete('/manage/:id', withViewer, requireAuth, requirePermission(PERMISSIONS.ENQUIRY_MANAGE), withDb, async c => {
    const id = idOf(c.req.param('id'));
    if (!id) return c.json(notFound, 404);
    const {count} = await c.var.db.enquiry.deleteMany({where: {id}});
    return count ? c.json({ok: true}) : c.json(notFound, 404);
  });
