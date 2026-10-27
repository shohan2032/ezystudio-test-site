import {Hono} from 'hono';
import {validator} from 'hono/validator';

import {checkBooking, isDate, londonToday, openSlots, SLOT_COVERS} from '../../lib/booking';
import {BOOKING_STATUSES, type Booking, type BookingsPage, type OwnBooking} from '../../lib/types';
import {problem, requireAuth, requirePermission, withAuthCore, withDb, withViewer} from '../../platform/guards';
import {requesterHash, tooManyRecent} from '../abuse';
import {PERMISSIONS} from '../permissions';

/**
 * Table bookings (table `bookings`). Rules in `src/lib/booking.ts`.
 *
 * Public:
 *   GET  /site-api/bookings/slots?date=2026-11-04   the times still open that day
 *   POST /site-api/bookings                         a booking request (guest or signed in)
 *
 * Signed in, their own bookings (`userId`):
 *   GET  /site-api/bookings/mine?before=
 *   POST /site-api/bookings/mine/:id/cancel
 *
 * Holders of `site:booking:manage` (`/portal/bookings`):
 *   GET   /site-api/bookings/manage?view=waiting&before=    requests waiting for an answer
 *   GET   /site-api/bookings/manage?view=day&date=2026-11-04 one day's diary, by time
 *   PATCH /site-api/bookings/manage/:id {status}
 *
 * A request is NOT a confirmed table: staff confirm it (by phone or email)
 * and mark it here. Capacity is `SLOT_COVERS` per slot, counting requests
 * and confirmed bookings, read through the `(date, time)` index.
 */

const PAGE_SIZE = 20;
/** A day holds at most ~14 slots × 20 covers: this bounds one day's diary. */
const DAY_LIMIT = 300;
/** Booking requests per sender (IP hash) per hour. */
const HOURLY_LIMIT = 5;
const HOLDING = ['requested', 'confirmed'];

const ownSelect = {id: true, reference: true, partySize: true, date: true, time: true, status: true} as const;
const staffSelect = {...ownSelect, name: true, email: true, phone: true, notes: true, createdAt: true} as const;

const day = (date: string) => new Date(`${date}T00:00:00Z`);
const dateText = (date: Date) => date.toISOString().slice(0, 10);

const cursorOf = (value: unknown) => {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : undefined;
};

const idOf = (value: string) => {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};

const toOwn = (row: {id: number; reference: string; partySize: number; date: Date; time: string; status: string}): OwnBooking => ({
  id: row.id,
  reference: row.reference,
  partySize: row.partySize,
  date: dateText(row.date),
  time: row.time,
  status: row.status,
});

const toStaff = (row: {
  id: number;
  reference: string;
  partySize: number;
  date: Date;
  time: string;
  status: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: Date;
}): Booking => ({
  ...toOwn(row),
  name: row.name,
  email: row.email,
  phone: row.phone,
  notes: row.notes,
  createdAt: row.createdAt.toISOString(),
});

/** `FF-` + 6 characters with no look-alikes (0/O, 1/I/L), from WebCrypto. */
function newReference(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `FF-${Array.from(bytes, b => alphabet[b % alphabet.length]).join('')}`;
}

const bookingBody = validator('json', (value, c) => {
  const checked = checkBooking((value ?? {}) as Record<string, unknown>, new Date());
  if (!checked.ok) {
    return c.json({...problem('invalid_input', 'Some details need another look.'), fields: checked.fields}, 422);
  }
  return checked.value;
});

const slotsQuery = validator('query', (value, c) => {
  const date = typeof value.date === 'string' ? value.date : '';
  if (!isDate(date)) return c.json(problem('invalid_input', 'Choose a date.'), 422);
  return {date};
});

const statusBody = validator('json', (value, c) => {
  const status = (value as {status?: unknown})?.status;
  if (typeof status !== 'string' || !(BOOKING_STATUSES as string[]).includes(status)) {
    return c.json(problem('invalid_input', 'Status is requested, confirmed, declined or cancelled.'), 422);
  }
  return {status};
});

const manageQuery = validator('query', (value, c) => {
  const view = value.view === 'day' ? 'day' : 'waiting';
  const date = typeof value.date === 'string' ? value.date : '';
  if (view === 'day' && !isDate(date)) return c.json(problem('invalid_input', 'Choose a date.'), 422);
  return {view, date, before: typeof value.before === 'string' ? value.before : ''};
});

const pageQuery = validator('query', value => ({before: typeof value.before === 'string' ? value.before : ''}));

export const bookingRoutes = new Hono()
  // ---- public ---------------------------------------------------------------
  .get('/slots', slotsQuery, withDb, async c => {
    const {date} = c.req.valid('query');
    const times = openSlots(date, new Date());
    if (!times.length) return c.json({date, slots: []});
    const taken = await c.var.db.booking.groupBy({
      by: ['time'],
      where: {date: day(date), status: {in: HOLDING}},
      _sum: {partySize: true},
    });
    const covers = new Map(taken.map(row => [row.time, row._sum.partySize ?? 0]));
    // Free covers per slot, so the form can grey out times a party will not fit.
    const slots = times.map(time => ({time, free: Math.max(0, SLOT_COVERS - (covers.get(time) ?? 0))}));
    c.header('Cache-Control', 'no-store');
    return c.json({date, slots});
  })

  .post('/', bookingBody, withViewer, withAuthCore, async c => {
    const input = c.req.valid('json');
    const db = c.var.db;
    const ipHash = await requesterHash(c, c.var.secret);
    if (await tooManyRecent(db, 'booking', ipHash, HOURLY_LIMIT)) {
      return c.json(problem('too_many', 'That is a lot of bookings in an hour. Call us and we will sort it out.'), 429);
    }
    const held = await db.booking.aggregate({
      where: {date: day(input.date), time: input.time, status: {in: HOLDING}},
      _sum: {partySize: true},
    });
    if ((held._sum.partySize ?? 0) + input.partySize > SLOT_COVERS) {
      return c.json(
        {
          ...problem('slot_full', 'That time is fully booked.'),
          fields: {time: 'That time is fully booked for a party this size. Choose another, or call us for the waiting list.'},
        },
        409
      );
    }
    const data = {
      name: input.name,
      email: input.email,
      phone: input.phone,
      partySize: input.partySize,
      date: day(input.date),
      time: input.time,
      notes: input.notes,
      userId: c.var.viewer.state === 'user' ? c.var.viewer.id : null,
      ipHash,
    };
    // A reference collision is ~1 in 10^8; try once more, then give up politely.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const row = await db.booking.create({data: {...data, reference: newReference()}, select: ownSelect});
        return c.json(
          {
            booking: toOwn(row),
            message: 'Thank you. Your request is in: we will confirm by email or phone, usually within a few hours.',
          },
          201
        );
      } catch (err) {
        if ((err as {code?: string}).code !== 'P2002' || attempt === 1) throw err;
      }
    }
    return c.json(problem('internal_error', 'Something went wrong.'), 500);
  })

  // ---- the signed-in guest's own bookings ------------------------------------
  .get('/mine', pageQuery, withViewer, requireAuth, withDb, async c => {
    const cursor = cursorOf(c.req.valid('query').before);
    const rows = await c.var.db.booking.findMany({
      select: ownSelect,
      where: {userId: c.var.viewer.id!, ...(cursor ? {id: {lt: cursor}} : {})},
      orderBy: {id: 'desc'},
      take: PAGE_SIZE + 1,
    });
    const page = rows.slice(0, PAGE_SIZE).map(toOwn);
    return c.json({bookings: page, nextBefore: rows.length > PAGE_SIZE ? page.at(-1)!.id : null});
  })

  .post('/mine/:id/cancel', withViewer, requireAuth, withDb, async c => {
    const id = idOf(c.req.param('id'));
    if (!id) return c.json(problem('not_found', 'No such booking.'), 404);
    // Only theirs, only still held, only from today on: one conditional update.
    const {count} = await c.var.db.booking.updateMany({
      where: {id, userId: c.var.viewer.id!, status: {in: HOLDING}, date: {gte: day(londonToday(new Date()))}},
      data: {status: 'cancelled'},
    });
    if (!count) return c.json(problem('not_found', 'That booking cannot be cancelled online any more. Call us.'), 404);
    return c.json({ok: true});
  })

  // ---- staff ----------------------------------------------------------------
  .get('/manage', manageQuery, withViewer, requireAuth, requirePermission(PERMISSIONS.BOOKING_MANAGE), withDb, async c => {
    const {view, date, before} = c.req.valid('query');
    if (view === 'day') {
      // Index: bookings(date, time).
      const rows = await c.var.db.booking.findMany({
        select: staffSelect,
        where: {date: day(date)},
        orderBy: [{time: 'asc'}, {id: 'asc'}],
        take: DAY_LIMIT,
      });
      const page: BookingsPage = {bookings: rows.map(toStaff), nextBefore: null};
      return c.json(page);
    }
    // Index: bookings(status, id).
    const cursor = cursorOf(before);
    const rows = await c.var.db.booking.findMany({
      select: staffSelect,
      where: {status: 'requested', ...(cursor ? {id: {lt: cursor}} : {})},
      orderBy: {id: 'desc'},
      take: PAGE_SIZE + 1,
    });
    const bookings = rows.slice(0, PAGE_SIZE).map(toStaff);
    const page: BookingsPage = {bookings, nextBefore: rows.length > PAGE_SIZE ? bookings.at(-1)!.id : null};
    return c.json(page);
  })

  .patch('/manage/:id', statusBody, withViewer, requireAuth, requirePermission(PERMISSIONS.BOOKING_MANAGE), withDb, async c => {
    const id = idOf(c.req.param('id'));
    if (!id) return c.json(problem('not_found', 'No such booking.'), 404);
    const {status} = c.req.valid('json');
    try {
      const row = await c.var.db.booking.update({where: {id}, data: {status}, select: staffSelect});
      return c.json({booking: toStaff(row)});
    } catch (err) {
      if ((err as {code?: string}).code === 'P2025') return c.json(problem('not_found', 'No such booking.'), 404);
      throw err;
    }
  });
